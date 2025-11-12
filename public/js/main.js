let diaries = [];
let currentDiaryId = null;
let uploadedFiles = [];

document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  loadDiaries();
});

function initializeApp() {
  // New diary button
  document.getElementById('newDiaryBtn').addEventListener('click', () => {
    openDiaryModal();
  });
  
  // Logout button
  document.getElementById('logoutBtn').addEventListener('click', logout);
  
  // Modal close buttons
  document.getElementById('closeModal').addEventListener('click', closeDiaryModal);
  document.getElementById('closeViewModal').addEventListener('click', closeViewModal);
  document.getElementById('cancelBtn').addEventListener('click', closeDiaryModal);
  
  // Form submit
  document.getElementById('diaryForm').addEventListener('submit', saveDiary);
  
  // Image upload
  document.getElementById('imageUpload').addEventListener('change', handleImageUpload);
  
  // Search
  let searchTimeout;
  document.getElementById('searchInput').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const query = e.target.value.trim();
      if (query) {
        searchDiaries(query);
      } else {
        loadDiaries();
      }
    }, 500);
  });
  
  // Edit and delete buttons in view modal
  document.getElementById('editDiaryBtn').addEventListener('click', editCurrentDiary);
  document.getElementById('deleteDiaryBtn').addEventListener('click', deleteCurrentDiary);
  
  // Close modals on background click
  document.getElementById('diaryModal').addEventListener('click', (e) => {
    if (e.target.id === 'diaryModal') {
      closeDiaryModal();
    }
  });
  
  document.getElementById('viewModal').addEventListener('click', (e) => {
    if (e.target.id === 'viewModal') {
      closeViewModal();
    }
  });
}

async function loadDiaries() {
  try {
    const response = await fetch('/api/diaries');
    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }
      throw new Error('Failed to load diaries');
    }
    
    diaries = await response.json();
    renderDiaries(diaries);
    updateStats();
  } catch (error) {
    console.error('Error loading diaries:', error);
    showNotification('加载日记失败', 'error');
  }
}

function renderDiaries(diariesToRender) {
  const diaryList = document.getElementById('diaryList');
  const emptyState = document.getElementById('emptyState');
  
  if (diariesToRender.length === 0) {
    diaryList.innerHTML = '';
    emptyState.classList.add('show');
  } else {
    emptyState.classList.remove('show');
    diaryList.innerHTML = diariesToRender.map((diary, index) => `
      <div class="diary-card" onclick="viewDiary(${diary.id})" style="animation-delay: ${index * 0.05}s">
        <div class="diary-card-header">
          <h3 class="diary-card-title">${escapeHtml(diary.title)}</h3>
          <p class="diary-card-date">${formatDate(diary.created_at)}</p>
        </div>
        <p class="diary-card-content">${escapeHtml(diary.content)}</p>
        ${diary.images && diary.images.length > 0 ? `
          <div class="diary-card-images">
            ${diary.images.slice(0, 3).map(img => `
              <img src="${img}" alt="Diary image" class="diary-card-image">
            `).join('')}
          </div>
        ` : ''}
      </div>
    `).join('');
  }
}

function updateStats() {
  document.getElementById('totalCount').textContent = diaries.length;
}

function openDiaryModal(diary = null) {
  currentDiaryId = diary ? diary.id : null;
  const modal = document.getElementById('diaryModal');
  const modalTitle = document.getElementById('modalTitle');
  const form = document.getElementById('diaryForm');
  
  modalTitle.textContent = diary ? '编辑日记' : '新建日记';
  
  if (diary) {
    document.getElementById('diaryId').value = diary.id;
    document.getElementById('diaryTitle').value = diary.title;
    document.getElementById('diaryContent').value = diary.content;
    renderImagePreview(diary.images || []);
  } else {
    form.reset();
    document.getElementById('imagePreview').innerHTML = '';
    uploadedFiles = [];
  }
  
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
  
  // Focus on title input with animation
  setTimeout(() => {
    document.getElementById('diaryTitle').focus();
  }, 300);
}

function closeDiaryModal() {
  const modal = document.getElementById('diaryModal');
  modal.classList.remove('show');
  document.body.style.overflow = 'auto';
  uploadedFiles = [];
}

function viewDiary(id) {
  const diary = diaries.find(d => d.id === id);
  if (!diary) return;
  
  currentDiaryId = id;
  
  document.getElementById('viewTitle').textContent = diary.title;
  document.getElementById('viewDate').textContent = formatDate(diary.created_at);
  document.getElementById('viewContent').textContent = diary.content;
  
  const viewImages = document.getElementById('viewImages');
  if (diary.images && diary.images.length > 0) {
    viewImages.innerHTML = diary.images.map(img => `
      <img src="${img}" alt="Diary image" class="diary-image" onclick="window.open('${img}', '_blank')">
    `).join('');
  } else {
    viewImages.innerHTML = '';
  }
  
  document.getElementById('viewModal').classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeViewModal() {
  document.getElementById('viewModal').classList.remove('show');
  document.body.style.overflow = 'auto';
}

function editCurrentDiary() {
  const diary = diaries.find(d => d.id === currentDiaryId);
  if (!diary) return;
  
  closeViewModal();
  setTimeout(() => {
    openDiaryModal(diary);
  }, 300);
}

async function deleteCurrentDiary() {
  if (!confirm('确定要删除这篇日记吗？')) return;
  
  try {
    const response = await fetch(`/api/diaries/${currentDiaryId}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showNotification('日记已删除', 'success');
      closeViewModal();
      loadDiaries();
    } else {
      showNotification(data.error || '删除失败', 'error');
    }
  } catch (error) {
    console.error('Error deleting diary:', error);
    showNotification('删除失败', 'error');
  }
}

async function saveDiary(e) {
  e.preventDefault();
  
  const title = document.getElementById('diaryTitle').value.trim();
  const content = document.getElementById('diaryContent').value.trim();
  const diaryId = document.getElementById('diaryId').value;
  
  const formData = new FormData();
  formData.append('title', title);
  formData.append('content', content);
  
  // Handle images
  if (diaryId) {
    // For editing, preserve existing images
    const diary = diaries.find(d => d.id == diaryId);
    if (diary && diary.images) {
      formData.append('existingImages', JSON.stringify(diary.images));
    }
  }
  
  // Add new uploaded files
  uploadedFiles.forEach(file => {
    formData.append('images', file);
  });
  
  try {
    const url = diaryId ? `/api/diaries/${diaryId}` : '/api/diaries';
    const method = diaryId ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method: method,
      body: formData
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showNotification(diaryId ? '日记已更新' : '日记已创建', 'success');
      closeDiaryModal();
      loadDiaries();
    } else {
      showNotification(data.error || '保存失败', 'error');
    }
  } catch (error) {
    console.error('Error saving diary:', error);
    showNotification('保存失败', 'error');
  }
}

function handleImageUpload(e) {
  const files = Array.from(e.target.files);
  uploadedFiles = uploadedFiles.concat(files);
  
  const imageUrls = files.map(file => URL.createObjectURL(file));
  const existingPreview = document.getElementById('imagePreview');
  const existingImages = Array.from(existingPreview.querySelectorAll('img')).map(img => img.src);
  
  renderImagePreview(existingImages.concat(imageUrls), true);
  
  // Reset input
  e.target.value = '';
}

function renderImagePreview(images, isLocal = false) {
  const preview = document.getElementById('imagePreview');
  preview.innerHTML = images.map((img, index) => {
    const escapedImg = escapeHtml(img);
    return `
      <div class="image-preview-item">
        <img src="${escapedImg}" class="image-preview-img" alt="Preview">
        <button type="button" class="image-preview-remove" onclick="removeImage(${index}, ${isLocal})">✕</button>
      </div>
    `;
  }).join('');
}

function removeImage(index, isLocal) {
  if (isLocal) {
    uploadedFiles.splice(index, 0);
    const preview = document.getElementById('imagePreview');
    const items = preview.querySelectorAll('.image-preview-item');
    if (items[index]) {
      items[index].remove();
    }
  }
}

async function searchDiaries(query) {
  try {
    const response = await fetch(`/api/diaries/search/${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Search failed');
    
    const results = await response.json();
    renderDiaries(results);
  } catch (error) {
    console.error('Error searching diaries:', error);
    showNotification('搜索失败', 'error');
  }
}

async function logout() {
  try {
    const response = await fetch('/api/logout', {
      method: 'POST'
    });
    
    if (response.ok) {
      document.body.style.opacity = '0';
      setTimeout(() => {
        window.location.href = '/login';
      }, 300);
    }
  } catch (error) {
    console.error('Error logging out:', error);
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    return '今天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  } else if (days === 1) {
    return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  } else if (days < 7) {
    return days + '天前';
  } else {
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: ${type === 'success' ? '#34c759' : '#ff3b30'};
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    z-index: 10000;
    animation: slideInRight 0.3s ease-out;
    font-size: 14px;
    font-weight: 500;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
