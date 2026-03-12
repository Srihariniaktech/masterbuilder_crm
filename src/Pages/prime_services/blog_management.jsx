import React, { useEffect, useState } from "react";
import axios from "axios";
import noImage from "../../assets/no_image.jpg";

const BLOG_API_URL = "https://masterbuilder-backend.onrender.com/api/blogs";
const UPLOAD_SINGLE = "https://masterbuilder-backend.onrender.com/api/upload/single";

// Simple SVG Icons
const IconCalendar = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);

const IconClock = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
);

const IconPlus = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

export default function BlogManagement() {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);

    /* ---- Blog form state ---- */
    const initialForm = { title: "", category: "", bannerurl: "", description: "" };
    const [formData, setFormData] = useState(initialForm);
    const [editId, setEditId] = useState(null);
    const [uploading, setUploading] = useState(false);

    const fetchBlogs = async () => {
        setLoading(true);
        try {
            const res = await axios.get(BLOG_API_URL);
            // The response structure provided: { blogs: [...] }
            let data = res.data?.blogs || (Array.isArray(res.data) ? res.data : []);
            setBlogs(data);
        } catch (err) {
            console.error("Failed to fetch blogs.", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlogs();
    }, []);

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
                setFormData(f => ({ ...f, bannerurl: url }));
            }
        } catch (err) {
            alert("❌ Image upload failed.");
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editId) {
                await axios.put(`${BLOG_API_URL}/${editId}`, formData);
                alert("✅ Blog Updated!");
                setEditId(null);
            } else {
                await axios.post(BLOG_API_URL, formData);
                alert("✅ Blog Added!");
            }
            setFormData(initialForm);
            fetchBlogs();
        } catch (err) {
            alert("❌ Error saving blog.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this blog?")) return;
        try {
            await axios.delete(`${BLOG_API_URL}/${id}`);
            alert("✅ Blog Deleted!");
            fetchBlogs();
        } catch (err) {
            alert("❌ Delete failed.");
        }
    };

    return (
        <div style={styles.container}>
            {/* Centered Heading with dashbord style but no back arrow */}
            <div style={styles.headerArea}>
                <h1 style={styles.pageTitle}>BLOG MANAGEMENT</h1>
            </div>

            {/* Form Section */}
            <div style={styles.formPanel}>
                <h3 style={styles.panelHeading}>{editId ? "EDIT BLOG POST" : "CREATE NEW BLOG POST"}</h3>
                <form onSubmit={handleSubmit} style={styles.formContainer}>
                    <div style={styles.inputRow}>
                        <div style={styles.inputField}>
                            <label style={styles.label}>Post Title</label>
                            <input
                                type="text"
                                placeholder="e.g. The Future of Sustainable Building"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                required
                                style={styles.input}
                            />
                        </div>
                        <div style={styles.inputField}>
                            <label style={styles.label}>Category</label>
                            <input
                                type="text"
                                placeholder="e.g. Architecture"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                required
                                style={styles.input}
                            />
                        </div>
                    </div>

                    <div style={styles.inputFieldFull}>
                        <label style={styles.label}>Banner Image</label>
                        <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                            <input type="file" id="blogBanner" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />
                            <label htmlFor="blogBanner" style={styles.uploadBtn}>
                                {uploading ? "⏳ Uploading..." : "📁 Upload Image"}
                            </label>
                            <input
                                type="text"
                                placeholder="Or paste image URL"
                                value={formData.bannerurl}
                                onChange={e => setFormData({ ...formData, bannerurl: e.target.value })}
                                style={{ ...styles.input, flex: 1 }}
                            />
                        </div>
                        {formData.bannerurl && (
                            <img src={formData.bannerurl} alt="Preview" style={styles.previewImg} />
                        )}
                    </div>

                    <div style={styles.inputFieldFull}>
                        <label style={styles.label}>Content / Description</label>
                        <textarea
                            placeholder="Write your blog content here..."
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            required
                            style={{ ...styles.input, minHeight: "150px", resize: "vertical" }}
                        />
                    </div>

                    <div style={styles.actionRow}>
                        {editId && (
                            <button type="button" onClick={() => { setEditId(null); setFormData(initialForm); }} style={styles.cancelBtn}>
                                CANCEL
                            </button>
                        )}
                        <button type="submit" style={styles.saveBtn}>
                            {editId ? "🚀 UPDATE POST" : "✨ PUBLISH POST"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Blogs List */}
            <div style={styles.blogGrid}>
                {blogs.map((blog) => (
                    <div key={blog.id} style={styles.blogCard}>
                        {/* Image Section */}
                        <div style={styles.cardImageArea}>
                            <img
                                src={blog.bannerurl || "https://images.unsplash.com/photo-1541888086425-d81bb19240f5?q=80&w=1000&auto=format"}
                                alt={blog.title}
                                style={styles.cardBanner}
                            />
                        </div>

                        {/* Content Section */}
                        <div style={styles.cardContent}>
                            <span style={styles.categoryBadge}>{blog.category?.toUpperCase() || "GENERAL"}</span>
                            <h2 style={styles.blogTitle}>{blog.title}</h2>

                            <div style={styles.metaRow}>
                                <div style={styles.metaItem}>
                                    <IconCalendar />
                                    <span>{new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                                <div style={styles.metaItem}>
                                    <IconClock />
                                    <span>5 min read</span>
                                </div>
                            </div>

                            <p style={styles.blogDescription}>
                                {blog.description}
                            </p>

                            <div style={styles.cardFooter}>
                                <button
                                    onClick={() => {
                                        setEditId(blog.id);
                                        setFormData({ title: blog.title, category: blog.category, bannerurl: blog.bannerurl, description: blog.description });
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    style={styles.btnEdit}
                                >
                                    EDIT
                                </button>
                                <button onClick={() => handleDelete(blog.id)} style={styles.btnDelete}>
                                    DELETE
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {blogs.length === 0 && !loading && (
                <div style={styles.emptyState}>No blogs found. Start by creating one!</div>
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
    headerArea: {
        textAlign: "center",
        marginBottom: "40px",
    },
    pageTitle: {
        fontSize: "32px",
        fontWeight: "900",
        color: "#000",
        letterSpacing: "-1px",
        margin: 0,
        borderBottom: "4px solid #ffc400",
        display: "inline-block",
        paddingBottom: "10px"
    },
    formPanel: {
        backgroundColor: "#fff",
        border: "1px solid #f1f5f9",
        borderRadius: "24px",
        padding: "35px",
        marginBottom: "60px",
        boxShadow: "0 15px 40px rgba(0,0,0,0.04)",
    },
    panelHeading: {
        color: "#1e293b",
        fontSize: "18px",
        fontWeight: "800",
        marginBottom: "25px",
        textTransform: "uppercase"
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
        marginLeft: "4px"
    },
    input: {
        padding: "15px 20px",
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        fontSize: "15px",
        outline: "none",
        transition: "border-color 0.2s",
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
    },
    previewImg: {
        width: "100%",
        maxHeight: "200px",
        objectFit: "cover",
        borderRadius: "14px",
        marginTop: "10px",
        border: "1px solid #eee"
    },
    actionRow: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "15px",
        marginTop: "10px"
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
        boxShadow: "0 4px 10px rgba(255, 196, 0, 0.3)"
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

    /* Blog Card Styles mapped from design */
    blogGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "28px"
    },
    blogCard: {
        backgroundColor: "#fff",
        borderRadius: "24px",
        overflow: "hidden",
        boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
        border: "1px solid #f1f5f9",
    },
    cardImageArea: {
        height: "220px",
        backgroundColor: "#f8fafc",
        position: "relative",
        overflow: "hidden"
    },
    cardBanner: {
        width: "100%",
        height: "100%",
        objectFit: "cover"
    },
    cardContent: {
        padding: "24px",
    },
    categoryBadge: {
        backgroundColor: "#ffc400",
        color: "#000",
        padding: "6px 14px",
        borderRadius: "8px",
        fontSize: "11px",
        fontWeight: "900",
        display: "inline-block",
        marginBottom: "14px"
    },
    blogTitle: {
        fontSize: "20px",
        fontWeight: "800",
        color: "#1e293b",
        marginBottom: "10px",
        lineHeight: "1.3",
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden"
    },
    metaRow: {
        display: "flex",
        gap: "18px",
        color: "#94a3b8",
        fontSize: "13px",
        fontWeight: "600",
        marginBottom: "14px",
        borderBottom: "1px solid #f1f5f9",
        paddingBottom: "14px"
    },
    metaItem: {
        display: "flex",
        alignItems: "center",
        gap: "8px"
    },
    blogDescription: {
        color: "#64748b",
        fontSize: "14px",
        lineHeight: "1.6",
        marginBottom: "18px",
        display: "-webkit-box",
        WebkitLineClamp: 3,
        WebkitBoxOrient: "vertical",
        overflow: "hidden"
    },
    cardFooter: {
        display: "flex",
        gap: "10px",
        borderTop: "1px solid #f1f5f9",
        paddingTop: "16px"
    },
    btnEdit: {
        flex: 1,
        padding: "12px",
        borderRadius: "10px",
        border: "1px solid #e2e8f0",
        backgroundColor: "#fff",
        fontWeight: "800",
        cursor: "pointer",
    },
    btnDelete: {
        flex: 1,
        padding: "12px",
        borderRadius: "10px",
        border: "none",
        backgroundColor: "#fef2f2",
        color: "#ef4444",
        fontWeight: "800",
        cursor: "pointer",
    },
    emptyState: {
        textAlign: "center",
        padding: "100px 0",
        color: "#94a3b8",
        fontSize: "18px",
        fontWeight: "600"
    }
};
