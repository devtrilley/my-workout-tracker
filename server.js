// server.js is to Create and Configure the Server. Entry point for our backend application
// This is where we'll define and configure your server, handle incoming requests, and interact with the database.

// Imports Express npm module for creating servers
const express = require("express");

// Imports dotenv npm module to store our environmental variables
const dotenv = require("dotenv").config();

// Imports MySQL npm module, allowing us to talk to MySQL through backend
const mysql = require("mysql2");

// Calling express func which starts our server, storing it in app variable
// app obj is our server. It handles all requests and sends responses
const app = express();

// Port where our server will run. 3000 is for local dev, render.com will assign automatically
// Port is kinda like an address, you're knocking on different doors to different houses
const PORT = 3000;

// Middleware to automatically parse JSON data into JS. Comes before routes
// Without middleware, app wouldn't understand incoming data
app.use(express.json());

// Creates connection to MySQL database, using all the creds listed in .env
const connection = mysql.createConnection({
  host: process.env.DB_HOST, //DB = Database
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Takes our connection we just created an connects it to the MySQL Database
connection.connect((err) => {
  // There there's an error, print this erro message, then stop the func
  if (err) {
    console.error(`Error connecting to MySQL: ${err.message}`);
    return;
  }
  // If there isn't any error, this success message will run
  console.log("Success: Connected to MySQL Database!");
});

// Test route at our root route (/). A route is essentially a door into your app.
app.get("/", (req, res) => {
  // Sends plain message. Essentially just text in a <body> element, no other elements
  res.send("Hello Worl... Workout Tracker!");
});

// Workouts endpoint. GETting/Selecting all of the user logged workouts from workouts table
app.get("/workouts", (req, res) => {
  const query = "SELECT * FROM workouts"; // Specific SQL query to get all workouts from our table
  // .query() method execute SQL code using our above query var
  connection.query(query, (err, results) => {
    // If there's an error, else, show the results as JSON
    if (err) {
      console.error(`Error fetching workouts: ${err.message}`); // Error message
      // Sends error response and 500 Internal server error response
      // Internal error since we wouldn't have been able to retrieve data from DB
      res.status(500).send("Error fetching workouts");
    } else {
      res.json(results); // Sends results, our workouts, in JSON format
    }
  });
});

// POSTing/Adding a new workout to the MySQL workouts table
app.post("/workouts", (req, res) => {
  const { name, date } = req.body; // Destructures workout name and date completed
  const query = "INSERT INTO workouts (name, date) VALUES (?, ?)"; // SQL query

  // Runs query in MySQL. In our array, name & date's values will replace the question marks (?) in our query var
  // Note results and not res. Res is reserved for the result obj from Express-
  // so since we're inserting, there is no table/record result needed now (only 'metadata' returned by mysql)
  connection.query(query, [name, date], (err, results) => {
    if (err) {
      res.status(500).send(`Error adding workout: ${err.message}`);
    } else {
      // Success status and message (POST sends a 201)
      res.status(201).send(`New workout "${name}" added!`);
    }
  });
});

// GETs all the exercises performed in a specific logged workout
app.get("/workouts/:id/exercises", (req, res) => {
  const { id } = req.params; // Extract workout id from URL as it's a query param
  // SQL query that grabs all exercsies where the workout_id matches
  const query = "SELECT * FROM exercises WHERE workout_id = ?";
  connection.query(query, [id], (err, results) => {
    // Error handling
    if (err) {
      console.error(`Error fetching exercises: ${err.message}`);
      res.status(500).send("Error fetching exercises");
    } else {
      res.json(results); // Display results as JSON
    }
  });
});

// GETs our list of exercises from exercises table in DB
app.get("/exercises", (req, res) => {
  const query = "SELECT * FROM exercises"; // SQL Query to select all exercises
  connection.query(query, (err, results) => {
    if (err) {
      console.error(`Error gettign exercises list: ${err.message}`);
      res.status(500).send("Error getting exercises list.");
    } else {
      res.json(results);
    }
  });
});

// POST/Adds an exercise to our workout_exercises table in DB
// User input, so we'll add extra validation to make sure values are passed
app.post("/workout_exercises", (req, res) => {
  // Destructing vars from request body
  const { workout_id, exercise_id } = req.body;

  // SQL query to insert
  const query =
    "INSERT INTO workout_exercises (workout_id, exercise_id) VALUES (?, ?)";

  // Runs query
  connection.query(query, [workout_id, exercise_id], (err, results) => {
    if (err) {
      console.error(`Error adding exercise to workout: ${err.message}`);
      res.status(500).send("Error adding exercise to workout.");
    } else {
      // POST gives 201 status. Success message
      res
        .status(201)
        .send(
          `Exercise with ID ${exercise_id} add to workout with ID ${workout_id}`
        );
    }
  });
});

// Logs set for an exercise in a workout in the sets table
// User input, so we'll add extra validation to make sure values are passed
app.post("/sets", (req, res) => {
  // Destructures vars we need when defining a set for an exercise
  const { workout_exercises_id, reps, weight } = req.body;

  // SQL Query to insert set information for a specifc exercise in a specifc workout
  const query =
    "INSERT INTO sets (workout_exercises_id, reps, weight) VALUES (?, ?, ?)";

  //
  connection.query(
    query,
    [workout_exercises_id, reps, weight],
    (err, result) => {
      if (err) {
        console.error(`Error adding set to exercise: ${err.message}`);
        res.status(500).send("Error adding set to exercise");
      } else {
        res
          .status(201)
          .json(`Added set to workout exercise ID ${workout_exercises_id}`); // When we get info from DB, it's not in JSON so we convert in .query()
      }
    }
  );
});

// Starts the server and tells it to listen for requests.
// We put the link in the string so we can click it when run Node in our terminal
app.listen(PORT, () => {
  console.log(`Server is live biatch! Get to work @ http://localhost:${PORT}`);
});
