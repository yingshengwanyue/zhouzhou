# 安全配置说明 (Security Configuration Guide)

本文档说明了生产环境部署时需要注意的安全配置事项。

## 当前实现的安全特性

✅ **已实现的安全功能：**
- 密码加密存储 (bcrypt)
- 会话管理
- 用户认证中间件
- 文件上传大小限制 (5MB)
- 文件类型验证 (仅允许图片)
- SQL注入防护 (参数化查询)
- XSS防护 (HTML转义)

## 生产环境必需的额外配置

### 1. HTTPS 和安全Cookie

当前配置用于开发环境。生产环境中需要启用HTTPS并配置安全cookie：

```javascript
// src/app.js
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-strong-secret-here',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: true,        // 启用HTTPS
    httpOnly: true,      // 防止XSS
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'strict'   // 防止CSRF
  }
}));
```

### 2. CSRF 保护

建议添加CSRF令牌保护：

```bash
npm install csurf
```

```javascript
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

// 在路由中使用
app.use(csrfProtection);
```

### 3. 速率限制

防止暴力破解和DDoS攻击：

```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 限制每个IP 100次请求
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5 // 登录限制更严格
});

app.use('/api/', limiter);
app.use('/api/login', loginLimiter);
```

### 4. 环境变量

使用环境变量管理敏感信息：

```bash
npm install dotenv
```

创建 `.env` 文件：
```
SESSION_SECRET=your-very-strong-secret-key-here
PORT=3000
NODE_ENV=production
```

### 5. Helmet 安全头

添加安全HTTP头：

```bash
npm install helmet
```

```javascript
const helmet = require('helmet');
app.use(helmet());
```

### 6. 输入验证

考虑添加更严格的输入验证：

```bash
npm install express-validator
```

## 部署清单

生产环境部署前请确认：

- [ ] 启用HTTPS
- [ ] 配置安全cookie (secure: true)
- [ ] 添加CSRF保护
- [ ] 添加速率限制
- [ ] 使用强密钥的环境变量
- [ ] 添加Helmet安全头
- [ ] 设置适当的CORS策略
- [ ] 配置日志记录
- [ ] 设置错误处理（不暴露敏感信息）
- [ ] 定期备份数据库
- [ ] 设置防火墙规则
- [ ] 使用反向代理 (如Nginx)

## 当前配置适用场景

当前配置适合：
- 本地开发和测试
- 内部网络使用
- 学习和演示目的

**不适合**直接用于：
- 公网生产环境
- 包含敏感数据的应用

## 联系支持

如需生产环境部署帮助，请参考Node.js和Express.js的安全最佳实践。
