import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const PRODUCT_API_URL = "https://masterbuilder-backend.onrender.com/api/product-page4";
const UPLOAD_SINGLE = "https://masterbuilder-backend.onrender.com/api/upload/single";

function MaterialProductDetails() {
    const { productId } = useParams();
    const navigate = useNavigate();
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);

    const initialForm = {
        title: "",
        location: "",
        rating: "",
        reviewsCount: "",
        aboutUs: "",
        services: { s1: "", s2: "", s3: "", s4: "" },
        bannerurl: "",
        profileUrl: "",
        gallery: []
    };
    const [formData, setFormData] = useState(initialForm);
    const [editId, setEditId] = useState(null);
    const [uploading, setUploading] = useState(null);

    const fetchProfiles = async () => {
        try {
            const res = await axios.get(PRODUCT_API_URL);
            let data = Array.isArray(res.data) ? res.data : (res.data.data || []);
            // Filter the profiles that belong to this specific material/product page
            const foundProfiles = data.filter(p => String(p.productpage3id) === String(productId));
            setProfiles(foundProfiles);
        } catch (err) {
            console.error("Error fetching product details", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
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
                    const res = await axios.post(UPLOAD_SINGLE, data, {
                        headers: { "Content-Type": "multipart/form-data" }
                    });
                    const url = res.data?.url || res.data?.data?.url || "";
                    if (url) newUrls.push(url);
                }
                setFormData(prev => ({ ...prev, gallery: [...prev.gallery, ...newUrls] }));
            } else {
                const data = new FormData();
                data.append("image", files[0]);
                const res = await axios.post(UPLOAD_SINGLE, data, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                const url = res.data?.url || res.data?.data?.url || "";
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
                productpage3id: productId,
                rating: Number(formData.rating || 0),
                reviewsCount: Number(formData.reviewsCount || 0)
            };

            payload.services = {
                ...payload.services,
                manualRating: payload.rating,
                manualReviewsCount: payload.reviewsCount
            };

            if (editId) {
                await axios.put(`${PRODUCT_API_URL}/${editId}`, payload);
                alert("✅ Details Updated!");
            } else {
                await axios.post(PRODUCT_API_URL, payload);
                alert("✅ Details Added!");
            }
            setEditId(null);
            setFormData(initialForm);
            fetchProfiles();
        } catch (err) {
            console.error(err);
            alert("❌ Save failed. Verify backend structure.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this?")) return;
        try {
            await axios.delete(`${PRODUCT_API_URL}/${id}`);
            alert("✅ Deleted.");
            fetchProfiles();
        } catch (err) {
            alert("❌ Delete failed.");
        }
    };

    if (loading) return <div style={styles.loadingContainer}>Loading details...</div>;

    return (
        <div style={styles.pageContainer}>
            {/* Main Wrapper that centers the mobile view and shows form above it */}
            <div style={styles.contentWrapper}>

                {/* BACK BUTTON AND HEADER FOR THE PAGE */}
                <div style={styles.pageHeader}>
                    <button onClick={() => navigate(-1)} style={styles.backButton}>&#8592;</button>
                    <h2>Material Details Management</h2>
                </div>

                {/* FORM SECTION */}
                <div style={styles.formSection}>
                    <h3 style={styles.sectionHeading}>{editId ? "Update Details" : "Add New Detail Section"}</h3>
                    <form onSubmit={handleSubmit} style={styles.mainForm}>
                        <div style={styles.inputGrid}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Title</label>
                                <input type="text" style={styles.input} value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Prime Material Supply" required />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Location</label>
                                <input type="text" style={styles.input} value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="e.g. New York, NY" required />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Rating (0-5)</label>
                                <input type="number" step="0.1" style={styles.input} value={formData.rating} onChange={e => setFormData({ ...formData, rating: e.target.value })} />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Reviews Count</label>
                                <input type="number" style={styles.input} value={formData.reviewsCount} onChange={e => setFormData({ ...formData, reviewsCount: e.target.value })} />
                            </div>
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>About Us</label>
                            <textarea style={styles.textarea} value={formData.aboutUs} onChange={e => setFormData({ ...formData, aboutUs: e.target.value })} placeholder="Tell us about the supplies..." />
                        </div>

                        <div style={styles.uploadFlex}>
                            <div style={styles.uploadBox}>
                                <label style={styles.label}>Banner Image</label>
                                <input type="file" onChange={e => handleUpload(e, "bannerurl")} />
                                {uploading === "bannerurl" && <span style={styles.loader}>Uploading...</span>}
                                {formData.bannerurl && <img src={formData.bannerurl} alt="Banner Preview" style={styles.previewImg} />}
                            </div>
                            <div style={styles.uploadBox}>
                                <label style={styles.label}>Profile Icon</label>
                                <input type="file" onChange={e => handleUpload(e, "profileUrl")} />
                                {uploading === "profileUrl" && <span style={styles.loader}>Uploading...</span>}
                                {formData.profileUrl && <img src={formData.profileUrl} alt="Profile Preview" style={styles.previewImg} />}
                            </div>
                            <div style={styles.uploadBox}>
                                <label style={styles.label}>Gallery (Multiple)</label>
                                <input type="file" multiple onChange={e => handleUpload(e, "gallery")} />
                                {uploading === "gallery" && <span style={styles.loader}>Uploading...</span>}
                                <div style={styles.galleryPreviewWrap}>
                                    {formData.gallery.map((img, idx) => (
                                        <div key={idx} style={styles.galleryPreviewItem}>
                                            <img src={img} alt={`Gallery ${idx}`} style={styles.previewImgSmall} />
                                            <button type="button" onClick={() => removeGalleryImage(idx)} style={styles.removeBtn}>✕</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div style={styles.inputGrid}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Service 1</label>
                                <input type="text" style={styles.input} value={formData.services?.s1 || ""} onChange={e => setFormData({ ...formData, services: { ...formData.services, s1: e.target.value } })} placeholder="e.g. Masonry" />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Service 2</label>
                                <input type="text" style={styles.input} value={formData.services?.s2 || ""} onChange={e => setFormData({ ...formData, services: { ...formData.services, s2: e.target.value } })} placeholder="e.g. Painting" />
                            </div>
                        </div>

                        <div style={styles.formActions}>
                            <button type="submit" style={styles.submitBtn}>{editId ? "Update Info" : "Save Detail"}</button>
                            {editId && <button type="button" onClick={() => { setEditId(null); setFormData(initialForm); }} style={styles.cancelBtn}>Cancel</button>}
                        </div>
                    </form>
                </div>


                {/* Display existing profiles matching the design requested */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', justifyContent: 'center' }}>
                    {profiles.map((profile, index) => {
                        const verifiedPro = true;

                        // Fallbacks
                        const banner = profile.bannerurl || "https://images.unsplash.com/photo-1541888081622-1ae0281b1686?q=80&w=1000&auto=format&fit=crop";
                        const icon = profile.profileUrl || profile.productPage3?.iconurl;
                        const title = profile.title || "Prime Material Supply";
                        const location = profile.location || "New York, NY";
                        const subtitle = profile.services ? Object.values(profile.services).filter(v => v !== profile.services?.manualRating && v !== profile.services?.manualReviewsCount).filter(Boolean).join(" & ") + " • " + location : `Wholesale & Retail Construction Materials • ${location}`;
                        const rating = profile.services?.manualRating ?? profile.rating ?? "0.0";
                        const reviewsCount = profile.services?.manualReviewsCount ?? profile.reviewsCount ?? "0";
                        const aboutUs = profile.aboutUs || "Your trusted partner for high-quality construction materials. From foundational masonry to premium finishing products, we provide a comprehensive range of supplies for projects of any scale.";

                        const gal = profile.gallery || [];
                        const galleryImage1 = gal[0] || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1470&auto=format&fit=crop";
                        const galleryImage2 = gal[1] || "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1469&auto=format&fit=crop";
                        const galleryImage3 = gal[2] || "https://images.unsplash.com/photo-1618221118493-9cfa1a1c00da?q=80&w=1532&auto=format&fit=crop";

                        return (
                            <div key={profile.id || profile._id || index} style={styles.iphoneContainer}>
                                {/* Top Bar Navigation */}
                                <div style={styles.topNav}>
                                    <div style={{ width: "24px" }}></div>
                                    <div style={styles.navTitle}>Prime Material</div>
                                    <div style={{ width: "24px" }}></div>
                                </div>

                                {/* Scrolling Content Area */}
                                <div style={styles.scrollContent}>
                                    <div style={styles.bannerContainer}>
                                        <img src={banner} alt="Banner" style={styles.bannerImg} />
                                        <div style={styles.iconCircleWrapper}>
                                            <div style={styles.iconCircleInner}>
                                                {icon ? (
                                                    <img src={icon} alt="Icon" style={styles.iconImg} />
                                                ) : (
                                                    <span style={styles.boxIconPlaceholder}>📦</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={styles.infoSection}>
                                        {/* Badge */}
                                        {verifiedPro && (
                                            <div style={styles.verifiedBadge}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffc400" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                                <span style={styles.verifiedText}>Verified Pro</span>
                                            </div>
                                        )}

                                        {/* Title and Subtitle */}
                                        <h1 style={styles.productName}>{title}</h1>
                                        <p style={styles.subtitle}>{subtitle}</p>

                                        {/* Rating inside text */}
                                        <div style={styles.ratingRow}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="#ffc400" stroke="#ffc400" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                            <span style={styles.ratingText}>{rating}</span>
                                            <span style={styles.bulletPoint}>•</span>
                                            <span style={styles.reviewsLink}>{reviewsCount} Reviews</span>
                                        </div>

                                        {/* About Us */}
                                        <div style={{ marginTop: "24px", marginBottom: "24px" }}>
                                            <h2 style={styles.sectionHeader}>About Us</h2>
                                            <p style={styles.aboutUsText}>
                                                {aboutUs} <span style={styles.readMore}>Read more</span>
                                            </p>
                                        </div>

                                        {/* Gallery Grid */}
                                        <div style={styles.galleryContainer}>
                                            <div style={styles.galleryTopImageWrapper}>
                                                <img src={galleryImage1} alt="Recent Works" style={styles.galleryImgStyle} />
                                            </div>
                                            <div style={styles.galleryBottomRow}>
                                                <div style={styles.galleryBottomLeftWrapper}>
                                                    <img src={galleryImage2} alt="Material 2" style={styles.galleryImgStyle} />
                                                </div>
                                                <div style={styles.galleryBottomRightWrapper}>
                                                    <img src={galleryImage3} alt="Material 3" style={styles.galleryImgStyle} />
                                                    {gal.length > 3 && (
                                                        <div style={styles.moreOverlay}>
                                                            <span style={{ fontSize: "14px", fontWeight: "600" }}>{gal.length - 3} more →</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Management Actions */}
                                        <div style={styles.mgmtRow}>
                                            <button onClick={() => { setEditId(profile.id || profile._id); setFormData(profile); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={styles.editMgmtBtn}>Edit Details</button>
                                            <button onClick={() => handleDelete(profile.id || profile._id)} style={styles.delMgmtBtn}>Delete Details</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {profiles.length === 0 && <div style={{ textAlign: "center", marginTop: "40px", color: "#666", padding: "20px", background: "#fff", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>No detailed profiles added for this product yet. Use the form above to add some!</div>}

            </div>
        </div>
    );
}

const styles = {
    // Basic Page Wrapper to center everything and look neat
    pageContainer: { backgroundColor: "#f0f2f5", minHeight: "100vh", fontFamily: "'Inter', sans-serif" },
    contentWrapper: { maxWidth: "1200px", margin: "0 auto", padding: "40px" },
    pageHeader: { display: "flex", alignItems: "center", gap: "20px", marginBottom: "30px" },
    backButton: { backgroundColor: "#fff", color: "#000", border: "1px solid #eee", width: "40px", height: "40px", borderRadius: "50%", cursor: "pointer", fontWeight: "900", fontSize: "20px", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" },
    loadingContainer: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontSize: "18px", fontFamily: "sans-serif" },

    // Form Styles
    formSection: { backgroundColor: "#fff", padding: "35px", borderRadius: "16px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", marginBottom: "50px" },
    sectionHeading: { fontSize: "20px", fontWeight: "bold", marginBottom: "25px", color: "#111" },
    mainForm: { display: "flex", flexDirection: "column", gap: "20px" },
    inputGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" },
    inputGroup: { display: "flex", flexDirection: "column", gap: "8px" },
    label: { fontSize: "13px", fontWeight: "600", color: "#555" },
    input: { padding: "12px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px", outline: "none" },
    textarea: { padding: "12px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px", outline: "none", minHeight: "100px" },
    uploadFlex: { display: "flex", flexWrap: "wrap", gap: "20px", background: "#f9f9f9", padding: "20px", borderRadius: "12px" },
    uploadBox: { display: "flex", flexDirection: "column", gap: "10px" },
    loader: { fontSize: "12px", color: "#ffc400", fontWeight: "bold" },
    previewImg: { width: "100px", height: "60px", objectFit: "cover", borderRadius: "8px", border: "1px solid #ddd", marginTop: "10px" },
    galleryPreviewWrap: { display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "10px" },
    galleryPreviewItem: { position: "relative" },
    previewImgSmall: { width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px", border: "1px solid #ddd" },
    removeBtn: { position: "absolute", top: "-5px", right: "-5px", background: "#f44336", color: "#fff", border: "none", borderRadius: "50%", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", cursor: "pointer" },
    formActions: { display: "flex", gap: "15px", marginTop: "20px" },
    submitBtn: { background: "#ffc400", color: "#000", border: "none", padding: "14px 30px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "15px" },
    cancelBtn: { background: "#eee", color: "#333", border: "none", padding: "14px 30px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "15px" },

    // Screen Design Wrapper (Matching screenshot)
    iphoneContainer: {
        width: "100%",
        maxWidth: "480px",
        background: "#f7f8f9",
        position: "relative",
        boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
        display: "flex",
        flexDirection: "column",
        borderRadius: "40px", // like a mobile phone
        overflow: "hidden",
        border: "8px solid #fff"
    },
    topNav: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", backgroundColor: "#f7f8f9", zIndex: 10 },
    navTitle: { fontSize: "17px", fontWeight: "700", color: "#111" },
    scrollContent: { flex: 1, paddingBottom: "40px" },
    bannerContainer: { width: "100%", height: "220px", position: "relative" },
    bannerImg: { width: "100%", height: "100%", objectFit: "cover" },
    iconCircleWrapper: { position: "absolute", bottom: "-45px", left: "20px", width: "90px", height: "90px", borderRadius: "50%", backgroundColor: "#f7f8f9", display: "flex", alignItems: "center", justifyContent: "center" },
    iconCircleInner: { width: "78px", height: "78px", borderRadius: "50%", backgroundColor: "#111827", border: "2px solid #ffc400", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" },
    iconImg: { width: "60%", height: "60%", objectFit: "contain" },
    boxIconPlaceholder: { fontSize: "30px" },
    infoSection: { padding: "60px 20px 20px 20px" },
    verifiedBadge: { display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" },
    verifiedText: { fontSize: "12px", color: "#6b7280", fontWeight: "600" },
    productName: { fontSize: "22px", fontWeight: "800", color: "#1f2937", margin: "0 0 6px 0", letterSpacing: "-0.5px" },
    subtitle: { fontSize: "13px", color: "#6b7280", margin: "0 0 12px 0", lineHeight: "1.4" },
    ratingRow: { display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" },
    ratingText: { fontWeight: "800", color: "#111" },
    bulletPoint: { color: "#9ca3af" },
    reviewsLink: { color: "#6b7280", cursor: "pointer" },
    sectionHeader: { fontSize: "16px", fontWeight: "800", color: "#111", margin: "0 0 10px 0" },
    aboutUsText: { fontSize: "13px", color: "#6b7280", lineHeight: "1.6", margin: 0 },
    readMore: { color: "#ffb400", fontWeight: "700", cursor: "pointer" },
    galleryContainer: { display: "flex", flexDirection: "column", gap: "12px" },
    galleryTopImageWrapper: { width: "100%", height: "220px", borderRadius: "16px", overflow: "hidden" },
    galleryImgStyle: { width: "100%", height: "100%", objectFit: "cover" },
    galleryBottomRow: { display: "flex", gap: "12px", height: "140px" },
    galleryBottomLeftWrapper: { flex: 1, borderRadius: "16px", overflow: "hidden" },
    galleryBottomRightWrapper: { flex: 1, borderRadius: "16px", overflow: "hidden", position: "relative" },
    moreOverlay: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" },

    // Management Action Buttons at the bottom of the card
    mgmtRow: { display: "flex", gap: "10px", marginTop: "30px", borderTop: "1px solid #eee", paddingTop: "20px" },
    editMgmtBtn: { flex: 1, background: "#000", color: "#fff", border: "none", padding: "12px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", transition: "0.2s" },
    delMgmtBtn: { flex: 1, background: "#fff0f0", color: "#ef4444", border: "1px solid #ffcccc", padding: "12px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", transition: "0.2s" }
};

export default MaterialProductDetails;
