const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
});

app.use(cors());

app.get("/", (req, res) => {
  res.send("chat app server is running");
});

io.on("connection", (socket) => {
  console.log(`new user joined `);
  socket.on("set_username", (username) => {
    socket.username = username;
    console.log(`User joined: ${username}`);
    io.emit("user_joined", `${username} has joined the chat`);
    socket.emit("welcome_message", `Welcome ${username}!`);
  });

  socket.on("load_messages", async () => {
    try {
      // Get the last 20 messages, ordered by timestamp (latest first)
      const messages = await Message.find()
        .sort({ timestamp: -1 }) // Sort by timestamp (desc)
        .limit(20); // Limit to the last 20 messages

      // Send messages in chronological order (ascending)
      socket.emit("load_messages", messages.reverse());
    } catch (err) {
      console.log("Error loading messages from MongoDB:", err);
    }
  });

  socket.on("send_message", async (message) => {
    const messageWithUser = {
      ...message,
      user: socket.username,
      timestamp: new Date(),
    };

    try {
      const newMessage = new Message(messageWithUser);
      await newMessage.save();
    } catch (err) {
      console.log("Error saving message to MongoDB:", err);
    }

    io.emit("receive_message", messageWithUser);
  });
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

const messageSchema = new mongoose.Schema({
  user: String,
  content: String,
  timestamp: Date,
});

const Message = mongoose.model("Message", messageSchema);

server.listen(5000, () => {
  mongoose
    .connect("mongodb://localhost:27017/chat")
    .then((result) => {
      console.log("mongo db connected");
    })
    .then(() => {
      console.log("Server is running on port 5000");
    })
    .catch((error) => {
      console.log("mongo db connection error");
    });
});
