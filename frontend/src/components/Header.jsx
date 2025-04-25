import React from "react";

export default function Header({ toggleSidebar }) {
  return (
    <header className="bg-teal-700 text-white flex items-center px-6 py-1 shadow-md">

      {/* Botón hamburguesa */}
            <button
        className="text-white focus:outline-none"
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

      {/* Logo con imagen */}
      <div>
        <img
          src="/images/utalca_icc.png" // Aquí debes colocar la ruta correcta de la imagen
          alt="Logo"
          className="h-18" // Ajusta el tamaño de la imagen según lo necesites
        />
      </div>


    </header>
  );
}
