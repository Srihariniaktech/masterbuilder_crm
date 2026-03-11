import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

// SVG Icons
const IconMapPin = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>;
const IconStar = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>;
const IconEdit = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const IconTrash = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;
const IconVerified = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="#ffc400" stroke="#ffc400" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10" stroke="black" strokeWidth="3"></polyline></svg>;

const PRODUCT_API_URL = "https://masterbuilder-backend.onrender.com/api/product-page3";
const MANPOWER_API_URL = "https://masterbuilder-backend.onrender.com/api/manpower/details";
const UPLOAD_SINGLE = "https://masterbuilder-backend.onrender.com/api/upload/single";

export default function RenovationProductDetails() {
    const { productId } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [profiles, setProfiles] = useState([]);

    /* ---- CRM Form State ---- */
    const initialForm = {
        title: "",
        bannerurl: "",
        profileUrl: "",
        rating: "",
        reviewsCount: "",
        aboutUs: "",
        location: "",
        availableFrom: new Date().toISOString().split('T')[0],
        services: { s1: "", s2: "", s3: "", s4: "" },
        gallery: []
    };
    const [formData, setFormData] = useState(initialForm);
    const [editId, setEditId] = useState(null);
    const [uploading, setUploading] = useState(null);

    const fetchProduct = async () => {
        try {
            const res = await axios.get(PRODUCT_API_URL);
            const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
            const found = data.find(p => String(p.id || p._id) === String(productId));
            setProduct(found);
        } catch (err) { console.error("Product fetch error", err); }
    };

    const fetchProfiles = async () => {
        try {
            const res = await axios.get(MANPOWER_API_URL);
            let data = Array.isArray(res.data) ? res.data : (res.data.data || []);
            // Filter profiles by the renovation category ID (product's primecategoriesid)
            // First get product to know its category, or use productId-based matching
            const productRes = await axios.get(PRODUCT_API_URL);
            const productData = Array.isArray(productRes.data) ? productRes.data : (productRes.data.data || []);
            const currentProduct = productData.find(p => String(p.id || p._id) === String(productId));

            if (currentProduct) {
                // Filter manpower/details by the same primecategoriesid as the product
                const filtered = data.filter(w => String(w.primecategoriesid) === String(currentProduct.primecategoriesid));
                setProfiles(filtered);
            } else {
                setProfiles(data);
            }
        } catch (err) { console.error("Profiles fetch error", err); }
    };

    useEffect(() => {
        fetchProduct();
        fetchProfiles();
    }, [productId]);

    const handleUpload = async (e, field) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        setUploading(field);

        try {
            if (field === "gallery") {
                const newUrls = [];
                for (const file of files) {
                    const data = new FormData();
                    data.append("image", file);
                    const res = await axios.post(UPLOAD_SINGLE, data);
                    const url = res.data?.url || res.data?.imageUrl || "";
                    if (url) newUrls.push(url);
                }
                setFormData(prev => ({ ...prev, gallery: [...prev.gallery, ...newUrls] }));
            } else {
                const data = new FormData();
                data.append("image", files[0]);
                const res = await axios.post(UPLOAD_SINGLE, data);
                const url = res.data?.url || res.data?.imageUrl || "";
                if (url) setFormData(prev => ({ ...prev, [field]: url }));
            }
        } catch (err) { alert("Upload failed"); }
        finally {
            setUploading(null);
            e.target.value = "";
        }
    };

    const removeGalleryImage = (index) => {
        setFormData(prev => ({
            ...prev,
            gallery: prev.gallery.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                primecategoriesid: product?.primecategoriesid || productId,
                rating: Number(formData.rating || 0),
                reviewsCount: Number(formData.reviewsCount || 0)
            };

            payload.services = {
                ...payload.services,
                manualRating: payload.rating,
                manualReviewsCount: payload.reviewsCount
            };

            if (editId) {
                await axios.put(`${MANPOWER_API_URL}/${editId}`, payload);
                alert("✅ Profile updated!");
            } else {
                await axios.post(MANPOWER_API_URL, payload);
                alert("✅ New profile added!");
            }
            setEditId(null);
            setFormData(initialForm);
            fetchProfiles();
        } catch (err) {
            console.error("Save Error:", err);
            alert("❌ Save failed.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this profile permanently?")) return;
        try {
            await axios.delete(`${MANPOWER_API_URL}/${id}`);
            alert("✅ Profile deleted.");
            fetchProfiles();
        } catch (err) { alert("❌ Delete failed."); }
    };

    return (
        <div style={styles.container}>
            <button onClick={() => navigate(-1)} style={styles.backBtn}>&#8592;</button>

            <h2 style={styles.mainTitle}>
                {product ? product.name.toUpperCase() : "RENOVATION"} — PROFILES
            </h2>

            {/* ---- ADD / EDIT FORM ---- */}
            <div style={styles.formBox}>
                <h3 style={{ marginBottom: "20px", color: "#1e293b" }}>
                    {editId ? "EDIT PROFILE" : "ADD NEW PROFILE"}
                </h3>
                <form onSubmit={handleSubmit} style={styles.form}>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                        <input type="text" placeholder="Title / Name" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required style={styles.inputStyle} />
                        <input type="text" placeholder="Location" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} required style={styles.inputStyle} />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                        <input type="number" step="0.1" placeholder="Rating (0.0 to 5.0)" value={formData.rating} onChange={e => setFormData({ ...formData, rating: e.target.value })} style={styles.inputStyle} />
                        <input type="number" placeholder="Reviews Count" value={formData.reviewsCount} onChange={e => setFormData({ ...formData, reviewsCount: e.target.value })} style={styles.inputStyle} />
                    </div>

                    <textarea placeholder="About Us" value={formData.aboutUs} onChange={e => setFormData({ ...formData, aboutUs: e.target.value })} style={{ ...styles.inputStyle, minHeight: "100px", resize: "vertical" }} />

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                        <input type="text" placeholder="Specialty 1" value={formData.services?.s1 || ""} onChange={e => setFormData({ ...formData, services: { ...formData.services, s1: e.target.value } })} style={styles.inputStyle} />
                        <input type="text" placeholder="Specialty 2" value={formData.services?.s2 || ""} onChange={e => setFormData({ ...formData, services: { ...formData.services, s2: e.target.value } })} style={styles.inputStyle} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                        <input type="text" placeholder="Specialty 3" value={formData.services?.s3 || ""} onChange={e => setFormData({ ...formData, services: { ...formData.services, s3: e.target.value } })} style={styles.inputStyle} />
                        <input type="text" placeholder="Specialty 4" value={formData.services?.s4 || ""} onChange={e => setFormData({ ...formData, services: { ...formData.services, s4: e.target.value } })} style={styles.inputStyle} />
                    </div>

                    {/* Media Uploads */}
                    <div style={styles.mediaPanel}>
                        <h4 style={{ margin: "0 0 15px 0", color: "#1e293b" }}>Media Assets</h4>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
                            {/* Banner */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Banner Image {uploading === "bannerurl" && "(Uploading...)"}</label>
                                <div style={{ display: "flex" }}>
                                    <input type="file" id="renoBannerFile" accept="image/*" style={{ display: "none" }} onChange={(e) => handleUpload(e, "bannerurl")} />
                                    <label htmlFor="renoBannerFile" style={styles.uploadBtnSvc}>📁 UPLOAD BANNER</label>
                                </div>
                                {formData.bannerurl && <img src={formData.bannerurl} alt="Banner" style={{ width: "100%", height: "80px", objectFit: "cover", borderRadius: "8px", border: "1px solid #cbd5e0" }} />}
                            </div>

                            {/* Logo */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Profile Logo {uploading === "profileUrl" && "(Uploading...)"}</label>
                                <div style={{ display: "flex" }}>
                                    <input type="file" id="renoLogoFile" accept="image/*" style={{ display: "none" }} onChange={(e) => handleUpload(e, "profileUrl")} />
                                    <label htmlFor="renoLogoFile" style={styles.uploadBtnSvc}>📁 UPLOAD LOGO</label>
                                </div>
                                {formData.profileUrl && <img src={formData.profileUrl} alt="Logo" style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "50%", border: "1px solid #cbd5e0" }} />}
                            </div>

                            {/* Gallery */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Gallery {uploading === "gallery" && "(Uploading...)"}</label>
                                <div style={{ display: "flex" }}>
                                    <input type="file" id="renoGalleryFile" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => handleUpload(e, "gallery")} />
                                    <label htmlFor="renoGalleryFile" style={styles.uploadBtnSvc}>📁 ADD PHOTOS</label>
                                </div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                    {formData.gallery.map((img, i) => (
                                        <div key={i} style={{ position: "relative" }}>
                                            <img src={img} alt="Thumb" style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "4px" }} />
                                            <button type="button" onClick={() => removeGalleryImage(i)} style={{ position: "absolute", top: -5, right: -5, background: "red", color: "white", border: "none", borderRadius: "50%", cursor: "pointer", fontSize: "10px", width: "16px", height: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>&times;</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                        {editId && <button type="button" onClick={() => { setEditId(null); setFormData(initialForm); }} style={styles.cancelBtn}>CANCEL</button>}
                        <button type="submit" style={styles.submitBtn}>{editId ? "🚀 UPDATE PROFILE" : "✨ ADD PROFILE"}</button>
                    </div>
                </form>
            </div>

            {/* ---- PROFILES CARDS ---- */}
            <div style={styles.cardList}>
                {profiles.map(unit => {
                    const specialties = [unit.services?.s1, unit.services?.s2, unit.services?.s3, unit.services?.s4].filter(Boolean);
                    const subtitles = specialties.length > 0 ? `${specialties.join(" • ")} • ${unit.location || ""}` : unit.location;

                    return (
                        <div key={unit.id || unit._id} style={styles.builderCard}>
                            <div style={styles.cardVisuals}>
                                <img src={unit.bannerurl || "https://images.unsplash.com/photo-1541888086425-d81bb19240f5?q=80&w=1000&auto=format"} alt="Banner" style={styles.cardBanner} />
                                <div style={styles.cardLogoWrapper}>
                                    <div style={styles.cardLogoInner}>
                                        <img src={unit.profileUrl || "https://images.unsplash.com/photo-1502581827181-9cf3c3ee0106?q=80&w=100"} alt="Logo" style={styles.cardLogo} />
                                    </div>
                                </div>
                            </div>

                            <div style={styles.cardContent}>
                                <div style={styles.verifiedRow}>
                                    <IconVerified /> <span style={styles.verifiedText}>Verified Pro</span>
                                </div>
                                <h3 style={styles.builderName}>{unit.title || "Unnamed Profile"}</h3>
                                <p style={styles.subtitleText}>{subtitles || "No details provided"}</p>

                                <div style={styles.ratingRow}>
                                    <IconStar /> <span style={styles.ratingScore}>{unit.services?.manualRating ?? unit.rating ?? "0.0"}</span>
                                    <span style={styles.dot}>•</span>
                                    <span style={styles.reviewsText}><u>{unit.services?.manualReviewsCount ?? unit.reviewsCount ?? "0"} Reviews</u></span>
                                </div>

                                <div style={styles.aboutSection}>
                                    <h4 style={styles.aboutTitle}>About Us</h4>
                                    <p style={styles.aboutUsText}>
                                        {unit.aboutUs && unit.aboutUs.length > 120 ? unit.aboutUs.substring(0, 120) + "..." : (unit.aboutUs || "No background provided.")}
                                        {unit.aboutUs && unit.aboutUs.length > 120 && <span style={styles.readMore}> Read more</span>}
                                    </p>
                                </div>

                                {/* Gallery */}
                                {unit.gallery && unit.gallery.length > 0 && (
                                    <div style={styles.galleryLayout}>
                                        <img src={unit.gallery[0]} style={styles.galleryTopImg} />
                                        {unit.gallery.length > 1 && (
                                            <div style={styles.galleryBottomRow}>
                                                {unit.gallery.slice(1, 3).map((img, i) => (
                                                    <div key={i} style={styles.galleryBottomBox}>
                                                        <img src={img} style={styles.galleryBottomImg} />
                                                        {i === 1 && unit.gallery.length > 3 && (
                                                            <div style={styles.galleryOverlay}>
                                                                +{unit.gallery.length - 3} more
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div style={styles.cardActions}>
                                <button
                                    onClick={() => {
                                        setEditId(unit.id || unit._id);
                                        setFormData({
                                            ...unit,
                                            rating: unit.services?.manualRating ?? unit.rating ?? "",
                                            reviewsCount: unit.services?.manualReviewsCount ?? unit.reviewsCount ?? "",
                                            services: unit.services || { s1: "", s2: "", s3: "", s4: "" }
                                        });
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    style={styles.actionBtnEdit}
                                >
                                    <IconEdit /> Edit details
                                </button>
                                <button onClick={() => handleDelete(unit.id || unit._id)} style={styles.actionBtnDel}>
                                    <IconTrash /> Remove
                                </button>
                            </div>
                        </div>
                    );
                })}

                {profiles.length === 0 && (
                    <div style={{ width: '100%', textAlign: 'center', color: '#666', padding: '40px 0' }}>
                        No profiles found. Add one above!
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = {
    container: { padding: "40px", maxWidth: "1350px", margin: "0 auto", backgroundColor: "#fff", fontFamily: "'Inter', sans-serif" },
    mainTitle: { borderLeft: "6px solid #ffc400", paddingLeft: "15px", marginBottom: "30px", fontWeight: "900", color: "#000", fontSize: "28px" },
    formBox: { background: "#fff", padding: "30px", borderRadius: "20px", border: "1px solid #f1f5f9", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", marginBottom: "40px" },
    form: { display: "flex", flexDirection: "column", gap: "24px" },
    inputStyle: { padding: "14px 18px", border: "1px solid #cbd5e0", borderRadius: "12px", width: "100%", boxSizing: "border-box", outline: "none" },
    uploadBtnSvc: { background: "#000", color: "#fff", padding: "14px 25px", borderRadius: "12px", fontSize: "12px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap", flex: 1, textAlign: "center", display: "inline-block" },
    submitBtn: { background: "#ffc400", color: "#000", padding: "15px 30px", border: "none", borderRadius: "12px", fontWeight: "900", cursor: "pointer", fontSize: "15px" },
    cancelBtn: { background: "#f1f5f9", color: "#475569", padding: "15px 25px", border: "none", borderRadius: "12px", fontWeight: "800", cursor: "pointer", fontSize: "14px" },
    backBtn: { backgroundColor: "#fff", color: "#000", border: "1px solid #eee", width: "40px", height: "40px", borderRadius: "50%", cursor: "pointer", fontWeight: "900", fontSize: "20px", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" },
    mediaPanel: { backgroundColor: "#f8fafc", padding: "20px", borderRadius: "12px", border: "1px dashed #cbd5e0" },

    /* Profile Cards */
    cardList: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
        gap: "35px"
    },
    builderCard: {
        backgroundColor: "#fff",
        border: "1px solid #eee",
        borderRadius: "20px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
        transition: "transform 0.2s"
    },
    cardVisuals: {
        position: "relative",
        height: "180px"
    },
    cardBanner: {
        width: "100%",
        height: "100%",
        objectFit: "cover"
    },
    cardLogoWrapper: {
        position: "absolute",
        bottom: "-35px",
        left: "25px",
        width: "80px",
        height: "80px",
        backgroundColor: "#fff",
        padding: "4px",
        borderRadius: "50%",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
    },
    cardLogoInner: {
        width: "100%", height: "100%", borderRadius: "50%",
        border: "2px solid #ffc400", padding: "2px", boxSizing: "border-box", overflow: "hidden"
    },
    cardLogo: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        borderRadius: "50%"
    },
    cardContent: {
        padding: "50px 25px 25px 25px",
        flex: 1
    },
    verifiedRow: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        marginBottom: "6px"
    },
    verifiedText: {
        color: "#d97706",
        fontWeight: "900",
        fontSize: "12px",
        textTransform: "uppercase",
        letterSpacing: "0.5px"
    },
    builderName: {
        color: "#111",
        fontSize: "24px",
        fontWeight: "900",
        margin: "0 0 6px 0",
        letterSpacing: "-0.5px"
    },
    subtitleText: {
        color: "#666",
        fontSize: "13px",
        fontWeight: "600",
        margin: "0 0 16px 0",
        lineHeight: "1.4"
    },
    ratingRow: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        marginBottom: "20px",
        fontSize: "14px"
    },
    ratingScore: {
        fontWeight: "800",
        color: "#111"
    },
    dot: {
        color: "#999",
        margin: "0 4px"
    },
    reviewsText: {
        color: "#666",
        fontWeight: "600"
    },
    aboutSection: {
        marginBottom: "20px"
    },
    aboutTitle: {
        fontSize: "13px",
        fontWeight: "800",
        color: "#111",
        textTransform: "uppercase",
        margin: "0 0 8px 0"
    },
    aboutUsText: {
        color: "#444",
        fontSize: "14px",
        lineHeight: "1.6",
        margin: 0
    },
    readMore: {
        color: "#d97706",
        fontWeight: "800",
        cursor: "pointer"
    },

    /* Gallery */
    galleryLayout: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        marginTop: "10px"
    },
    galleryTopImg: {
        width: "100%",
        height: "140px",
        objectFit: "cover",
        borderRadius: "12px",
        border: "1px solid #eee"
    },
    galleryBottomRow: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "8px"
    },
    galleryBottomBox: {
        position: "relative",
        height: "90px"
    },
    galleryBottomImg: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        borderRadius: "12px",
        border: "1px solid #eee"
    },
    galleryOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.6)",
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: "15px",
        fontWeight: "800",
        cursor: "pointer"
    },
    cardActions: {
        display: "flex",
        borderTop: "1px solid #f0f0f0",
        backgroundColor: "#fafafa"
    },
    actionBtnEdit: {
        flex: 1,
        padding: "18px",
        backgroundColor: "transparent",
        border: "none",
        color: "#111",
        fontWeight: "800",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        borderRight: "1px solid #f0f0f0"
    },
    actionBtnDel: {
        flex: 1,
        padding: "18px",
        backgroundColor: "transparent",
        border: "none",
        color: "#ef4444",
        fontWeight: "800",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px"
    }
};
