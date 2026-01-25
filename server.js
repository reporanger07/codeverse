const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
require("dotenv").config();
require("./db");

const ACTIONS = require("./src/Actions");
const Room = require("./models/Room");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

------------------------------------------------------------------

app.use(express.static(path.join(__dirname, "build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

------------------------------------------------------------------

const userSocketMap = {};
const roomState = {};

------------------------------------------------------------------

function getAllConnectedClients(roomId) {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => ({
      socketId,
      username: userSocketMap[socketId],
    })
  );
}

------------------------------------------------------------------

io.on("connection", (socket) => {
  console.log("socket connected", socket.id);

------------------------------------------------------------------

  socket.on(ACTIONS.JOIN, async ({ roomId, username }) => {
    userSocketMap[socket.id] = username;
    socket.join(roomId);

    if (!roomState[roomId]) {
      let savedRoom = null;
      try {
        savedRoom = await Room.findOne({ roomId });
      } catch (err) {
        console.error(err);
      }

      if (savedRoom) {
        roomState[roomId] = {
          files: Object.fromEntries(
            savedRoom.files.map((f) => [f.name, f.content])
          ),
          activeFile: savedRoom.activeFile,
        };
      } else {
        roomState[roomId] = {
          files: {
            "script.js": "// Welcome to CodeVerse ",
          },
          activeFile: "script.js",
        };
      }
    }

    const clients = getAllConnectedClients(roomId);

    clients.forEach(({ socketId }) => {
      io.to(socketId).emit(ACTIONS.JOINED, {
        clients,
        username,
        socketId: socket.id,
      });
    });

    io.to(socket.id).emit(ACTIONS.FILES_SYNC, roomState[roomId]);
  });

------------------------------------------------------------------

  socket.on(ACTIONS.FILE_CHANGE, ({ roomId, fileName, newCode }) => {
    if (roomState[roomId] && roomState[roomId].files) {
      roomState[roomId].files[fileName] = newCode;
      socket.in(roomId).emit(ACTIONS.FILE_CHANGE, { fileName, newCode });
    }
  });

------------------------------------------------------------------

  socket.on(ACTIONS.FILE_CREATE, ({ roomId, fileName }) => {
    if (roomState[roomId] && !roomState[roomId].files[fileName]) {
      roomState[roomId].files[fileName] = "";
      io.to(roomId).emit(ACTIONS.FILES_SYNC, roomState[roomId]);
    }
  });

------------------------------------------------------------------

  socket.on(ACTIONS.FILE_DELETE, ({ roomId, fileName }) => {
    if (roomState[roomId] && roomState[roomId].files[fileName]) {
      delete roomState[roomId].files[fileName];

      if (roomState[roomId].activeFile === fileName) {
        const remainingFiles = Object.keys(roomState[roomId].files);
        roomState[roomId].activeFile =
          remainingFiles.length > 0 ? remainingFiles[0] : null;
      }

      io.to(roomId).emit(ACTIONS.FILES_SYNC, roomState[roomId]);
    }
  });

------------------------------------------------------------------

  socket.on(ACTIONS.FILE_RENAME, ({ roomId, oldFileName, newFileName }) => {
    const room = roomState[roomId];

    if (
      room &&
      room.files[oldFileName] !== undefined &&
      room.files[newFileName] === undefined
    ) {
      room.files[newFileName] = room.files[oldFileName];
      delete room.files[oldFileName];

      if (room.activeFile === oldFileName) {
        room.activeFile = newFileName;
      }

      io.to(roomId).emit(ACTIONS.FILES_SYNC, room);
    }
  });

------------------------------------------------------------------

  socket.on("disconnecting", async () => {
    const rooms = [...socket.rooms].filter((r) => r !== socket.id);

    for (const roomId of rooms) {
      socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });

      const room = io.sockets.adapter.rooms.get(roomId);
      const remainingUsers = room ? room.size - 1 : 0;

      if (remainingUsers === 0 && roomState[roomId]) {
        await Room.findOneAndUpdate(
          { roomId },
          {
            roomId,
            files: Object.entries(roomState[roomId].files).map(
              ([name, content]) => ({ name, content })
            ),
            activeFile: roomState[roomId].activeFile,
            updatedAt: new Date(),
          },
          { upsert: true }
        );

        delete roomState[roomId];
      }
    }

    delete userSocketMap[socket.id];
  });
});

------------------------------------------------------------------

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
