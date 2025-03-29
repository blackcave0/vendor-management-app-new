const express = require('express');
const path = require('path');
const cors = require('cors');
const db = require('./src/utils/database');

const app = express();
const PORT = 3000;

// Enable CORS
app.use(cors());

// Serve static files from src directory
app.use(express.static(path.join(__dirname, 'src')));
app.use(express.json());

// Redirect root to login page
app.get('/', (req, res) => {
  res.redirect('/pages/login.html');
});

// API Routes
app.get('/api/estimates', async (req, res) => {
  try {
    const estimates = await db.getEstimates();
    res.json(estimates);
  } catch (error) {
    console.error('Error getting estimates:', error);
    res.status(500).json({ error: 'Failed to get estimates' });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const products = await db.getAll('products');
    res.json(products);
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({ error: 'Failed to get products' });
  }
});

app.post('/api/estimates', async (req, res) => {
  try {
    const newEstimate = await db.add('estimates', req.body);
    res.status(201).json(newEstimate);
  } catch (error) {
    console.error('Error adding estimate:', error);
    res.status(500).json({ error: 'Failed to add estimate' });
  }
});

app.get('/api/estimates/:id', async (req, res) => {
  try {
    const estimate = await db.getEstimateById(req.params.id);
    if (!estimate) {
      return res.status(404).json({ error: 'Estimate not found' });
    }
    res.json(estimate);
  } catch (error) {
    console.error('Error getting estimate:', error);
    res.status(500).json({ error: 'Failed to get estimate' });
  }
});

app.put('/api/estimates/:id', async (req, res) => {
  try {
    const updatedEstimate = await db.update('estimates', req.params.id, req.body);
    res.json(updatedEstimate);
  } catch (error) {
    console.error('Error updating estimate:', error);
    res.status(500).json({ error: 'Failed to update estimate' });
  }
});

app.patch('/api/estimates/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const updatedEstimate = await db.update('estimates', req.params.id, { status });
    res.json(updatedEstimate);
  } catch (error) {
    console.error('Error updating estimate status:', error);
    res.status(500).json({ error: 'Failed to update estimate status' });
  }
});

// Only start the server if this file is run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
  });
}

module.exports = app; 