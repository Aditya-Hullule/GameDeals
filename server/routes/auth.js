const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../db');
const { SECRET_KEY } = require('../middleware/auth');

const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password are required.' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    
    res.status(201).json({ message: 'User registered successfully!', userId: newUser._id });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Username already exists.' });
    }
    console.error('Registration error:', error.message);
    res.status(500).json({ error: 'Failed to register user.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password are required.' });

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: 'Invalid username or password.' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid username or password.' });

    const token = jwt.sign({ id: user._id, username: user.username }, SECRET_KEY, { expiresIn: '24h' });
    res.json({ message: 'Logged in successfully', token, user: { id: user._id, username: user.username } });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
