import { io } from "socket.io-client";
export const socket = io("http://localhost:3000/lobby");
export const battleSocket = io("http://localhost:3000/battle");
