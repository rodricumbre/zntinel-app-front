// src/components/pages/Dashboard.tsx

import React from "react";

const Dashboard: React.FC = () => {
  console.log("Dashboard se está renderizando");
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "white",
        padding: "2rem",
      }}
    >
      <h1>Dashboard básico</h1>
      <p>Si ves este texto, el routing está bien y el fallo está en los widgets.</p>
    </div>
  );
};

export default Dashboard;
