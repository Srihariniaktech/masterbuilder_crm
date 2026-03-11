import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
// raw SVGs replacing react-icons
const IconMapPin = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>;
const IconStar = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>;
const IconEdit = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const IconTrash = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;
const IconPlus = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const IconImage = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>;

const CATEGORY_API_URL = "https://masterbuilder-backend.onrender.com/api/prime-categories";
const BUILDERS_API_URL = "https://masterbuilder-backend.onrender.com/api/manpower/details";
const UPLOAD_SINGLE = "https://masterbuilder-backend.onrender.com/api/upload/single";

export default function BuilderDetails() {
    const { categoryId } = useParams();
    const navigate = useNavigate();
    const [category, setCategory] = useState(null);
    const [builders, setBuilders] = useState([]);

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

    const fetchBuilders = async () => {
        try {
            const res = await axios.get(BUILDERS_API_URL);
            let data = Array.isArray(res.data) ? res.data : (res.data.data || []);
            const filtered = data.filter(w => String(w.primecategoriesid) === String(categoryId));
            setBuilders(filtered);
        } catch (err) { console.error("Builders fetch error", err); }
    };

    useEffect(() => {
        fetchCategoryInfo();
        fetchBuilders();
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
                await axios.put(`${BUILDERS_API_URL}/${editId}`, payload);
                alert("✅ Builder profile updated!");
            } else {
                await axios.post(BUILDERS_API_URL, payload);
                alert("✅ New builder added!");
            }
            setEditId(null);
            setFormData(initialForm);
            fetchBuilders();
        } catch (err) {
            console.error("Save Error:", err);
            alert("❌ Save failed. Ensure the API is active.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this builder profile permanently?")) return;
        try {
            await axios.delete(`${BUILDERS_API_URL}/${id}`);
            alert("✅ Builder deleted.");
            fetchBuilders();
        } catch (err) { alert("❌ Delete failed."); }
    };

    return (
        <div style={styles.pageContainer}>
            {/* Header */}
            <header style={styles.headerArea}>
                <button onClick={() => navigate(-1)} style={styles.backButton}>&#8592;</button>
                <h1 style={styles.pageTitle}>
                    {category?.name ? category.name + " Builders" : "Builder Profiles"}
                </h1>
            </header>

            {/* Form Section */}
            <div style={styles.formPanel}>
                <h2 style={styles.panelHeading}>{editId ? "Update Builder Profile" : "Add New Builder"}</h2>
                <form onSubmit={handleSubmit} style={styles.formContainer}>

                    <div style={styles.inputRow}>
                        <div style={styles.inputField}>
                            <label style={styles.label}>Company/Builder Name</label>
                            <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="E.g. Apex Constructions" required style={styles.inputBox} />
                        </div>
                        <div style={styles.inputField}>
                            <label style={styles.label}>Location</label>
                            <input type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="E.g. Los Angeles, CA" required style={styles.inputBox} />
                        </div>
                    </div>

                    <div style={styles.inputRow}>
                        <div style={styles.inputField}>
                            <label style={styles.label}>Rating (0.0 to 5.0)</label>
                            <input type="number" step="0.1" value={formData.rating} onChange={e => setFormData({ ...formData, rating: e.target.value })} style={styles.inputBox} />
                        </div>
                        <div style={styles.inputField}>
                            <label style={styles.label}>Total Reviews</label>
                            <input type="number" value={formData.reviewsCount} onChange={e => setFormData({ ...formData, reviewsCount: e.target.value })} style={styles.inputBox} />
                        </div>
                    </div>

                    <div style={styles.inputFieldFull}>
                        <label style={styles.label}>About The Builder</label>
                        <textarea value={formData.aboutUs} onChange={e => setFormData({ ...formData, aboutUs: e.target.value })} placeholder="Company history, mission, scale of projects..." style={styles.textArea} />
                    </div>

                    {/* Media Uploads */}
                    <div style={styles.mediaPanel}>
                        <h3 style={styles.mediaTitle}>Media Assets</h3>
                        <div style={styles.mediaGrid}>
                            {/* Banner */}
                            <div style={styles.uploadBlock}>
                                <label style={styles.subLabel}>Core Project Banner <span style={styles.uploadState}>{uploading === "bannerurl" ? "(Uploading...)" : ""}</span></label>
                                <div style={styles.fileTrigger}>
                                    <IconImage /> Upload Banner
                                    <input type="file" onChange={e => handleUpload(e, "bannerurl")} style={styles.hiddenFile} />
                                </div>
                                {formData.bannerurl && <img src={formData.bannerurl} alt="Banner" style={styles.uploadPreview} />}
                            </div>

                            {/* Profile Logo */}
                            <div style={styles.uploadBlock}>
                                <label style={styles.subLabel}>Company Logo <span style={styles.uploadState}>{uploading === "profileUrl" ? "(Uploading...)" : ""}</span></label>
                                <div style={styles.fileTrigger}>
                                    <IconImage /> Upload Logo
                                    <input type="file" onChange={e => handleUpload(e, "profileUrl")} style={styles.hiddenFile} />
                                </div>
                                {formData.profileUrl && <img src={formData.profileUrl} alt="Logo" style={styles.uploadPreviewLogo} />}
                            </div>

                            {/* Gallery */}
                            <div style={styles.uploadBlock}>
                                <label style={styles.subLabel}>Portfolio Gallery <span style={styles.uploadState}>{uploading === "gallery" ? "(Uploading...)" : ""}</span></label>
                                <div style={styles.fileTrigger}>
                                    <IconPlus /> Add Photos
                                    <input type="file" multiple onChange={e => handleUpload(e, "gallery")} style={styles.hiddenFile} />
                                </div>
                                <div style={styles.galleryStrip}>
                                    {formData.gallery.map((img, i) => (
                                        <div key={i} style={styles.galleryThumbWrapper}>
                                            <img src={img} alt="Thumb" style={styles.galleryThumb} />
                                            <button type="button" onClick={() => removeGalleryImage(i)} style={styles.removeThumb}>&times;</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Services/Excellence Areas */}
                    <div style={styles.inputRow}>
                        <div style={styles.inputField}>
                            <label style={styles.label}>Excellence Area 1</label>
                            <input type="text" value={formData.services?.s1 || formData.services?.repair || ""} onChange={e => setFormData({ ...formData, services: { ...formData.services, s1: e.target.value } })} placeholder="E.g. Commercial Towers" style={styles.inputBox} />
                        </div>
                        <div style={styles.inputField}>
                            <label style={styles.label}>Excellence Area 2</label>
                            <input type="text" value={formData.services?.s2 || formData.services?.install || ""} onChange={e => setFormData({ ...formData, services: { ...formData.services, s2: e.target.value } })} placeholder="E.g. Residential Complexes" style={styles.inputBox} />
                        </div>
                    </div>
                    <div style={styles.inputRow}>
                        <div style={styles.inputField}>
                            <label style={styles.label}>Excellence Area 3</label>
                            <input type="text" value={formData.services?.s3 || ""} onChange={e => setFormData({ ...formData, services: { ...formData.services, s3: e.target.value } })} placeholder="E.g. Heavy Civil Infrastructure" style={styles.inputBox} />
                        </div>
                        <div style={styles.inputField}>
                            <label style={styles.label}>Excellence Area 4</label>
                            <input type="text" value={formData.services?.s4 || ""} onChange={e => setFormData({ ...formData, services: { ...formData.services, s4: e.target.value } })} placeholder="E.g. Renovations" style={styles.inputBox} />
                        </div>
                    </div>

                    <div style={styles.actionRow}>
                        {editId && <button type="button" onClick={() => { setEditId(null); setFormData(initialForm); }} style={styles.cancelButton}>Cancel Edit</button>}
                        <button type="submit" style={styles.saveButton}>{editId ? "Update Builder Data" : "Publish Builder"}</button>
                    </div>
                </form>
            </div>

            {/* CRM Display Cards */}
            <div style={styles.cardList}>
                {builders.map(builder => (
                    <div key={builder.id || builder._id} style={styles.builderCard}>

                        <div style={styles.cardVisuals}>
                            <img src={builder.bannerurl || "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1000&auto=format"} alt="Banner" style={styles.cardBanner} />
                            <div style={styles.cardLogoWrapper}>
                                <img src={builder.profileUrl || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=100"} alt="Logo" style={styles.cardLogo} />
                            </div>
                        </div>

                        <div style={styles.cardContent}>
                            <div style={styles.cardHeader}>
                                <h3 style={styles.builderName}>{builder.title || "Unnamed Builder"}</h3>
                                <div style={styles.ratingBadge}>
                                    <IconStar />
                                    <span>{builder.services?.manualRating ?? builder.rating ?? "0.0"} ({builder.services?.manualReviewsCount ?? builder.reviewsCount ?? "0"})</span>
                                </div>
                            </div>

                            <p style={styles.builderLocation}>
                                <span style={{ marginRight: '6px' }}><IconMapPin /></span>{builder.location || "Location not given"}
                            </p>

                            <p style={styles.builderDescription}>
                                {builder.aboutUs || "No background details provided yet."}
                            </p>

                            <div style={styles.servicesPills}>
                                {[(builder.services?.s1 || builder.services?.repair), (builder.services?.s2 || builder.services?.install), builder.services?.s3, builder.services?.s4].filter(Boolean).map((s, idx) => (
                                    <span key={idx} style={styles.pill}>{s}</span>
                                ))}
                            </div>

                            {/* Gallery Preview */}
                            {builder.gallery && builder.gallery.length > 0 && (
                                <div style={styles.portfolioMini}>
                                    {builder.gallery.slice(0, 3).map((img, i) => (
                                        <div key={i} style={styles.portThumbBox}>
                                            <img src={img} alt="port" style={styles.portThumb} />
                                            {i === 2 && builder.gallery.length > 3 && (
                                                <div style={styles.portOverlay}>+{builder.gallery.length - 3}</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                        </div>

                        {/* CRM Actions */}
                        <div style={styles.cardActions}>
                            <button onClick={() => {
                                setEditId(builder.id || builder._id);
                                setFormData({
                                    ...builder,
                                    rating: builder.services?.manualRating ?? builder.rating ?? "",
                                    reviewsCount: builder.services?.manualReviewsCount ?? builder.reviewsCount ?? "",
                                    services: builder.services || { s1: "", s2: "", s3: "", s4: "" }
                                });
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }} style={styles.actionBtnEdit}>
                                <IconEdit /> Edit details
                            </button>
                            <button onClick={() => handleDelete(builder.id || builder._id)} style={styles.actionBtnDel}>
                                <IconTrash /> Remove
                            </button>
                        </div>
                    </div>
                ))}

                {builders.length === 0 && (
                    <div style={{ width: '100%', textAlign: 'center', color: '#666', padding: '40px 0' }}>
                        No Builders found in this category.
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = {
    pageContainer: {
        backgroundColor: "#fbfbfb",
        minHeight: "100vh",
        padding: "40px",
        fontFamily: "'Inter', sans-serif",
        color: "#111"
    },
    headerArea: {
        display: "flex",
        alignItems: "center",
        gap: "20px",
        marginBottom: "40px"
    },
    backButton: {
        backgroundColor: "#fff",
        color: "#000",
        border: "1px solid #eee",
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        cursor: "pointer",
        fontWeight: "900",
        fontSize: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
    },
    pageTitle: {
        fontSize: "28px",
        fontWeight: "800",
        color: "#111",
        margin: 0
    },

    /* Form Styles */
    formPanel: {
        backgroundColor: "#fff",
        border: "1px solid #f0f0f0",
        borderRadius: "24px",
        padding: "35px",
        marginBottom: "50px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.04)"
    },
    panelHeading: {
        color: "#222",
        fontSize: "18px",
        fontWeight: "800",
        marginBottom: "25px",
        borderBottom: "1px solid #eee",
        paddingBottom: "15px"
    },
    formContainer: {
        display: "flex",
        flexDirection: "column",
        gap: "22px"
    },
    inputRow: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "25px"
    },
    inputField: {
        display: "flex",
        flexDirection: "column",
        gap: "8px"
    },
    inputFieldFull: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        width: "100%"
    },
    label: {
        fontSize: "13px",
        fontWeight: "600",
        color: "#666",
        textTransform: "uppercase",
        letterSpacing: "0.5px"
    },
    inputBox: {
        backgroundColor: "#fff",
        border: "1px solid #ddd",
        color: "#111",
        padding: "14px 16px",
        borderRadius: "10px",
        fontSize: "14px",
        outline: "none",
        transition: "border 0.2s"
    },
    textArea: {
        backgroundColor: "#fff",
        border: "1px solid #ddd",
        color: "#111",
        padding: "14px 16px",
        borderRadius: "10px",
        fontSize: "14px",
        minHeight: "100px",
        outline: "none",
        resize: "vertical",
        transition: "border 0.2s"
    },
    mediaPanel: {
        backgroundColor: "#f9fafb",
        padding: "20px",
        borderRadius: "16px",
        border: "1px dashed #e0e0e0",
        margin: "10px 0"
    },
    mediaTitle: {
        color: "#222",
        fontSize: "16px",
        fontWeight: "700",
        marginBottom: "20px"
    },
    mediaGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "25px"
    },
    uploadBlock: {
        display: "flex",
        flexDirection: "column",
        gap: "12px"
    },
    subLabel: {
        fontSize: "13px",
        color: "#666",
        fontWeight: "600"
    },
    uploadState: {
        color: "#ffc400",
        fontWeight: "700",
        fontSize: "12px"
    },
    fileTrigger: {
        position: "relative",
        backgroundColor: "#fff",
        color: "#555",
        border: "1px dashed #ccc",
        padding: "12px",
        borderRadius: "8px",
        textAlign: "center",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        fontWeight: "600",
        overflow: "hidden",
        transition: "background 0.2s"
    },
    hiddenFile: {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        opacity: 0,
        cursor: "pointer"
    },
    uploadIcon: {
        fontSize: "16px",
        color: "#ffc400"
    },
    uploadPreview: {
        width: "100%",
        height: "100px",
        objectFit: "cover",
        borderRadius: "8px",
        border: "1px solid #ddd"
    },
    uploadPreviewLogo: {
        width: "80px",
        height: "80px",
        objectFit: "cover",
        borderRadius: "50%",
        border: "2px solid #ddd",
        alignSelf: "center"
    },
    galleryStrip: {
        display: "flex",
        gap: "10px",
        flexWrap: "wrap",
        marginTop: "10px"
    },
    galleryThumbWrapper: {
        position: "relative",
        width: "60px",
        height: "60px"
    },
    galleryThumb: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        borderRadius: "8px",
        border: "1px solid #ddd"
    },
    removeThumb: {
        position: "absolute",
        top: "-8px",
        right: "-8px",
        backgroundColor: "#ef4444",
        color: "#fff",
        border: "none",
        width: "20px",
        height: "20px",
        borderRadius: "50%",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "12px",
        fontWeight: "bold"
    },
    actionRow: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "15px",
        marginTop: "20px"
    },
    saveButton: {
        backgroundColor: "#ffc400",
        color: "#000",
        border: "none",
        padding: "16px 40px",
        borderRadius: "14px",
        fontWeight: "900",
        cursor: "pointer",
        transition: "0.2s",
        fontSize: "15px"
    },
    cancelButton: {
        backgroundColor: "#f1f3f5",
        color: "#444",
        border: "none",
        padding: "16px 30px",
        borderRadius: "14px",
        fontWeight: "800",
        cursor: "pointer"
    },

    /* Builder Cards */
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
    cardHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "12px"
    },
    builderName: {
        color: "#111",
        fontSize: "22px",
        fontWeight: "900",
        margin: 0,
        letterSpacing: "-0.5px"
    },
    ratingBadge: {
        display: "flex",
        alignItems: "center",
        gap: "4px",
        backgroundColor: "#fff9e6",
        color: "#d97706",
        padding: "6px 12px",
        borderRadius: "20px",
        fontSize: "13px",
        fontWeight: "800",
        border: "1px solid #fde68a"
    },
    starIcon: {
        fontSize: "13px"
    },
    builderLocation: {
        color: "#666",
        fontSize: "13px",
        display: "flex",
        alignItems: "center",
        margin: "0 0 15px 0",
        fontWeight: "500"
    },
    builderDescription: {
        color: "#444",
        fontSize: "14px",
        lineHeight: "1.6",
        margin: "0 0 25px 0",
        display: "-webkit-box",
        WebkitLineClamp: 3,
        WebkitBoxOrient: "vertical",
        overflow: "hidden"
    },
    servicesPills: {
        display: "flex",
        flexWrap: "wrap",
        gap: "10px",
        marginBottom: "25px"
    },
    pill: {
        backgroundColor: "#fff",
        color: "#111",
        border: "1px solid #d1d5db",
        padding: "6px 14px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "700",
        boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
    },
    portfolioMini: {
        display: "flex",
        gap: "10px",
        paddingTop: "20px",
        borderTop: "1px solid #f0f0f0"
    },
    portThumbBox: {
        width: "60px",
        height: "60px",
        borderRadius: "10px",
        overflow: "hidden",
        position: "relative"
    },
    portThumb: {
        width: "100%",
        height: "100%",
        objectFit: "cover"
    },
    portOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: "13px",
        fontWeight: "bold"
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
