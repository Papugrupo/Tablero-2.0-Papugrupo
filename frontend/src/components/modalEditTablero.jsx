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
          style={{ backgroundColor: "rgba(0,0,0,0.75)" }} // Este es el overlay semitransparente, déjalo así
        >
          {/* Fondo del modal con bg-light */}
          <div className="bg-light p-4 sm:p-6 rounded-lg w-full max-w-md">
            {/* Título del modal con text-text-darker */}
            <h3 className="text-lg sm:text-xl font-bold mb-4 text-text-darker">Editar Tablero</h3>
            <form onSubmit={handleEditTablero}>
              {/* Nombre de tablero */}
              <div className="mb-4">
                {/* Label con text-input-text */}
                <label className="block text-sm font-medium mb-1 text-input-text">Nombre de tablero</label>
                <input
                  id="nombre-tablero"
                  type="text"
                  // Input con bg-input-bg, border-border-base, text-input-text
                  className="w-full border border-border-base rounded px-2 py-1 bg-input-bg text-input-text"
                  value={nombreTablero}
                  onChange={(e) => setNombreTablero(e.target.value)}
                  placeholder="Nombre del tablero"
                  maxLength={LIMITE_CARACTERES}
                />
                <div className="flex justify-end mt-1">
                  {/* Contador de caracteres con text-text-muted */}
                  <span className="text-xs text-text-muted">
                    {nombreTablero.length}/{LIMITE_CARACTERES}
                  </span>
                </div>
              </div>
              {/* Protocolo tablero */}
              <div className="mb-4 ">
                {/* Label con text-input-text */}
                <label className="block text-sm font-medium mb-1 text-input-text">Protocolo tablero</label>
                <input
                  id="protocolo-tablero"
                  type="text"
                  // Input deshabilitado con bg-button-secondary-bg y text-button-secondary-text
                  className="w-1/4 rounded px-2 py-1 bg-button-secondary-bg text-button-secondary-text"
                  value={protocoloTablero}
                  onChange={(e) => setNombreTablero(e.target.value)}
                  placeholder="ws por defecto"
                  disabled
                />
              </div>
              
              {/* Ip y puerto de tablero */}
              <div className="mb-4">
                {/* Label con text-input-text */}
                <label className="block text-sm font-medium mb-1 text-input-text">Ip y puerto de tablero</label>
                <input
                  id="ip-tablero"
                  type="text"
                  // Input con bg-input-bg, border-border-base, text-input-text
                  className="w-full border border-border-base rounded px-2 py-1 bg-input-bg text-input-text"
                  value={ipTablero}
                  onChange={(e) => setIpTablero(e.target.value)}
                  placeholder="123.456.789.123:12346"
                />
                <div className="flex justify-end mt-1">
                  {/* Contador de caracteres con text-text-muted */}
                  <span className="text-xs text-text-muted">
                    {ipTablero.length}/{21}
                  </span>
                </div>
              </div>
              
              {/* Topico tablero */}
              <div className="mb-4">
                {/* Label con text-input-text */}
                <label className="block text-sm font-medium mb-1 text-input-text">Tópico de tablero</label>
                <input
                  id="topico-tablero"
                  type="text"
                  // Input con bg-input-bg, border-border-base, text-input-text
                  className="w-full border border-border-base rounded px-2 py-1 bg-input-bg text-input-text"
                  value={topicoTablero}
                  onChange={(e) => setTopicoTablero(e.target.value)}
                  placeholder="topico/principal, principal, etc"
                  maxLength={LIMITE_CARACTERES}
                />
                <div className="flex justify-end mt-1">
                  {/* Contador de caracteres con text-text-muted */}
                  <span className="text-xs text-text-muted">
                    {topicoTablero.length}/{LIMITE_CARACTERES}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                {/* Botón Cancelar con clases de botón secundario */}
                <button
                  type="button"
                  className="px-3 sm:px-4 py-2 rounded bg-button-secondary-bg text-button-secondary-text hover:bg-button-secondary-bg-hover transition-colors text-sm"
                  onClick={() => setModalOpen(false)}
                >
                  Cancelar
                </button>
                {/* Botón Editar con clases de botón primario */}
                <button
                  type="submit"
                  className="px-3 sm:px-4 py-2 rounded bg-primary text-white hover:bg-primary-dark transition-colors text-sm"
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