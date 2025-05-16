import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import './VistaPrincipal.css'; // Reutiliza los estilos existentes
//import { obtenerGrupos, crearGrupo } from "../services/grupo.service"; // Debes implementar estos servicios

export default function SeleccionarGrupo() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [grupos, setGrupos] = useState([]);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState("");
  const [nombreNuevoGrupo, setNombreNuevoGrupo] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarGrupos = async () => {
      try {
        //const data = await obtenerGrupos(); // obtiene lista desde tu backend
        //setGrupos(data);
        setError(null);
      } catch (err) {
        console.error("Error al obtener grupos:", err);
        setError("No se pudieron cargar los grupos.");
      }
    };

    cargarGrupos();
  }, []);

  const handleCrearGrupo = async (e) => {
    e.preventDefault();
    if (nombreNuevoGrupo.trim() === "") return;

    try {
      //const nuevo = await crearGrupo({ nombre: nombreNuevoGrupo });
      //setGrupos([...grupos, nuevo]);
      setNombreNuevoGrupo("");
    } catch (err) {
      console.error("Error al crear grupo:", err);
      setError("No se pudo crear el grupo.");
    }
  };

  const handleSeleccionarGrupo = (e) => {
    setGrupoSeleccionado(e.target.value);
  };

  return (
    <div className="min-h-screen bg-[#f4f9f9] text-[#1c2b2b]">
      <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />
      <main className="p-6 md:px-36 rounded-lg">
        <h1 className="text-2xl font-bold mb-6">Hola</h1>
        <p className="mb-4">Para seguir con el proceso de registro, necesitas seleccionar o crear un grupo para ser asignado a él.</p>
        <h1 className="text-2xl font-bold mb-6">Gestión de Grupos</h1>

        {error && <p className="text-red-600 mb-4">{error}</p>}

        <div className="flex flex-col md:flex-row justify-between ">
          <div className="flex flex-col gap-4  md:w-1/2 px-10">
          
          <section className="mb-8 ">
            <h2 className="text-xl font-semibold mb-2">Selecciona un grupo existente:</h2>
            <select
              className="p-2 border rounded w-full "
              value={grupoSeleccionado}
              onChange={handleSeleccionarGrupo}
            >
              <option value="">-- Selecciona un grupo --</option>
              {grupos.map((grupo) => (
                <option key={grupo.id} value={grupo.id}>
                  {grupo.nombre}
                </option>
              ))}
            </select>
          </section>

        <section className="mb-8 justify-center ">
              <h2 className="text-xl font-semibold mb-2">O</h2>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-2">Crear nuevo grupo</h2>
            <form onSubmit={handleCrearGrupo} className="flex flex-row gap-4 items-start">
              <input
                type="text"
                className="p-2 border rounded w-full"
                placeholder="Nombre del grupo"
                value={nombreNuevoGrupo}
                onChange={(e) => setNombreNuevoGrupo(e.target.value)}
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Crear
              </button>
            </form>
          </section>
          </div>
          <div className="flex flex-col justify-center items-center  md:w-1/2">
          <img src="./public/people.png" alt="Grupo" className=" mx-auto " />
          
          </div>
        </div>

        

        {grupoSeleccionado && (
          <div className="mt-6 text-green-700 font-medium">
            Grupo seleccionado: <strong>{grupos.find(g => g.id === grupoSeleccionado)?.nombre}</strong>
          </div>
        )}
      </main>
    </div>
  );
}
