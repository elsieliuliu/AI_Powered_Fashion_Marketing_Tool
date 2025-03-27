// Simple script to start the server with the correct port
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

// Load environment variables from .env file
require("dotenv").config();

// Get the port from environment or use default
// Priority: SERVER_PORT, PORT, default value
const PORT = process.env.SERVER_PORT || process.env.PORT || 64970;

console.log(`Starting server on port ${PORT}...`);

// Check if port is available
const net = require("net");
const testServer = net.createServer();

testServer.once("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.log(`Port ${PORT} is already in use.`);
    console.log("Do you want to:");
    console.log("1. Try a different port");
    console.log("2. Force close the application using this port");

    // In a real application, you would prompt the user here
    // For simplicity, we'll just try a random port
    console.log("Trying with random port instead...");
    startServer(0);
  } else {
    console.error("Error checking port:", err);
    process.exit(1);
  }
});

testServer.once("listening", () => {
  // Port is available
  testServer.close(() => {
    startServer(PORT);
  });
});

testServer.listen(PORT);

function startServer(port) {
  // Set environment variable
  process.env.SERVER_PORT = port;

  // Start the server
  const serverProcess = spawn("node", ["server.js"], {
    env: { ...process.env, SERVER_PORT: port },
    stdio: "inherit",
  });

  serverProcess.on("close", (code) => {
    console.log(`Server process exited with code ${code}`);
  });
}
