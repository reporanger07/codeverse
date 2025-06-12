const ACTIONS = {
  JOIN: "join",
  JOINED: "joined",
  DISCONNECTED: "disconnected",
  LEAVE: "leave",

  // File Management Actions
  FILE_CREATE: "file-create",
  FILE_DELETE: "file-delete",
  FILE_CHANGE: "file-change",
  FILES_SYNC: "files-sync",
  FILE_RENAME: "file-rename", // <- ADD THIS LINE
  ACTIVE_FILE_CHANGE: "active-file-change",
};

module.exports = ACTIONS;
