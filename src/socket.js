import { io } from "socket.io-client";

export const initSocket = async () => {
  // console.log("BACKEND URL =", process.env.REACT_APP_BACKEND_URL);

  const options = {
    "force new connection": true,
    reconnectionAttempt: "Infinity",
    timeout: 10000,
    transports: ["websocket"],
  };
 
  return io("http://localhost:5000", options);
};
