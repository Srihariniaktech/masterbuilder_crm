import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "https://masterbuilder-backend.onrender.com/api/projects-tenders";
const UPLOAD_SINGLE = "https://masterbuilder-backend.onrender.com/api/upload/single";

/* ── SVG Icons ─────────────────────────────────────── */
const IconCalendar = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);

const IconLink = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
    </svg>
);

const IconUser = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);

const IconEdit = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
);

const IconTrash = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
);

const IconExternalLink = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
        <polyline points="15 3 21 3 21 9"></polyline>
        <line x1="10" y1="14" x2="21" y2="3"></line>
    </svg>
);

const IconFilter = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
    </svg>
);

export default function ProjectsTenders() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState("All");

    /* ── Form state ── */
    const initialForm = { title: "", category: "Project", bannerurl: "", description: "", applylink: "" };
    const [formData, setFormData] = useState(initialForm);
    const [editId, setEditId] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [showForm, setShowForm] = useState(false);

    /* ── Fetch ── */
    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await axios.get(API_URL);
            const data = res.data?.items || (Array.isArray(res.data) ? res.data : []);
            setItems(data);
        } catch (err) {
            console.error("Failed to fetch projects/tenders.", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    /* ── Image upload ── */
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);

        const data = new FormData();
        data.append("image", file);

        try {
            const res = await axios.post(UPLOAD_SINGLE, data);
            const url = res.data?.url || res.data?.imageUrl || "";
            if (url) {
                setFormData((f) => ({ ...f, bannerurl: url }));
            }
        } catch (err) {
            alert("❌ Image upload failed.");
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    /* ── Submit ── */
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editId) {
                await axios.put(`${API_URL}/${editId}`, formData);
                alert("✅ Item Updated!");
                setEditId(null);
            } else {
                await axios.post(API_URL, formData);
                alert("✅ Item Created!");
            }
            setFormData(initialForm);
            setShowForm(false);
            fetchItems();
        } catch (err) {
            alert("❌ Error saving item.");
        }
    };

    /* ── Delete ── */
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this item?")) return;
        try {
            await axios.delete(`${API_URL}/${id}`);
            alert("✅ Item Deleted!");
            fetchItems();
        } catch (err) {
            alert("❌ Delete failed.");
        }
    };

    /* ── Edit ── */
    const handleEdit = (item) => {
        setEditId(item.id);
        setFormData({
            title: item.title || "",
            category: item.category || "Project",
            bannerurl: item.bannerurl || "",
            description: item.description || "",
            applylink: item.applylink || "",
        });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    /* ── Filter ── */
    const filteredItems =
        activeFilter === "All" ? items : items.filter((i) => i.category === activeFilter);

    const projectCount = items.filter((i) => i.category === "Project").length;
    const tenderCount = items.filter((i) => i.category === "Tender").length;

    const defaultBanner =
        "https://images.unsplash.com/photo-1541888086425-d81bb19240f5?q=80&w=1000&auto=format";

    return (
        <div style={styles.container}>
            {/* ── Header ── */}
            <div style={styles.headerArea}>
                <div style={styles.headerTop}>
                    <div>
                        <h1 style={styles.pageTitle}>PROJECTS & TENDERS</h1>
                        <p style={styles.subtitle}>
                            Manage all your construction projects and government tenders in one place
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setShowForm(!showForm);
                            if (showForm) {
                                setEditId(null);
                                setFormData(initialForm);
                            }
                        }}
                        style={styles.addBtn}
                    >
                        {showForm ? "✕ Close" : "+ Add New"}
                    </button>
                </div>

                {/* ── Stats row ── */}
                <div style={styles.statsRow}>
                    <div style={{ ...styles.statCard, borderLeft: "4px solid #ffc400" }}>
                        <span style={styles.statCount}>{items.length}</span>
                        <span style={styles.statLabel}>Total Items</span>
                    </div>
                    <div style={{ ...styles.statCard, borderLeft: "4px solid #3b82f6" }}>
                        <span style={styles.statCount}>{projectCount}</span>
                        <span style={styles.statLabel}>Projects</span>
                    </div>
                    <div style={{ ...styles.statCard, borderLeft: "4px solid #10b981" }}>
                        <span style={styles.statCount}>{tenderCount}</span>
                        <span style={styles.statLabel}>Tenders</span>
                    </div>
                </div>
            </div>

            {/* ── Form Panel ── */}
            {showForm && (
                <div style={styles.formPanel}>
                    <h3 style={styles.panelHeading}>
                        {editId ? "✏️ EDIT ITEM" : "🚀 CREATE NEW ITEM"}
                    </h3>
                    <form onSubmit={handleSubmit} style={styles.formContainer}>
                        <div style={styles.inputRow}>
                            <div style={styles.inputField}>
                                <label style={styles.label}>Title</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Highway Construction Project"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                    style={styles.input}
                                />
                            </div>
                            <div style={styles.inputField}>
                                <label style={styles.label}>Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    style={styles.input}
                                >
                                    <option value="Project">Project</option>
                                    <option value="Tender">Tender</option>
                                </select>
                            </div>
                        </div>

                        <div style={styles.inputFieldFull}>
                            <label style={styles.label}>Banner Image</label>
                            <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                                <input
                                    type="file"
                                    id="ptBanner"
                                    accept="image/*"
                                    style={{ display: "none" }}
                                    onChange={handleImageUpload}
                                />
                                <label htmlFor="ptBanner" style={styles.uploadBtn}>
                                    {uploading ? "⏳ Uploading..." : "📁 Upload Image"}
                                </label>
                                <input
                                    type="text"
                                    placeholder="Or paste image URL"
                                    value={formData.bannerurl}
                                    onChange={(e) => setFormData({ ...formData, bannerurl: e.target.value })}
                                    style={{ ...styles.input, flex: 1 }}
                                />
                            </div>
                            {formData.bannerurl && (
                                <img src={formData.bannerurl} alt="Preview" style={styles.previewImg} />
                            )}
                        </div>

                        <div style={styles.inputFieldFull}>
                            <label style={styles.label}>Apply Link</label>
                            <input
                                type="text"
                                placeholder="e.g. https://apply.example.com"
                                value={formData.applylink}
                                onChange={(e) => setFormData({ ...formData, applylink: e.target.value })}
                                style={styles.input}
                            />
                        </div>

                        <div style={styles.inputFieldFull}>
                            <label style={styles.label}>Description</label>
                            <textarea
                                placeholder="Write project/tender details here..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                required
                                style={{ ...styles.input, minHeight: "130px", resize: "vertical" }}
                            />
                        </div>

                        <div style={styles.actionRow}>
                            {editId && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditId(null);
                                        setFormData(initialForm);
                                        setShowForm(false);
                                    }}
                                    style={styles.cancelBtn}
                                >
                                    CANCEL
                                </button>
                            )}
                            <button type="submit" style={styles.saveBtn}>
                                {editId ? "🚀 UPDATE ITEM" : "✨ PUBLISH ITEM"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── Filter Tabs ── */}
            <div style={styles.filterRow}>
                <div style={styles.filterLeft}>
                    <IconFilter />
                    <span style={styles.filterLabel}>Filter:</span>
                </div>
                {["All", "Project", "Tender"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveFilter(tab)}
                        style={{
                            ...styles.filterTab,
                            ...(activeFilter === tab ? styles.filterTabActive : {}),
                        }}
                    >
                        {tab}
                        <span
                            style={{
                                ...styles.filterBadge,
                                ...(activeFilter === tab ? styles.filterBadgeActive : {}),
                            }}
                        >
                            {tab === "All"
                                ? items.length
                                : tab === "Project"
                                    ? projectCount
                                    : tenderCount}
                        </span>
                    </button>
                ))}
            </div>

            {/* ── Loading state ── */}
            {loading && (
                <div style={styles.loadingState}>
                    <div style={styles.spinner}></div>
                    <p style={{ color: "#94a3b8", marginTop: "15px" }}>Loading items...</p>
                </div>
            )}

            {/* ── Items Grid ── */}
            {!loading && (
                <div style={styles.itemGrid}>
                    {filteredItems.map((item) => (
                        <div key={item.id} style={styles.itemCard}>
                            {/* Banner */}
                            <div style={styles.cardImageArea}>
                                <img
                                    src={item.bannerurl || defaultBanner}
                                    alt={item.title}
                                    style={styles.cardBanner}
                                    onError={(e) => {
                                        e.target.src = defaultBanner;
                                    }}
                                />
                                {/* Category badge overlay */}
                                <span
                                    style={{
                                        ...styles.categoryOverlay,
                                        backgroundColor:
                                            item.category === "Project" ? "#3b82f6" : "#10b981",
                                    }}
                                >
                                    {item.category?.toUpperCase()}
                                </span>
                            </div>

                            {/* Content */}
                            <div style={styles.cardContent}>
                                <h2 style={styles.itemTitle}>{item.title}</h2>

                                <p style={styles.itemDesc}>
                                    {item.description || "No description provided."}
                                </p>

                                {/* Meta info */}
                                <div style={styles.metaRow}>
                                    <div style={styles.metaItem}>
                                        <IconCalendar />
                                        <span>
                                            {new Date(item.createdAt).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </span>
                                    </div>
                                    {item.author && (
                                        <div style={styles.metaItem}>
                                            <IconUser />
                                            <span>{item.author.name || "Unknown"}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Apply link */}
                                {item.applylink && (
                                    <a
                                        href={item.applylink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={styles.applyLink}
                                    >
                                        <IconExternalLink /> Apply / View Details
                                    </a>
                                )}

                                {/* Action buttons */}
                                <div style={styles.cardFooter}>
                                    <button onClick={() => handleEdit(item)} style={styles.btnEdit}>
                                        <IconEdit /> <span>EDIT</span>
                                    </button>
                                    <button onClick={() => handleDelete(item.id)} style={styles.btnDelete}>
                                        <IconTrash /> <span>DELETE</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Empty state ── */}
            {filteredItems.length === 0 && !loading && (
                <div style={styles.emptyState}>
                    <div style={styles.emptyIcon}>📋</div>
                    <h3 style={styles.emptyTitle}>No {activeFilter === "All" ? "items" : activeFilter.toLowerCase() + "s"} found</h3>
                    <p style={styles.emptyDesc}>
                        Start by creating a new {activeFilter === "All" ? "project or tender" : activeFilter.toLowerCase()}.
                    </p>
                    <button
                        onClick={() => setShowForm(true)}
                        style={styles.emptyBtn}
                    >
                        + Create New
                    </button>
                </div>
            )}

            {/* Inline keyframes for spinner */}
            <style>{`
                @keyframes pt-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

/* ── Styles ──────────────────────────────────────── */
const styles = {
    container: {
        padding: "40px",
        maxWidth: "1200px",
        margin: "0 auto",
        backgroundColor: "#fff",
        fontFamily: "'Inter', sans-serif",
        minHeight: "100vh",
    },

    /* Header */
    headerArea: {
        marginBottom: "40px",
    },
    headerTop: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "30px",
    },
    pageTitle: {
        fontSize: "32px",
        fontWeight: "900",
        color: "#000",
        letterSpacing: "-1px",
        margin: 0,
        borderBottom: "4px solid #ffc400",
        display: "inline-block",
        paddingBottom: "10px",
    },
    subtitle: {
        color: "#94a3b8",
        fontSize: "14px",
        marginTop: "10px",
        fontWeight: "500",
    },
    addBtn: {
        backgroundColor: "#ffc400",
        color: "#000",
        padding: "14px 28px",
        border: "none",
        borderRadius: "14px",
        fontWeight: "800",
        cursor: "pointer",
        fontSize: "15px",
        boxShadow: "0 4px 12px rgba(255,196,0,0.3)",
        transition: "all 0.2s ease",
    },

    /* Stats */
    statsRow: {
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "20px",
    },
    statCard: {
        background: "#f8fafc",
        borderRadius: "16px",
        padding: "22px 28px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
    },
    statCount: {
        fontSize: "28px",
        fontWeight: "900",
        color: "#1e293b",
    },
    statLabel: {
        fontSize: "13px",
        fontWeight: "600",
        color: "#94a3b8",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
    },

    /* Form */
    formPanel: {
        backgroundColor: "#fff",
        border: "1px solid #f1f5f9",
        borderRadius: "24px",
        padding: "35px",
        marginBottom: "40px",
        boxShadow: "0 15px 40px rgba(0,0,0,0.04)",
    },
    panelHeading: {
        color: "#1e293b",
        fontSize: "18px",
        fontWeight: "800",
        marginBottom: "25px",
        textTransform: "uppercase",
    },
    formContainer: {
        display: "flex",
        flexDirection: "column",
        gap: "24px",
    },
    inputRow: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "30px",
    },
    inputField: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
    },
    inputFieldFull: {
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
        transition: "border-color 0.2s",
        backgroundColor: "#f8fafc",
        fontFamily: "'Inter', sans-serif",
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
    previewImg: {
        width: "100%",
        maxHeight: "200px",
        objectFit: "cover",
        borderRadius: "14px",
        marginTop: "10px",
        border: "1px solid #eee",
    },
    actionRow: {
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
        boxShadow: "0 4px 10px rgba(255,196,0,0.3)",
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

    /* Filters */
    filterRow: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "30px",
        flexWrap: "wrap",
    },
    filterLeft: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        color: "#64748b",
        marginRight: "8px",
    },
    filterLabel: {
        fontWeight: "700",
        fontSize: "14px",
    },
    filterTab: {
        padding: "10px 22px",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        backgroundColor: "#fff",
        fontWeight: "700",
        fontSize: "14px",
        cursor: "pointer",
        color: "#64748b",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        transition: "all 0.2s ease",
    },
    filterTabActive: {
        backgroundColor: "#ffc400",
        borderColor: "#ffc400",
        color: "#000",
    },
    filterBadge: {
        backgroundColor: "#f1f5f9",
        color: "#64748b",
        padding: "2px 8px",
        borderRadius: "8px",
        fontSize: "12px",
        fontWeight: "800",
    },
    filterBadgeActive: {
        backgroundColor: "rgba(0,0,0,0.15)",
        color: "#000",
    },

    /* Item Grid */
    itemGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
        gap: "28px",
    },
    itemCard: {
        backgroundColor: "#fff",
        borderRadius: "20px",
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        border: "1px solid #f1f5f9",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
    },
    cardImageArea: {
        height: "200px",
        backgroundColor: "#f8fafc",
        position: "relative",
        overflow: "hidden",
    },
    cardBanner: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        transition: "transform 0.3s ease",
    },
    categoryOverlay: {
        position: "absolute",
        top: "14px",
        left: "14px",
        color: "#fff",
        padding: "6px 14px",
        borderRadius: "8px",
        fontSize: "11px",
        fontWeight: "800",
        letterSpacing: "0.5px",
        backdropFilter: "blur(4px)",
    },
    cardContent: {
        padding: "24px",
    },
    itemTitle: {
        fontSize: "20px",
        fontWeight: "800",
        color: "#1e293b",
        marginBottom: "10px",
        lineHeight: "1.3",
    },
    itemDesc: {
        color: "#64748b",
        fontSize: "14px",
        lineHeight: "1.6",
        marginBottom: "16px",
        display: "-webkit-box",
        WebkitLineClamp: 3,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
    },
    metaRow: {
        display: "flex",
        gap: "20px",
        color: "#94a3b8",
        fontSize: "13px",
        fontWeight: "600",
        marginBottom: "16px",
        paddingBottom: "16px",
        borderBottom: "1px solid #f1f5f9",
    },
    metaItem: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
    },
    applyLink: {
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        color: "#3b82f6",
        fontSize: "13px",
        fontWeight: "700",
        textDecoration: "none",
        marginBottom: "18px",
        padding: "8px 16px",
        backgroundColor: "#eff6ff",
        borderRadius: "10px",
        transition: "all 0.2s ease",
    },
    cardFooter: {
        display: "flex",
        gap: "10px",
    },
    btnEdit: {
        flex: 1,
        padding: "11px",
        borderRadius: "10px",
        border: "1px solid #e2e8f0",
        backgroundColor: "#fff",
        fontWeight: "800",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        fontSize: "13px",
        color: "#1e293b",
        transition: "all 0.2s ease",
    },
    btnDelete: {
        flex: 1,
        padding: "11px",
        borderRadius: "10px",
        border: "none",
        backgroundColor: "#fef2f2",
        color: "#ef4444",
        fontWeight: "800",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        fontSize: "13px",
        transition: "all 0.2s ease",
    },

    /* Loading */
    loadingState: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 0",
    },
    spinner: {
        width: "40px",
        height: "40px",
        border: "4px solid #f1f5f9",
        borderTop: "4px solid #ffc400",
        borderRadius: "50%",
        animation: "pt-spin 0.8s linear infinite",
    },

    /* Empty state */
    emptyState: {
        textAlign: "center",
        padding: "80px 20px",
        color: "#94a3b8",
    },
    emptyIcon: {
        fontSize: "48px",
        marginBottom: "15px",
    },
    emptyTitle: {
        fontSize: "20px",
        fontWeight: "800",
        color: "#1e293b",
        marginBottom: "8px",
    },
    emptyDesc: {
        fontSize: "15px",
        marginBottom: "25px",
        color: "#94a3b8",
    },
    emptyBtn: {
        backgroundColor: "#ffc400",
        color: "#000",
        padding: "14px 28px",
        border: "none",
        borderRadius: "14px",
        fontWeight: "800",
        cursor: "pointer",
        fontSize: "15px",
    },
};
