import express, { json } from "express";
import { connect } from "mqtt";
import cors from "cors";

// MQTT Broker Connection (Replace with your server's IP or domain)
const mqttBrokerUrl = "mqtt://13.127.22.78:1883"; // Cloud IP or local IP
const mqttClient = connect(mqttBrokerUrl);
const mqttTopic = "robot/control"; // The topic for robot movement commands

// Initialize Express Server
const app = express();
app.use(json()); // Middleware to parse JSON bodies

// Enable CORS
app.use(
  cors({
    origin: "*",
  })
);

// Handle MQTT connection events
mqttClient.on("connect", () => {
  console.log("Connected to MQTT broker");
});

// Handle connection errors
mqttClient.on("error", (err) => {
  console.error("MQTT Connection error:", err);
});

// Route to accept command array from frontend
app.post("/send-commands", (req, res) => {
  const { commands } = req.body; // Expecting an array of commands from frontend

  if (!commands || !Array.isArray(commands)) {
    return res.status(400).send("Invalid commands array");
  }

  // Send commands to the ESP32 via MQTT
  commands.forEach((command, index) => {
    if (command === "left") {
      setTimeout(() => {
        mqttClient.publish(mqttTopic, command);
        console.log("Command sent:", command);
      }, index * 778); // Sending each command with a delay of 2 seconds
    } else {
      setTimeout(() => {
        mqttClient.publish(mqttTopic, command);
        console.log("Command sent:", command);
      }, index * 795); // Sending each command with a delay of 2 seconds
    }
  });

  res.send("Commands sent to the robot");
});

// Start Express Server
const PORT = 8000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
