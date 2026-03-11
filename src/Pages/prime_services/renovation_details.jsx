import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import noImage from "../../assets/no_image.jpg";

const CATEGORY_API_URL = "https://masterbuilder-backend.onrender.com/api/prime-categories";
const PRODUCT_API_URL = "https://masterbuilder-backend.onrender.com/api/product-page3";
const UPLOAD_SINGLE = "https://masterbuilder-backend.onrender.com/api/upload/single";

export default function RenovationDetails() {
    const { categoryId } = useParams();
    const navigate = useNavigate();
    const [category, setCategory] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    /* ---- Form State ---- */
    const initialForm = { name: "", iconurl: "" };
    const [formData, setFormData] = useState(initialForm);
    const [editId, setEditId] = useState(null);
    const [uploading, setUploading] = useState(false);

    const fetchCategoryInfo = async () => {
        try {
            const res = await axios.get(CATEGORY_API_URL);
            const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
            const current = data.find(c => String(c.id || c._id) === String(categoryId));
            setCategory(current);
        } catch (err) { console.error("Category fetch error", err); }
    };

    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await axios.get(PRODUCT_API_URL);
            let data = Array.isArray(res.data) ? res.data : (res.data.data || []);
            // Filter by category ID (Renovation)
            const filtered = data.filter(item => String(item.primecategoriesid) === String(categoryId));
            setItems(filtered);
        } catch (err) { console.error("Items fetch error", err); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchCategoryInfo();
        fetchItems();
    }, [categoryId]);

    const handleIconUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const data = new FormData();
            data.append("image", file);
            const res = await axios.post(UPLOAD_SINGLE, data);
            const url = res.data?.url || res.data?.imageUrl || "";
            if (url) setFormData(f => ({ ...f, iconurl: url }));
        } catch (err) { alert("❌ Upload failed"); }
        finally { setUploading(false); e.target.value = ""; }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData, primecategoriesid: categoryId };
            if (editId) {
                await axios.put(`${PRODUCT_API_URL}/${editId}`, payload);
                alert("✅ Item Updated!");
                setEditId(null);
            } else {
                await axios.post(PRODUCT_API_URL, payload);
                alert("✅ Item Added!");
            }
            setFormData(initialForm);
            fetchItems();
        } catch (err) {
            console.error("Save error:", err);
            alert("❌ Save failed.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this item?")) return;
        try {
            await axios.delete(`${PRODUCT_API_URL}/${id}`);
            alert("✅ Item Deleted!");
            fetchItems();
        } catch (err) {
            console.error("Delete error:", err);
            alert("❌ Delete failed.");
        }
    };

    return (
        <div style={styles.container}>
            <button onClick={() => navigate(-1)} style={styles.backBtn}>&#8592;</button>

            <h2 style={styles.mainTitle}>
                {category ? category.name.toUpperCase() : "RENOVATION"} ITEMS
            </h2>

            {/* ---- ADD / EDIT FORM ---- */}
            <div style={styles.formPanel}>
                <h3 style={styles.panelHeading}>{editId ? "EDIT ITEM" : "ADD NEW ITEM"}</h3>
                <form onSubmit={handleSubmit} style={styles.formGrid}>
                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>Item Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Sand, Cement, Paint"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>Icon Image</label>
                        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                            <input type="file" id="iconFile" accept="image/*" style={{ display: "none" }} onChange={handleIconUpload} />
                            <label htmlFor="iconFile" style={styles.uploadBtn}>
                                {uploading ? "⏳ Uploading..." : "📁 Upload Icon"}
                            </label>
                            <input
                                type="text"
                                placeholder="Or paste icon URL"
                                value={formData.iconurl}
                                onChange={e => setFormData({ ...formData, iconurl: e.target.value })}
                                style={{ ...styles.input, flex: 1 }}
                            />
                        </div>
                        {formData.iconurl && (
                            <img src={formData.iconurl} alt="Preview" style={styles.previewIcon} />
                        )}
                    </div>

                    <div style={styles.btnRow}>
                        {editId && (
                            <button type="button" onClick={() => { setEditId(null); setFormData(initialForm); }} style={styles.cancelBtn}>
                                CANCEL
                            </button>
                        )}
                        <button type="submit" style={styles.saveBtn}>
                            {editId ? "🚀 UPDATE ITEM" : "✨ ADD ITEM"}
                        </button>
                    </div>
                </form>
            </div>

            {/* ---- ITEMS GRID ---- */}
            <div style={styles.itemsGrid}>
                {items.map((item) => (
                    <div key={item.id} style={{ ...styles.itemCard, cursor: "pointer" }}
                        onClick={() => navigate(`/renovation-product-details/${item.id || item._id}`)}
                    >
                        <div style={styles.iconArea}>
                            <img src={item.iconurl || noImage} alt={item.name} style={styles.iconImg} />
                        </div>
                        <div style={styles.itemInfo}>
                            <h3 style={styles.itemName}>{item.name}</h3>
                            <div style={styles.itemActions}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditId(item.id || item._id);
                                        setFormData({ name: item.name, iconurl: item.iconurl || "" });
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    style={styles.editBtn}
                                >
                                    ✏️ Edit
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(item.id || item._id);
                                    }}
                                    style={styles.deleteBtn}
                                >
                                    🗑️ Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {items.length === 0 && !loading && (
                <p style={styles.emptyMsg}>No items found for this category. Add one above!</p>
            )}
        </div>
    );
}

const styles = {
    container: {
        padding: "40px",
        maxWidth: "1200px",
        margin: "0 auto",
        backgroundColor: "#fff",
        fontFamily: "'Inter', sans-serif",
    },
    backBtn: {
        backgroundColor: "#fff",
        color: "#000",
        border: "1px solid #eee",
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        cursor: "pointer",
        fontWeight: "900",
        fontSize: "20px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "20px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
    },
    mainTitle: {
        borderLeft: "6px solid #ffc400",
        paddingLeft: "15px",
        marginBottom: "30px",
        fontWeight: "900",
        color: "#000",
        fontSize: "28px",
    },
    formPanel: {
        backgroundColor: "#fff",
        border: "1px solid #f1f5f9",
        borderRadius: "24px",
        padding: "35px",
        marginBottom: "50px",
        boxShadow: "0 15px 40px rgba(0,0,0,0.04)",
    },
    panelHeading: {
        color: "#1e293b",
        fontSize: "18px",
        fontWeight: "800",
        marginBottom: "25px",
    },
    formGrid: {
        display: "flex",
        flexDirection: "column",
        gap: "24px",
    },
    fieldGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
    },
    label: {
        fontSize: "13px",
        fontWeight: "700",
        color: "#64748b",
        marginLeft: "4px",
    },
    input: {
        padding: "15px 20px",
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        fontSize: "15px",
        outline: "none",
        backgroundColor: "#f8fafc",
    },
    uploadBtn: {
        backgroundColor: "#000",
        color: "#fff",
        padding: "14px 25px",
        borderRadius: "14px",
        fontSize: "14px",
        fontWeight: "700",
        cursor: "pointer",
        whiteSpace: "nowrap",
    },
    previewIcon: {
        width: "80px",
        height: "80px",
        objectFit: "cover",
        borderRadius: "14px",
        marginTop: "10px",
        border: "1px solid #eee",
    },
    btnRow: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "15px",
        marginTop: "10px",
    },
    saveBtn: {
        backgroundColor: "#ffc400",
        color: "#000",
        padding: "16px 40px",
        border: "none",
        borderRadius: "14px",
        fontWeight: "900",
        cursor: "pointer",
        fontSize: "15px",
        boxShadow: "0 4px 10px rgba(255, 196, 0, 0.3)",
    },
    cancelBtn: {
        backgroundColor: "#f1f5f9",
        color: "#475569",
        padding: "16px 30px",
        border: "none",
        borderRadius: "14px",
        fontWeight: "800",
        cursor: "pointer",
    },

    /* ---- Items Grid ---- */
    itemsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: "25px",
    },
    itemCard: {
        backgroundColor: "#fff",
        borderRadius: "20px",
        overflow: "hidden",
        border: "1px solid #f1f5f9",
        boxShadow: "0 6px 20px rgba(0,0,0,0.04)",
        transition: "transform 0.2s, box-shadow 0.2s",
    },
    iconArea: {
        height: "180px",
        backgroundColor: "#f8fafc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
    },
    iconImg: {
        maxWidth: "100%",
        maxHeight: "100%",
        objectFit: "contain",
        borderRadius: "12px",
    },
    itemInfo: {
        padding: "20px",
    },
    itemName: {
        fontSize: "18px",
        fontWeight: "800",
        color: "#1e293b",
        margin: "0 0 15px 0",
        textTransform: "capitalize",
    },
    itemActions: {
        display: "flex",
        gap: "10px",
    },
    editBtn: {
        flex: 1,
        padding: "10px",
        borderRadius: "10px",
        border: "1px solid #e2e8f0",
        backgroundColor: "#fff",
        fontWeight: "700",
        cursor: "pointer",
        fontSize: "13px",
    },
    deleteBtn: {
        flex: 1,
        padding: "10px",
        borderRadius: "10px",
        border: "none",
        backgroundColor: "#fef2f2",
        color: "#ef4444",
        fontWeight: "700",
        cursor: "pointer",
        fontSize: "13px",
    },
    emptyMsg: {
        textAlign: "center",
        color: "#94a3b8",
        marginTop: "60px",
        fontSize: "16px",
        fontWeight: "600",
    },
};
