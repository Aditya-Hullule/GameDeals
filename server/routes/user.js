const express = require('express');
const { clerkClient } = require('@clerk/express');
const { Waitlist, Collection } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Delete user account permanently
router.delete('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  
  try {
    console.log(`Starting account deletion process for user: ${userId}`);

    // 1. Delete waitlist items
    const waitlistResult = await Waitlist.deleteMany({ user_id: userId });
    console.log(`Deleted ${waitlistResult.deletedCount} waitlist items`);

    // 2. Delete collection items
    const collectionResult = await Collection.deleteMany({ user_id: userId });
    console.log(`Deleted ${collectionResult.deletedCount} collection items`);

    // 3. Delete user account from Clerk
    await clerkClient.users.deleteUser(userId);
    console.log(`Successfully deleted user ${userId} from Clerk`);

    res.json({ message: 'Account and all associated lists deleted successfully.' });
  } catch (error) {
    console.error('Error during account deletion:', error.message);
    res.status(500).json({ error: 'Failed to delete account.' });
  }
});

module.exports = router;
