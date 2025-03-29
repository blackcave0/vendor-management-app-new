const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Determine user data path
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'test-db.db');
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
        created_by INTEGER NOT NULL DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT
      )
    `, err => {
      if (err) {
        console.error('Error creating estimates table:', err);
        return;
      }
      
      console.log('Estimates table created successfully');
      
      // Insert a test estimate
      db.run(`
        INSERT INTO estimates (estimate_no, date, order_no, customer_name, assigned_agent, status, total_amount)
        VALUES ('EST-TEST', datetime('now'), 'ORD-TEST', 'Test Customer', 'Test Agent', 'pending', 100)
      `, err => {
        if (err) {
          console.error('Error inserting test estimate:', err);
          return;
        }
        
        console.log('Test estimate inserted successfully');
        
        // Query the estimates
        db.all('SELECT * FROM estimates', (err, rows) => {
          if (err) {
            console.error('Error querying estimates:', err);
            return;
          }
          
          console.log('Estimates:', rows);
          
          // Close the database connection
          db.close(err => {
            if (err) {
              console.error('Error closing database:', err);
              return;
            }
            
            console.log('Database connection closed');
          });
        });
      });
    });
  });
}); 