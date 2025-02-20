const express = require('express');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Create an Express application
const app = express();
const PORT = 5173; // Port for your proxy server
const API_SERVICE_URL = 'https://9452-102-221-238-162.ngrok-free.app'; // Target API URL

// Logging middleware
app.use(morgan('dev'));

// Proxy all requests starting with /api to the target API
app.use('/', createProxyMiddleware({
    target: API_SERVICE_URL,
    changeOrigin: true,
}));

// Start the server
app.listen(PORT, () => {
    console.log(`Proxy server is running on http://localhost:${PORT}`);
});
