const express = require('express');
const router = express.Router();
const User = require('../models/User.js');
const Booking = require('../models/Booking.js');
const Flight = require('../models/Flight.js');

require('dotenv').config();

// const { signup } = require('../utils/auth.js');
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const cookieParser = require('cookie-parser')
router.use(cookieParser())

// Check if user is logged in already or not ---------------------------------------------------------------------------
router.get('/signup', async (req, res) => {
  const token = req.cookies && req.cookies.token;
  // console.log(token);
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.email);
      res.json(user);
      res.render('loggedIn.ejs', { user });
    } catch (error) {
      res.status(401).json({ message: 'Unauthorized' });
    }
  } else {
    res.render('signup.ejs');
    // res.send("Signup");
  }
});

// Create a user or SIGNING UP -----------------------------------------------------------------------------------------
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(password, salt, async function(err, hash) {
          try {
            let newUser = new User({ name, email, password: hash });
            await newUser.save();
            res.cookie("token", jwt.sign({ name, email, password : hash }, process.env.JWT_SECRET));
            res.render('loggedIn.ejs');
          } catch (error) {
            res.status(500).json({ message: 'Something went wrong', error: error.message });
          }
        });
    });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
})

// Login route ----------------------------------------------------------------------------------------------------------
router.get('/login', async (req, res) => {
  const token = req.cookies && req.cookies.token;
  console.log("token from login route-------> " + token)

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findOne({ email: decoded.email });
      if (user) {
        return res.render('loggedIn.ejs', { user });
      }
    } catch (error) {
      // If token is invalid, clear it
      // res.clearCookie('token');
      res.cookie("token", "");
    }
  }
  // If no valid token, render login page
  else res.render('login.ejs');
});

// Login POST route ------------------------------------------------------------------------------------------------------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create and assign token
    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET);
    res.cookie('token', token, { httpOnly: true });
    console.log("token from login post route -------> " + token);

    res.render('loggedIn.ejs', { user });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
});

router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});

router.get('/bookings', async (req, res) => {
  const token = req.cookies && req.cookies.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findOne({ email: decoded.email });

      const bookings = await Booking.find({ user: user._id }).populate('flight');

      // No need to manually populate flightDetails as it's already in the Booking model
      console.log(bookings.flightDetails);

      res.render('myBooking.ejs', { user, bookings });
    } catch (error) {
      res.status(401).json({ message: 'Unauthorized' });
    }
  } else {
    // res.redirect('/login');
    res.render('login.ejs');
  }
});


// Update a user
router.patch('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    Object.assign(user, req.body);
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a user
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.remove();
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
