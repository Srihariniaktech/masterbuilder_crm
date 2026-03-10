import React, { useState } from "react";
import { Link } from "react-router-dom";

function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile Toggle */}
      <button className="menu-btn" onClick={() => setOpen(!open)}>
        ☰
      </button>

      <div className={`sidebar ${open ? "open" : ""}`}>
        <h2 className="logo">MEDBOOK</h2>

        <nav>
          <Link to="/" onClick={() => setOpen(false)}>
            Dashboard
          </Link>

          <Link to="/prime-services" onClick={() => setOpen(false)}>
            Prime Services
          </Link>
        </nav>
      </div>
    </>
  );
}

export default Sidebar;
