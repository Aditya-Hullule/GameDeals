try {
  if (process.loadEnvFile) {
    process.loadEnvFile();
  }
} catch (e) {
  // Ignore if no .env file
}

const express = require('express');
const cors = require('cors');
const { clerkMiddleware } = require('@clerk/express');

const listsRoutes = require('./routes/lists');
const dealsRoutes = require('./routes/deals');
const userRoutes = require('./routes/user');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

// Routes
app.use('/api', listsRoutes);
app.use('/api', dealsRoutes);
app.use('/api/user', userRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
