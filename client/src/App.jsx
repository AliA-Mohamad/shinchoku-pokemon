import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LobbyGlobal from "./components/lobby/LobbyGlobal";
import SalaDeEspera from "./components/lobby/SalaDeEspera";
import BattleInterface from "./components/battle/BattleInterface";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LobbyGlobal />} />
        <Route path="/sala" element={<SalaDeEspera />} />
        <Route path="/battle" element={<BattleInterface />} />
      </Routes>
    </Router>
  );
}

export default App;