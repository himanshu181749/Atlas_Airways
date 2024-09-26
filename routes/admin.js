const express = require("express");
const mongoose = require('mongoose');
const router = express.Router();
const Flight = require("../models/Flight");
const User = require("../models/User.js");
const cookieParser = require("cookie-parser");
const adminAuth = require("../middlewares/authMiddleware");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Booking = require('../models/Booking');


router.use(cookieParser()); // Ensure cookies are parsed correctly

// Admin login route (unprotected)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find admin by email
    const user = await User.findOne({ email, role: "admin" });
    if (!user) {
      return res.status(400).json({ message: "Admin not found" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Create token
    const token = jwt.sign(
      { email: user.email, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    console.log("Generated token: ", token);

    // Set token in cookies
    res.cookie("token", token, { httpOnly: true }); // Ensure cookies are set correctly with the token
    console.log("Cookie set with token");

    // Redirect to admin dashboard
    res.redirect("/admin/dashboard");
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
});

router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});


// Protect all routes below with adminAuth middleware
router.use(adminAuth); // Apply protection from this point on

// Route for admin dashboard
router.get("/dashboard", (req, res) => {
  res.render("adminDashboard.ejs"); // Create an adminDashboard.ejs view
});

// Route to list all flights (Admin Only)
router.get("/flights", adminAuth, async (req, res) => {
  try {
    const flights = await Flight.find(); // Fetch all flights from the database
    res.render("adminFlight.ejs", { flights }); // Render a page with the flight list
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving flights", error: error.message });
  }
});

// Route to show the "Add Flight" form (GET request)
router.get("/flights/add", adminAuth, (req, res) => {
  res.render("adminAddFlight.ejs");
});

// Add a new flight (Admin Only)
router.post("/flights/add", async (req, res) => {
  try {
    const {
      flightNumber,
      departure,
      arrival,
      departureTime,
      arrivalTime,
      price,
      seats,
      availableSeats,
    } = req.body;

    // Create a new flight with all fields
    const newFlight = new Flight({
      flightNumber,
      departure,
      arrival,
      departureTime,
      arrivalTime,
      price,
      seats,
      availableSeats,
    });

    await newFlight.save();
    res.redirect("/admin/flights"); // Redirect to flight list
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding flight", error: error.message });
  }
});

// Route to show the "Edit Flight" form (GET request)
router.get("/flights/edit/:id", adminAuth, async (req, res) => {
  try {
    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).json({ message: "Flight not found" });
    }
    res.render("adminEditFlight.ejs", { flight });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving flight", error: error.message });
  }
});

// Edit a flight (Admin Only)
router.post("/flights/edit/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      flightNumber,
      departure,
      arrival,
      departureTime,
      arrivalTime,
      price,
      seats,
      availableSeats,
    } = req.body;

    // Find the flight by its ID
    const flight = await Flight.findById(id);
    if (!flight) {
      return res.status(404).json({ message: "Flight not found" });
    }

    // Update all flight details
    flight.flightNumber = flightNumber;
    flight.departure = departure;
    flight.arrival = arrival;
    flight.departureTime = departureTime;
    flight.arrivalTime = arrivalTime;
    flight.price = price;
    flight.seats = seats;
    flight.availableSeats = availableSeats;

    await flight.save();
    res.redirect("/admin/flights");
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error editing flight", error: error.message });
  }
});

// Delete a flight (Admin Only)
router.post('/flights/delete/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await Flight.findByIdAndDelete(id);
    res.redirect('/admin/flights'); // Redirect to the flight list after deletion
  } catch (error) {
    res.status(500).json({ message: 'Error deleting flight', error: error.message });
  }
});

// Get all bookings
router.get('/bookings', async (req, res) => {
  const { search } = req.query;

    let filter = {};


    if (search) {
      // Create an array to hold individual filter conditions
      let searchConditions = [];

      // If search is a valid MongoDB ObjectId, add it as a filter for Booking ID
      if (mongoose.Types.ObjectId.isValid(search)) {
          searchConditions.push({ _id: new mongoose.Types.ObjectId(search) });
      }

      // Add filter for travelers' names using a case-insensitive regex
      searchConditions.push({ travelers: { $regex: search, $options: 'i' } });

      // Add filter for flight number using case-insensitive regex
      searchConditions.push({ 'flight.flightNumber': { $regex: search, $options: 'i' } });

      // Combine the conditions using $or
      filter = { $or: searchConditions };
  }

  try {
      const bookings = await Booking.find(filter).populate('user').populate('flight'); // Populate user and flight details
      res.render("adminBookings.ejs", { bookings });
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});

// Get booking details for editing (GET request)
router.get('/bookings/edit/:id', async (req, res) => {
  try {
      const booking = await Booking.findById(req.params.id).populate('flight'); // Fetch booking with flight details
      const flights = await Flight.find(); // Fetch all available flights

      if (!booking) return res.status(404).json({ message: 'Booking not found' });

      res.render("adminEditBookings.ejs", { booking, flights }); // Pass booking and flights to the form
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});

// Edit booking (POST request)
router.post('/bookings/edit/:id', async (req, res) => {
  try {
      const booking = await Booking.findById(req.params.id);
      if (!booking) return res.status(404).json({ message: 'Booking not found' });

      // Update the booking details with values from the form
      booking.flight = req.body.flight || booking.flight;
      booking.bookingDate = req.body.bookingDate || booking.bookingDate;
      booking.quantity = req.body.quantity || booking.quantity;
      booking.phone = req.body.phone || booking.phone;

      // Save the updated booking
      await booking.save();

      // req.flash('success', 'Booking updated successfully');
      res.redirect('/admin/bookings');
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});


// Cancel booking
router.post('/bookings/cancel/:id', async (req, res) => {
  try {
      const booking = await Booking.findById(req.params.id);
      if (!booking) return res.status(404).json({ message: 'Booking not found' });

      // Update the flight's available seats
      const flight = await Flight.findById(booking.flight);
      if (flight) {
          flight.availableSeats += booking.quantity;
          await flight.save();
      }

      await Booking.findByIdAndDelete(req.params.id);
      // req.flash('success', 'Booking cancelled successfully');
      res.status(303).redirect('/admin/bookings');
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});


// fetching all the users
router.get("/users", adminAuth, async (req, res) => {
  try {
    const users = await User.find();
    res.render("adminUsers.ejs", { users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});





module.exports = router;
