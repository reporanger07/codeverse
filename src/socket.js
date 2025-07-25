import { io } from "socket.io-client";

export const initSocket = async () => {
  const options = {
    "force new connection": true,
    reconnectionAttempts: Infinity,
    timeout: 10000,
    transports: ["websocket"],
  };

  const BACKEND_URL =
    process.env.NODE_ENV === "development"
      ? "http://localhost:5000"
      : "wss://codeverse-0gvh-backend.onrender.com"; // Replace with your actual backend Render URL

  return io(BACKEND_URL, options);
};
