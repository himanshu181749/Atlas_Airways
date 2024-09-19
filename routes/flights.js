const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();
const Flight = require('../models/Flight.js');

// mongoose.connect('mongodb://127.0.0.1:27017/flightBookingSystem');

// Get all flights
router.get('/', async (req, res) => {
  try {
    const flights = await Flight.find();
    res.render('flightsIndex.ejs', { flights });
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
