// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  
  // If it's an API request, send JSON error
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: '未授权，请先登录' });
  }
  
  // Otherwise redirect to login page
  res.redirect('/login');
}

module.exports = { isAuthenticated };
