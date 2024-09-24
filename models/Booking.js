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
  phone: { type: String, required: true },

  // paymentId: { type: String, required: true },
  // transactionId: { type: String, required: true },
  // providerReferenceId: { type: String, required: true },
  // paymentStatus: { type: String, required: true, enum: ['pending', 'completed', 'failed'] },
});

module.exports = mongoose.model('Booking', BookingSchema);
