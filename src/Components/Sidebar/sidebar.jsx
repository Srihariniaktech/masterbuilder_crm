import React from "react";
import { Link, useLocation } from "react-router-dom";

function Sidebar({ isOpen, toggleSidebar }) {
    const location = useLocation();

    return (
        <div className={`sidebar ${isOpen ? "open" : ""}`}>
            <div className="logo">
                <h2>MASTER BUILDER</h2>
            </div>
            <nav>
                <Link
                    to="/"
                    className={location.pathname === "/" ? "active" : ""}
                    onClick={toggleSidebar}
                >
                    Dashboard
                </Link>
                <Link
                    to="/prime-services"
                    className={location.pathname === "/prime-services" ? "active" : ""}
                    onClick={toggleSidebar}
                >
                    Prime Services
                </Link>
                <Link
                    to="/blog-management"
                    className={location.pathname === "/blog-management" ? "active" : ""}
                    onClick={toggleSidebar}
                >
                    Blogs
                </Link>
                <Link
                    to="/projects-tenders"
                    className={location.pathname === "/projects-tenders" ? "active" : ""}
                    onClick={toggleSidebar}
                >
                    Projects & Tenders
                </Link>
                <Link to="#" onClick={toggleSidebar}>Properties</Link>
                <Link to="#" onClick={toggleSidebar}>Bookings</Link>
                <Link to="#" onClick={toggleSidebar}>Settings</Link>
            </nav>
        </div>
    );
}

export default Sidebar;
