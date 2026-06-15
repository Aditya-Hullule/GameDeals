const mongoose = require('mongoose');

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gamedeals';

mongoose.connect(mongoURI)
  .then(() => console.log('Connected to MongoDB.'))
  .catch(err => console.error('Error connecting to MongoDB:', err.message));

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true }
});

const ListItemSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dealID: { type: String, required: true },
  title: { type: String, required: true },
  thumb: String,
  salePrice: Number,
  storeID: String
});

// Compound unique index to mimic SQLite's UNIQUE(user_id, dealID)
ListItemSchema.index({ user_id: 1, dealID: 1 }, { unique: true });

const User = mongoose.model('User', UserSchema);
const Waitlist = mongoose.model('Waitlist', ListItemSchema);
const Collection = mongoose.model('Collection', ListItemSchema);

module.exports = {
  db: mongoose.connection,
  User,
  Waitlist,
  Collection
};
