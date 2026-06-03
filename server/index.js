try {
  if (process.loadEnvFile) {
    process.loadEnvFile();
  }
} catch (e) {
  // Ignore if no .env file
}

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const listsRoutes = require('./routes/lists');
const dealsRoutes = require('./routes/deals');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', listsRoutes);
app.use('/api', dealsRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
