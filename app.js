const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const session = require('express-session'); // Import the session middleware

// importing gemini ai --------------------------------------------------------
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI('AIzaSyDkLEaiMdPFfmRG_wlezAzt7RCDFJo7G2s');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// ----------------------------------------------------------------------------


require('dotenv').config();

const app = express();



// importing routes ----------------------------------------------------------
const flightRoutes = require('./routes/flights.js');
const userRoutes = require('./routes/users.js');
const bookingRoutes = require('./routes/bookings.js');
const adminRoutes = require('./routes/admin.js');  // Import admin routes

// importing models ----------------------------------------------------------
const Flight = require('./models/Flight.js');
const User = require('./models/User.js');
const Booking = require('./models/Booking.js');




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


// Initialize session middleware with configuration
app.use(session({
  secret: process.env.JWT_SECRET, // Replace with a secret key for signing the session ID cookie
  resave: false,           // Prevents session being saved if it wasn't modified
  saveUninitialized: true, // Forces uninitialized sessions to be saved
  cookie: {
    secure: false,         // Set to true if you are using HTTPS, false for development
    maxAge: 1000 * 60 * 60 // Sets cookie expiration (e.g., 1 hour)
  }
}));



// parsers----------------------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());



// view engine setup--------------------------------------------------------
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));


//Routes ---------------------------------------------------------------------
app.use('/flights', flightRoutes);
app.use('/users', userRoutes);
app.use('/admin', adminRoutes); 
app.use('/bookings', bookingRoutes);

app.get('/', async (req, res) => {
    // console.log("cookie from home page: " + req.cookies);
    // console.log("token from home page: " + req.cookies.token);

    let user;
    if (req.cookies && req.cookies.token) {
        try {
        const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
        
        email = decoded.email;
        user = await User.findOne({ email });
        } catch (error) {
        console.error('Error decoding token:', error);
        }
    }

    // res.send("Welcome home");
    res.render('home.ejs', { user: user });
    // res.render("signup.ejs")
})

app.get('/session-example', (req, res) => {
  // Example: Setting a session variable
  req.session.user = 'testUser';
  res.send('Session set for user: ' + req.session.user);
});

// Example: Accessing the session variable
app.get('/check-session', (req, res) => {
  if (req.session.user) {
    res.send('Session for user: ' + req.session.user);
  } else {
    res.send('No session found');
  }
});


app.post("/itinerary/generate", async function(req, res) {
    let user;
    if (req.cookies && req.cookies.token) {
        try {
        const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
        
        email = decoded.email;
        user = await User.findOne({ email });
        } catch (error) {
        console.error('Error decoding token:', error);
        }
    }

    // console.log("user from itinerary: " + user);


    let {startPoint, destination, startDate, endDate, budget, interests, travelStyle} = req.body;

    let data = `Please generate a detailed travel itinerary based on the following information:
    - Starting Point: ${req.body.startPoint}
    - Destination: ${destination}
    - Start Date: ${startDate}
    - End Date: ${endDate}
    - Budget: $${budget} USD
    - Interests: ${interests}
    - Travel Style: ${travelStyle}

    Please provide a day-by-day itinerary in the following JSON format:

    {
      "itinerary": [
        {
          "day": "Day 1 (YYYY-MM-DD)",
          "morning": [
            {
              "name": "Activity or place name",
              "description": "Brief description including estimated time"
            }
          ],
          "afternoon": [
            {
              "name": "Activity or place name",
              "description": "Brief description including estimated time"
            }
          ],
          "evening": [
            {
              "name": "Activity or place name",
              "description": "Brief description including estimated time"
            }
          ],
          "accommodation": [
            {
              "name": "Hotel or area name",
              "description": "Brief description"
            }
          ],
          "estimatedDailyBudget": 100
        }
      ]
    }

    Please ensure the itinerary matches the travel style, respects the overall budget, and incorporates the listed interests. Include suggestions for local cuisine and any must-see attractions. The response should be a valid JSON object that can be parsed directly.`;
    try {
        const result = await model.generateContent(data);
        const output = result.response.text();
        // console.log(output);

        function cleanJsonString(inputStr) {
            // Remove the ```json at the start
            if (inputStr.startsWith("```json")) {
                inputStr = inputStr.slice(7);  // Remove `json` and starting ```
            }
        
            // Remove the ``` at the end
            if (inputStr.endsWith("```")) {
                inputStr = inputStr.slice(0, -3);  // Remove the ending ```
            }
        
            return inputStr.trim();  // Trim any extra spaces or newlines
        }

        // Clean and parse the output
        const cleanedOutput = cleanJsonString(output);
        let parsedOutput;
        try {
            parsedOutput = JSON.parse(cleanedOutput);
            // console.log("parsedOutput -----------" + parsedOutput);
        } catch (error) {
            console.error('Error parsing JSON:', error);
            return res.status(500).send('Error parsing the generated itinerary.');
        }

        res.render('itineraryOutput.ejs', { output: parsedOutput, user: user });
        // res.send(parsedOutput);
        // res.send("output mil gya hai gemini se");
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('An error occurred.');
    }
});


app.get("/itinerary", async (req, res) => {
    res.render("itenary.ejs");
    // res.send("Itenary page");
})

app.get("/carbon-calculator", async (req, res) => {
    let user;
    if (req.cookies && req.cookies.token) {
        try {
        const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
        email = decoded.email;
        user = await User.findOne({ email });
        } catch (error) {
        console.error('Error decoding token:', error);
        }
    }
    res.render("carbonCalculator.ejs", { user: user });
    // res.send("Carbon calculator page");
})

app.post("/carbon-calculator/calculate", async (req, res) => {
    // let user;
    // if (req.cookies && req.cookies.token) {
    //     try {
    //     const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    //     email = decoded.email;
    //     user = await User.findOne({ email });
    //     } catch (error) {
    //     console.error('Error decoding token:', error);
    //     }
    // }

    const { bookingId } = req.body;
    // const booking = await Booking.findById(bookingId);

    // if (!booking) {
    //     return res.status(404).send('Booking not found.');
    // }

    // const flight = await Flight.findById(booking.flightId);

    // if (!flight) {
    //     return res.status(404).send('Flight not found.');
    // }

    // const carbonFootprint = calculateCarbonFootprint(flight);

    // res.render("carbonCalculator.ejs", { user: user, carbonFootprint: carbonFootprint });

    res.send(`Carbon Footprint generated for ${bookingId} is 1000 kgCO2e`);
}) 

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
app.listen(PORT, () => {
    console.log(`Server is running at ${BASE_URL}`);
});

