const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const crypto = require('crypto');
const TMClient = require('textmagic-rest-client');

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


// please dont touch this route ------------------------------------------------------------------

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

    // var c = new TMClient('username', 'C7XDKZOQZo6HvhJwtUw0MBcslfqwtp4');
    // c.Messages.send({text: 'test message from server', phones:'7992423198'}, function(err, res){
    //     console.log('Messages.send()', err, res);
    // });

    // res.status(201).json({ message: `Flight ${flight._id} booked successfully for ${quantity} travelers`, bookingId: booking._id });
    res.render("bookingConfirmation.ejs", { booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



 // - testing the payment gateway ----------------------------------------------------------------
 
 // 1. Book a flight (TESTING THE PAYMENT GATEWAY) -------------------------------------------------
//  router.post('/book/:id', async (req, res) => {
//    try {
//      const { quantity, phone, travelers } = req.body;
 
//      // Get user from cookies
//      let user;
//      if (req.cookies && req.cookies.token) {
//        try {
//          const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
//          const email = decoded.email;
//          user = await User.findOne({ email });
//        } catch (error) {
//          console.error('Error decoding token:', error);
//          return res.status(401).json({ message: 'Invalid token' });
//        }
//      }
 
//      if (!user) {
//        return res.status(401).json({ message: 'User not authenticated' });
//      }
 
//      const flight = await Flight.findById(req.params.id);
 
//      if (!flight) {
//        return res.status(404).json({ message: 'Flight not found' });
//      }
 
//      if (flight.availableSeats < quantity) {
//        return res.status(400).json({ message: 'Not enough available seats' });
//      }
 
//      // Calculate the total amount
//      const totalAmount = flight.price * quantity;
 
//      // Create a Phonepe payment request
//      const phonepePayment = await createPhonepePayment(totalAmount, `Booking for flight ${flight.flightNumber}`);
 
//      // Store the payment details in the session
//      req.session.pendingBooking = {
//        flightId: flight._id,
//        quantity,
//        travelers,
//        phone,
//        paymentId: phonepePayment.id
//      };
 
//      // Redirect the user to the Phonepe payment page
//      res.redirect(phonepePayment.paymentUrl);
 
//    } catch (err) {
//      res.status(500).json({ message: err.message });
//    }
//  });
 
//  // Phonepe payment callback route
//  router.get('/payment-callback', async (req, res) => {
//    try {
//      const { status, paymentId } = req.query;
 
//      if (status !== 'success') {
//        return res.render('paymentFailed.ejs', { message: 'Payment failed or was cancelled' });
//      }
 
//      // Verify the payment status with Phonepe
//      const paymentVerified = await verifyPhonepePayment(paymentId);
 
//      if (!paymentVerified) {
//        return res.render('paymentFailed.ejs', { message: 'Payment verification failed' });
//      }
 
//      // Retrieve the pending booking details from the session
//      const pendingBooking = req.session.pendingBooking;
 
//      if (!pendingBooking || pendingBooking.paymentId !== paymentId) {
//        return res.render('paymentFailed.ejs', { message: 'Invalid booking session' });
//      }
 
//      // Finalize the booking
//      const flight = await Flight.findById(pendingBooking.flightId);
//      flight.availableSeats -= pendingBooking.quantity;
//      await flight.save();
 
//      const booking = new Booking({
//        user: req.user._id,
//        flight: flight._id,
//        quantity: pendingBooking.quantity,
//        travelers: pendingBooking.travelers,
//        phone: pendingBooking.phone,
//        paymentId: paymentId,
//        paymentStatus: 'completed'
//      });
 
//      await booking.save();
//      await booking.populate('flight');
//      await booking.populate('user');
 
//      // Clear the pending booking from the session
//      delete req.session.pendingBooking;
 
//      res.render("bookingConfirmation.ejs", { booking });
 
//    } catch (err) {
//      res.status(500).json({ message: err.message });
//    }
//  });
 
//  // Helper function to create a Phonepe payment request
//  async function createPhonepePayment(amount, description) {
//    // Replace with actual Phonepe API integration
//    const phonepeApiUrl = 'https://api.phonepe.com/v1/payments';
//    const phonepeApiKey = process.env.PHONEPE_API_KEY;
 
//    try {
//      const response = await axios.post(phonepeApiUrl, {
//        amount,
//        description,
//        callbackUrl: 'http://localhost:3000/flights/payment-callback'
//      }, {
//        headers: {
//          'Authorization': `Bearer ${phonepeApiKey}`,
//          'Content-Type': 'application/json'
//        }
//      });
 
//      return {
//        id: response.data.id,
//        paymentUrl: response.data.paymentUrl
//      };
//    } catch (error) {
//      console.error('Error creating Phonepe payment:', error);
//      throw new Error('Failed to create payment');
//    }
//  }
 
//  // Helper function to verify a Phonepe payment
//  async function verifyPhonepePayment(paymentId) {
//    // Replace with actual Phonepe API integration
//    const phonepeApiUrl = `https://api.phonepe.com/v1/payments/${paymentId}`;
//    const phonepeApiKey = process.env.PHONEPE_API_KEY;
 
//    try {
//      const response = await axios.get(phonepeApiUrl, {
//        headers: {
//          'Authorization': `Bearer ${phonepeApiKey}`
//        }
//      });
 
//      return response.data.status === 'SUCCESS';
//    } catch (error) {
//      console.error('Error verifying Phonepe payment:', error);
//      return false;
//    }
//  }


// 2. Book a flight (TESTING THE PAYMENT GATEWAY) -------------------------------------------------


// ... (keep all existing routes up to the booking route) ...

// Book a flight
// router.post('/book/:id', async (req, res) => {
//   try {
//     const { quantity, phone, travelers } = req.body;

//     let user;
//     if (req.cookies && req.cookies.token) {
//       try {
//         const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
//         const email = decoded.email;
//         user = await User.findOne({ email });
//       } catch (error) {
//         console.error('Error decoding token:', error);
//         return res.status(401).json({ message: 'Invalid token' });
//       }
//     }

//     if (!user) {
//       return res.status(401).json({ message: 'User not authenticated' });
//     }

//     const flight = await Flight.findById(req.params.id);

//     if (!flight) {
//       return res.status(404).json({ message: 'Flight not found' });
//     }

//     if (flight.availableSeats < quantity) {
//       return res.status(400).json({ message: 'Not enough available seats' });
//     }

//     // Calculate the total amount
//     const totalAmount = flight.price * quantity;

//     // Create a Phonepe payment request
//     const phonepePayment = await createPhonepePayment(totalAmount, `Booking for flight ${flight.flightNumber}`);

//     // Store the payment details in the session
//     req.session.pendingBooking = {
//       flightId: flight._id,
//       quantity,
//       travelers,
//       phone,
//       paymentId: phonepePayment.data.merchantTransactionId
//     };

//     // Redirect the user to the Phonepe payment page
//     res.redirect(phonepePayment.data.instrumentResponse.redirectInfo.url);

//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // Phonepe payment callback route
// router.post('/payment-callback', async (req, res) => {
//   try {
//     const { merchantTransactionId, transactionId, providerReferenceId } = req.body;

//     // Verify the payment status with Phonepe
//     const paymentVerified = await verifyPhonepePayment(merchantTransactionId);

//     if (!paymentVerified) {
//       return res.render('paymentFailed.ejs', { message: 'Payment verification failed' });
//     }

//     // Retrieve the pending booking details from the session
//     const pendingBooking = req.session.pendingBooking;

//     if (!pendingBooking || pendingBooking.paymentId !== merchantTransactionId) {
//       return res.render('paymentFailed.ejs', { message: 'Invalid booking session' });
//     }

//     // Finalize the booking
//     const flight = await Flight.findById(pendingBooking.flightId);
//     flight.availableSeats -= pendingBooking.quantity;
//     await flight.save();

//     const booking = new Booking({
//       user: req.user._id,
//       flight: flight._id,
//       quantity: pendingBooking.quantity,
//       travelers: pendingBooking.travelers,
//       phone: pendingBooking.phone,
//       paymentId: merchantTransactionId,
//       transactionId: transactionId,
//       providerReferenceId: providerReferenceId,
//       paymentStatus: 'completed'
//     });

//     await booking.save();
//     await booking.populate('flight');
//     await booking.populate('user');

//     // Clear the pending booking from the session
//     delete req.session.pendingBooking;

//     res.render("bookingConfirmation.ejs", { booking });

//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // Helper function to create a Phonepe payment request
// async function createPhonepePayment(amount, description) {
//   const merchantId = process.env.PHONEPE_MERCHANT_ID;
//   const saltKey = process.env.PHONEPE_SALT_KEY;
//   const saltIndex = process.env.PHONEPE_SALT_INDEX;
//   const apiEndpoint = 'https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay';

//   const merchantTransactionId = `MT${Date.now()}`;
//   const payload = {
//     merchantId: merchantId,
//     merchantTransactionId: merchantTransactionId,
//     merchantUserId: 'MUID123',
//     amount: amount * 100, // Convert to paise
//     redirectUrl: `${process.env.BASE_URL}/flights/payment-callback`,
//     redirectMode: 'POST',
//     callbackUrl: `${process.env.BASE_URL}/flights/payment-callback`,
//     mobileNumber: '9999999999',
//     paymentInstrument: {
//       type: 'PAY_PAGE'
//     }
//   };

//   const payloadString = JSON.stringify(payload);
//   const payloadBase64 = Buffer.from(payloadString).toString('base64');
//   const string = `${payloadBase64}/pg/v1/pay${saltKey}`;
//   const sha256 = crypto.createHash('sha256').update(string).digest('hex');
//   const checksum = `${sha256}###${saltIndex}`;

//   const options = {
//     method: 'POST',
//     url: apiEndpoint,
//     headers: {
//       accept: 'application/json',
//       'Content-Type': 'application/json',
//       'X-VERIFY': checksum
//     },
//     data: {
//       request: payloadBase64
//     }
//   };

//   try {
//     const response = await axios.request(options);
//     console.log('Phonepe API Response:', response.data);
//     return response.data;
//   } catch (error) {
//     console.error('Error creating Phonepe payment:', error);
//     throw new Error('Failed to create payment');
//   }
// }

// // Helper function to verify a Phonepe payment
// async function verifyPhonepePayment(merchantTransactionId) {
//   const merchantId = process.env.PHONEPE_MERCHANT_ID;
//   const saltKey = process.env.PHONEPE_SALT_KEY;
//   const saltIndex = process.env.PHONEPE_SALT_INDEX;
//   const apiEndpoint = `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${merchantId}/${merchantTransactionId}`;

//   const string = `/pg/v1/status/${merchantId}/${merchantTransactionId}${saltKey}`;
//   const sha256 = crypto.createHash('sha256').update(string).digest('hex');
//   const checksum = `${sha256}###${saltIndex}`;

//   const options = {
//     method: 'GET',
//     url: apiEndpoint,
//     headers: {
//       accept: 'application/json',
//       'Content-Type': 'application/json',
//       'X-VERIFY': checksum,
//       'X-MERCHANT-ID': merchantId
//     }
//   };

//   try {
//     const response = await axios.request(options);
//     return response.data.code === 'PAYMENT_SUCCESS';
//   } catch (error) {
//     console.error('Error verifying Phonepe payment:', error);
//     return false;
//   }
// }


























module.exports = router;
