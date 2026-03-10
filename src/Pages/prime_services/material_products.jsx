import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import noImage from "../../assets/no_image.jpg";

const CATEGORY_API_URL = "https://masterbuilder-backend.onrender.com/api/prime-categories";
const PRODUCT_API_URL = "https://masterbuilder-backend.onrender.com/api/product-page3";
const UPLOAD_SINGLE = "https://masterbuilder-backend.onrender.com/api/upload/single";

function MaterialProducts() {
    const { categoryId } = useParams();
    const navigate = useNavigate();
    const [category, setCategory] = useState(null);
    const [products, setProducts] = useState([]);

    /* ---- Product form state ---- */
    const [formData, setFormData] = useState({ name: "", imageurl: "", iconurl: "" });
    const [editId, setEditId] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadingIcon, setUploadingIcon] = useState(false);

    useEffect(() => {
        const fetchCategoryInfo = async () => {
            try {
                const res = await axios.get(CATEGORY_API_URL);
                const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
                const current = data.find(c => (c._id || c.id) === categoryId);
                setCategory(current);
            } catch (err) { console.error("Failed to fetch category info.", err); }
        };

        const fetchProducts = async () => {
            try {
                const res = await axios.get(PRODUCT_API_URL);
                let data = Array.isArray(res.data) ? res.data : (res.data.data || []);
                const filtered = data.filter(p => String(p.primecategoriesid) === String(categoryId));
                setProducts(filtered);
            } catch (err) {
                console.warn("Products API failed or not found. Using empty list.", err);
                setProducts([]);
            }
        };

        fetchCategoryInfo();
        fetchProducts();
    }, [categoryId]);

    const handleImageUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        if (type === 'image') setUploadingImage(true);
        else setUploadingIcon(true);

        const data = new FormData();
        data.append("image", file);
        try {
            const res = await axios.post(UPLOAD_SINGLE, data, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            // Check possible paths for the URL
            const url = res.data?.url || res.data?.data?.url || "";

            if (url) {
                if (type === 'image') {
                    setFormData(f => ({ ...f, imageurl: url }));
                } else {
                    setFormData(f => ({ ...f, iconurl: url }));
                }
            } else {
                alert("❌ Upload succeeded but no URL was returned.");
            }
        } catch { alert("❌ Upload failed."); }
        finally {
            if (type === 'image') setUploadingImage(false);
            else setUploadingIcon(false);
            e.target.value = "";
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData, primecategoriesid: categoryId };
            if (editId) {
                await axios.put(`${PRODUCT_API_URL}/${editId}`, payload);
                alert("✅ Material Product Updated!");
                setEditId(null);
            } else {
                await axios.post(PRODUCT_API_URL, payload);
                alert("✅ Material Product Added!");
            }
            setFormData({ name: "", imageurl: "", iconurl: "" });

            // Re-fetch products
            const res = await axios.get(PRODUCT_API_URL);
            let data = Array.isArray(res.data) ? res.data : (res.data.data || []);
            const filtered = data.filter(p => String(p.primecategoriesid) === String(categoryId));
            setProducts(filtered);

        } catch (err) { alert("Error saving product. Please verify the Product API endpoint."); }
    };

    const handleDelete = async (prodId) => {
        if (!window.confirm("Delete this material product?")) return;
        try {
            await axios.delete(`${PRODUCT_API_URL}/${prodId}`);
            alert("✅ Material Product Deleted!");

            // Re-fetch
            const res = await axios.get(PRODUCT_API_URL);
            let data = Array.isArray(res.data) ? res.data : (res.data.data || []);
            const filtered = data.filter(p => String(p.primecategoriesid) === String(categoryId));
            setProducts(filtered);
        } catch (err) { alert("Delete failed."); }
    };

    return (
        <div style={styles.container}>
            <button onClick={() => window.history.back()} style={styles.backBtn}>← Back to Categories</button>

            <h2 style={styles.mainTitle}>{category ? category.name.toUpperCase() : "LOADING..."} PRODUCTS</h2>

            <div style={styles.formBox}>
                <h3 style={{ marginBottom: "20px", color: "#1e293b" }}>{editId ? "EDIT MATERIAL" : "ADD NEW MATERIAL"}</h3>
                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
                        <input type="text" placeholder="Product Name (e.g., Cement & Concrete)" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required style={styles.inputStyle} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            <input type="file" id="prodImageFile" accept="image/*" style={{ display: "none" }} onChange={(e) => handleImageUpload(e, 'image')} />
                            <label htmlFor="prodImageFile" style={styles.uploadBtnSvc}>{uploadingImage ? "..." : "📁 MAIN IMAGE"}</label>
                            <input type="text" placeholder="Or paste Main Image URL" value={formData.imageurl} onChange={e => setFormData({ ...formData, imageurl: e.target.value })} style={styles.inputStyle} />
                        </div>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            <input type="file" id="prodIconFile" accept="image/*" style={{ display: "none" }} onChange={(e) => handleImageUpload(e, 'icon')} />
                            <label htmlFor="prodIconFile" style={styles.uploadBtnSvc}>{uploadingIcon ? "..." : "📁 ICON"}</label>
                            <input type="text" placeholder="Or paste Icon URL" value={formData.iconurl} onChange={e => setFormData({ ...formData, iconurl: e.target.value })} style={styles.inputStyle} />
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "10px" }}>
                        {editId && <button type="button" onClick={() => { setEditId(null); setFormData({ name: "", imageurl: "", iconurl: "" }); }} style={styles.cancelBtn}>CANCEL</button>}
                        <button type="submit" style={styles.submitBtn}>{editId ? "🚀 UPDATE MATERIAL" : "✨ ADD MATERIAL"}</button>
                    </div>
                </form>
            </div>

            <div style={styles.categoryGrid}>
                {products.map((prod, i) => (
                    <div
                        key={prod.id || i}
                        style={{ ...styles.productCard, cursor: 'pointer' }}
                        onClick={() => navigate(`/material-product-details/${prod.id || prod._id}`)}
                    >
                        {/* Actions Overlay */}
                        <div style={styles.actionOverlay}>
                            <button
                                onClick={(e) => { e.stopPropagation(); setEditId(prod.id || prod._id); setFormData({ name: prod.name, imageurl: prod.imageurl, iconurl: prod.iconurl }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                style={styles.iconBtnEdit}
                                title="Edit"
                            >
                                ✏️
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(prod.id || prod._id); }}
                                style={styles.iconBtnDel}
                                title="Delete"
                            >
                                🗑️
                            </button>
                        </div>

                        <div style={styles.prodImageContainer}>
                            <img src={prod.imageurl || noImage} alt={prod.name} style={styles.prodImg} />
                        </div>
                        <div style={styles.prodContent}>
                            <div style={styles.iconContainer}>
                                <img src={prod.iconurl || noImage} alt="icon" style={styles.iconImg} />
                            </div>
                            <h3 style={styles.prodName}>{prod.name}</h3>
                        </div>
                    </div>
                ))}
            </div>
            {products.length === 0 && (
                <p style={{ textAlign: "center", color: "#64748b", marginTop: "40px" }}>No materials found in this category yet.</p>
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
    productCard: {
        position: 'relative',
        background: "#fff",
        borderRadius: "16px",
        border: "1px solid #f1f5f9",
        overflow: "hidden",
        transition: "all 0.3s",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
    },
    actionOverlay: {
        position: 'absolute',
        top: '10px',
        right: '10px',
        display: 'flex',
        gap: '8px',
        zIndex: 10
    },
    iconBtnEdit: {
        background: 'rgba(255, 255, 255, 0.9)',
        border: 'none',
        borderRadius: '50%',
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        fontSize: '14px'
    },
    iconBtnDel: {
        background: 'rgba(255, 235, 235, 0.9)',
        border: 'none',
        borderRadius: '50%',
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        fontSize: '14px'
    },
    prodImageContainer: { height: "200px", background: "#f8fafc", overflow: "hidden" },
    prodImg: { width: "100%", height: "100%", objectFit: "cover" },
    prodContent: {
        padding: "15px 20px",
        display: "flex",
        alignItems: "center",
        gap: "15px"
    },
    iconContainer: {
        width: "32px",
        height: "32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    },
    iconImg: {
        maxWidth: "100%",
        maxHeight: "100%",
        objectFit: "contain"
    },
    prodName: {
        margin: "0",
        fontSize: "16px",
        fontWeight: "700",
        color: "#1e293b"
    },
};

export default MaterialProducts;
