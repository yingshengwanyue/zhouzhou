document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const errorMessage = document.getElementById('errorMessage');
  
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    errorMessage.textContent = '';
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Success - redirect to main page with smooth transition
        document.body.style.opacity = '0';
        setTimeout(() => {
          window.location.href = '/';
        }, 300);
      } else {
        errorMessage.textContent = data.error || '登录失败';
      }
    } catch (error) {
      errorMessage.textContent = '网络错误，请重试';
    }
  });
  
  // Add enter key animation
  const inputs = document.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        input.style.transform = 'scale(0.98)';
        setTimeout(() => {
          input.style.transform = 'scale(1)';
        }, 100);
      }
    });
  });
});
