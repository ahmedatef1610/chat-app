const path = require("path");
const express = require("express");
const http = require("http");
const socketio = require("socket.io");

const Filter = require("bad-words");
const {
  generateMessage,
  generateLocationMessage,
} = require("./utils/messages");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./utils/users");

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
  //   socket.on("join", ({ username, room }) => {
  //     socket.join(room);
  //     socket.emit("message", generateMessage("Welcome!"));
  //     socket.broadcast
  //       .to(room)
  //       .emit("message", generateMessage(`${username} has joined!`));
  //     // socket.emit, io.emit, socket.broadcast.emit
  //     // io.to.emit, socket.broadcast.to.emit
  //   });
  socket.on("join", (options, callback) => {
    const { error, user } = addUser({ id: socket.id, ...options });

    if (error) {
      return callback(error);
    }

    socket.join(user.room);

    socket.emit('message', generateMessage('Admin', 'Welcome!'))
    socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`))
    io.to(user.room).emit('roomData', {room: user.room,users: getUsersInRoom(user.room)})

    callback();
  });

  //2
  //   socket.on("sendMessage", (message, callback) => {
  //     const filter = new Filter();
  //     if (filter.isProfane(message)) {
  //       return callback("Profanity is not allowed!");
  //     }
  //     io.emit("message", generateMessage(message));
  //     callback();
  //   });
  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);
    const filter = new Filter();
    if (filter.isProfane(message)) {
      return callback("Profanity is not allowed!");
    }
    io.to(user.room).emit("message", generateMessage(user.username, message));
    callback();
  });

  //3
  //   socket.on("sendLocation", (coords, callback) => {
  //     io.emit("locationMessage",generateLocationMessage(`https://google.com/maps?q=${coords.latitude},${coords.longitude}`));
  //     callback();
  //   });
  socket.on("sendLocation", (coords, callback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessage(
        user.username,
        `https://google.com/maps?q=${coords.latitude},${coords.longitude}`
      )
    );
    callback();
  });

  //4
  //   socket.on("disconnect", () => {
  //     io.emit("message", generateMessage("A user has left!"));
  //   });
  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
        io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
        io.to(user.room).emit('roomData', {room: user.room,users: getUsersInRoom(user.room)})
    }
  });
});

/***********/
server.listen(port, () => {
  console.log(`Server is up on port ${port}!`);
});
