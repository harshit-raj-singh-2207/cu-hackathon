const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function configureDevelopmentProxies(app) {
  // The application has two backend services. Keep the versioned application
  // API (auth, jobs, analytics, etc.) on FastAPI and leave the legacy coding
  // API on the Express proxy configured in package.json.
  app.use(
    '/api/v1',
    createProxyMiddleware({
      target: process.env.FASTAPI_PROXY_TARGET || 'http://127.0.0.1:8000',
      changeOrigin: true,
    })
  );
};
