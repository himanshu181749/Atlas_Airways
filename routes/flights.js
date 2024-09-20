const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const router = express.Router();
const Flight = require('../models/Flight.js');
const User = require('../models/User.js');

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
    console.log("Flights: " + flights); 
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

module.exports = router;
