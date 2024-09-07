import { connect } from "mqtt";

// Connect to local MQTT broker
const mqttClient = connect("mqtt://localhost");

// Subscribe to the same topic
const mqttTopic = "robot/control";

// When connected, subscribe to the topic
mqttClient.on("connect", () => {
  console.log("Connected to MQTT broker");
  mqttClient.subscribe(mqttTopic, (err) => {
    if (!err) {
      console.log(`Subscribed to topic: ${mqttTopic}`);
    }
  });
});

// Log incoming messages
mqttClient.on("message", (topic, message) => {
  console.log(`Message received on topic ${topic}: ${message.toString()}`);
});
