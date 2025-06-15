import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import './VistaPrincipal.css'; // Reutiliza los estilos existentes
import { crearGrupo,unirseGrupo,obtenerGrupos } from "../services/tablero.service";
import { useNavigate } from "react-router-dom";

export default function SeleccionarGrupo() {
  const [grupos, setGrupos] = useState([]);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState("");
  const [nombreNuevoGrupo, setNombreNuevoGrupo] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const cargarGrupos = async () => {
    try {
      const data = await obtenerGrupos(); 
      console.log("Grupos obtenidos:", data);
      setGrupos(data);
      setError(null);
    } catch (err) {
      console.error("Error al obtener grupos:", err);
      setError("No se pudieron cargar los grupos.");
    }
  };


  useEffect(() => {
    const cargarGrupos = async () => {
      try {
        const data = await obtenerGrupos(); 
        console.log("Grupos obtenidos:", data);
        setGrupos(data);
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
      await crearGrupo({ nombreGrupo: nombreNuevoGrupo });
      navigate("/tablero");
      //setNombreNuevoGrupo("");
      //cargarGrupos();
    } catch (err) {
      console.error("Error al crear grupo:", err);
      setError("No se pudo crear el grupo.");
    }
  };

  const handleSeleccionarGrupo = (e) => {
    const uuidSeleccionado = e.target.value;
    const grupo = grupos.find((g) => g.idGrupo === uuidSeleccionado);
    setGrupoSeleccionado(grupo);
    console.log("Grupo seleccionado:", grupo);
  };

  const handleUnirGrupo = async (e) => {
    e.preventDefault();
    if (!grupoSeleccionado) return;

    try {
      await unirseGrupo({ idGrupo: grupoSeleccionado.idGrupo });
      navigate("/tablero");
      //setGrupoSeleccionado("");
      // cargarGrupos();
    } catch (err) {
      console.error("Error al unirse al grupo:", err);
      setError("No se pudo unir al grupo.");
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f9f9] text-[#1c2b2b]">
      <Header/>
      <main className="p-6 md:px-36 rounded-lg">
        <h1 className="text-2xl font-bold mb-6">Hola!</h1>
        <p className="mb-4">Para seguir con el proceso de registro, necesitas seleccionar o crear un grupo para ser asignado a él.</p>
        <h1 className="text-2xl font-bold mb-6">Gestión de Grupos</h1>

        {error && <p className="text-red-600 mb-4">{error}</p>}

        <div className="flex flex-col md:flex-row justify-between ">
          <div className="flex flex-col gap-4  md:w-1/2 px-10">
          
          <section className="mb-8 ">
            <h2 className="text-xl font-semibold mb-2">Selecciona un grupo existente:</h2>
            <select
              className="p-2 border rounded w-full"
              value={grupoSeleccionado?.idGrupo || ''}
              onChange={handleSeleccionarGrupo}
            >
              <option value="">-- Selecciona un grupo --</option>
              {grupos.map((grupo) => (
                <option key={grupo.idGrupo} value={grupo.idGrupo}>
                  {grupo.nombreGrupo} - {grupo.Usuario.nombre}
                </option>
              ))}
            </select>
            {grupoSeleccionado && (
          <div className="flex mt-6 text-green-700 justify-end items-end ">
            <button onClick={handleUnirGrupo} type="submit"className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"> Unirme al grupo</button>
           
          </div>
        )}
          </section>

        <section className="mb-8 w-full">
              <h2 className="text-xl  font-semibold mb-2">O</h2>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-2">Crear y unirme a un nuevo grupo</h2>
            <form onSubmit={handleCrearGrupo} className="flex flex-col gap-4 items-start">
              <input
                type="text"
                className="p-2 border rounded w-full "
                placeholder="Nombre del grupo"
                value={nombreNuevoGrupo}
                onChange={(e) => setNombreNuevoGrupo(e.target.value)}
              />  
            </form>
            <div className="flex mt-6 text-green-700 justify-end items-end ">
                {nombreNuevoGrupo && (
                  <button
                  
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                  onClick={handleCrearGrupo}
                >
                  Crear y unirme
                </button>
                )}
              </div>
          </section>
          </div>
          <div className="flex flex-col   md:w-1/2">
          <img src="/people.png" alt="Grupo" className=" mx-auto " />
          
          </div>
        </div>

        

        
      </main>
    </div>
  );
}
