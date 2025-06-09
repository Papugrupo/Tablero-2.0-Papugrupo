import React from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";

export default function Header({ toggleSidebar }) {
  const navigate = useNavigate();

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
    <header className="bg-teal-700 text-white flex items-center px-6 py-1 shadow-md">

      <div className="flex ">
        <button
          className="text-white focus:outline-none mr-4"
          onClick={toggleSidebar}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Logo centrado */}
      <div className="flex-grow flex ">
        <img
          src="/images/utalca_icc.png"
          alt="Logo"
          className="h-18" 
        />
      </div>
      
      {/* Botón de cerrar sesión (derecha) */}
      <div>
        <button 
          onClick={cerrarSesion}
          className="flex items-center text-white hover:text-gray-200 transition-colors"
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
