import { useState } from "react";
import { editarTablero } from "../services/tablero.service";

const ModalEditTablero = ({setModalOpen,obtenerTableros, tableroInfo,setTableroInfo})=>{
    const LIMITE_CARACTERES = 100;

    console.log("Tablero Info:", tableroInfo);


    const [nombreTablero,setNombreTablero] = useState(tableroInfo.nombreTablero || "")
    const [ipTablero, setIpTablero] = useState(tableroInfo.ipTablero || "");
    const [topicoTablero, setTopicoTablero] = useState(tableroInfo.topicoTablero || "");
    const [protocoloTablero] = useState("ws")

    const handleEditTablero = async (e) =>{
      e.preventDefault();
      const res = await editarTablero({ 
        idTablero: tableroInfo.idTablero,
        nombreTablero: nombreTablero.trim(),
        ipTablero: ipTablero.trim(),
        topicoTablero: topicoTablero.trim(),
      });

      if (res){
        setTableroInfo(prevInfo => ({
                ...prevInfo,
                nombreTablero: nombreTablero.trim(),
                ipTablero: ipTablero.trim(),         
                topicoTablero: topicoTablero.trim(),
            }));
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
            <form onSubmit={handleEditTablero}>
              {/* Nombre de tablero */}
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
              {/* Protocolo tablero */}
              <div className="mb-4 ">
                <label className="block text-sm font-medium mb-1">Protocolo tablero</label>
                <input
                  id="protocolo-tablero"
                  type="text"
                  className=" w-1/4 bg-gray-200 rounded px-2 py-1"
                  value={protocoloTablero}
                  onChange={(e) => setNombreTablero(e.target.value)}
                  placeholder="ws por defecto"
                  disabled
                />
              </div>
              
              {/* Ip y puerto de tablero */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Ip y puerto de tablero</label>
                <input
                  id="ip-tablero"
                  type="text"
                  className="w-full border rounded px-2 py-1"
                  value={ipTablero}
                  onChange={(e) => setIpTablero(e.target.value)}
                  placeholder="123.456.789.123:12346"
                />
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-gray-500">
                    {ipTablero.length}/{21}
                  </span>
                </div>
              </div>
              
              {/* Topico tablero */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Tópico de tablero</label>
                <input
                  id="topico-tablero"
                  type="text"
                  className="w-full border rounded px-2 py-1"
                  value={topicoTablero}
                  onChange={(e) => setTopicoTablero(e.target.value)}
                  placeholder="topico/principal, principal, etc"
                  maxLength={LIMITE_CARACTERES}
                />
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-gray-500">
                    {topicoTablero.length}/{LIMITE_CARACTERES}
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
                  Editar
                </button>
              </div>
            </form>
          </div>
        </div>
    )
}

export default ModalEditTablero;