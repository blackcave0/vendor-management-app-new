const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 4001;

// Sample data
const products = [
  { id: 1, code: 'P001', name: 'Product A', size: 'Medium', category: 'Electronics', price: 250 },
  { id: 2, code: 'P002', name: 'Product B', size: 'Large', category: 'Clothing', price: 500 },
  { id: 3, code: 'P003', name: 'Product C', size: 'Small', category: 'Food', price: 150 }
];

let estimates = [
  {
    id: 1,
    estimate_no: 'EST-001',
    date: '2025-03-23 18:22:58',
    order_no: 'ORD-001',
    customer_name: 'John Doe',
    assigned_agent: 'Agent Smith',
    status: 'pending',
    total_amount: 1250,
    created_by: 1,
    created_at: '2025-03-28 18:22:58',
    updated_at: null,
    products: [
      { id: 1, estimate_id: 1, product_id: 1, quantity: 3, rate: 250, amount: 750, productCode: 'P001', name: 'Product A', size: 'Medium', category: 'Electronics' },
      { id: 2, estimate_id: 1, product_id: 2, quantity: 1, rate: 500, amount: 500, productCode: 'P002', name: 'Product B', size: 'Large', category: 'Clothing' }
    ]
  },
  {
    id: 2,
    estimate_no: 'EST-002',
    date: '2025-03-26 18:22:58',
    order_no: '',
    customer_name: 'Jane Smith',
    assigned_agent: 'Agent Johnson',
    status: 'pending',
    total_amount: 2000,
    created_by: 1,
    created_at: '2025-03-28 18:22:58',
    updated_at: null,
    products: [
      { id: 3, estimate_id: 2, product_id: 3, quantity: 2, rate: 1000, amount: 2000, productCode: 'P003', name: 'Product C', size: 'Small', category: 'Food' }
    ]
  },
  {
    id: 3,
    estimate_no: 'EST-003',
    date: '2025-03-27 18:22:58',
    order_no: 'ORD-002',
    customer_name: 'Robert Brown',
    assigned_agent: 'Agent Davis',
    status: 'pending',
    total_amount: 900,
    created_by: 1,
    created_at: '2025-03-28 18:22:58',
    updated_at: null,
    products: [
      { id: 4, estimate_id: 3, product_id: 1, quantity: 1, rate: 250, amount: 250, productCode: 'P001', name: 'Product A', size: 'Medium', category: 'Electronics' },
      { id: 5, estimate_id: 3, product_id: 2, quantity: 1, rate: 500, amount: 500, productCode: 'P002', name: 'Product B', size: 'Large', category: 'Clothing' },
      { id: 6, estimate_id: 3, product_id: 3, quantity: 1, rate: 150, amount: 150, productCode: 'P003', name: 'Product C', size: 'Small', category: 'Food' }
    ]
  }
];

// Middleware
app.use(bodyParser.json());
app.use(express.static('src'));
app.use(cors());

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Body:', JSON.stringify(req.body));
  }
  next();
});

// API Routes
app.get('/api/products', (req, res) => {
  res.json(products);
});

app.get('/api/estimates', (req, res) => {
  res.json(estimates);
});

app.get('/api/estimates/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const estimate = estimates.find(e => e.id === id);
  
  if (!estimate) {
    return res.status(404).json({ error: 'Estimate not found' });
  }
  
  res.json(estimate);
});

app.post('/api/estimates', (req, res) => {
  console.log('POST estimate received');
  console.log('Body:', req.body);
  
  const newEstimate = {
    ...req.body,
    id: estimates.length + 1,
    created_at: new Date().toISOString(),
    updated_at: null
  };
  
  // Add product details
  if (newEstimate.products && newEstimate.products.length > 0) {
    newEstimate.products = newEstimate.products.map((p, index) => {
      const product = products.find(prod => prod.id === p.product_id);
      return {
        id: estimates.length * 10 + index + 1,
        estimate_id: newEstimate.id,
        product_id: p.product_id,
        quantity: p.quantity,
        rate: p.rate,
        amount: p.amount,
        productCode: product.code,
        name: product.name,
        size: product.size,
        category: product.category
      };
    });
  } else {
    newEstimate.products = [];
  }
  
  estimates.push(newEstimate);
  
  res.status(201).json({
    success: true,
    id: newEstimate.id
  });
});

app.put('/api/estimates/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const estimateIndex = estimates.findIndex(e => e.id === id);
  
  if (estimateIndex === -1) {
    return res.status(404).json({ error: 'Estimate not found' });
  }
  
  const updatedEstimate = {
    ...req.body,
    id: id,
    created_at: estimates[estimateIndex].created_at,
    updated_at: new Date().toISOString()
  };
  
  // Update product details
  if (updatedEstimate.products && updatedEstimate.products.length > 0) {
    updatedEstimate.products = updatedEstimate.products.map((p, index) => {
      const product = products.find(prod => prod.id === p.product_id);
      return {
        id: id * 10 + index + 1,
        estimate_id: id,
        product_id: p.product_id,
        quantity: p.quantity,
        rate: p.rate,
        amount: p.amount,
        productCode: product.code,
        name: product.name,
        size: product.size,
        category: product.category
      };
    });
  } else {
    updatedEstimate.products = [];
  }
  
  estimates[estimateIndex] = updatedEstimate;
  
  res.json({
    success: true,
    id: id
  });
});

app.put('/api/estimates/:id/status', (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  
  if (!status || !['pending', 'packed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }
  
  const estimateIndex = estimates.findIndex(e => e.id === id);
  
  if (estimateIndex === -1) {
    return res.status(404).json({ error: 'Estimate not found' });
  }
  
  estimates[estimateIndex].status = status;
  estimates[estimateIndex].updated_at = new Date().toISOString();
  
  res.json({
    success: true,
    id: id,
    status: status
  });
});

// Serve the HTML files
app.get('/estimates', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'pages', 'estimates.html'));
});

app.get('/estimate-detail', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'pages', 'estimate-detail.html'));
});

// Redirect root to estimates page
app.get('/', (req, res) => {
  res.redirect('/estimates');
});

// Start server
app.listen(PORT, () => {
  console.log(`Simple server running at http://localhost:${PORT}/`);
}); 