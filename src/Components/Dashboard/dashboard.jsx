import React from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
    const navigate = useNavigate();
    const stats = [
        { title: "Total Users", count: "1,250", color: "#ffc400" },
        { title: "Active Services", count: "48", color: "#4caf50" },
        { title: "Blog Posts", count: "15", color: "#9c27b0" },
        { title: "Pending Orders", count: "12", color: "#f44336" },
        { title: "Revenue", count: "₹45,000", color: "#2196f3" },
    ];

    return (
        <div className="page">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h1>Dashboard Overview</h1>
                <div style={{ display: "flex", gap: "12px" }}>
                    <button
                        onClick={() => navigate("/projects-tenders")}
                        style={{
                            padding: "10px 20px",
                            backgroundColor: "#000",
                            color: "#ffc400",
                            border: "none",
                            borderRadius: "8px",
                            fontWeight: "bold",
                            cursor: "pointer",
                            boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                        }}
                    >
                        🏗️ Projects & Tenders
                    </button>
                    <button
                        onClick={() => navigate("/blog-management")}
                        style={{
                            padding: "10px 20px",
                            backgroundColor: "#ffc400",
                            color: "#000",
                            border: "none",
                            borderRadius: "8px",
                            fontWeight: "bold",
                            cursor: "pointer",
                            boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                        }}
                    >
                        📝 Manage Blogs
                    </button>
                </div>
            </div>


            <div className="cards">
                {stats.map((stat, index) => (
                    <div key={index} className="card" style={{ borderLeftColor: stat.color }}>
                        <h3>{stat.title}</h3>
                        <p style={{ fontSize: "24px", fontWeight: "bold", marginTop: "10px" }}>
                            {stat.count}
                        </p>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: "40px", padding: "20px", background: "#fff", borderRadius: "8px", boxShadow: "0 0 10px #ddd" }}>
                <h2>Recent Activity</h2>
                <p style={{ color: "#666", marginTop: "10px" }}>No recent activity to show.</p>
            </div>
        </div>
    );
}

export default Dashboard;
