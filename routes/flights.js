const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const router = express.Router();
const Flight = require('../models/Flight.js');
const User = require('../models/User.js');
const Booking = require('../models/Booking.js');

require('dotenv').config();

// Get all flights
router.get('/', async (req, res) => {
  let user;
  if (req.cookies && req.cookies.token) {
    try {
      const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
      email = decoded.email;
      user = await User.findOne({ email });
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  } else {
    user = null;
  }

  try {
    let query = {};
    if (req.query.departure) query.departure = req.query.departure;
    if (req.query.arrival) query.arrival = req.query.arrival;
    if (req.query.departureDate) {
      const inputDate = new Date(req.query.departureDate);
      
      // Set start of day (midnight)
      const startDate = new Date(inputDate);
      startDate.setHours(0, 0, 0, 0);
      
      // Set end of day (23:59:59.999)
      const endDate = new Date(inputDate);
      endDate.setHours(23, 59, 59, 999);
      
      query.departureTime = {
        $gte: startDate,
        $lte: endDate
      };
    }

    const flights = await Flight.find(query);        // for getting flights on a specific date and destination
    // const flights = await Flight.find();          // for getting all flights
    // console.log("Flights: " + flights); 
    res.render('flightsIndex.ejs', { flights, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a flight
router.post('/', async (req, res) => {
  const flight = new Flight({
    flightNumber: req.body.flightNumber,
    airline: req.body.airline,
    departureTime: req.body.departureTime,
    arrivalTime: req.body.arrivalTime,
    origin: req.body.origin,
    destination: req.body.destination,
    availableSeats: req.body.availableSeats,
  });

  try {
    const newFlight = await flight.save();
    res.status(201).json(newFlight);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a flight
router.patch('/:id', async (req, res) => {
  try {
    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).json({ message: 'Flight not found' });
    }

    Object.assign(flight, req.body);
    await flight.save();
    res.json(flight);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a flight
router.delete('/:id', async (req, res) => {
  try {
    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).json({ message: 'Flight not found' });
    }

    await flight.remove();
    res.json({ message: 'Flight deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Book a flight
router.get('/book/:id', async (req, res) => {
  let user;
  if (req.cookies && req.cookies.token) {
    try {
      const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
      email = decoded.email;
      user = await User.findOne({ email });
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  } else {
    user = null;
  }

  try {
    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).json({ message: 'Flight not found' });
    }

    res.render('bookFlight.ejs', { flight, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
  // res.send(`<h1>Booking flight ${req.params.id}</h1>`);
});

// Book a flight
router.post('/book/:id', async (req, res) => {
  try {
    const { quantity, phone, travelers } = req.body;

    // Get user from cookies
    let user;
    if (req.cookies && req.cookies.token) {
      try {
        const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
        const email = decoded.email;
        user = await User.findOne({ email });
      } catch (error) {
        console.error('Error decoding token:', error);
        return res.status(401).json({ message: 'Invalid token' });
      }
    }

    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const flight = await Flight.findById(req.params.id);

    if (!flight) {
      return res.status(404).json({ message: 'Flight not found' });
    }

    if (flight.availableSeats < quantity) {
      return res.status(400).json({ message: 'Not enough available seats' });
    }

    flight.availableSeats -= quantity;
    await flight.save();

    // res.send(travelers);

    // Create a new booking
    const booking = new Booking({
      user: user._id,
      flight: flight._id,
      quantity,
      travelers,
      phone
    });
    await booking.save();
    await booking.populate('flight');
    await booking.populate('user');

    // res.status(201).json({ message: `Flight ${flight._id} booked successfully for ${quantity} travelers`, bookingId: booking._id });
    res.render("bookingConfirmation.ejs", { booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Cancel a booking
router.get('/cancel/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.status = 'cancelled';
    await booking.save();
    res.redirect('/myBooking');
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
