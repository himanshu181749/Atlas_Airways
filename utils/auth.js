const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const User = require('../models/User.js');

require('dotenv').config();


const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const cookieParser = require('cookie-parser')
router.use(cookieParser())

const signup = async (req, res) => {
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
            res.cookie("Auth-token", jwt.sign({ username, email, age }, process.env.JWT_SECRET));
            res.send("User created successfully, Take me Home")
          } catch (error) {
            res.status(500).json({ message: 'Something went wrong', error: error.message });
          }
        });
    });


    res.status(201).json({ token, userId: newUser._id });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

module.exports = { signup };
