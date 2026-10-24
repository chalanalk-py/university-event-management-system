const express = require('express');
const cors = require('cors');

// Initialize express application
const app = express();

// Enable cross-origin resource sharing
app.use(cors());

// Parse incoming json request bodies
app.use(express.json());

// Parse incoming urlencoded request bodies
app.use(express.urlencoded({ extended: true }));

// Handle base health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Export configured express application
module.exports = app;
