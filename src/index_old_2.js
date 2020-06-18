const path = require("path");
const express = require("express");
const http = require("http");
const socketio = require("socket.io");
require("./db/mongoose");
const Filter = require("bad-words");
const { generateMessage,generateLocationMessage } = require("./utils/messages");
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
io.on("connection", (socket) => {
  console.log("New WebSocket connection");
  //1
  socket.emit("message", generateMessage("Welcome!"));
  //2
  socket.broadcast.emit("message", generateMessage("A new user has joined!"));
  //3
  socket.on("sendMessage", (message, callback) => {
    const filter = new Filter();

    if (filter.isProfane(message)) {
      return callback("Profanity is not allowed!");
    }

    io.emit("message", generateMessage(message));
    callback();
  });
  //4
  socket.on("sendLocation", (coords, callback) => {
    io.emit("locationMessage", generateLocationMessage(`https://google.com/maps?q=${coords.latitude},${coords.longitude}`));
    callback();
  });
  //5
  socket.on("disconnect", () => {
    io.emit("message", generateMessage("A user has left!"));
  });
});

/***********/
server.listen(port, () => {
  console.log(`Server is up on port ${port}!`);
});
