import React from "react";
import RegisterForm from "../components/lobby/RegisterForm";
import PlayerList from "../components/lobby/PlayerList";

const LobbyPage: React.FC = () => {
  const [players, setPlayers] = React.useState<Player[]>([]);

  const handleRegister = (name: string) => {
    const newPlayer = { id: Date.now().toString(), name };
    setPlayers(prev => [...prev, newPlayer]);
  };

  return (
    <div>
      <h1>Lobby</h1>
      <RegisterForm onSubmit={handleRegister} />
      <PlayerList players={players} />
    </div>
  );
};

export default LobbyPage;