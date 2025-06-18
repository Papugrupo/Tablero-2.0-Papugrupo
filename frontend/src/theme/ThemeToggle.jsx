// src/components/ThemeToggle.jsx
import React from 'react';
import { useTheme } from '../theme/ThemeContext'; // Asegúrate de que la ruta sea correcta

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="
        relative inline-flex items-center h-8 w-16 rounded-full
        cursor-pointer
        transition-colors duration-300 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        bg-light border border-secondary
        dark:bg-darkNeutral dark:border-darkNeutral
      "
      aria-label="Toggle theme"
    >
      {/* Contenedor del ícono (se moverá) */}
      <span
        className={`
          inline-block h-6 w-6 transform
          rounded-full bg-primary shadow-lg
          transition-transform duration-300 ease-in-out
          ${theme === 'dark' ? 'translate-x-8' : 'translate-x-1'}
          
          // ESTOS SON LOS CAMBIOS PARA MEJORAR EL CENTRADO:
          flex items-center justify-center // Asegura flexbox para centrado
          // Puedes probar con un 'pt-px' o 'pb-px' si aún se ve ligeramente desalineado
          // Por ejemplo:
          // pt-px // Pequeño ajuste de 1px hacia abajo
          // pb-px // Pequeño ajuste de 1px hacia arriba
        `}
      >
        {theme === 'dark' ? (
          // Ícono de luna (para modo oscuro)
          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        ) : (
          // Ícono de sol (para modo claro)
          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h1M3 12H2m15.325-6.675l-.707-.707M6.675 17.325l-.707-.707M18.611 18.611l-.707-.707M5.389 5.389l-.707-.707M12 18a6 6 0 100-12 6 6 0 000 12z"
            />
          </svg>
        )}
      </span>
    </button>
  );
}

export default ThemeToggle;