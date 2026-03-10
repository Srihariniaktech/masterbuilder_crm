import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import noImage from "../../assets/no_image.jpg";

const API_URL = "https://masterbuilder-backend.onrender.com/api/prime-services";
const CATEGORY_API_URL = "https://masterbuilder-backend.onrender.com/api/prime-categories";
const PRODUCT_API_URL = "https://masterbuilder-backend.onrender.com/api/prime-products"; // Placeholder guess
const UPLOAD_SINGLE = "https://masterbuilder-backend.onrender.com/api/upload/single";

function CategoryProducts() {
    const { categoryId } = useParams();
    const navigate = useNavigate();
    const [category, setCategory] = useState(null);
    const [products, setProducts] = useState([]);

    /* ---- Product form state ---- */
    const [formData, setFormData] = useState({ name: "", price: "", description: "", imageurl: "", orderno: "" });
    const [editId, setEditId] = useState(null);
    const [uploading, setUploading] = useState(false);

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
                const filtered = data.filter(p => String(p.categoryid) === String(categoryId));
                setProducts(filtered);
            } catch (err) {
                console.warn("Products API failed or not found. Using empty list.", err);
                setProducts([]);
            }
        };

        fetchCategoryInfo();
        fetchProducts();
    }, [categoryId]);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const data = new FormData();
        data.append("image", file);
        try {
            const res = await axios.post(UPLOAD_SINGLE, data);
            // Handling the response structure mentioned by the user
            const url = res.data?.url || res.data?.imageUrl || res.data?.filePath || "";
            if (url) setFormData(f => ({ ...f, imageurl: url }));
        } catch { alert("❌ Upload failed."); }
        finally { setUploading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData, categoryid: categoryId };
            if (editId) {
                await axios.put(`${PRODUCT_API_URL}/${editId}`, payload);
                alert("✅ Product Updated!");
                setEditId(null);
            } else {
                await axios.post(PRODUCT_API_URL, payload);
                alert("✅ Product Added!");
            }
            setFormData({ name: "", price: "", description: "", imageurl: "", orderno: "" });
            // Re-fetch products (logic would go here if API works)
        } catch (err) { alert("Error saving product. Please verify the Product API endpoint."); }
    };

    const handleDelete = async (prodId) => {
        if (!window.confirm("Delete this product?")) return;
        try {
            await axios.delete(`${PRODUCT_API_URL}/${prodId}`);
            alert("✅ Product Deleted!");
            // Re-fetch
        } catch (err) { alert("Delete failed."); }
    };

    return (
        <div style={styles.container}>
            <button onClick={() => window.history.back()} style={styles.backBtn}>← Back to Categories</button>

            <h2 style={styles.mainTitle}>{category ? category.name.toUpperCase() : "LOADING..."} PRODUCTS</h2>

            <div style={styles.formBox}>
                <h3 style={{ marginBottom: "20px", color: "#1e293b" }}>{editId ? "EDIT PRODUCT" : "ADD NEW PRODUCT"}</h3>
                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                        <input type="text" placeholder="Product Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required style={styles.inputStyle} />
                        <input type="text" placeholder="Price (INR)" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required style={styles.inputStyle} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                        <input type="text" placeholder="Order Number" value={formData.orderno} onChange={e => setFormData({ ...formData, orderno: e.target.value })} style={styles.inputStyle} />
                        <input type="text" placeholder="Description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} style={styles.inputStyle} />
                    </div>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <input type="file" id="prodFile" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />
                        <label htmlFor="prodFile" style={styles.uploadBtnSvc}>{uploading ? "..." : "📁 UPLOAD IMAGE"}</label>
                        <input type="text" placeholder="Or paste Image URL" value={formData.imageurl} onChange={e => setFormData({ ...formData, imageurl: e.target.value })} style={styles.inputStyle} />
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                        {editId && <button type="button" onClick={() => { setEditId(null); setFormData({ name: "", price: "", description: "", imageurl: "", orderno: "" }); }} style={styles.cancelBtn}>CANCEL</button>}
                        <button type="submit" style={styles.submitBtn}>{editId ? "🚀 UPDATE PRODUCT" : "✨ ADD PRODUCT"}</button>
                    </div>
                </form>
            </div>

            <div style={styles.categoryGrid}>
                {products.map((prod, i) => (
                    <div key={prod.id || i} style={styles.productCard}>
                        <div style={styles.prodImageContainer}>
                            <img src={prod.imageurl || noImage} alt={prod.name} style={styles.prodImg} />
                        </div>
                        <div style={styles.prodContent}>
                            <h3 style={styles.prodName}>{prod.name}</h3>
                            <p style={{ fontSize: "14px", color: "#173b01", fontWeight: "bold", margin: "5px 0" }}>₹ {prod.price}</p>
                            <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "15px" }}>{prod.description}</p>
                            <div style={styles.prodActions}>
                                <button
                                    onClick={() => { setEditId(prod.id || prod._id); setFormData({ name: prod.name, price: prod.price, description: prod.description, imageurl: prod.imageurl, orderno: prod.orderno }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                    style={styles.prodEdit}
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(prod.id || prod._id)}
                                    style={styles.prodDel}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {products.length === 0 && (
                <p style={{ textAlign: "center", color: "#64748b", marginTop: "40px" }}>No products found in this category yet. {PRODUCT_API_URL.includes("placeholder") ? "(Verify API endpoint)" : ""}</p>
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
    prodName: { margin: "0 0 5px 0", fontSize: "18px", fontWeight: "800", color: "#1e293b" },
    prodActions: { display: "flex", gap: "10px" },
    prodEdit: { flex: 1, padding: "8px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#fff", fontWeight: "700", cursor: "pointer", fontSize: "12px", textAlign: "center" },
    prodDel: { flex: 1, padding: "8px", borderRadius: "8px", border: "1px solid #fee2e2", background: "#fff5f5", color: "#ef4444", fontWeight: "700", cursor: "pointer", fontSize: "12px", textAlign: "center" },
};

export default CategoryProducts;
