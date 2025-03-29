const express = require('express');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

// Setup the database
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'test-server.db');
console.log(`Database path: ${dbPath}`);

// Create a new database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Could not connect to database', err);
    process.exit(1);
  }
  
  console.log('Connected to SQLite database');
  
  // Create tables
  db.serialize(() => {
    // Create users table (needed for foreign key constraints)
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT,
        role TEXT NOT NULL
      )
    `, err => {
      if (err) {
        console.error('Error creating users table:', err);
        return;
      }
      
      // Insert admin user if it doesn't exist
      db.get('SELECT id FROM users WHERE username = ?', ['admin'], (err, row) => {
        if (err || !row) {
          db.run(`
            INSERT INTO users (username, password, name, role)
            VALUES ('admin', 'admin123', 'Admin User', 'admin')
          `);
        }
      });
    });
    
    // Create products table (needed for foreign key constraints)
    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        size TEXT,
        category TEXT,
        price REAL NOT NULL
      )
    `, err => {
      if (err) {
        console.error('Error creating products table:', err);
        return;
      }
      
      // Insert sample products if they don't exist
      db.get('SELECT id FROM products WHERE code = ?', ['P001'], (err, row) => {
        if (err || !row) {
          db.run(`
            INSERT INTO products (code, name, size, category, price)
            VALUES 
              ('P001', 'Product A', 'Medium', 'Electronics', 250),
              ('P002', 'Product B', 'Large', 'Clothing', 500),
              ('P003', 'Product C', 'Small', 'Food', 150)
          `);
        }
      });
    });
    
    // Create estimates table
    db.run(`
      CREATE TABLE IF NOT EXISTS estimates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        estimate_no TEXT UNIQUE NOT NULL,
        date TEXT NOT NULL,
        order_no TEXT,
        customer_name TEXT NOT NULL,
        assigned_agent TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        total_amount REAL NOT NULL DEFAULT 0,
        created_by INTEGER NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `, err => {
      if (err) {
        console.error('Error creating estimates table:', err);
        return;
      }
      
      console.log('Estimates table created successfully');
    });
    
    // Create estimate_products table
    db.run(`
      CREATE TABLE IF NOT EXISTS estimate_products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        estimate_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        rate REAL NOT NULL,
        amount REAL NOT NULL,
        FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `, err => {
      if (err) {
        console.error('Error creating estimate_products table:', err);
        return;
      }
      
      console.log('Estimate_products table created successfully');
    });
    
    // Insert sample estimates if they don't exist
    db.get('SELECT id FROM estimates WHERE estimate_no = ?', ['EST-001'], (err, row) => {
      if (err || !row) {
        db.run(`
          INSERT INTO estimates (estimate_no, date, order_no, customer_name, assigned_agent, status, total_amount, created_by)
          VALUES 
            ('EST-001', datetime('now', '-5 days'), 'ORD-001', 'John Doe', 'Agent Smith', 'packed', 1250, 1),
            ('EST-002', datetime('now', '-2 days'), '', 'Jane Smith', 'Agent Johnson', 'pending', 2000, 1),
            ('EST-003', datetime('now', '-1 days'), 'ORD-002', 'Robert Brown', 'Agent Davis', 'pending', 900, 1)
        `, function(err) {
          if (err) {
            console.error('Error inserting sample estimates:', err);
            return;
          }
          
          // Get the IDs of the inserted estimates
          db.all('SELECT id, estimate_no FROM estimates', (err, estimates) => {
            if (err || !estimates.length) {
              console.error('Error getting inserted estimates:', err);
              return;
            }
            
            const estimateMap = {};
            estimates.forEach(est => {
              estimateMap[est.estimate_no] = est.id;
            });
            
            // Insert sample estimate products
            const stmt = db.prepare(`
              INSERT INTO estimate_products (estimate_id, product_id, quantity, rate, amount)
              VALUES (?, ?, ?, ?, ?)
            `);
            
            if (estimateMap['EST-001']) {
              stmt.run(estimateMap['EST-001'], 1, 3, 250, 750);
              stmt.run(estimateMap['EST-001'], 2, 1, 500, 500);
            }
            
            if (estimateMap['EST-002']) {
              stmt.run(estimateMap['EST-002'], 3, 2, 1000, 2000);
            }
            
            if (estimateMap['EST-003']) {
              stmt.run(estimateMap['EST-003'], 1, 1, 250, 250);
              stmt.run(estimateMap['EST-003'], 2, 1, 500, 500);
              stmt.run(estimateMap['EST-003'], 3, 1, 150, 150);
            }
            
            stmt.finalize();
            console.log('Sample data inserted successfully');
          });
        });
      }
    });
  });
});

// Middleware
app.use(express.static(path.join(__dirname, 'src')));
app.use(express.json());

// Debug middleware - log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Body:', JSON.stringify(req.body));
  }
  next();
});

// API Routes
app.get('/api/estimates', async (req, res) => {
  db.all(`SELECT * FROM estimates ORDER BY date DESC`, (err, estimates) => {
    if (err) {
      console.error('Error getting estimates:', err);
      return res.status(500).json({ error: 'Failed to get estimates' });
    }
    
    // Get products for each estimate
    const promises = estimates.map(estimate => {
      return new Promise((resolve) => {
        db.all(`
          SELECT 
            ep.*,
            p.code as productCode,
            p.name,
            p.size,
            p.category
          FROM 
            estimate_products ep
          JOIN 
            products p ON ep.product_id = p.id
          WHERE 
            ep.estimate_id = ?
        `, [estimate.id], (err, products) => {
          if (err) {
            console.error('Error getting estimate products:', err);
            resolve([]);
            return;
          }
          
          resolve(products);
        });
      });
    });
    
    Promise.all(promises)
      .then(productsResults => {
        estimates.forEach((estimate, index) => {
          estimate.products = productsResults[index];
        });
        
        res.json(estimates);
      })
      .catch(err => {
        console.error('Error getting estimate products:', err);
        res.status(500).json({ error: 'Failed to get estimate products' });
      });
  });
});

app.get('/api/estimates/:id', async (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM estimates WHERE id = ?', [id], (err, estimate) => {
    if (err) {
      console.error('Error getting estimate:', err);
      return res.status(500).json({ error: 'Failed to get estimate' });
    }
    
    if (!estimate) {
      return res.status(404).json({ error: 'Estimate not found' });
    }
    
    // Get products for the estimate
    db.all(`
      SELECT 
        ep.*,
        p.code as productCode,
        p.name,
        p.size,
        p.category
      FROM 
        estimate_products ep
      JOIN 
        products p ON ep.product_id = p.id
      WHERE 
        ep.estimate_id = ?
    `, [id], (err, products) => {
      if (err) {
        console.error('Error getting estimate products:', err);
        estimate.products = [];
      } else {
        estimate.products = products;
      }
      
      res.json(estimate);
    });
  });
});

app.get('/api/products', async (req, res) => {
  db.all('SELECT * FROM products', (err, products) => {
    if (err) {
      console.error('Error getting products:', err);
      return res.status(500).json({ error: 'Failed to get products' });
    }
    
    res.json(products);
  });
});

// Update estimate status
app.put('/api/estimates/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['pending', 'packed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
    
    db.run('UPDATE estimates SET status = ?, updated_at = datetime("now") WHERE id = ?', 
      [status, id], function(err) {
      if (err) {
        console.error('Error updating estimate status:', err);
        return res.status(500).json({ error: 'Database error when updating estimate' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Estimate not found' });
      }
      
      res.json({ success: true, id, status });
    });
  } catch (error) {
    console.error('Error updating estimate status:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add new estimate
app.post('/api/estimates', (req, res) => {
  try {
    const estimate = req.body;
    
    // Validate required fields
    if (!estimate.estimate_no || !estimate.customer_name || !estimate.date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Start a transaction
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      // Insert estimate
      db.run(
        `INSERT INTO estimates (
          estimate_no, date, order_no, customer_name, assigned_agent, 
          status, total_amount, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [
          estimate.estimate_no,
          estimate.date,
          estimate.order_no || '',
          estimate.customer_name,
          estimate.assigned_agent,
          estimate.status || 'pending',
          estimate.total_amount,
          estimate.created_by
        ],
        function(err) {
          if (err) {
            console.error('Error creating estimate:', err);
            db.run('ROLLBACK');
            return res.status(500).json({ error: 'Database error when creating estimate' });
          }
          
          const estimateId = this.lastID;
          
          // Insert products
          if (estimate.products && estimate.products.length > 0) {
            const stmt = db.prepare(
              `INSERT INTO estimate_products (
                estimate_id, product_id, quantity, rate, amount
              ) VALUES (?, ?, ?, ?, ?)`
            );
            
            try {
              estimate.products.forEach(product => {
                stmt.run(
                  estimateId,
                  product.product_id,
                  product.quantity,
                  product.rate,
                  product.amount
                );
              });
              
              stmt.finalize();
              db.run('COMMIT');
              res.status(201).json({ success: true, id: estimateId });
            } catch (error) {
              console.error('Error adding products to estimate:', error);
              db.run('ROLLBACK');
              res.status(500).json({ error: 'Database error when adding products' });
            }
          } else {
            db.run('COMMIT');
            res.status(201).json({ success: true, id: estimateId });
          }
        }
      );
    });
  } catch (error) {
    console.error('Error creating estimate:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update existing estimate
app.put('/api/estimates/:id', (req, res) => {
  try {
    const { id } = req.params;
    const estimate = req.body;
    
    // Validate required fields
    if (!estimate.estimate_no || !estimate.customer_name || !estimate.date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Start a transaction
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      // Update estimate
      db.run(
        `UPDATE estimates SET 
          estimate_no = ?, 
          date = ?, 
          order_no = ?, 
          customer_name = ?, 
          assigned_agent = ?, 
          status = ?, 
          total_amount = ?, 
          updated_at = datetime('now')
        WHERE id = ?`,
        [
          estimate.estimate_no,
          estimate.date,
          estimate.order_no || '',
          estimate.customer_name,
          estimate.assigned_agent,
          estimate.status,
          estimate.total_amount,
          id
        ],
        function(err) {
          if (err) {
            console.error('Error updating estimate:', err);
            db.run('ROLLBACK');
            return res.status(500).json({ error: 'Database error when updating estimate' });
          }
          
          if (this.changes === 0) {
            db.run('ROLLBACK');
            return res.status(404).json({ error: 'Estimate not found' });
          }
          
          // Delete existing products
          db.run('DELETE FROM estimate_products WHERE estimate_id = ?', [id], function(err) {
            if (err) {
              console.error('Error deleting existing products:', err);
              db.run('ROLLBACK');
              return res.status(500).json({ error: 'Database error when updating products' });
            }
            
            // Insert new products
            if (estimate.products && estimate.products.length > 0) {
              const stmt = db.prepare(
                `INSERT INTO estimate_products (
                  estimate_id, product_id, quantity, rate, amount
                ) VALUES (?, ?, ?, ?, ?)`
              );
              
              try {
                estimate.products.forEach(product => {
                  stmt.run(
                    id,
                    product.product_id,
                    product.quantity,
                    product.rate,
                    product.amount
                  );
                });
                
                stmt.finalize();
                db.run('COMMIT');
                res.json({ success: true, id });
              } catch (error) {
                console.error('Error adding products to estimate:', error);
                db.run('ROLLBACK');
                res.status(500).json({ error: 'Database error when adding products' });
              }
            } else {
              db.run('COMMIT');
              res.json({ success: true, id });
            }
          });
        }
      );
    });
  } catch (error) {
    console.error('Error updating estimate:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Serve the estimates.html file
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

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
}); 