// AppRoute.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from '../views/Login';
import SeleccionarGrupo from '../views/SeleccionarGrupo';
import VistaPrincipal from '../views/VistaPrincipal';
import Registro from '../views/Registro';
export default function AppRoute() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login/>} />
        <Route path="/SeleccionarGrupo" element={<SeleccionarGrupo/>} />
        <Route path="/tablero" element={<VistaPrincipal/>} />
        <Route path="/registro" element={<Registro />} />
    
      </Routes>
    </Router>
  );
}
