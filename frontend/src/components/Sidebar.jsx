import React from "react";

export default function Sidebar({ isOpen, closeSidebar }) {
  return (
    <aside
      className={`fixed top-0 left-0 h-full w-64 bg-teal-800 text-white transform transition-transform duration-300 z-40 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Cierre */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-teal-700">
        <h2 className="text-xl font-bold">Menú</h2>
        <button onClick={closeSidebar} className="text-white text-2xl">
          &times;
        </button>
      </div>

      {/* Navegación */}
      <nav className="p-6 flex flex-col gap-4">
        <a href="#" className="hover:text-teal-300">Inicio</a>
        <a href="#" className="hover:text-teal-300">Mensajes</a>
        <a href="#" className="hover:text-teal-300">Configuración</a>
        <a href="#" className="hover:text-teal-300">Salir</a>
      </nav>
    </aside>
  );
}
