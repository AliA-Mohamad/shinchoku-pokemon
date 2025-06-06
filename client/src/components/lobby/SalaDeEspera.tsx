import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { socket } from "../../services/socket";
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
  const [team, setTeam] = useState([
    createEmptyPokemon("Pikachu"),
    createEmptyPokemon("Charmander")
  ]);

  useEffect(() => {
    socket.on("start-battle", ({ roomId, myId, battleState }) => {
      navigate("/battle", {
        state: { roomId, myId, battleState },
      });
    });

    socket.on("room-info", (room) => {
      setIsOwner(room.ownerId === myId);
    });

    socket.emit("check-ownership", { roomId, playerId: myId }, (isRoomOwner) => {
      setIsOwner(isRoomOwner);
    });

    socket.emit("get-room-info", roomId);

    socket.emit("challenger-selected-team", {
      roomId,
      team,
    });

    return () => {
      socket.off("start-battle");
      socket.off("room-info");
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
    socket.emit("submit-build", {
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
      <div style={{ padding: 20 }}>
        {isOwner ? (
          <p>Aguardando o desafiante montar seu time...</p>
        ) : (
          <>
            <h2>Monte seu time</h2>
            {team.map((poke, i) => (
              <div key={i} style={{ border: "1px solid #ccc", padding: 10, marginBottom: 10 }}>
                <h3>{poke.name}</h3>
                <label>
                  Nature:
                  <select value={poke.nature} onChange={e => handleTeamChange(i, "nature", e.target.value)}>
                    <option value="Hardy">Hardy</option>
                    <option value="Timid">Timid</option>
                    <option value="Adamant">Adamant</option>
                    <option value="Modest">Modest</option>
                    {/* adicionar mais depois */}
                  </select>
                </label>
                <br />
                <label>
                  Ability:
                  <select value={poke.ability} onChange={e => handleTeamChange(i, "ability", e.target.value)}>
                    {pokemonData[poke.name].abilities.map((ab, abIndex) => (
                      <option key={abIndex} value={ab}>{ab}</option>
                    ))}
                  </select>
                </label>
                <br />
                <label>
                  Item:
                  <select value={poke.item} onChange={e => handleTeamChange(i, "item", e.target.value)}>
                    <option value="">-- Nenhum --</option>
                    {heldItems.map((item, idx) => (
                      <option key={idx} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </label>
                <h4>IVs</h4>
                {defaultStats.map(stat => (
                  <div key={stat}>
                    {stat.toUpperCase()}: <input type="number" value={poke.ivs[stat]} onChange={e => handleIVChange(i, stat, e.target.value)} />
                  </div>
                ))}
                <h4>EVs</h4>
                {defaultStats.map(stat => (
                  <div key={stat}>
                    {stat.toUpperCase()}: <input type="number" value={poke.evs[stat]} onChange={e => handleEVChange(i, stat, e.target.value)} />
                  </div>
                ))}
                <h4>Moves</h4>
                {[0, 1, 2, 3].map(moveIdx => (
                  <select
                    key={moveIdx}
                    value={poke.moves[moveIdx] || ""}
                    onChange={e => handleMoveChange(i, moveIdx, e.target.value)}>
                    <option value="">---</option>
                    {pokemonData[poke.name].moves.map((mv, mvi) => (
                      <option key={mvi} value={mv}>{mv}</option>
                    ))}
                  </select>
                ))}
              </div>
            ))}
            <button onClick={handleConfirm}>Confirmar equipe</button>
          </>
        )}
    </div>
  );

}

export default SalaDeEspera;