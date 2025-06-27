import { useState } from "react";
import { crearTablero, obtenerTableros as serviceObtenerTableros} from "../services/tablero.service";

const ModalNewTablero = ({setModalOpen, obtenerTableros: refreshTableros})=>{
    const LIMITE_CARACTERES = 100;

    const [nombreTablero,setNombreTablero] = useState("")
    const [ipTablero, setIpTablero] = useState("");
    const [topicoTablero, setTopicoTablero] = useState("");
    const [protocoloTablero] = useState("ws");
    const [error, setError] = useState("");
    const [formatoMensaje, setFormatoMensaje] = useState("TEXTO_PLANO"); // Nuevo estado para el formato
    const [atributosJson, setAtributosJson] = useState([{ clave: "" }]);
    const [attrErrors, setAttrErrors] = useState([]); 
    
    
    const handleAddAtributo = () => {
      setAtributosJson([...atributosJson, { clave: "" }]); 
      setAttrErrors([...attrErrors, { clave: "" }]); 
    };

        const handleRemoveAtributo = (index) => {
      const newAtributos = atributosJson.filter((_, i) => i !== index);
      setAtributosJson(newAtributos);
      const newAttrErrors = attrErrors.filter((_, i) => i !== index);
      setAttrErrors(newAttrErrors);
    };

    const handleChangeAtributo = (index, field, value) => {
      const newAtributos = [...atributosJson];
      newAtributos[index][field] = value;
      setAtributosJson(newAtributos);

      // Limpiar el error específico para este campo si se está corrigiendo
      const newAttrErrors = [...attrErrors];
      if (newAttrErrors[index]) {
        newAttrErrors[index][field] = "";
        setAttrErrors(newAttrErrors);
      }
    };

    const validateAtributosJson = () => {
      let isValid = true;
      // --- ATENCIÓN: attrErrors ahora solo valida 'clave' ---
      const newAttrErrors = atributosJson.map(() => ({ clave: "" }));

      if (formatoMensaje === "JSON") {
        if (atributosJson.length === 0) {
          setError("Si el formato es JSON, debe agregar al menos un atributo.");
          isValid = false;
        } else {
          atributosJson.forEach((attr, index) => {
            if (attr.clave.trim() === "") {
              newAttrErrors[index].clave = "La clave no puede estar vacía.";
              isValid = false;
            }
            // --- ATENCIÓN: Eliminada la validación de 'valor' ---
          });
        }
      }
      setAttrErrors(newAttrErrors);
      return isValid;
    };


    const handleAddTablero = async (e) =>{
      e.preventDefault();
      setError("");

      const trimmedNombreTablero = nombreTablero.trim();

      if (trimmedNombreTablero === "") {
        setError("El nombre del tablero no puede estar vacío.");
        return;
      }

      if (!validateAtributosJson()) {
        return;
      }

      let existingTableros = [];

      try{
        existingTableros = await serviceObtenerTableros();
      } catch (error) {
        console.error("Error al verificar tableros existentes:", error);
        setError("Error al verificar tableros existentes.");
        return;
      }

      const isDuplicated = existingTableros.some(
        (tablero) => tablero.nombreTablero.trim().toLowerCase() === trimmedNombreTablero.toLowerCase()
      );

      if (isDuplicated) {
        setError("Ya existe un tablero con este nombre. Por favor, elige otro.");
        return;
      }
      
      try{
          const payload = {
            nombreTablero: trimmedNombreTablero,
            ipTablero: ipTablero.trim(),
            topicoTablero: topicoTablero.trim(),
            protocoloTablero: protocoloTablero.trim(),
            formatoMensaje: formatoMensaje,
          };

          // Añadir atributos JSON si el formato es JSON
          if (formatoMensaje === "JSON") {
            payload.atributosJson = atributosJson.map(attr => ({
              clave: attr.clave.trim(),
            }));
          }

          const res = await crearTablero(payload);

          if (res){
            refreshTableros();
            setModalOpen(false)
          }
      } catch (err) {
        console.error("Error al crear tablero:", err);
        setError("Error al crear tablero. Por favor, inténtalo de nuevo.");
      }
    }

    return(
        <div
          className="fixed inset-0 flex items-center justify-center z-50 px-4"
          style={{ backgroundColor: "rgba(0,0,0,0.75)" }} // Este es el overlay semitransparente, déjalo así
        >
          {/* CAMBIO CLAVE: Usamos bg-light para que sea igual que el fondo de la vista principal */}
          <div className="bg-light p-4 sm:p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg sm:text-xl font-bold mb-4 text-text-darker">Nuevo Tablero</h3>
            <form onSubmit={handleAddTablero}>
              {/* Nombre de tablero */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1 text-input-text">Nombre de tablero</label>
                <input
                  id="nombre-tablero"
                  type="text"
                  className={`w-full border border-border-base rounded px-2 py-1 bg-input-bg text-input-text ${error ? 'border-red-500' : ''}`}
                  value={nombreTablero}
                  onChange={(e) =>{ 
                    setNombreTablero(e.target.value)
                    setError("");
                  }}
                  placeholder="Nombre del tablero"
                  maxLength={LIMITE_CARACTERES}
                />
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-text-muted">
                    {nombreTablero.length}/{LIMITE_CARACTERES}
                  </span>
                </div>
                {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
              </div>
              {/* Protocolo tablero */}
              <div className="mb-4 ">
                <label className="block text-sm font-medium mb-1 text-input-text">Protocolo tablero</label>
                <input
                  id="protocolo-tablero"
                  type="text"
                  className="w-1/4 rounded px-2 py-1 bg-button-secondary-bg text-button-secondary-text"
                  value={protocoloTablero}
                  onChange={(e) => setNombreTablero(e.target.value)}
                  placeholder="ws por defecto"
                  disabled
                />
              </div>
              
              {/* Ip y puerto de tablero */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1 text-input-text">Ip y puerto de tablero</label>
                <input
                  id="ip-tablero"
                  type="text"
                  className="w-full border border-border-base rounded px-2 py-1 bg-input-bg text-input-text"
                  value={ipTablero}
                  onChange={(e) => setIpTablero(e.target.value)}
                  placeholder="123.456.789.123:12346"
                />
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-text-muted">
                    {ipTablero.length}/{21}
                  </span>
                </div>
              </div>
              
              {/* Topico tablero */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1 text-input-text">Tópico de tablero</label>
                <input
                  id="topico-tablero"
                  type="text"
                  className="w-full border border-border-base rounded px-2 py-1 bg-input-bg text-input-text"
                  value={topicoTablero}
                  onChange={(e) => setTopicoTablero(e.target.value)}
                  placeholder="topico/principal, principal, etc"
                  maxLength={LIMITE_CARACTERES}
                />
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-text-muted">
                    {topicoTablero.length}/{LIMITE_CARACTERES}
                  </span>
                </div>
              </div>

              {/* Selección de Formato de Mensaje */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1 text-input-text">Formato de Mensaje</label>
                <select
                  id="formato-mensaje"
                  className="w-full border border-border-base rounded px-2 py-1 bg-input-bg text-input-text"
                  value={formatoMensaje}
                  onChange={(e) => {
                    setFormatoMensaje(e.target.value);
                    setError(""); // Limpiar errores generales
                  }}
                >
                  <option value="TEXTO_PLANO">Texto Plano</option>
                  <option value="JSON">JSON</option>
                  <option value="PAPUGRUPO">PAPUGRUPO</option>
                </select>
              </div>

              {/* Atributos JSON (condicional) */}
              {formatoMensaje === "JSON" && (
                <div className="mb-4 border border-border-base p-3 rounded">
                  <label className="block text-sm font-medium mb-2 text-input-text">Claves JSON</label>
                  {atributosJson.map((attr, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        className={`w-full border border-border-base rounded px-2 py-1 bg-input-bg text-input-text ${attrErrors[index]?.clave ? 'border-red-500' : ''}`}
                        placeholder="Clave"
                        value={attr.clave}
                        onChange={(e) => handleChangeAtributo(index, "clave", e.target.value)}
                      />
                      {/* --- ATENCIÓN: Eliminado el input para 'valor' --- */}
                      {atributosJson.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAtributo(index)}
                          className="ml-2 p-1 rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
                        >
                          X
                        </button>
                      )}
                    </div>
                  ))}
                  {attrErrors.some(err => err.clave) && (
                    <p className="text-red-500 text-xs mt-1">Por favor, rellena todas las claves de los atributos.</p>
                  )}
                  <button
                    type="button"
                    onClick={handleAddAtributo}
                    className="mt-2 px-3 py-1 rounded bg-button-secondary-bg text-button-secondary-text hover:bg-button-secondary-bg-hover transition-colors text-sm"
                  >
                    + Añadir Clave
                  </button>
                </div>
              )}


              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  className="px-3 sm:px-4 py-2 rounded bg-button-secondary-bg text-button-secondary-text hover:bg-button-secondary-bg-hover transition-colors text-sm"
                  onClick={() => setModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 sm:px-4 py-2 rounded bg-primary text-white hover:bg-primary-dark transition-colors text-sm"
                  disabled={nombreTablero.trim() === "" || error !== "" || ipTablero.trim() === "" || topicoTablero.trim() === ""}
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