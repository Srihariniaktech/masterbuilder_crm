import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import noImage from "../../assets/no_image.jpg";

const CATEGORY_API_URL = "https://masterbuilder-backend.onrender.com/api/prime-categories";
const MANPOWER_DETAILS_API = "https://masterbuilder-backend.onrender.com/api/manpower/details";
const UPLOAD_SINGLE = "https://masterbuilder-backend.onrender.com/api/upload/single";

function ManpowerDetails() {
    const { categoryId } = useParams();
    const navigate = useNavigate();
    const [category, setCategory] = useState(null);
    const [workers, setWorkers] = useState([]);

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

    const fetchCategoryInfo = async () => {
        try {
            const res = await axios.get(CATEGORY_API_URL);
            const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
            const current = data.find(c => String(c.id || c._id) === String(categoryId));
            setCategory(current);
        } catch (err) { console.error("Category fetch error", err); }
    };

    const fetchWorkers = async () => {
        try {
            const res = await axios.get(MANPOWER_DETAILS_API);
            let data = Array.isArray(res.data) ? res.data : (res.data.data || []);
            // Filter by the selected category ID
            const filtered = data.filter(w => String(w.primecategoriesid) === String(categoryId));
            setWorkers(filtered);
        } catch (err) { console.error("Workers fetch error", err); }
    };

    useEffect(() => {
        fetchCategoryInfo();
        fetchWorkers();
    }, [categoryId]);

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
            e.target.value = ""; // reset input
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
            // Force save into the open-ended services object to bypass backend schema resets
            const payload = {
                ...formData,
                primecategoriesid: categoryId,
                rating: Number(formData.rating || 0),
                reviewsCount: Number(formData.reviewsCount || 0)
            };

            payload.services = {
                ...payload.services,
                manualRating: payload.rating,
                manualReviewsCount: payload.reviewsCount
            };

            if (editId) {
                await axios.put(`${MANPOWER_DETAILS_API}/${editId}`, payload);
                alert("✅ Worker profile successfully updated!");
            } else {
                await axios.post(MANPOWER_DETAILS_API, payload);
                alert("✅ New worker profile created!");
            }
            setEditId(null);
            setFormData(initialForm);
            fetchWorkers();
        } catch (err) {
            console.error("Save Error:", err);
            alert("❌ Save failed. Ensure the API is active.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this worker profile? This action is permanent.")) return;
        try {
            await axios.delete(`${MANPOWER_DETAILS_API}/${id}`);
            alert("✅ Profile deleted.");
            fetchWorkers();
        } catch (err) {
            console.error("Delete Error:", err);
            alert("❌ Delete operation failed.");
        }
    };

    return (
        <div style={styles.container}>
            {/* Header with Back Button */}
            <div style={styles.headerRow}>
                <button onClick={() => navigate(-1)} style={styles.backBtn}>←</button>
                <h2 style={styles.pageTitle}>{category ? category.name : "Category"} Details</h2>
            </div>

            {/* CRM MANAGEMENT FORM (Top Section) */}
            <div style={styles.formSection}>
                <h3 style={styles.sectionHeading}>{editId ? "Update Professional Profile" : "Register New Professional"}</h3>
                <form onSubmit={handleSubmit} style={styles.mainForm}>
                    <div style={styles.inputGrid}>
                        <div style={styles.inputGroup}>
                            <label>Professional Title</label>
                            <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Professional Plumber" required />
                        </div>
                        <div style={styles.inputGroup}>
                            <label>Location</label>
                            <input type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="e.g. New York, NY" required />
                        </div>
                        <div style={styles.inputGroup}>
                            <label>Rating (0-5)</label>
                            <input type="number" step="0.1" value={formData.rating} onChange={e => setFormData({ ...formData, rating: e.target.value })} />
                        </div>
                    </div>

                    <div style={styles.inputGroup}>
                        <label>Business Description / Bio</label>
                        <textarea value={formData.aboutUs} onChange={e => setFormData({ ...formData, aboutUs: e.target.value })} placeholder="Tell clients about your experience..." style={{ height: "100px", padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
                    </div>

                    <div style={styles.uploadFlex}>
                        <div style={styles.uploadBox}>
                            <label>Banner Image</label>
                            <input type="file" onChange={e => handleUpload(e, "bannerurl")} />
                            {uploading === "bannerurl" && <span style={styles.loader}>Uploading...</span>}
                            {formData.bannerurl && <img src={formData.bannerurl} alt="Banner Preview" style={styles.previewImg} />}
                        </div>
                        <div style={styles.uploadBox}>
                            <label>Profile Image</label>
                            <input type="file" onChange={e => handleUpload(e, "profileUrl")} />
                            {uploading === "profileUrl" && <span style={styles.loader}>Uploading...</span>}
                            {formData.profileUrl && <img src={formData.profileUrl} alt="Profile Preview" style={styles.previewImg} />}
                        </div>
                        <div style={styles.uploadBox}>
                            <label>Project Gallery (You can select multiple)</label>
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
                            <label>Service 1 (e.g. Roofing)</label>
                            <input type="text" value={formData.services?.s1 || formData.services?.repair || ""} onChange={e => setFormData({ ...formData, services: { ...formData.services, s1: e.target.value } })} placeholder="e.g. Roofing" />
                        </div>
                        <div style={styles.inputGroup}>
                            <label>Service 2 (e.g. Renovation)</label>
                            <input type="text" value={formData.services?.s2 || formData.services?.install || ""} onChange={e => setFormData({ ...formData, services: { ...formData.services, s2: e.target.value } })} placeholder="e.g. Renovation" />
                        </div>
                        <div style={styles.inputGroup}>
                            <label>Service 3 (e.g. Design)</label>
                            <input type="text" value={formData.services?.s3 || ""} onChange={e => setFormData({ ...formData, services: { ...formData.services, s3: e.target.value } })} placeholder="e.g. Design" />
                        </div>
                        <div style={styles.inputGroup}>
                            <label>Service 4 (e.g. Plumbing)</label>
                            <input type="text" value={formData.services?.s4 || ""} onChange={e => setFormData({ ...formData, services: { ...formData.services, s4: e.target.value } })} placeholder="e.g. Plumbing" />
                        </div>
                        <div style={styles.inputGroup}>
                            <label>Total Reviews</label>
                            <input type="number" value={formData.reviewsCount} onChange={e => setFormData({ ...formData, reviewsCount: e.target.value })} placeholder="e.g. 120" />
                        </div>
                    </div>

                    <div style={styles.formActions}>
                        <button type="submit" style={styles.submitBtn}>{editId ? "Save Changes" : "Create Profile"}</button>
                        {editId && <button type="button" onClick={() => { setEditId(null); setFormData(initialForm); }} style={styles.cancelBtn}>Cancel Edit</button>}
                    </div>
                </form>
            </div>

            <hr style={styles.divider} />

            {/* PREVIEW CARDS (IMAGE MATCHED DESIGN) */}
            <div style={styles.previewContainer}>
                {workers.map((worker) => (
                    <div key={worker.id || worker._id} style={styles.crmCard}>
                        {/* Mobile Device Frame Header */}
                        <div style={styles.cardHeader}>
                            <span style={styles.headerTitle}>{worker.title || "Untitled Profile"}</span>
                        </div>

                        {/* Banner & Floating Profile */}
                        <div style={styles.bannerContainer}>
                            <img src={worker.bannerurl || "https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=1000&auto=format&fit=crop"} alt="Banner" style={styles.bannerImg} />
                            <div style={styles.profileCircle}>
                                <img src={worker.profileUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1000&auto=format&fit=crop"} alt="Profile" style={styles.pImg} />
                            </div>
                        </div>

                        {/* Profile Details */}
                        <div style={styles.cardInfo}>
                            <h2 style={styles.cardMainTitle}>{worker.title || "Untitled Profile"}</h2>
                            <p style={styles.cardSubtitle}>{worker.location || "Location not given"}</p>

                            <div style={styles.ratingRow}>
                                <span style={styles.star}>☆</span>
                                <span style={styles.ratingText}>{worker.services?.manualRating ?? worker.rating ?? "0.0"}</span>
                                <span style={styles.reviewsDot}>•</span>
                                <span style={styles.reviewsCount}>{worker.services?.manualReviewsCount ?? worker.reviewsCount ?? "0"} Reviews</span>
                            </div>

                            <div style={styles.aboutBox}>
                                <h4 style={styles.sectionLabel}>About Us</h4>
                                <p style={styles.aboutText}>
                                    {worker.aboutUs || "No background details provided yet."}
                                </p>
                            </div>

                            {/* Service Icons Grid */}
                            <div style={styles.servicesBox}>
                                <h4 style={styles.sectionLabel}>Services</h4>
                                <div style={styles.serviceIcons}>
                                    {/* Icon 1 */}
                                    {(worker.services?.s1 || worker.services?.repair) && (
                                        <div style={styles.iconItem}>
                                            <div style={styles.iconCircle}>
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffc400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                                            </div>
                                            <span style={styles.iconLabel}>{worker.services?.s1 || worker.services?.repair}</span>
                                        </div>
                                    )}
                                    {/* Icon 2 */}
                                    {(worker.services?.s2 || worker.services?.install) && (
                                        <div style={styles.iconItem}>
                                            <div style={styles.iconCircle}>
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffc400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v19"></path><path d="M5 8h14"></path><path d="M5 16h14"></path></svg>
                                            </div>
                                            <span style={styles.iconLabel}>{worker.services?.s2 || worker.services?.install}</span>
                                        </div>
                                    )}
                                    {/* Icon 3 */}
                                    {worker.services?.s3 && (
                                        <div style={styles.iconItem}>
                                            <div style={styles.iconCircle}>
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffc400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"></path><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"></path></svg>
                                            </div>
                                            <span style={styles.iconLabel}>{worker.services?.s3}</span>
                                        </div>
                                    )}
                                    {/* Icon 4 */}
                                    {worker.services?.s4 && (
                                        <div style={styles.iconItem}>
                                            <div style={styles.iconCircle}>
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffc400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                                            </div>
                                            <span style={styles.iconLabel}>{worker.services?.s4}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Projects Gallery */}
                            <div style={styles.projectsBox}>
                                <span style={styles.viewPortfolio}>View Portfolio</span>
                                <h4 style={styles.sectionLabel}>Recent Projects</h4>
                                <div style={styles.galleryGrid}>
                                    {worker.gallery && worker.gallery.length > 0 ? (
                                        <>
                                            <div style={styles.galleryImgLargeContainer}>
                                                <img src={worker.gallery[0]} alt="Project" style={styles.galleryImgLarge} />
                                                <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "50%", background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)", zIndex: 1 }}></div>
                                                <div style={styles.galleryOverlayText}>
                                                    <div style={styles.galleryPrimaryTitle}>Recent Project</div>
                                                    <div style={styles.gallerySecondaryTitle}>Tap to view more</div>
                                                </div>
                                            </div>
                                            <div style={styles.gallerySubGrid}>
                                                {(worker.gallery[1] || worker.gallery[2]) && (
                                                    <div style={styles.galleryImgSmallWrapper}>
                                                        <img src={worker.gallery[1] || worker.gallery[2]} alt="Project" style={styles.galleryImgSmall} />
                                                    </div>
                                                )}
                                                {worker.gallery[2] && (
                                                    <div style={styles.galleryImgSmallWrapper}>
                                                        <img src={worker.gallery[2]} alt="Project" style={styles.galleryImgSmall} />
                                                        {worker.gallery.length > 3 && (
                                                            <div style={styles.galleryMoreOverlay}>
                                                                more {worker.gallery.length - 3} +
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div style={styles.noGallery}>Add project images to show your work</div>
                                    )}
                                </div>
                            </div>

                            {/* CRM MANAGEMENT ACTIONS */}
                            <div style={styles.mgmtRow}>
                                <button onClick={() => { setEditId(worker.id || worker._id); setFormData(worker); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={styles.editMgmtBtn}>Modify Profile</button>
                                <button onClick={() => handleDelete(worker.id || worker._id)} style={styles.delMgmtBtn}>Remove User</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

const styles = {
    container: { padding: "40px", backgroundColor: "#fbfbfb", minHeight: "100vh", fontFamily: "'Inter', sans-serif" },
    headerRow: { display: "flex", alignItems: "center", gap: "25px", marginBottom: "35px" },
    backBtn: { backgroundColor: "#fff", border: "1px solid #eee", width: "45px", height: "45px", borderRadius: "50%", fontSize: "20px", fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" },
    pageTitle: { fontSize: "32px", fontWeight: "900", color: "#111", letterSpacing: "-1px" },

    formSection: { backgroundColor: "#fff", padding: "35px", borderRadius: "24px", boxShadow: "0 10px 40px rgba(0,0,0,0.04)", border: "1px solid #f0f0f0", marginBottom: "50px" },
    sectionHeading: { fontSize: "18px", fontWeight: "800", marginBottom: "30px", color: "#222" },
    mainForm: { display: "flex", flexDirection: "column", gap: "22px" },
    inputGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "25px" },
    inputGroup: { display: "flex", flexDirection: "column", gap: "8px" },
    uploadFlex: { display: "flex", flexWrap: "wrap", gap: "30px", backgroundColor: "#f9fafb", padding: "20px", borderRadius: "16px", border: "1px dashed #e0e0e0" },
    uploadBox: { display: "flex", flexDirection: "column", gap: "10px", minWidth: "200px" },
    previewImg: { width: "100px", height: "60px", objectFit: "cover", borderRadius: "8px", marginTop: "10px", border: "1px solid #ddd" },
    galleryPreviewWrap: { display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "10px" },
    galleryPreviewItem: { position: "relative" },
    previewImgSmall: { width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px", border: "1px solid #ddd" },
    removeBtn: { position: "absolute", top: "-5px", right: "-5px", backgroundColor: "#ef4444", color: "#fff", border: "none", borderRadius: "50%", width: "20px", height: "20px", fontSize: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
    formActions: { display: "flex", gap: "15px", marginTop: "15px" },
    submitBtn: { backgroundColor: "#ffc400", color: "#000", border: "none", padding: "16px 40px", borderRadius: "14px", fontWeight: "900", cursor: "pointer", fontSize: "15px" },
    cancelBtn: { backgroundColor: "#f1f3f5", border: "none", padding: "16px 30px", borderRadius: "14px", fontWeight: "800", cursor: "pointer" },
    loader: { fontSize: "12px", color: "#ffc400", fontWeight: "700" },
    divider: { border: "none", height: "1px", backgroundColor: "#eee", margin: "50px 0" },

    previewContainer: { display: "flex", flexWrap: "wrap", gap: "50px", justifyContent: "center", paddingBottom: "100px" },
    crmCard: {
        width: "360px",
        backgroundColor: "#f7f7f7",
        borderRadius: "0px",
        overflow: "hidden",
        boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
        position: "relative",
        borderLeft: "2px solid #29b6f6",
        borderRight: "2px solid #29b6f6",
        borderTop: "2px solid #29b6f6"
    },
    cardHeader: {
        display: "flex",
        justifyContent: "space-between",
        padding: "16px 20px",
        alignItems: "center",
        backgroundColor: "#fff",
        color: "#111"
    },
    headerBack: { fontSize: "20px", fontWeight: "900", cursor: "pointer" },
    headerTitle: { fontSize: "15px", fontWeight: "800", letterSpacing: "0px" },
    headerHeart: { fontSize: "20px" },

    bannerContainer: { width: "100%", height: "200px", position: "relative" },
    bannerImg: { width: "100%", height: "100%", objectFit: "cover" },
    profileCircle: {
        position: "absolute",
        bottom: "-40px",
        left: "20px",
        width: "74px",
        height: "74px",
        borderRadius: "50%",
        border: "4px solid #f7f7f7",
        overflow: "hidden",
        backgroundColor: "#111"
    },
    pImg: { width: "100%", height: "100%", objectFit: "cover" },

    cardInfo: { padding: "50px 20px 20px" },
    cardMainTitle: { fontSize: "20px", fontWeight: "800", marginBottom: "4px", color: "#111", letterSpacing: "-0.5px" },
    cardSubtitle: { fontSize: "12px", color: "#888", marginBottom: "14px", fontWeight: "500" },
    ratingRow: { display: "flex", alignItems: "center", gap: "6px", marginBottom: "20px" },
    star: { color: "#ffc400", fontSize: "14px" },
    ratingText: { fontWeight: "800", color: "#111", fontSize: "13px" },
    reviewsDot: { color: "#888", fontSize: "14px", marginLeft: "2px" },
    reviewsCount: { color: "#888", fontSize: "13px", textDecoration: "underline", marginLeft: "2px" },

    aboutBox: { marginBottom: "25px" },
    sectionLabel: { fontSize: "17px", fontWeight: "800", marginBottom: "12px", color: "#111" },
    aboutText: { fontSize: "13px", color: "#666", lineHeight: "1.6", fontWeight: "400" },
    readMore: { color: "#ffc400", fontWeight: "800", cursor: "pointer", marginLeft: "2px" },

    servicesBox: { marginBottom: "30px" },
    serviceIcons: { display: "flex", justifyContent: "space-between" },
    iconItem: { display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" },
    iconCircle: {
        width: "60px",
        height: "60px",
        borderRadius: "18px",
        backgroundColor: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 12px rgba(0,0,0,0.04)"
    },
    iconLabel: { fontSize: "11px", fontWeight: "600", color: "#444" },

    projectsBox: { position: "relative" },
    viewPortfolio: { position: "absolute", right: 0, top: "2px", color: "#ffc400", fontWeight: "800", fontSize: "12px", cursor: "pointer" },
    galleryGrid: { display: "grid", gridTemplateColumns: "1fr", gap: "12px", marginTop: "10px" },
    galleryImgLargeContainer: { position: "relative", width: "100%", height: "180px", borderRadius: "16px", overflow: "hidden" },
    galleryImgLarge: { width: "100%", height: "100%", objectFit: "cover" },
    galleryOverlayText: { position: "absolute", bottom: "16px", left: "16px", color: "#fff", zIndex: 2 },
    galleryPrimaryTitle: { fontSize: "14px", fontWeight: "800", marginBottom: "2px", textShadow: "0 2px 4px rgba(0,0,0,0.5)" },
    gallerySecondaryTitle: { fontSize: "11px", fontWeight: "400", color: "#eee", textShadow: "0 2px 4px rgba(0,0,0,0.5)" },

    gallerySubGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
    galleryImgSmallWrapper: { position: "relative", width: "100%", height: "90px", borderRadius: "12px", overflow: "hidden" },
    galleryImgSmall: { width: "100%", height: "100%", objectFit: "cover" },
    galleryMoreOverlay: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "14px", fontWeight: "700" },

    mgmtRow: { display: "flex", gap: "12px", marginTop: "35px", paddingTop: "25px", borderTop: "1px solid #e0e0e0" },
    editMgmtBtn: { flex: 1, backgroundColor: "#000", color: "#fff", border: "none", padding: "12px", borderRadius: "14px", fontWeight: "800", cursor: "pointer", fontSize: "13px" },
    delMgmtBtn: { flex: 1, backgroundColor: "#fff5f5", color: "#ef4444", border: "1px solid #fee2e2", padding: "12px", borderRadius: "14px", fontWeight: "800", cursor: "pointer", fontSize: "13px" }
};

export default ManpowerDetails;
