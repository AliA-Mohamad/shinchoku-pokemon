import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { socket, battleSocket } from "../../services/socket";

interface Player {
  id: string;
  name: string;
}

interface Room {
  roomId: string;
  ownerId: string;
  ownerName: string;
  players: string[];
  status: "waiting" | "in-battle";
}

export default function LobbyGlobal() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [name, setName] = useState("");
  const [registered, setRegistered] = useState(false);
  const [roomIdCreated, setRoomIdCreated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();


  useEffect(() => {
    socket.on("players-update", (data: Player[]) => setPlayers(data));
    socket.on("rooms-update", (data: Room[]) => setRooms(data));
    socket.on("room-created", ({ roomId }) => setRoomIdCreated(roomId));
    socket.on("room-error", (msg: string) => {
      setError(msg);
      setTimeout(() => setError(null), 3000);
    });
    battleSocket.on("start-battle", ({ roomId, myId, battleState }) => {
      navigate("/battle", { state: { roomId, myId, battleState } });
    });

    return () => {
      socket.off("players-update");
      socket.off("rooms-update");
      socket.off("room-created");
      socket.off("room-error");
      socket.off("start-battle");
    };
  }, [navigate]);

  const handleRegister = () => {
    if (name.trim()) {
      socket.emit("register-player", name.trim());
      setRegistered(true);
    }
  };

  const handleCreateRoom = () => {
    socket.emit("create-room");
  };

  const handleJoinRoom = (roomId: string) => {
    socket.emit("join-room", { roomId, playerId: socket.id });
    navigate("/sala", { state: { myId: socket.id, roomId } });
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      {!registered ? (
        <div>
          <h2>Digite seu nome para entrar no lobby:</h2>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
          />
          <button onClick={handleRegister} style={{ marginLeft: "10px" }}>
            Entrar
          </button>
        </div>
      ) : (
        <>
          <h2>Bem-vindo, {name}!</h2>

          {error && <p style={{ color: "red" }}>{error}</p>}

          <button onClick={handleCreateRoom} style={{ marginBottom: "10px" }}>
            Criar Sala (Você será o Boss)
          </button>

          {roomIdCreated && (
            <p style={{ color: "green" }}>Sala criada: <strong>{roomIdCreated}</strong></p>
          )}

          <div style={{ marginTop: "20px" }}>
            <h3>Jogadores Online:</h3>
            {players.length === 0 ? (
              <p>Nenhum jogador online.</p>
            ) : (
              <ul>
                {players.map((p) => (
                  <li key={p.id}>
                    {p.name} {p.id === socket.id && <strong>(Você)</strong>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ marginTop: "20px" }}>
            <h3>Salas Disponíveis:</h3>
            {rooms.length === 0 ? (
              <p>Nenhuma sala criada ainda.</p>
            ) : (
              <ul>
                {rooms.map((room) => (
                  <li key={room.roomId}>
                    <strong>{room.roomId}</strong> — Boss: {room.ownerName} — Jogadores: {room.players.length}/2
                    {room.status === "waiting" &&
                      room.ownerId !== socket.id &&
                      room.players.length < 2 && (
                        <button
                          onClick={() => handleJoinRoom(room.roomId)}
                          style={{ marginLeft: "10px" }}
                        >
                          Entrar
                        </button>
                      )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );

}
