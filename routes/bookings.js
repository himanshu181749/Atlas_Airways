const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

const router = express.Router();
const Booking = require("../models/Booking.js");
const User = require("../models/User.js");
const Flight = require("../models/Flight.js");

const adminAuth = require("../middlewares/authMiddleware.js");

router.use(cookieParser());

// Get all bookings
router.get("/", adminAuth, async (req, res) => {
  try {
    const bookings = await Booking.find().populate("user").populate("flight");
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a booking   || this is not needed as this has been done by user in Flights Route
// router.post('/', async (req, res) => {
//   try {
//     const user = await User.findById(req.body.userId);
//     const flight = await Flight.findById(req.body.flightId);

//     if (!user || !flight) {
//       return res.status(404).json({ message: 'User or Flight not found' });
//     }

//     const booking = new Booking({
//       user: user._id,
//       flight: flight._id,
//       bookingDate: new Date(),
//       seatNumber: req.body.seatNumber,
//     });

//     const newBooking = await booking.save();
//     res.status(201).json(newBooking);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// });

router.post("/cancel/:id", async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ email: decoded.email });

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    // Check if the booking belongs to the user
    if (booking.user.toString() !== user._id.toString()) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Forbidden: This booking does not belong to you",
        });
    }

    // Increase available seats for the flight
    const flight = await Flight.findById(booking.flight);
    if (flight) {
      flight.availableSeats += booking.quantity;
      await flight.save();
    }

    // Delete the booking
    await Booking.findByIdAndDelete(req.params.id);

    // Send a success response
    return res
      .status(200)
      .json({ success: true, message: "Booking cancelled successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
