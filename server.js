// server.js

const express = require("express");
const app = express();
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const ACTIONS = require("./src/Actions");

const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("build"));
app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

const userSocketMap = {};
// This object will store the state of each room (files and their content)
const roomState = {};

function getAllConnectedClients(roomId) {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => {
      return {
        socketId,
        username: userSocketMap[socketId],
      };
    }
  );
}

io.on("connection", (socket) => {
  console.log("socket connected", socket.id);

  socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
    userSocketMap[socket.id] = username;
    socket.join(roomId);

    // If the room is new, initialize it with a default file
    if (!roomState[roomId]) {
      roomState[roomId] = {
        files: {
          "script.js": `// Welcome to your new room!\nconsole.log('Hello, world!');`,
        },
        activeFile: "script.js",
      };
    }

    const clients = getAllConnectedClients(roomId);
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit(ACTIONS.JOINED, {
        clients,
        username,
        socketId: socket.id,
      });
    });

    // Send the current file state to the newly joined user
    io.to(socket.id).emit(ACTIONS.FILES_SYNC, roomState[roomId]);
  });

  socket.on(ACTIONS.FILE_CHANGE, ({ roomId, fileName, newCode }) => {
    // Update the code for the specific file on the server
    if (roomState[roomId] && roomState[roomId].files) {
      roomState[roomId].files[fileName] = newCode;
      // Broadcast the change to all other clients in the room
      socket.in(roomId).emit(ACTIONS.FILE_CHANGE, { fileName, newCode });
    }
  });

  socket.on(ACTIONS.FILE_CREATE, ({ roomId, fileName }) => {
    if (roomState[roomId] && !roomState[roomId].files[fileName]) {
      roomState[roomId].files[fileName] = ""; // Create an empty file
      // Broadcast the updated file list to everyone
      io.to(roomId).emit(ACTIONS.FILES_SYNC, roomState[roomId]);
    }
  });

  socket.on(ACTIONS.FILE_DELETE, ({ roomId, fileName }) => {
    if (roomState[roomId] && roomState[roomId].files[fileName]) {
      delete roomState[roomId].files[fileName];
      // If the deleted file was the active one, pick a new active file
      if (roomState[roomId].activeFile === fileName) {
        const remainingFiles = Object.keys(roomState[roomId].files);
        roomState[roomId].activeFile =
          remainingFiles.length > 0 ? remainingFiles[0] : null;
      }
      // Broadcast the updated file list to everyone
      io.to(roomId).emit(ACTIONS.FILES_SYNC, roomState[roomId]);
    }
  });

  // ==================== NEW EVENT HANDLER FOR RENAMING ====================
  socket.on(ACTIONS.FILE_RENAME, ({ roomId, oldFileName, newFileName }) => {
    const room = roomState[roomId];
    if (
      room &&
      room.files[oldFileName] !== undefined && // Check that the old file exists
      room.files[newFileName] === undefined // And that the new name isn't already taken
    ) {
      // Copy content to the new file name
      room.files[newFileName] = room.files[oldFileName];
      // Delete the old file
      delete room.files[oldFileName];

      // If the renamed file was the active one, update the activeFile pointer
      if (room.activeFile === oldFileName) {
        room.activeFile = newFileName;
      }

      // Broadcast the full updated state to all clients to ensure they are in sync
      io.to(roomId).emit(ACTIONS.FILES_SYNC, room);
    }
  });
  // ========================================================================

  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];
    rooms.forEach((roomId) => {
      socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });
    });

    // Clean up room state if no one is left
    const allRooms = io.sockets.adapter.rooms;
    rooms.forEach((roomId) => {
      const room = allRooms.get(roomId);
      // Check if room will be empty after this user disconnects
      if (room && room.size === 1) {
        delete roomState[roomId];
        console.log(`Room ${roomId} state cleaned up.`);
      }
    });

    delete userSocketMap[socket.id];
    socket.leave();
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
