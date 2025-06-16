// src/components/ThemeToggle.jsx
import React from 'react';
import { useTheme } from '../theme/ThemeContext'; // Asegúrate de que la ruta sea correcta a tu ThemeContext.js

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}   
      style={{
        padding: '10px 20px',
        fontSize: '1rem',
        cursor: 'pointer',
        borderRadius: '5px',
        border: '1px solid currentColor', // `currentColor` tomará el color de texto actual del elemento padre
        backgroundColor: theme === 'light' ? '#eee' : '#555', // Fondo del botón según el tema
        color: theme === 'light' ? '#333' : '#eee', // Color de texto del botón según el tema
        transition: 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease', // Transición suave al cambiar
      }}
    >
      Cambiar a {theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}
    </button>
  );
}

export default ThemeToggle;