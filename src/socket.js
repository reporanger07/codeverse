import { io } from "socket.io-client";

export const initSocket = async () => {
  const options = {
    "force new connection": true,
    reconnectionAttempts: Infinity,
    timeout: 10000,
    transports: ["websocket"],
  };

  const backendURL =
    process.env.NODE_ENV === "production"
      ? undefined 
      : "http://localhost:5000";

  return io(backendURL, options);
};