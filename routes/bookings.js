const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();
const Booking = require('../models/Booking.js');
const User = require('../models/User.js');
const Flight = require('../models/Flight.js');

// mongoose.connect('mongodb://127.0.0.1:27017/flightBookingSystem');

// Get all bookings
router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find().populate('user').populate('flight');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a booking
router.post('/', async (req, res) => {
  try {
    const user = await User.findById(req.body.userId);
    const flight = await Flight.findById(req.body.flightId);

    if (!user || !flight) {
      return res.status(404).json({ message: 'User or Flight not found' });
    }

    const booking = new Booking({
      user: user._id,
      flight: flight._id,
      bookingDate: new Date(),
      seatNumber: req.body.seatNumber,
    });

    const newBooking = await booking.save();
    res.status(201).json(newBooking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a booking
router.patch('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    Object.assign(booking, req.body);
    await booking.save();
    res.json(booking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a booking
router.delete('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: 'Booking deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;


