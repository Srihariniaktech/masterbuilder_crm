import React from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="page">

      <h1>Dashboard</h1>

      <div className="cards">

        {/* Prime Service Card */}
        <div
          className="card"
          onClick={() => navigate("/prime-services")}
        >
          <h3>Prime Services</h3>
          <p>Manage all prime services</p>
        </div>

        {/* Future Cards */}
        <div className="card">
          <h3>Hospitals</h3>
          <p>Manage hospitals</p>
        </div>

        <div className="card">
          <h3>Doctors</h3>
          <p>Manage doctors</p>
        </div>

      </div>

    </div>
  );
}

export default Dashboard;
