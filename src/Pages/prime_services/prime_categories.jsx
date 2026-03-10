import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import noImage from "../../assets/no_image.jpg";

const API_URL = "https://masterbuilder-backend.onrender.com/api/prime-services";
const CATEGORY_API_URL = "https://masterbuilder-backend.onrender.com/api/prime-categories";
const UPLOAD_SINGLE = "https://masterbuilder-backend.onrender.com/api/upload/single";

function PrimeCategories() {
    const { serviceId } = useParams();
    const navigate = useNavigate();
    const [service, setService] = useState(null);
    const [categories, setCategories] = useState([]);

    /* ---- Category form state ---- */
    const [catFormData, setCatFormData] = useState({ orderno: "", name: "", imageurl: "" });
    const [catEditId, setCatEditId] = useState(null);
    const [catUploading, setCatUploading] = useState(false);

    const fetchServiceInfo = async () => {
        try {
            const res = await axios.get(API_URL);
            const data = Array.isArray(res.data) ? res.data : (res.data.data || res.data.services || []);
            const current = data.find(s => String(s._id || s.id) === String(serviceId));
            setService(current);
        } catch (err) { console.error("Failed to fetch service info.", err); }
    };

    const fetchCategories = async () => {
        try {
            const res = await axios.get(CATEGORY_API_URL);
            let data = Array.isArray(res.data) ? res.data : (res.data.data || []);
            const filtered = data.filter(c => String(c.primeserviceid) === String(serviceId));
            setCategories(filtered);
        } catch (err) { console.error("Failed to fetch categories.", err); }
    };

    useEffect(() => {
        fetchServiceInfo();
        fetchCategories();
    }, [serviceId]);

    const handleCatImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setCatUploading(true);

        const data = new FormData();
        // Try appending both "image" and "file" if you're unsure, 
        // but typically it's one of them. We'll stick to "image" first.
        data.append("image", file);

        try {
            const res = await axios.post(UPLOAD_SINGLE, data);
            let rawUrl = res.data?.url || res.data?.imageUrl || res.data?.filePath || "";

            // Handle potential stringified JSON response
            if (rawUrl && typeof rawUrl === "string" && (rawUrl.startsWith("[") || rawUrl.startsWith("{"))) {
                try {
                    const parsed = JSON.parse(rawUrl);
                    if (Array.isArray(parsed) && parsed[0]) {
                        rawUrl = typeof parsed[0] === "string" ? parsed[0] : (parsed[0].url || "");
                    } else if (parsed && parsed.url) {
                        rawUrl = parsed.url;
                    }
                } catch (err) { console.warn("URL Parse Error:", err); }
            }

            if (rawUrl) {
                setCatFormData(f => ({ ...f, imageurl: rawUrl }));
                console.log("✅ Category Image Uploaded:", rawUrl);
            } else {
                console.error("❌ No URL in response:", res.data);
                alert("❌ Upload succeeded but no URL was returned.");
            }
        } catch (err) {
            console.error("❌ Upload API Error:", err);
            alert("❌ Image upload failed. See console for details.");
        } finally {
            setCatUploading(false);
            e.target.value = ""; // Clear input for re-uploads
        }
    };

    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...catFormData, primeserviceid: serviceId };
            if (catEditId) {
                await axios.put(`${CATEGORY_API_URL}/${catEditId}`, payload);
                alert("✅ Category Updated!");
                setCatEditId(null);
            } else {
                await axios.post(CATEGORY_API_URL, payload);
                alert("✅ Category Added!");
            }
            setCatFormData({ orderno: "", name: "", imageurl: "" });
            fetchCategories();
        } catch (err) { alert("Error saving category."); }
    };

    const handleCategoryDelete = async (catId) => {
        if (!window.confirm("Delete this category?")) return;
        try {
            console.log("🗑️ Deleting Category ID:", catId);
            const res = await axios.delete(`${CATEGORY_API_URL}/${catId}`);
            console.log("✅ Delete Response:", res.data);
            alert("✅ Category Deleted!");
            fetchCategories();
        } catch (err) {
            console.error("❌ Delete Error:", err.response?.data || err.message);
            const errorMsg = err.response?.data?.message || err.response?.data?.error || "Delete failed.";
            alert(`❌ ${errorMsg}`);
        }
    };

    return (
        <div style={styles.container}>
            <button onClick={() => navigate("/prime-services")} style={styles.backBtn}>← Back to Services</button>

            <h2 style={styles.mainTitle}>{service ? service.name.toUpperCase() : "LOADING..."} CATEGORIES</h2>

            <div style={styles.formBox}>
                <h3 style={{ marginBottom: "20px", color: "#1e293b" }}>{catEditId ? "EDIT CATEGORY" : "ADD NEW CATEGORY"}</h3>
                <form onSubmit={handleCategorySubmit} style={styles.form}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                        <input type="text" placeholder="Order Number" value={catFormData.orderno} onChange={e => setCatFormData({ ...catFormData, orderno: e.target.value })} required style={styles.inputStyle} />
                        <input type="text" placeholder="Category Name" value={catFormData.name} onChange={e => setCatFormData({ ...catFormData, name: e.target.value })} required style={styles.inputStyle} />
                    </div>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <input type="file" id="catFile" accept="image/*" style={{ display: "none" }} onChange={handleCatImageUpload} />
                        <label htmlFor="catFile" style={styles.uploadBtnSvc}>{catUploading ? "..." : "📁 UPLOAD IMAGE"}</label>
                        <input type="text" placeholder="Or paste Image URL" value={catFormData.imageurl} onChange={e => setCatFormData({ ...catFormData, imageurl: e.target.value })} style={styles.inputStyle} />
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                        {catEditId && <button type="button" onClick={() => { setCatEditId(null); setCatFormData({ orderno: "", name: "", imageurl: "" }); }} style={styles.cancelBtn}>CANCEL</button>}
                        <button type="submit" style={styles.submitBtn}>{catEditId ? "🚀 UPDATE CATEGORY" : "✨ ADD CATEGORY"}</button>
                    </div>
                </form>
            </div>

            <div style={styles.categoryGrid}>
                {categories.map((cat, i) => (
                    <div
                        key={cat.id || i}
                        style={{ ...styles.productCard, cursor: "pointer" }}
                        onClick={() => {
                            // Find the parent service directly from state
                            const svcName = (service?.name || "").toLowerCase().replace(/\s/g, "");
                            let isManPower = svcName.includes("manpower");

                            // Fallback logic if 'service' is inexplicably null but we have categories
                            // Man Power service ID from the API is typically 4.
                            if (!service && String(serviceId) === "4") {
                                isManPower = true;
                            }

                            const catName = (cat?.name || "").toLowerCase().trim();
                            const isMaterial = catName === "material" || String(cat.id || cat._id) === "4"; // Based on provided ID

                            if (isManPower) {
                                navigate(`/manpower-details/${cat.id || cat._id}`);
                            } else if (isMaterial) {
                                navigate(`/material-products/${cat.id || cat._id}`);
                            } else {
                                navigate(`/category-products/${cat.id || cat._id}`);
                            }
                        }}
                    >
                        <div style={styles.prodImageContainer}>
                            <img src={cat.imageurl || noImage} alt={cat.name} style={styles.prodImg} />
                        </div>
                        <div style={styles.prodContent}>
                            <h3 style={styles.prodName}>{cat.name}</h3>
                            <div style={styles.prodMeta}>
                                <span style={styles.prodOrder}>Order {cat.orderno}</span>
                                <span style={styles.prodDate}>{new Date(cat.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div style={styles.prodActions}>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setCatEditId(cat.id || cat._id); setCatFormData({ name: cat.name, orderno: cat.orderno, imageurl: cat.imageurl }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                    style={styles.prodEdit}
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleCategoryDelete(cat.id || cat._id); }}
                                    style={styles.prodDel}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {categories.length === 0 && (
                <p style={{ textAlign: "center", color: "#64748b", marginTop: "40px" }}>No categories found for this service.</p>
            )}
        </div>
    );
}

const styles = {
    container: { padding: "40px", maxWidth: "1350px", margin: "0 auto", backgroundColor: "#fff", fontFamily: "'Inter', sans-serif" },
    mainTitle: { borderLeft: "6px solid #ffc400", paddingLeft: "15px", marginBottom: "30px", fontWeight: "900", color: "#000", fontSize: "28px" },
    formBox: { background: "#fff", padding: "30px", borderRadius: "20px", border: "1px solid #f1f5f9", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", marginBottom: "40px" },
    form: { display: "flex", flexDirection: "column", gap: "24px" },
    inputStyle: { padding: "14px 18px", border: "1px solid #cbd5e0", borderRadius: "12px", width: "100%", boxSizing: "border-box", outline: "none" },
    uploadBtnSvc: { background: "#000", color: "#fff", padding: "14px 25px", borderRadius: "12px", fontSize: "12px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap" },
    submitBtn: { background: "#ffc400", color: "#000", padding: "15px 30px", border: "none", borderRadius: "12px", fontWeight: "900", cursor: "pointer", fontSize: "15px" },
    cancelBtn: { background: "#f1f5f9", color: "#475569", padding: "15px 25px", border: "none", borderRadius: "12px", fontWeight: "800", cursor: "pointer", fontSize: "14px" },
    backBtn: { background: "none", border: "none", color: "#ffc400", fontWeight: "700", cursor: "pointer", marginBottom: "20px", fontSize: "16px", padding: 0 },
    categoryGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "25px" },
    productCard: { background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", overflow: "hidden", transition: "all 0.3s", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" },
    prodImageContainer: { height: "180px", background: "#f8fafc", overflow: "hidden" },
    prodImg: { width: "100%", height: "100%", objectFit: "cover" },
    prodContent: { padding: "20px" },
    prodName: { margin: "0 0 10px 0", fontSize: "18px", fontWeight: "800", color: "#1e293b" },
    prodMeta: { display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b", marginBottom: "18px" },
    prodOrder: { background: "#f1f5f9", padding: "2px 8px", borderRadius: "4px" },
    prodDate: { fontStyle: "italic" },
    prodActions: { display: "flex", gap: "10px" },
    prodEdit: { flex: 1, padding: "8px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#fff", fontWeight: "700", cursor: "pointer", fontSize: "12px" },
    prodDel: { flex: 1, padding: "8px", borderRadius: "8px", border: "1px solid #fee2e2", background: "#fff5f5", color: "#ef4444", fontWeight: "700", cursor: "pointer", fontSize: "12px" },
};

export default PrimeCategories;
