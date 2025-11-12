const express = require('express');
const router = express.Router();
const UserModel = require('../models/user');

// Login page
router.get('/login', (req, res) => {
  res.sendFile('login.html', { root: 'views' });
});

// Login POST
router.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  UserModel.findByUsername(username, (err, user) => {
    if (err) {
      return res.status(500).json({ error: '服务器错误' });
    }
    
    if (!user || !UserModel.verifyPassword(password, user.password)) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    
    req.session.userId = user.id;
    req.session.username = user.username;
    res.json({ success: true, message: '登录成功' });
  });
});

// Logout
router.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: '退出失败' });
    }
    res.json({ success: true, message: '已退出登录' });
  });
});

module.exports = router;
