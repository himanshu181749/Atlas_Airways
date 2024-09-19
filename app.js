const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

const flightRoutes = require('./routes/flights.js');
const userRoutes = require('./routes/users.js');
const bookingRoutes = require('./routes/bookings.js');


// connection of mongoose ----------------------------------------------------

// type 1 ------------------
// mongoose.connect('mongodb://127.0.0.1:27017/flightBookingSystem');

// type 2 ------------------

// mongoose.connect(process.env.MONGO_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(() => console.log('Connected to MongoDB'))
//   .catch(err => console.error('Error connecting to MongoDB:', err));

// type 3 ------------------
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Error connecting to MongoDB:', err));




// parsers----------------------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// view engine setup--------------------------------------------------------
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));


//Routes ---------------------------------------------------------------------
app.use('/flights', flightRoutes);
app.use('/users', userRoutes);
app.use('/bookings', bookingRoutes);

app.get('/', (req, res) => {
    // res.send('Welcome');
    console.log(req.cookies);

    res.render('home.ejs', { token: req.cookies});
    // res.render("signup.ejs")
})


app.listen(3000);

