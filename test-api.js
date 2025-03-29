const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001;

// Middleware
app.use(bodyParser.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log('Body:', req.body);
  next();
});

// Test POST endpoint
app.post('/api/test', (req, res) => {
  console.log('POST request received');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  
  res.status(201).json({
    success: true,
    receivedData: req.body
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Test API server running on port ${PORT}`);
}); 