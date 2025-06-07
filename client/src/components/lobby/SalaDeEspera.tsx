import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { battleSocket, socket } from "../../services/socket";
import pokemonData from "../../data/pokemonData.json";
import heldItems from "../../data/heldItemsData.json";

const defaultStats = ["hp", "atk", "def", "spa", "spd", "spe"];
const maxEVTotal = 510;
const maxEVPerStat = 252;
const maxIV = 31;
type Stat = "hp" | "atk" | "def" | "spa" | "spd" | "spe";
type PokemonBuild = {
  name: string;
  ability: string;
  nature: string;
  item: string;
  ivs: Record<Stat, number>;
  evs: Record<Stat, number>;
  moves: string[];
};

function SalaDeEspera() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const myId = state?.myId;
  const roomId = state?.roomId;

  const [isOwner, setIsOwner] = useState(false);
  const [challengerName, setChallengerName] = useState("");
  const [team, setTeam] = useState([
    createEmptyPokemon("Pikachu"),
    createEmptyPokemon("Charmander")
  ]);

  useEffect(() => {
    if (!myId || !roomId) {
      navigate("/");
      return;
    }
    battleSocket.emit('join-battle-room', { roomId });

    battleSocket.on("start-battle", ({ roomId, myId, battleState }) => {
      navigate("/battle", {
        state: { roomId, myId, battleState },
      });
    });

    socket.on("challenger-joined", ({ challengerName }) => {
        setChallengerName(challengerName);
    });

    socket.on("room-info", (room) => {
      setIsOwner(room.ownerId === myId);
    });

    socket.emit("check-ownership", { roomId, playerId: myId }, (isRoomOwner) => {
      setIsOwner(isRoomOwner);
    });

    socket.emit("get-room-info", roomId);

    return () => {
      battleSocket.emit('leave-battle-room', { roomId });
      battleSocket.off("start-battle");
      socket.off("room-info");
      socket.off("challenger-joined");
    };
  }, [navigate, roomId, myId]);

  function handleTeamChange(index, field, value) {
    const newTeam = [...team];
    newTeam[index][field] = value;
    setTeam(newTeam);
  };

  function handleIVChange(index, stat, value) {
    const newTeam = [...team];
    newTeam[index].ivs[stat] = Math.min(maxIV, Math.max(0, parseInt(value) || 0));
    setTeam(newTeam);
  };

  function handleEVChange(index, stat, value) {
    const newTeam = [...team];
    const evs = { ...newTeam[index].evs, [stat]: Math.min(maxEVPerStat, Math.max(0, parseInt(value) || 0)) };
    const evTotal = Object.values(evs).reduce((a, b) => a + b, 0);
    if (evTotal <= maxEVTotal) {
      newTeam[index].evs = evs;
      setTeam(newTeam);
    }
  }

  function handleMoveChange(index, moveIndex, value) {
    const newTeam = [...team];
    newTeam[index].moves[moveIndex] = value;
    setTeam(newTeam);
  }

  function handleConfirm() {
    battleSocket.emit("submit-build", {
      roomId,
      playerId: myId,
      team
    });
  }

  function createEmptyPokemon(species: string): PokemonBuild {
    const data = pokemonData[species];
    return {
      name: species,
      ability: data.abilities[0],
      nature: "Hardy",
      item: "",
      ivs: Object.fromEntries(defaultStats.map(stat => [stat, 31])) as Record<Stat, number>,
      evs: Object.fromEntries(defaultStats.map(stat => [stat, 0])) as Record<Stat, number>,
      moves: data.moves.slice(0, 2)
    };
  }

  return (
  <div style={{ padding: 20, fontFamily: "sans-serif" }}>
    {isOwner ? (
      <div>
        <h2>Sala de Espera do Boss</h2>
        <p>
          Compartilhe este código com seu oponente:{" "}
          <strong style={{ fontSize: "1.2em", color: "#007bff" }}>
            {roomId}
          </strong>
        </p>
        {challengerName ? (
          <p style={{ color: "green", marginTop: "20px" }}>
            O desafiante <strong>{challengerName}</strong> entrou! Aguardando
            ele montar o time...
          </p>
        ) : (
          <p style={{ marginTop: "20px" }}>
            Aguardando um desafiante entrar na sala...
          </p>
        )}
      </div>
    ) : (
      <>
        <h2>Monte seu time, Desafiante!</h2>
        {team.map((poke, i) => (
          <div
            key={i}
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "15px",
              marginBottom: "15px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <h3>
              Pokémon {i + 1}: {poke.name}
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
              <label>
                Nature:
                <br />
                <select value={poke.nature} onChange={(e) => handleTeamChange(i, "nature", e.target.value)} style={{ width: "100%", padding: "5px" }}>
                  <option value="Hardy">Hardy</option>
                  <option value="Timid">Timid</option>
                  <option value="Adamant">Adamant</option>
                  <option value="Modest">Modest</option>
                  {/* adicionar mais depois */}
                </select>
              </label>
              <label>
                Ability:
                <br />
                <select value={poke.ability} onChange={(e) => handleTeamChange(i, "ability", e.target.value)} style={{ width: "100%", padding: "5px" }}>
                  {pokemonData[poke.name].abilities.map((ab, abIndex) => (
                    <option key={abIndex} value={ab}>
                      {ab}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Item:
                <br />
                <select value={poke.item} onChange={(e) => handleTeamChange(i, "item", e.target.value)} style={{ width: "100%", padding: "5px" }}>
                  <option value="">-- Nenhum --</option>
                  {heldItems.map((item, idx) => (
                    <option key={idx} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-around", marginTop: "15px" }}>
                <div>
                    <h4>IVs</h4>
                    {defaultStats.map((stat) => (
                    <div key={stat} style={{ marginBottom: "5px" }}>
                        {stat.toUpperCase()}:{" "}
                        <input type="number" value={poke.ivs[stat]} onChange={(e) => handleIVChange(i, stat, e.target.value)} style={{ width: "60px" }}/>
                    </div>
                    ))}
                </div>
                <div>
                    <h4>EVs (Total: {Object.values(poke.evs).reduce((a, b) => a + b, 0)} / {maxEVTotal})</h4>
                    {defaultStats.map((stat) => (
                    <div key={stat} style={{ marginBottom: "5px" }}>
                        {stat.toUpperCase()}:{" "}
                        <input type="number" value={poke.evs[stat]} onChange={(e) => handleEVChange(i, stat, e.target.value)} style={{ width: "60px" }}/>
                    </div>
                    ))}
                </div>
            </div>

            <h4 style={{ marginTop: "15px" }}>Moves</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px" }}>
                {[0, 1, 2, 3].map((moveIdx) => (
                <select
                    key={moveIdx}
                    value={poke.moves[moveIdx] || ""}
                    onChange={(e) => handleMoveChange(i, moveIdx, e.target.value)}
                    style={{ padding: "5px" }}
                >
                    <option value="">---</option>
                    {pokemonData[poke.name].moves.map((mv, mvi) => (
                    <option key={mvi} value={mv}>
                        {mv}
                    </option>
                    ))}
                </select>
                ))}
            </div>
          </div>
        ))}
        <button
          onClick={handleConfirm}
          style={{
            width: "100%",
            padding: "15px",
            fontSize: "1.2em",
            cursor: "pointer",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "5px",
          }}
        >
          Confirmar Equipe e Iniciar Batalha
        </button>
      </>
    )}
  </div>
);

}

export default SalaDeEspera;