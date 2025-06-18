// src/App.jsx
import React from "react";
import VistaPrincipal from "./views/VistaPrincipal";
import SeleccionarGrupo from "./views/SeleccionarGrupo";
import AppRoute from "./routes/AppRoute";
import { ThemeProvider } from './theme/ThemeContext';
function App() {
  return (
    <ThemeProvider>
      <AppRoute />
    </ThemeProvider>
  );
}

export default App;
