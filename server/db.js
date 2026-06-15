const mongoose = require('mongoose');

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gamedeals';

mongoose.connect(mongoURI)
  .then(() => console.log('Connected to MongoDB.'))
  .catch(err => console.error('Error connecting to MongoDB:', err.message));

const ListItemSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  dealID: { type: String, required: true },
  title: { type: String, required: true },
  thumb: String,
  salePrice: Number,
  storeID: String
});

// Compound unique index to mimic SQLite's UNIQUE(user_id, dealID)
ListItemSchema.index({ user_id: 1, dealID: 1 }, { unique: true });

const Waitlist = mongoose.model('Waitlist', ListItemSchema);
const Collection = mongoose.model('Collection', ListItemSchema);

module.exports = {
  db: mongoose.connection,
  Waitlist,
  Collection
};
