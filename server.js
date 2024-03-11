// server.js

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

const app = express();
const port = 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/user-registration', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Define User schema
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true }
});

// Hash password before saving user
userSchema.pre('save', async function (next) {
  const user = this;
  if (!user.isModified('password')) return next();
  user.password = await bcrypt.hash(user.password, 10);
  next();
});

const User = mongoose.model('User', userSchema);

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

// Serve index.html as the home page
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: __dirname + '/public' });
});

// Handle user signup
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).send('User already exists');
    }

    // Create a new user
    const newUser = new User({ username, email, password });
    // Save the user to the database
    await newUser.save();
    // Redirect to the home page
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error registering user');
  }
});

// Handle user login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find the user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).send('User not found');
    }

    // Compare passwords
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).send('Invalid password');
    }

    // Authentication successful
    res.send('Login successful!');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error logging in');
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
