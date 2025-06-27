import { useState, useEffect } from "react";
import { editarTablero } from "../services/tablero.service";

const ModalEditTablero = ({setModalOpen, tableroInfo,setTableroInfo})=>{
    const LIMITE_CARACTERES = 100;

    console.log("Tablero Info:", tableroInfo);

    const [nombreTablero,setNombreTablero] = useState(tableroInfo.nombreTablero || "")
    const [ipTablero, setIpTablero] = useState(tableroInfo.ipTablero || "");
    const [topicoTablero, setTopicoTablero] = useState(tableroInfo.topicoTablero || "");
    const [protocoloTablero] = useState("ws")
    const [formatoMensaje, setFormatoMensaje] = useState(tableroInfo.formatoMensaje || "");
    const [atributosJson, setAtributosJson] = useState(tableroInfo.atributosJsonTablero && tableroInfo.atributosJsonTablero.length > 0 ? tableroInfo.atributosJsonTablero.map(attr => ({ clave: attr.clave || "" })) : [{ clave: "" }]);
    const [attrErrors, setAttrErrors] = useState(tableroInfo.atributosJsonTablero && tableroInfo.atributosJsonTablero.length > 0 ? tableroInfo.atributosJsonTablero.map(() => ({ clave: "" })) : [{ clave: "" }]);
    const [error, setError] = useState("");
    
    useEffect(() => {
        if (tableroInfo.formatoMensaje === "JSON" && tableroInfo.atributosJsonTablero && tableroInfo.atributosJsonTablero.length > 0) {
            setAtributosJson(tableroInfo.atributosJsonTablero.map(attr => ({ clave: attr.clave || "" })));
            setAttrErrors(tableroInfo.atributosJsonTablero.map(() => ({ clave: "" })));
        } else if (tableroInfo.formatoMensaje === "JSON") {
            setAtributosJson([{ clave: "" }]);
            setAttrErrors([{ clave: "" }]);
        } else {
            setAtributosJson([]);
            setAttrErrors([]);
        }
    }, [tableroInfo]);

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

        const newAttrErrors = [...attrErrors];
        if (newAttrErrors[index]) {
            newAttrErrors[index][field] = "";
            setAttrErrors(newAttrErrors);
        }
    };

    const validateAtributosJson = () => {
        let isValid = true;
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
                });
            }
        }
        setAttrErrors(newAttrErrors);
        return isValid;
    };

    const handleEditTablero = async (e) =>{
      e.preventDefault();
      if (!validateAtributosJson()) {
          return;
      }

      try{
        const payload = {
            idTablero: tableroInfo.idTablero,
            nombreTablero: nombreTablero.trim(),
            ipTablero: ipTablero.trim(),
            topicoTablero: topicoTablero.trim(),
            formatoMensaje: formatoMensaje,
        };

        // Add JSON attributes if the format is JSON
        if (formatoMensaje === "JSON") {
            payload.atributosJson = atributosJson.map(attr => ({
                clave: attr.clave.trim(),
            }));
        } else {
            payload.atributosJson = []; // Ensure atributosJson is an empty array if not JSON
        }

        const res = await editarTablero(payload);

        if (res){
            setTableroInfo(prevInfo => ({
                ...prevInfo,
                nombreTablero: nombreTablero.trim(),
                ipTablero: ipTablero.trim(),         
                topicoTablero: topicoTablero.trim(),
                formatoMensaje: formatoMensaje,
                atributosJsonTablero: formatoMensaje === "JSON" ? atributosJson.map(attr => ({ clave: attr.clave.trim() })) : [],
            }));
            setModalOpen(false)
        }
    } catch (err) {
        console.error("Error al editar tablero:", err);
        setError("Error al editar tablero. Por favor, inténtalo de nuevo.");
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

              {/* Selección de Formato de Mensaje */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1 text-input-text">Formato de Mensaje</label>
                <select
                  id="formato-mensaje"
                  className="w-full border border-border-base rounded px-2 py-1 bg-input-bg text-input-text"
                  value={formatoMensaje}
                  onChange={(e) => {
                    setFormatoMensaje(e.target.value);
                  }}
                >
                  <option value="TEXTO_PLANO">Texto Plano</option>
                  <option value="JSON">JSON</option>
                  <option value="PAPUGRUPO">PAPUGRUPO</option>
                </select>
              </div>

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
                    disabled={nombreTablero.trim() === "" || error !== "" || ipTablero.trim() === "" || topicoTablero.trim() === ""}
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