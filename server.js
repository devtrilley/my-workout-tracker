// server.js is to Create and Configure the Server. Entry point for our backend application
// This is where we'll define and configure your server, handle incoming requests, and interact with the database.

// Imports Express npm module for creating servers
const express = require("express");

// Imports dotenv npm module to store our environmental variables
const dotenv = require("dotenv").config(); 

// Calling express func which starts our server, storing it in app variable
// app obj is our server. It handles all requests and sends responses
const app = express();

// Port where our server will run. 3000 is for local dev, render.com will assign automatically
// Port is kinda like an address, you're knocking on different doors to different houses
const PORT = 3000;

// Middleware to automatically parse JSON data into JS.
// Without middleware, app wouldn't understand incoming data
app.use(express.json());

// Test route at our root route (/). A route is essentially a door into your app.
app.get("/", (req, res) => {
  // Sends plain message. Essentially just text in a <body> element, no other elements
  res.send("Hello Worl... Workout Tracker!");
});

// Starts the server and tells it to listen for requests.
// We put the link in the string so we can click it when run Node in our terminal
app.listen(PORT, () => {
  console.log(`Server is live biatch! Get to work @ http://localhost:${PORT}`);
});

console.log(`Database Host: ${process.env.DB_HOST}`);
