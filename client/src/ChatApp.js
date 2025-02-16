import React, { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

function ChatApp() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [userName, setUserName] = useState("");
  const [isUserSet, setIsUserSet] = useState(false);

  useEffect(() => {
    // Listen for incoming messages from the server
    socket.on("receive_message", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    // Load previous messages when the user connects
    socket.on("load_messages", (messagesFromDb) => {
      setMessages(messagesFromDb);
    });

    // Listen for when a new user joins
    socket.on("user_joined", (message) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { user: "System", content: message },
      ]);
    });

    // Listen for when a user leaves
    socket.on("user_left", (message) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { user: "System", content: message },
      ]);
    });

    return () => {
      socket.off("receive_message");
      socket.off("load_messages");
      socket.off("user_joined");
      socket.off("user_left");
    };
  }, []);

  const handleUserNameSubmit = () => {
    if (userName.trim()) {
      socket.emit("set_username", userName);
      setIsUserSet(true);
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        user: userName,
        content: newMessage,
        timestamp: new Date(),
      };
      socket.emit("send_message", message); // Send the message to the server
      setNewMessage("");
    }
  };

  return (
    <div>
      {!isUserSet ? (
        <div>
          <h2>Enter your name to join the chat</h2>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Your name"
          />
          <button onClick={handleUserNameSubmit}>Join Chat</button>
        </div>
      ) : (
        <div>
          <h1>Welcome, {userName}!</h1>
          <div className="messages">
            {messages.map((msg, index) => (
              <div key={index}>
                <strong>{msg.user}: </strong>
                {msg.content}
              </div>
            ))}
          </div>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
          />
          <button onClick={handleSendMessage}>Send</button>
        </div>
      )}
    </div>
  );
}

export default ChatApp;
