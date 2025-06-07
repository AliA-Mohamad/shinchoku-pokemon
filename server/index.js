const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const setupBattleSockets = require("./sockets/battleSocket");
const setupLobbySockets = require("./sockets/lobbySocket");
const { rooms, connectedPlayers } = require("./state");

const app = express();
const server = http.createServer(app);

app.use(cors());

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

const lobbyNamespace = io.of("/lobby");
const battleNamespace = io.of("/battle");

setupLobbySockets(lobbyNamespace, rooms, connectedPlayers);
setupBattleSockets(battleNamespace, rooms);

server.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});
