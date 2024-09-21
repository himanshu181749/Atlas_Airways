const express = require("express");
const router = express.Router();
const Flight = require("../models/Flight");
const User = require("../models/User.js");
const cookieParser = require("cookie-parser");
const adminAuth = require("../middlewares/authMiddleware");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

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

// Delete a flight (Admin-only route)
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



router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});



module.exports = router;
