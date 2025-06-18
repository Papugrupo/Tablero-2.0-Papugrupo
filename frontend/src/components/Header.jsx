import React from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { useTheme } from '../theme/ThemeContext'; // Importa el hook useTheme
import ThemeToggle from '../theme/ThemeToggle'; // Importa el componente del botón de alternancia. Asegúrate de que la ruta sea correcta.

export default function Header() {
  const navigate = useNavigate();
  const { theme } = useTheme(); // Obtenemos el tema actual para adaptar el logo si es necesario

  const cerrarSesion = () => {
    // Eliminar todas las cookies relacionadas con la autenticación
    Cookies.remove("token");
    Cookies.remove("usuario");
    Cookies.remove("idUsuario");

    // Opcional: limpiar localStorage si guardas información ahí
    localStorage.removeItem("usuario");

    // Redireccionar al login
    navigate("/");
  };

  return (
    <header
      className="flex items-center px-6 py-1 shadow-md"
      style={{
        backgroundColor: theme === 'light' ? '#109d95' : '#2c3e50', // Color para 'bg-teal-700' en claro y un oscuro para el modo oscuro
        color: theme === 'light' ? '#ffffff' : '#e0e0e0', // Color para 'text-white' en claro y un gris claro para oscuro
        transition: 'background-color 0.3s ease, color 0.3s ease', // Transición suave
      }}
    >
      <div>
        <ThemeToggle />
      </div>

      {/* Logo centrado */}
      <div className="flex-grow flex justify-center"> {/* Agregamos justify-center para centrar */}
        <img
          src="/images/utalca_icc.png"
          alt="Logo"
          className="h-18"
          // Opcional: Si tienes una versión del logo para modo oscuro, puedes cambiarla aquí
          // src={theme === 'light' ? "/images/utalca_icc.png" : "/images/utalca_icc_dark.png"}
        />
      </div>

      {/* Botón de cerrar sesión (derecha) */}
      <div>
        <button
          onClick={cerrarSesion}
          // Puedes adaptar los colores del botón de cerrar sesión también
          // usando los colores de tus variables CSS o con estilos en línea como este
          style={{
            color: theme === 'light' ? '#ffffff' : '#a0a0a0', // Texto más claro en modo claro, gris en oscuro
            transition: 'color 0.3s ease',
          }}
          className="flex items-center hover:text-gray-200 transition-colors"
        >
          <span className="mr-2 text-sm font-medium">Cerrar sesión</span>
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}