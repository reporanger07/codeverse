
# CodeVerse – Real-Time Collaborative Code Editor

CodeVerse is a real-time collaborative coding platform where multiple users can join a room using a Room ID and edit code together with live synchronization.

## 🚀 Features
- Real-time collaborative editing (Socket.IO)
- Multiple files support (create, delete, rename)
- Syntax highlighting using CodeMirror
- Dark mode editor
- Room-based collaboration using Room ID
- MongoDB persistence (restore code after reconnect)
- Save room state when last user leaves

## 🛠 Tech Stack
- Frontend: React, CodeMirror
- Backend: Node.js, Express, Socket.IO
- Database: MongoDB (Mongoose)

## 🧠 How it works
- Users join a room using a Room ID
- File changes sync in real-time via WebSockets
- Room state is stored in memory while users are active
- When the last user leaves, the room state is saved to MongoDB
- When users rejoin, the last saved state is restored

## 📦 Installation

```bash
git clone https://github.com/your-username/codeverse.git
cd codeverse
npm install
