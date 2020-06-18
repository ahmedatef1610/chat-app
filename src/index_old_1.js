const path = require("path");
const express = require("express");
const http = require("http");
const socketio = require("socket.io");
require("./db/mongoose");
/********************************************************/
const app = express();
const server = http.createServer(app);
const io = socketio(server);
/********************************************************/
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const publicDirectoryPath = path.join(__dirname, "../public");
app.use(express.static(publicDirectoryPath));
/**************************************/
// app.use((req, res, next) => {
//   res.status(503).send("Site is currently down. Check back soon!");
// });

/**************************************/
app.use((error, req, res, next) => {
  res.status(500).send({ error: error.message });
});
/********************************************************/
const port = process.env.PORT || 8080;
/***********/
let count = 0;

io.on("connection", (socket) => {
  console.log("New WebSocket connection");

  // socket.emit("countUpdated", count);
  // socket.on("increment", () => {
  //   count++;
  //   // socket.emit("countUpdated", count); // for single connection
  //   io.emit("countUpdated", count);        // for all connections
  // });

  socket.emit("message", "Welcome!");
  socket.broadcast.emit("message", "A new user has joined!");
  socket.on("sendMessage", (message) => {
    io.emit("message", message);
  });
  socket.on("disconnect", () => {
    io.emit("message", "A user has left!");
  });
});

/***********/
server.listen(port, () => {
  console.log(`Server is up on port ${port}!`);
});
