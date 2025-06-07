function setupBattleSockets(io, rooms) {
  io.on("connection", (socket) => {
    socket.on('join-battle-room', ({ roomId }) => {
        console.log(`Socket ${socket.id} entrando na sala de batalha: ${roomId}`);
        socket.join(roomId);
    });

    socket.on('leave-battle-room', ({ roomId }) => {
        console.log(`Socket ${socket.id} saindo da sala de batalha: ${roomId}`);
        socket.leave(roomId);
    });

    socket.on("submit-build", ({ roomId, playerId, team }) => {
      const room = rooms[roomId];
      if (!room) {
        console.error(`Erro: Sala ${roomId} não encontrada ao submeter build.`);
        return;
      }

      if (room.challengerId === playerId) {
        room.challengerBuild = team;
        room.status = "in-battle";
        
        console.log(`Build do desafiante recebida para a sala ${roomId}. Iniciando batalha.`);
        const battleState = {
          players: [room.ownerId, room.challengerId],
          turn: 0,
          estados: {
            [room.ownerId]: {
              team: room.bossBuild,
              activePokemonIndex: 0,
            },
            [room.challengerId]: {
              team: room.challengerBuild,
              activePokemonIndex: 0,
            }
          },
          log: ["A batalha começou!"]
        };

        room.battleState = battleState;

        io.to(room.ownerId).emit("start-battle", {
          roomId,
          myId: room.ownerId,
          battleState,
        });

        io.to(room.challengerId).emit("start-battle", {
          roomId,
          myId: room.challengerId,
          battleState,
        });
      }
    });

    socket.on("battle-action", ({ roomId, action }) => {
      const room = rooms[roomId];
      if (!room || !room.battleState) return;
      io.to(roomId).emit("battle-action", action);
    });
  });
}

module.exports = setupBattleSockets;
