import React from 'react';

type Mensaje = {
  tablero: string;
  hora: string;
  topico: string;
  mensaje: string;
};

type Props = {
  mensajes: Mensaje[];
};

export const HistMensajes: React.FC<Props> = ({ mensajes }) => {
  return (
    <div className="bg-black text-green-400 font-mono p-4 text-sm rounded-lg shadow-inner h-83 overflow-y-auto overflow-x-hidden scrollbar-thin">
      {mensajes.map((msg, index) => (
        <div
          key={index}
          className="break-words whitespace-pre-wrap w-full"
        >
          <span className="text-gray-500">[{msg.hora}]</span>{' '}
          <span className="text-blue-400">{msg.tablero}</span>{' '}
          <span className="text-yellow-300">{msg.topico}</span> ➜{' '}
          <span>{msg.mensaje}</span>
        </div>
      ))}
    </div>
  );
};
