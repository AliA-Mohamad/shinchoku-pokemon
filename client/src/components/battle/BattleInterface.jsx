import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { socket } from "../../services/socket";

export default function BattleInterface() {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state) {
    return <p style={{ padding: "20px", color: "red" }}>Erro: dados da batalha não encontrados.</p>;
  }

  const { roomId, myId, battleState: initialBattleState } = state;
  const [battleState, setBattleState] = useState(initialBattleState);
  const [error, setError] = useState(null);

  useEffect(() => {
    socket.on("battle-update", (updatedBattle) => {
      setBattleState({ ...updatedBattle });
    });

    socket.on("battle-ended", ({ winner }) => {
      alert(winner === myId ? "Você venceu!" : "Você perdeu!");
      navigate("/");
    });

    socket.on("action-error", (msg) => {
      setError(msg);
      setTimeout(() => setError(null), 2000);
    });

    return () => {
      socket.off("battle-update");
      socket.off("battle-ended");
      socket.off("action-error");
    };
  }, [myId, navigate]);

  if (!battleState || !battleState.players || !battleState.estados) {
    return <p style={{ padding: "20px" }}>Carregando batalha...</p>;
  }

  const isMyTurn = battleState.players[battleState.turn] === myId;

  const handleAttack = (targetId) => {
    socket.emit("player-action", {
      roomId,
      action: "attack",
      targetId,
    });
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h2>Batalha</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {battleState.players.map((id) => {
        const isEnemy = id !== myId;
        const data = battleState.estados[id];

        return (
          <div
            key={id}
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              margin: "10px 0",
              backgroundColor: isEnemy ? "#f7d4d4" : "#d4f7dc",
            }}
          >
            <p><strong>{isEnemy ? "Inimigo" : "Você"}</strong></p>
            <p>Pokémon: {data.pokemons.join(", ")}</p>
            <p>HP: {data.hp}</p>

            {isEnemy && isMyTurn && (
              <button onClick={() => handleAttack(id)}>Atacar</button>
            )}
          </div>
        );
      })}

      {!isMyTurn && <p>Aguardando o turno do oponente...</p>}
    </div>
  );
}
