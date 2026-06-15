const express = require('express');
const { Waitlist, Collection } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Helper function to handle GET requests
const getList = (Model) => async (req, res) => {
  try {
    const rows = await Model.find({ user_id: req.user.id });
    res.json(rows);
  } catch (err) {
    console.error('Error fetching list:', err.message);
    res.status(500).json({ error: 'Database error' });
  }
};

// Helper function to handle POST requests
const addToList = (Model) => async (req, res) => {
  const { dealID, title, thumb, salePrice, storeID } = req.body;
  if (!dealID) return res.status(400).json({ error: 'dealID is required' });

  try {
    const newItem = new Model({
      user_id: req.user.id,
      dealID,
      title,
      thumb,
      salePrice,
      storeID
    });
    await newItem.save();
    res.status(201).json({ message: 'Added successfully', id: newItem._id });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Item already in list' });
    }
    console.error('Error adding to list:', err.message);
    res.status(500).json({ error: 'Failed to add item' });
  }
};

// Helper function to handle DELETE requests
const removeFromList = (Model) => async (req, res) => {
  const dealID = req.params.dealID;
  try {
    const result = await Model.findOneAndDelete({ user_id: req.user.id, dealID });
    if (!result) return res.status(404).json({ error: 'Item not found in list' });
    res.json({ message: 'Removed successfully' });
  } catch (err) {
    console.error('Error removing from list:', err.message);
    res.status(500).json({ error: 'Failed to delete item' });
  }
};

// Routes for Waitlist
router.get('/waitlist', authenticateToken, getList(Waitlist));
router.post('/waitlist', authenticateToken, addToList(Waitlist));
router.delete('/waitlist/:dealID', authenticateToken, removeFromList(Waitlist));

// Routes for Collection
router.get('/collection', authenticateToken, getList(Collection));
router.post('/collection', authenticateToken, addToList(Collection));
router.delete('/collection/:dealID', authenticateToken, removeFromList(Collection));

module.exports = router;
