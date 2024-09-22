const mongoose = require('mongoose');

// const TravelerSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   seatNumber: { type: String, required: true }
// });

const BookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  flight: { type: mongoose.Schema.Types.ObjectId, ref: 'Flight', required: true },
  bookingDate: { type: Date, default: Date.now },
  travelers: [{ type: String, required: true }],
  quantity: { type: Number, required: true, min: 1 },
  phone: { type: String, required: true }
});

module.exports = mongoose.model('Booking', BookingSchema);
