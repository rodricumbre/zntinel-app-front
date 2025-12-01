import React from 'react';

const Clients: React.FC = () => {
  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-100 mb-2">
        Clientes
      </h1>
      <p className="text-sm text-slate-400 mb-4">
        Gestiona las propiedades protegidas por Zntinel (dominios, planes y reglas).
      </p>
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-sm text-slate-400">
        Aquí listaremos los clientes desde la API (`GET /clients`).
      </div>
    </div>
  );
};

export default Clients;
