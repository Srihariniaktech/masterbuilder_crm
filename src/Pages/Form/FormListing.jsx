import React from "react";
import { useNavigate } from "react-router-dom";

function FormListing() {
    const navigate = useNavigate();

    const formCategories = [
        {
            id: 1,
            title: "Manpower Application",
            description: "View applications from manpower service seekers.",
            icon: "👷",
            route: "/manpower-application"
        }
    ];

    return (
        <div className="page" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h1>Manage Forms</h1>
            </div>

            <div className="cards" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "20px" }}>
                {formCategories.map((form) => (
                    <div 
                        key={form.id} 
                        className="card" 
                        onClick={() => navigate(form.route)}
                        style={{ 
                            padding: "20px", 
                            background: "#fff", 
                            borderRadius: "12px", 
                            boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                            cursor: "pointer",
                            transition: "transform 0.2s",
                            borderLeft: "5px solid #ffc400"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-5px)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                    >
                        <div style={{ fontSize: "40px", marginBottom: "15px" }}>{form.icon}</div>
                        <h3 style={{ marginBottom: "10px", color: "#333" }}>{form.title}</h3>
                        <p style={{ color: "#666", fontSize: "14px" }}>{form.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default FormListing;
