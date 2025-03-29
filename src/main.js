const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const db = require('./utils/database');
const express = require('express');
const server = require('../server');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'pages', 'login.html'));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  // Close database connection before quitting
  db.close();
  if (process.platform !== 'darwin') app.quit();
});

// IPC handlers
ipcMain.handle('login', async (event, credentials) => {
  try {
    const user = await db.getUserByCredentials(credentials.username, credentials.password);
  
  if (user) {
      return { success: true, user };
  }
  
  return { success: false, message: 'Invalid username or password' };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'An error occurred during login' };
  }
});

// User management
ipcMain.handle('get-users', async () => {
  try {
    return await db.getAll('users');
  } catch (error) {
    console.error('Error getting users:', error);
    throw error;
  }
});

ipcMain.handle('add-user', async (event, userData) => {
  try {
    return await db.add('users', userData);
  } catch (error) {
    console.error('Error adding user:', error);
    throw error;
  }
});

ipcMain.handle('update-user', async (event, userId, updates) => {
  try {
    return await db.update('users', userId, updates);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
});

ipcMain.handle('delete-user', async (event, userId) => {
  try {
    return await db.delete('users', userId);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
});

// Product management
ipcMain.handle('get-products', async () => {
  try {
    return await db.getProductsWithInventory();
  } catch (error) {
    console.error('Error getting products:', error);
    throw error;
  }
});

ipcMain.handle('get-product', async (event, productId) => {
  try {
    return await db.getById('products', productId);
  } catch (error) {
    console.error('Error getting product:', error);
    throw error;
  }
});

ipcMain.handle('add-product', async (event, product) => {
  try {
    return await db.add('products', product);
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
});

ipcMain.handle('update-product', async (event, productId, updates) => {
  try {
    return await db.update('products', productId, updates);
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
});

ipcMain.handle('delete-product', async (event, productId) => {
  try {
    return await db.delete('products', productId);
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
});

// Inventory management
ipcMain.handle('get-inventory', async () => {
  try {
    return await db.getProductsWithInventory();
  } catch (error) {
    console.error('Error getting inventory:', error);
    throw error;
  }
});

ipcMain.handle('update-inventory', async (event, data) => {
  try {
    return await db.updateInventory(data.productId, data.quantity, data.location, data.userId);
  } catch (error) {
    console.error('Error updating inventory:', error);
    throw error;
  }
});

// Order management
ipcMain.handle('get-today-orders', async () => {
  try {
    return await db.getTodayOrders();
  } catch (error) {
    console.error('Error getting today orders:', error);
    throw error;
  }
});

ipcMain.handle('get-all-orders', async () => {
  try {
    return await db.getAll('orders');
  } catch (error) {
    console.error('Error getting all orders:', error);
    throw error;
  }
});

ipcMain.handle('get-detailed-orders', async () => {
  try {
    return await db.getDetailedOrders();
  } catch (error) {
    console.error('Error getting detailed orders:', error);
    throw error;
  }
});

ipcMain.handle('get-pending-orders', async () => {
  try {
    return await db.getOrdersByStatus('pending');
  } catch (error) {
    console.error('Error getting pending orders:', error);
    throw error;
  }
});

ipcMain.handle('create-order', async (event, orderData) => {
  try {
    return await db.createOrder(orderData);
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
});

ipcMain.handle('update-order', async (event, orderId, updates) => {
  try {
    return await db.update('orders', orderId, updates);
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
});

ipcMain.handle('delete-order', async (event, orderId) => {
  try {
    return await db.delete('orders', orderId);
  } catch (error) {
    console.error('Error deleting order:', error);
    throw error;
  }
});

// Vendor management
ipcMain.handle('get-vendors', async () => {
  try {
    return await db.getAll('vendors');
  } catch (error) {
    console.error('Error getting vendors:', error);
    throw error;
  }
});

ipcMain.handle('get-vendor', async (event, vendorId) => {
  try {
    return await db.getById('vendors', vendorId);
  } catch (error) {
    console.error('Error getting vendor:', error);
    throw error;
  }
});

ipcMain.handle('add-vendor', async (event, vendorData) => {
  try {
    // Convert camelCase to snake_case for database
    const dbData = {
      name: vendorData.name,
      contact_person: vendorData.contactPerson,
      email: vendorData.email,
      phone: vendorData.phone,
      address: vendorData.address,
      notes: vendorData.notes
    };
    return await db.add('vendors', dbData);
  } catch (error) {
    console.error('Error adding vendor:', error);
    throw error;
  }
});

ipcMain.handle('update-vendor', async (event, vendorId, vendorData) => {
  try {
    // Convert camelCase to snake_case for database
    const dbData = {
      name: vendorData.name,
      contact_person: vendorData.contactPerson,
      email: vendorData.email,
      phone: vendorData.phone,
      address: vendorData.address,
      notes: vendorData.notes
    };
    return await db.update('vendors', vendorId, dbData);
  } catch (error) {
    console.error('Error updating vendor:', error);
    throw error;
  }
});

ipcMain.handle('delete-vendor', async (event, vendorId) => {
  try {
    return await db.delete('vendors', vendorId);
  } catch (error) {
    console.error('Error deleting vendor:', error);
    throw error;
  }
});

// Transaction management
ipcMain.handle('get-transactions', async () => {
  try {
    return await db.getAll('transactions');
  } catch (error) {
    console.error('Error getting transactions:', error);
    throw error;
  }
});

// Reports
ipcMain.handle('get-sales-report', async (event, filters) => {
  try {
    return await db.getSalesReport(filters);
  } catch (error) {
    console.error('Error getting sales report:', error);
    throw error;
  }
});

ipcMain.handle('get-inventory-report', async () => {
  try {
    return await db.getInventoryReport();
  } catch (error) {
    console.error('Error getting inventory report:', error);
    throw error;
  }
});

// Estimate management
ipcMain.handle('get-estimates', async () => {
  try {
    return await db.getEstimates();
  } catch (error) {
    console.error('Error getting estimates:', error);
    throw error;
  }
});

ipcMain.handle('get-estimate-by-id', async (event, estimateId) => {
  try {
    return await db.getEstimateById(estimateId);
  } catch (error) {
    console.error('Error getting estimate:', error);
    throw error;
  }
});

ipcMain.handle('add-estimate', async (event, estimateData) => {
  try {
    return await db.addEstimate(estimateData);
  } catch (error) {
    console.error('Error adding estimate:', error);
    throw error;
  }
});

ipcMain.handle('update-estimate', async (event, estimateId, updates) => {
  try {
    return await db.updateEstimate(estimateId, updates);
  } catch (error) {
    console.error('Error updating estimate:', error);
    throw error;
  }
});

ipcMain.handle('update-estimate-status', async (event, estimateId, status) => {
  try {
    return await db.updateEstimate(estimateId, { status });
  } catch (error) {
    console.error('Error updating estimate status:', error);
    throw error;
  }
});

ipcMain.handle('delete-estimate', async (event, estimateId) => {
  try {
    return await db.deleteEstimate(estimateId);
  } catch (error) {
    console.error('Error deleting estimate:', error);
    throw error;
  }
}); 