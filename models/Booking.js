const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  flight: { type: mongoose.Schema.Types.ObjectId, ref: 'Flight' },
  bookingDate: Date,
  seatNumber: String,
});

module.exports = mongoose.model('Booking', BookingSchema);
