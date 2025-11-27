// This file is used to configure the development server
// It will be automatically picked up by react-scripts
/* eslint-env node */

const { createProxyMiddleware } = require('http-proxy-middleware');

// eslint-disable-next-line no-undef
module.exports = function(app) {
  // Proxy API requests to backend
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:3002',
      changeOrigin: true,
    }),
  );

  // Proxy uploads requests to backend
  app.use(
    '/uploads',
    createProxyMiddleware({
      target: 'http://localhost:3002',
      changeOrigin: true,
    }),
  );

  // Disable WebSocket connection attempts
  // This will prevent the WebSocket connection error: 'WebSocket connection to 'ws://localhost:3000/ws' failed'
  app.use((req, res, next) => {
    // Add a header to disable WebSocket connections
    res.setHeader('X-No-WebSocket', 'true');
    next();
  });
};