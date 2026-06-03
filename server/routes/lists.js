const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Helper function to handle GET requests
const getList = (table) => (req, res) => {
  db.all(`SELECT * FROM ${table} WHERE user_id = ?`, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
};

// Helper function to handle POST requests
const addToList = (table) => (req, res) => {
  const { dealID, title, thumb, salePrice, storeID } = req.body;
  if (!dealID) return res.status(400).json({ error: 'dealID is required' });

  db.run(
    `INSERT INTO ${table} (user_id, dealID, title, thumb, salePrice, storeID) VALUES (?, ?, ?, ?, ?, ?)`,
    [req.user.id, dealID, title, thumb, salePrice, storeID],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Item already in list' });
        }
        return res.status(500).json({ error: 'Failed to add item' });
      }
      res.status(201).json({ message: 'Added successfully', id: this.lastID });
    }
  );
};

// Helper function to handle DELETE requests
const removeFromList = (table) => (req, res) => {
  const dealID = req.params.dealID;
  db.run(`DELETE FROM ${table} WHERE user_id = ? AND dealID = ?`, [req.user.id, dealID], function(err) {
    if (err) return res.status(500).json({ error: 'Failed to delete item' });
    res.json({ message: 'Removed successfully', changes: this.changes });
  });
};

// Routes for Waitlist
router.get('/waitlist', authenticateToken, getList('waitlist'));
router.post('/waitlist', authenticateToken, addToList('waitlist'));
router.delete('/waitlist/:dealID', authenticateToken, removeFromList('waitlist'));

// Routes for Collection
router.get('/collection', authenticateToken, getList('collection'));
router.post('/collection', authenticateToken, addToList('collection'));
router.delete('/collection/:dealID', authenticateToken, removeFromList('collection'));

module.exports = router;
