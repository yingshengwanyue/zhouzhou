const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const DiaryModel = require('../models/diary');
const { isAuthenticated } = require('../middleware/auth');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../public/images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('只支持图片格式：JPEG, JPG, PNG, GIF'));
  }
});

// Get all diary entries
router.get('/api/diaries', isAuthenticated, (req, res) => {
  DiaryModel.getAllByUser(req.session.userId, (err, entries) => {
    if (err) {
      return res.status(500).json({ error: '获取日记失败' });
    }
    
    // Parse images JSON string
    const parsedEntries = entries.map(entry => ({
      ...entry,
      images: entry.images ? JSON.parse(entry.images) : []
    }));
    
    res.json(parsedEntries);
  });
});

// Get single diary entry
router.get('/api/diaries/:id', isAuthenticated, (req, res) => {
  DiaryModel.getById(req.params.id, req.session.userId, (err, entry) => {
    if (err) {
      return res.status(500).json({ error: '获取日记失败' });
    }
    
    if (!entry) {
      return res.status(404).json({ error: '日记不存在' });
    }
    
    entry.images = entry.images ? JSON.parse(entry.images) : [];
    res.json(entry);
  });
});

// Create new diary entry
router.post('/api/diaries', isAuthenticated, upload.array('images', 5), (req, res) => {
  const { title, content } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({ error: '标题和内容不能为空' });
  }
  
  const images = req.files ? req.files.map(file => `/images/${file.filename}`) : [];
  const imagesJson = JSON.stringify(images);
  
  DiaryModel.create(req.session.userId, title, content, imagesJson, (err, id) => {
    if (err) {
      return res.status(500).json({ error: '创建日记失败' });
    }
    
    res.json({ success: true, id, message: '日记创建成功' });
  });
});

// Update diary entry
router.put('/api/diaries/:id', isAuthenticated, upload.array('images', 5), (req, res) => {
  const { title, content, existingImages } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({ error: '标题和内容不能为空' });
  }
  
  // Combine existing images with new uploads
  let images = existingImages ? JSON.parse(existingImages) : [];
  if (req.files && req.files.length > 0) {
    const newImages = req.files.map(file => `/images/${file.filename}`);
    images = images.concat(newImages);
  }
  
  const imagesJson = JSON.stringify(images);
  
  DiaryModel.update(req.params.id, req.session.userId, title, content, imagesJson, (err, changes) => {
    if (err) {
      return res.status(500).json({ error: '更新日记失败' });
    }
    
    if (changes === 0) {
      return res.status(404).json({ error: '日记不存在或无权限修改' });
    }
    
    res.json({ success: true, message: '日记更新成功' });
  });
});

// Delete diary entry
router.delete('/api/diaries/:id', isAuthenticated, (req, res) => {
  DiaryModel.delete(req.params.id, req.session.userId, (err, changes) => {
    if (err) {
      return res.status(500).json({ error: '删除日记失败' });
    }
    
    if (changes === 0) {
      return res.status(404).json({ error: '日记不存在或无权限删除' });
    }
    
    res.json({ success: true, message: '日记删除成功' });
  });
});

// Search diary entries
router.get('/api/diaries/search/:query', isAuthenticated, (req, res) => {
  DiaryModel.search(req.session.userId, req.params.query, (err, entries) => {
    if (err) {
      return res.status(500).json({ error: '搜索失败' });
    }
    
    const parsedEntries = entries.map(entry => ({
      ...entry,
      images: entry.images ? JSON.parse(entry.images) : []
    }));
    
    res.json(parsedEntries);
  });
});

module.exports = router;
