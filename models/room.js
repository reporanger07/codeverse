const mongoose = require("mongoose");

const FileSchema = new mongoose.Schema({
  name: String,
  content: String,
});

const RoomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
  },
  files: [FileSchema],
  activeFile: String,
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Room", RoomSchema);
