import React, { useEffect, useState } from 'react';
import { LuLoaderCircle } from "react-icons/lu";

/**
 * Componente de carga con animación fade in/out
 * @param {Object} props 
 * @param {boolean} props.isOpen - Controla la visibilidad del componente
 */
const Loading = ({ isOpen }) => {
  const [showLoader, setShowLoader] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const [scale, setScale] = useState(0.95);

  useEffect(() => {
    let timer;
    
    if (isOpen) {
      // Mostrar el loader inmediatamente
      setShowLoader(true);
      
      // Luego aplicar animación
      timer = setTimeout(() => {
        setOpacity(1);
        setScale(1);
      }, 10);
    } else {
      // Primero animar la salida
      setOpacity(0);
      setScale(0.95);
      
      // Luego ocultar el componente
      timer = setTimeout(() => {
        setShowLoader(false);
      }, 300); // Duración de la animación
    }
    
    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!showLoader) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ pointerEvents: 'auto' }}>
      {/* Overlay con animación de fade */}
      <div 
        className="fixed inset-0 bg-black transition-opacity duration-300 ease-out" 
        style={{ opacity: opacity * 0.25 }}
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center">
        {/* Contenedor del spinner con animación */}
        <div 
          className="w-40 transform overflow-hidden rounded-2xl bg-transparent p-6 text-left align-middle transition-all duration-300 ease-out"
          style={{ 
            opacity: opacity,
            transform: `scale(${scale})` 
          }}
        >
          <div className="bg-gray-100 py-3 px-3 rounded-full w-full h-full">
            <LuLoaderCircle className="h-full w-full animate-spin text-[#109d95]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loading;