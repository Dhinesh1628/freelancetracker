const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user');

const JWT_SECRET = process.env.JWT_SECRET || 'freelancetracker_jwt_secret_key_2026';

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// REGISTER
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password are required.' });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(409).json({ error: 'Account already exists.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    const token = generateToken(user);

    res.status(201).json({
      message: 'Account created successfully.',
      user: { id: user._id, name: user.name, email: user.email },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error during registration.' });
  }
};

// LOGIN
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful.',
      user: { id: user._id, name: user.name, email: user.email },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error during login.' });
  }
};

// ME
const getMe = (req, res) => {
  res.json({ user: req.user });
};

// UPDATE ME
const updateMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id || req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email;
    if (req.body.password) {
      user.password = await bcrypt.hash(req.body.password, 10);
    }

    const updatedUser = await user.save();
    
    res.json({
      message: 'Profile updated',
      user: { id: updatedUser._id, name: updatedUser.name, email: updatedUser.email }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error during profile update.' });
  }
};

module.exports = { register, login, getMe, updateMe, JWT_SECRET, generateToken };
