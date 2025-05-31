import { useState } from "react";
import { crearTablero } from "../services/tablero.service";

const ModalNewTablero = ({setModalOpen,obtenerTableros})=>{
    const LIMITE_CARACTERES = 100;

    const [nombreTablero,setNombreTablero] = useState("")

    const handleAddTablero = async (e) =>{
      e.preventDefault();
      const res = await crearTablero({ nombreTablero: nombreTablero.trim() });

      if (res){
        obtenerTableros();
        setModalOpen(false)
      }

    }

    return(
        <div
          className="fixed inset-0 flex items-center justify-center z-50 px-4"
          style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
        >
          <div className="bg-white p-4 sm:p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg sm:text-xl font-bold mb-4">Nuevo Tablero</h3>
            <form onSubmit={handleAddTablero}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Nombre de tablero</label>
                <input
                  id="nombre-tablero"
                  type="text"
                  className="w-full border rounded px-2 py-1"
                  value={nombreTablero}
                  onChange={(e) => setNombreTablero(e.target.value)}
                  placeholder="Nombre del tablero"
                  maxLength={LIMITE_CARACTERES}
                />
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-gray-500">
                    {nombreTablero.length}/{LIMITE_CARACTERES}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  className="px-3 sm:px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 transition-colors text-sm"
                  onClick={() => setModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 sm:px-4 py-2 rounded bg-[#109d95] text-white hover:bg-[#0f7d71] transition-colors text-sm"
                  disabled={nombreTablero.trim() === ""}
                >
                  Agregar
                </button>
              </div>
            </form>
          </div>
        </div>
    )
}

export default ModalNewTablero;