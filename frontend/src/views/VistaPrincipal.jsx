import React, { useState } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";


const mensajesGuardados = [
  { texto: "aaaaaaaaaaaaaaaaaaaaaa", velocidad: "x1" },
  { texto: "eeeeeeeeeeeeeeeeeeeee", velocidad: "x3.5" },
];


export default function VistaPrincipal() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f4f9f9] text-[#1c2b2b]">
      <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />

      {/* Fondo oscuro cuando el sidebar está abierto */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="pt-6 px-4">
        {/* Aquí va tu contenido principal */}
        <h1 className="text-2xl font-bold">Bienvenido Profesor</h1>
        <span className="font-normal">Rodrigo Domínguez</span>
        <h2 className="text-3xl font-bold mt-8 mb-4">Mensaje actual</h2>
        <div className="bg-black text-red-600 text-6xl font-mono px-6 py-4 rounded-lg border-8 border-gray-400 shadow-inner text-center">
          {mensajesGuardados[0].texto}
        </div>

        <div className="flex justify-center mt-6 gap-4">
          <button className="bg-[#109d95] hover:bg-[#4fd1c5] text-white font-bold py-2 px-4 rounded-full shadow-md">
            ACTUALIZAR MENSAJE
          </button>
          <button className="bg-[#9d101a] hover:bg-[#800b13] text-white font-bold py-2 px-4 rounded-full shadow-md">
            BORRAR MENSAJE
          </button>
        </div>

        <h2 className="text-2xl font-bold mt-10 mb-4">Mensajes Guardados</h2>
        <table className="w-full text-left bg-white rounded-lg shadow-md overflow-hidden">
          <thead className="bg-[#109d95] text-white ">
            <tr className="text-center">
              <th className="py-2">Selección</th>
              <th>Texto</th>
              <th>Velocidad</th>
            </tr>
          </thead>
          <tbody>
            {mensajesGuardados.map((msg, idx) => (
              <tr key={idx} className="border-t border-gray-200 hover:bg-[#f4f9f9]">
                <td className="py-2 px-4">
                  <input type="checkbox" className="form-checkbox text-[#109d95]" />
                </td>
                <td>{msg.texto}</td>
                <td>{msg.velocidad}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-center mt-6">
          <button className="bg-black text-white px-6 py-2 rounded-full">
            AGREGAR
          </button>
        </div>
      </main>
    </div>
  );
}