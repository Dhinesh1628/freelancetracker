require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const membersRoutes = require('./routes/membersRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);
app.use('/projects/:id/members', membersRoutes);

app.get('/', (req, res) =>
  res.json({ message: 'Freelance Tracker API is running.' })
);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});