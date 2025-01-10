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

// Middleware funcs to ensure POST/workouts and POST/sets endpoints have valid data before running any SQL queries
// This gives user more specifc error feedback and protect our DB from harmful insertions
// MW will check req.body. If data's invalid, it stops and returns error. If data's valid, use next() to go to route handler

// MW for POST/workouts: Checks if workout_id and exercise_id were provided and if they are numbers
const validateWorkoutExerciseInput = (req, res, next) => {
  const { workout_id, exercise_id } = req.body;

  // Checks to see if they exist
  if (!workout_id) {
    return res.status(400).send("Missing required field: workout_id.");
  }

  if (!exercise_id) {
    return res.status(400).send("Missing required field: exercise_id.");
  }

  // Checks to see if they're numbers
  if (typeof workout_id !== "number") {
    return res.status(400).send("Invalid input: workout_id must be a number.");
  }

  if (typeof exercise_id !== "number") {
    return res.status(400).send("Invalid input: exercise_id must be a number.");
  }

  // Used in Middleware to pass control to the next MW func. Structures MW logic in Express
  next();
};

// MW for POST/sets: Checks if workout_exercises_id, reps, and weight are provided and that reps and weight are positive numbers.
const validateSetInput = (req, res, next) => {
  const { workout_exercises_id, reps, weight } = req.body;

  // Checks to see if they exist
  if (!workout_exercises_id) {
    return res.status(400).send("Missing required field: workout_exercises_id");
  }
  if (!reps) {
    return res.status(400).send("Missing required field: reps");
  }
  if (!weight) {
    return res.status(400).send("Missing required field: weight");
  }

  // I wan't people to be able to say they attempted a lift (like a 1RM), but failed so they're able to put 0 reps down.
  // We'll handle htis later though.
  if (reps < 0) {
    return res.status(400).send("Reps must be at least 1 or more.");
  }
  if (weight < 0) {
    return res.status(400).send("Weight must be at least 1 lbs or more.");
  }

  next(); // Moves to the next Middleware
};

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

// GETS all the exercises AND sets performed for a specific workout
app.get("/workouts/:id", (req, res) => {
  const { id } = req.params;

  // SQL query that retrieves detailed information for all exercises and sets within a specific workout:
  // 1. SELECT clause:
  //    - we.id AS workout_exercise_id: Retrieves the unique ID linking a workout to an exercise from the workout_exercises table.
  //    - e.name AS exercise_name: Retrieves the name of the exercise from the exercises table.
  //    - s.reps: Retrieves the number of reps for each set from the sets table.
  //    - s.weight: Retrieves the weight used for each set from the sets table.
  //
  // 2. FROM workout_exercises we:
  //    - Specifies the workout_exercises table as the starting point of the query and assigns it the alias 'we'.
  //
  // 3. JOIN exercises e ON we.exercise_id = e.id:
  //    - Joins the exercises table (alias 'e') to the workout_exercises table using the exercise_id from workout_exercises
  //      and the id from exercises to retrieve exercise details for each entry in workout_exercises.
  //
  // 4. LEFT JOIN sets s ON we.id = s.workout_exercises_id:
  //    - Performs a LEFT JOIN between the workout_exercises table and the sets table using the workout_exercises_id from sets
  //      and the id from workout_exercises. This ensures that all exercises are included in the results, even if no sets are logged.
  //
  // 5. WHERE we.workout_id = ?:
  //    - Filters the query to only return rows where the workout_id in the workout_exercises table matches the provided parameter (?).
  //      This ensures the results are specific to the requested workout.
  const query = `
    SELECT
      we.id AS workout_exercise_id,
      e.name AS exercise_name,
      s.reps,
      s.weight
    FROM workout_exercises we
    JOIN exercises e ON we.exercise_id = e.id
    LEFT JOIN sets s ON we.id = s.workout_exercises_id
    WHERE we.workout_id = ?
  `;

  connection.query(query, [id], (err, results) => {
    if (err) {
      // Display message
      console.error(`Error fetching workout details: ${err.message}`);
      // Internal server error
      res.status(500).send("Error fetching exercise and set details");
    } else {
      // 200 for succesful get request then display them
      res.status(200).json(results);
    }
  });
});

// GETs all the exercises performed in a specific logged workout
// No sets, EXERCISES ONLY
app.get("/workouts/:id/exercises", (req, res) => {
  const { id } = req.params; // Extract workout id from URL as it's a query param

  // SQL query that grabs all columns from the exercises table (e.*)
  // for exercises associated with a specific workout.
  // It joins the workout_exercises table (we) to the exercises table (e)
  // using the exercise_id field in workout_exercises and the id field in exercises.
  // The WHERE clause ensures only exercises linked to the specified workout_id are returned.
  const query = `
    SELECT e.* 
    FROM workout_exercises we
    JOIN exercises e ON we.exercise_id = e.id
    WHERE we.workout_id = ?
  `;

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

// PATCHes/Updates only the notes field for the specified workout
app.patch("/workouts/:id/notes", (req, res) => {
  const { id } = req.params;
  // Extracts new notes from the request body (The note the user wrote)
  const { notes } = req.body;

  // SQL query to update the notes field for the specific workout
  const query = "UPDATE workouts SET notes = ? WHERE id = ?";

  connection.query(query, [notes, id], (err, results) => {
    // First branch is if there's an internal server error
    if (err) {
      console.error(`Error adding/updating workout notes: ${err.message}`);
      res.status(500).send("Error adding/updating workout notes.");
      // If affectedRows (from results obj given by mysql2) is 0, it means no workout with this ID was found
      // Ex) User only has 30 workouts but wants to add note a 50th workout
    } else if (results.affectedRows === 0) {
      // Error handling if workout id doesn't exist (404).
      res.status(404).send("Workout not found. Doesn't exist.");
    } else {
      // Success message
      res.status(200).send("Workout notes updated successfully");
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
// Added Middleware "validateWorkoutExerciseInput"
app.post("/workout_exercises", validateWorkoutExerciseInput, (req, res) => {
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
// Added Middleware "validateSetInput"
app.post("/sets", validateSetInput, (req, res) => {
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

// Deleting a workout with a specific workout id and the exercises and sets linked to it
app.delete("/workouts/:id", (req, res) => {
  const { id } = req.params; // Workout id we want to delete

  // Queries to delete the chosen exercises and workout for a specific workout id.
  // The logic is to delete the sets connected to exercises connected to a workout, then the workout (all 3 deleted in that order)

  // Delete exercise set info (due to foreign key)
  const deleteWorkoutExerciseSetsQuery = `DELETE FROM sets WHERE workout_exercises_id IN (SELECT id FROM workout_exercises WHERE workout_id = ?)`;
  // Deletes exercises from workout_exercises table with matching id
  const deleteWorkoutExerciseQuery = `DELETE FROM workout_exercises WHERE workout_id = ?`;
  // Deletes workout for workouts table
  const deleteWorkoutQuery = `DELETE FROM workouts WHERE id = ?`;

  // Starts running queries by deleting exercises connected to a workout in workout_exercises
  connection.query(deleteWorkoutExerciseSetsQuery, [id], (err, results) => {
    if (err) {
      console.error(
        `Error deleting sets from exercise linked to workout ${id}: ${err.message}`
      );
      res
        .status(500)
        .send(`Error deleting sets from exercise linked to workout ${id}`);
    } else {
      connection.query(deleteWorkoutExerciseQuery, [id], (err, results) => {
        if (err) {
          console.error(
            `Error deleting exercises for workout ${id}: ${err.message}`
          );
          return res
            .status(500)
            .send("Error deleting exercises for workout ${id}");
        } else {
          // If there's no error, then run query to delete workout itself
          connection.query(deleteWorkoutQuery, [id], (err, results) => {
            if (err) {
              console.error(`Error deleting workout ${id}: ${err.message}`);
              return res.status(500).send(`Error deleting workout ${id}.`);
            }

            // If there isn't an error, but no records are deleted, it means that workout id doesn't exist, returning a 404
            if (results.affectedRows === 0) {
              return res.status(404).send("Workout not found.");
            }

            // Success message
            res
              .status(200)
              .send(`Successfully deleted workout ${id} and it's exercises!`);
          });
        }
      });
    }
  });
});

// Delete a specific exercise from a workout and linked sets to that exercise in this specific workout
app.delete("/workout_exercises/:id", (req, res) => {
  const { id } = req.params;

  // SQL queries
  // Query to delete sets and reps of an exercise in a specifc workout
  const deleteSetsQuery = `DELETE FROM sets WHERE workout_exercises_id = ?`;
  // Query to delete the selected exercise in a specific workout
  const deleteWorkoutExerciseQuery = `DELETE FROM workout_exercise WHERE id = ?`;

  // Run queries, first deleting sets
  connection.query(deleteSetsQuery, [id], (err, results) => {
    if (err) {
      console.error(
        `Error deleting sets for workout_exercise ${id}: ${err.message}`
      );
      return res.status(500).send(`Error deleting sets for workout ${id}`);
    }

    // If there's no error, sets are deleted, now run query to delete exercise
    connection.query(deleteWorkoutExerciseQuery, [id], (err, results) => {
      if (err) {
        console.error(
          `Error deleting exercise for workout_exercise ${id}: ${err.message}`
        );
        return res
          .status(500)
          .send(`Error deleting exercise for workout_exercise ${id}`);
      }

      // Exercise linked to this workout id is misssing/doesn't exist
      if (results.affectedRows === 0) {
        return res.status(404).send("Workout exercise not found.");
      }

      res
        .status(200)
        .send(`Successfully deleted exercise and sets for workout ${id}`);
    });
  });
});

// Starts the server and tells it to listen for requests.
// We put the link in the string so we can click it when run Node in our terminal
app.listen(PORT, () => {
  console.log(`Server is live biatch! Get to work @ http://localhost:${PORT}`);
});
