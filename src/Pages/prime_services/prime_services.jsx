import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import noImage from "../../assets/no_image.jpg";

const API_URL = "https://masterbuilder-backend.onrender.com/api/prime-services";
const AD_API_URL = "https://masterbuilder-backend.onrender.com/api/advertisements";
const UPLOAD_SINGLE = "https://masterbuilder-backend.onrender.com/api/upload/single";

// Helper: extract URL string from either a string or { url, key } object
const getUrl = (val) => {
  if (!val) return "";
  let str = "";
  if (typeof val === "string") str = val;
  else if (typeof val === "object" && val.url) str = val.url;
  return str.replace(/^"|"$/g, "").trim();
};

// Helper: normalise whatever the backend returns for imageUrl / videoUrl into arrays
// The API may return deeply-stringified JSON like: "[\"url\"]" or "[\"[\\\"url1\\\",\\\"url2\\\"]\"]"
const toArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) {
    // Recursively flatten any nested stringified arrays
    return val.flatMap((item) => toArray(item));
  }
  if (typeof val === "string") {
    const trimmed = val.trim();
    // Try to parse as JSON if it looks like an array or object
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed);
        return toArray(parsed); // recurse in case of double-stringification
      } catch {
        // Not valid JSON, treat as a plain URL string
      }
    }
    // It's a plain URL string
    if (trimmed) return [trimmed];
    return [];
  }
  if (typeof val === "object" && val.url) return [val.url];
  return [];
};

function PrimeService() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [ads, setAds] = useState([]);

  /* ---- AD form state ---- */
  const emptyAdForm = () => ({ imageUrl: [], youtubeLinks: [""], uploadingIdx: null });
  const [adForm, setAdForm] = useState(emptyAdForm());
  const [adEditId, setAdEditId] = useState(null);
  const [adSaving, setAdSaving] = useState(false);

  /* ---- Prime-service form state ---- */
  const [formData, setFormData] = useState({ orderno: "", name: "", imageUrl: "" });
  const [editId, setEditId] = useState(null);
  const [uploading, setUploading] = useState(false);

  /* ================= FETCH ================= */
  const fetchServices = async () => {
    try {
      const res = await axios.get(API_URL);
      let data = Array.isArray(res.data) ? res.data : (res.data.data || res.data.services || []);
      // Include Man Power, Product, Services, and Builders.
      const allowed = ["man power", "product", "services", "builders"];
      const filtered = data.filter(s => allowed.includes(s.name?.toLowerCase()));
      setServices(filtered);
    } catch (err) { console.error("Failed to fetch services.", err); }
  };

  const fetchAds = async () => {
    try {
      const res = await axios.get(AD_API_URL);
      let data = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setAds(data);
    } catch (err) { console.error("Fetch Ads Error:", err); }
  };

  useEffect(() => { fetchServices(); fetchAds(); }, []);

  /* ================= UTILS ================= */
  const getYouTubeID = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = String(url).match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  /* ================= IMAGE UPLOAD ================= */
  const handleAdImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAdForm(f => ({ ...f, uploadingIdx: f.imageUrl.length }));

    const data = new FormData();
    data.append("image", file);
    try {
      const res = await axios.post(UPLOAD_SINGLE, data);
      let rawUrl = res.data?.url || res.data?.imageUrl || res.data?.filePath || "";

      if (rawUrl && (rawUrl.startsWith("[") || rawUrl.startsWith("{"))) {
        try {
          const parsed = JSON.parse(rawUrl);
          if (Array.isArray(parsed) && parsed[0]) {
            rawUrl = typeof parsed[0] === "string" ? parsed[0] : (parsed[0].url || "");
          } else if (parsed && parsed.url) {
            rawUrl = parsed.url;
          }
        } catch { /* leave rawUrl as-is */ }
      }

      if (rawUrl) {
        setAdForm(f => ({ ...f, imageUrl: [...f.imageUrl, rawUrl] }));
      } else {
        alert("❌ Upload returned no URL.");
      }
    } catch {
      alert("❌ Image upload failed.");
    } finally {
      setAdForm(f => ({ ...f, uploadingIdx: null }));
      e.target.value = "";
    }
  };

  const removeAdImage = (idx) => {
    setAdForm(f => ({ ...f, imageUrl: f.imageUrl.filter((_, i) => i !== idx) }));
  };

  /* ================= YOUTUBE LINKS ================= */
  const updateYtLink = (idx, val) => {
    const links = [...adForm.youtubeLinks];
    links[idx] = val;
    setAdForm(f => ({ ...f, youtubeLinks: links }));
  };

  const addYtLink = () => {
    if (adForm.youtubeLinks.length < 10) {
      setAdForm(f => ({ ...f, youtubeLinks: [...f.youtubeLinks, ""] }));
    }
  };

  const removeYtLink = (idx) => {
    setAdForm(f => ({ ...f, youtubeLinks: f.youtubeLinks.filter((_, i) => i !== idx) }));
  };

  /* ================= AD SUBMIT ================= */
  const handleAdSubmit = async (e) => {
    e.preventDefault();
    const validImages = adForm.imageUrl.filter(url => typeof url === "string" && url.trim());
    const validLinks = adForm.youtubeLinks.map(l => l.trim()).filter(Boolean);

    if (validImages.length === 0 && validLinks.length === 0) {
      alert("⚠️ Please upload at least one image or add a YouTube link.");
      return;
    }

    setAdSaving(true);
    try {
      const payload = {
        imageUrl: validImages.length > 0 ? validImages : null,
        videoUrl: validLinks.length > 0 ? validLinks : null,
      };

      if (adEditId) {
        const editedAd = ads.find(a => (a.id || a._id) === adEditId);
        await axios.put(`${AD_API_URL}/${adEditId}`, {
          ...payload,
          pageNumber: editedAd?.pageNumber ?? 1,
        });
        alert("✅ Advertisement Updated!");
        setAdEditId(null);
      } else {
        const maxPageNumber = ads.length > 0 ? Math.max(...ads.map(a => a.pageNumber || 0)) : 0;
        await axios.post(AD_API_URL, { ...payload, pageNumber: maxPageNumber + 1 });
        alert("✅ Advertisement Saved!");
      }

      setAdForm(emptyAdForm());
      fetchAds();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message;
      alert(`❌ Save failed: ${msg}`);
    } finally { setAdSaving(false); }
  };

  const handleAdEdit = (ad) => {
    setAdEditId(ad.id || ad._id);
    const imgs = toArray(ad.imageUrl).map(v => getUrl(v)).filter(Boolean);
    const links = toArray(ad.videoUrl).map(getUrl).filter(Boolean);
    setAdForm({
      imageUrl: imgs,
      youtubeLinks: links.length > 0 ? links : [""],
      uploadingIdx: null,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAdDelete = async (ad) => {
    if (!window.confirm("Delete this Advertisement?")) return;
    const id = ad.id || ad._id;
    try {
      await axios.delete(`${AD_API_URL}/${id}`);
      alert("✅ Advertisement deleted successfully!");
      fetchAds();
    } catch (err) {
      alert("❌ Delete failed: " + (err.response?.data?.message || err.message));
    }
  };

  /* ================= SERVICE HANDLERS ================= */
  const handleSvcImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const data = new FormData();
    data.append("image", file);
    try {
      const res = await axios.post(UPLOAD_SINGLE, data);
      const url = res.data?.url || res.data?.imageUrl || res.data?.filePath || "";
      if (url) setFormData(f => ({ ...f, imageUrl: url }));
    } catch { alert("❌ Upload failed."); }
    finally { setUploading(false); }
  };

  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await axios.put(`${API_URL}/${editId}`, formData);
        alert("✅ Updated!");
        setEditId(null);
      } else {
        await axios.post(API_URL, formData);
        alert("✅ Added!");
      }
      setFormData({ orderno: "", name: "", imageUrl: "" });
      fetchServices();
    } catch (err) { alert("Error."); }
  };

  /* ================= RENDER ================= */
  return (
    <div style={styles.container}>
      <h2 style={styles.mainTitle}>ADVERTISEMENT MANAGEMENT</h2>

      <div style={styles.formBox}>
        <form onSubmit={handleAdSubmit} style={styles.form}>
          <div style={styles.section}>
            <p style={styles.sectionLabel}>🖼️ IMAGES</p>
            {adForm.imageUrl.length > 0 && (
              <div style={styles.previewRow}>
                {adForm.imageUrl.map((imgUrl, i) => (
                  <div key={i} style={styles.previewThumb}>
                    <img src={imgUrl} alt={`img-${i}`} style={styles.thumbImg} />
                    <button type="button" onClick={() => removeAdImage(i)} style={styles.removeThumb}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <div style={styles.flexGroup}>
              <input type="file" id="adImgFile" accept="image/*" style={{ display: "none" }} onChange={handleAdImageUpload} />
              <label htmlFor="adImgFile" style={styles.uploadFileBtn}>
                {adForm.uploadingIdx !== null ? "⏳ Uploading..." : "📁 UPLOAD IMAGE"}
              </label>
            </div>
          </div>

          <div style={styles.section}>
            <p style={styles.sectionLabel}>▶️ YOUTUBE LINKS</p>
            {adForm.youtubeLinks.map((link, i) => (
              <div key={i} style={{ ...styles.flexGroup, marginBottom: "10px" }}>
                <input
                  type="text"
                  placeholder={`YouTube URL #${i + 1}`}
                  value={link}
                  onChange={e => updateYtLink(i, e.target.value)}
                  style={styles.inputSmall}
                />
                {adForm.youtubeLinks.length > 1 && (
                  <button type="button" onClick={() => removeYtLink(i)} style={styles.removeBtn}>✕</button>
                )}
              </div>
            ))}
            <button type="button" onClick={addYtLink} style={styles.addLinkBtn}>+ ADD LINK</button>
          </div>

          <div style={{ display: "flex", gap: "15px" }}>
            {adEditId && (
              <button type="button" onClick={() => { setAdEditId(null); setAdForm(emptyAdForm()); }} style={styles.cancelBtn}>
                CANCEL
              </button>
            )}
            <button type="submit" style={styles.submitBtn} disabled={adSaving}>
              {adSaving ? "⌛ SAVING..." : (adEditId ? "🚀 UPDATE" : "✨ SAVE AD")}
            </button>
          </div>
        </form>
      </div>

      <div style={styles.listGrid}>
        {ads.map((ad, i) => {
          const images = toArray(ad.imageUrl);
          const videos = toArray(ad.videoUrl);
          return (
            <div key={ad.id || ad._id || i} style={styles.adCard}>
              <div style={styles.imgStrip}>
                {images.length > 0 ? images.map((img, j) => <img key={j} src={getUrl(img)} alt="ad" style={styles.stripImg} />) : <div style={styles.noMediaStub}>No Images</div>}
              </div>
              <div style={styles.cardMeta}>
                <span style={styles.badge}>Page {ad.pageNumber}</span>
                <span style={styles.countBadge}>{images.length} img · {videos.length} vid</span>
              </div>
              <div style={styles.actionBox}>
                <button onClick={() => handleAdEdit(ad)} style={styles.tinyEdit}>✏️ EDIT</button>
                <button onClick={() => handleAdDelete(ad)} style={styles.tinyDel}>🗑️ DELETE</button>
              </div>
            </div>
          );
        })}
      </div>

      <hr style={{ margin: "60px 0", borderColor: "#f1f5f9" }} />

      <h2 style={styles.mainTitle}>PRIME SERVICES</h2>

      <div style={styles.formBox}>
        <form onSubmit={handleServiceSubmit} style={styles.form}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <input type="text" placeholder="Order Number" value={formData.orderno} onChange={e => setFormData({ ...formData, orderno: e.target.value })} required style={styles.inputStyle} />
            <input type="text" placeholder="Service Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required style={styles.inputStyle} />
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input type="file" id="svcFile" accept="image/*" style={{ display: "none" }} onChange={handleSvcImageUpload} />
            <label htmlFor="svcFile" style={styles.uploadBtnSvc}>{uploading ? "..." : "📁 UPLOAD IMAGE"}</label>
            <input type="text" placeholder="Or paste Image URL" value={formData.imageUrl} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} style={styles.inputStyle} />
          </div>
          <button type="submit" style={styles.submitBtn}>{editId ? "🚀 UPDATE" : "✨ ADD SERVICE"}</button>
        </form>
      </div>

      <div style={styles.serviceGrid}>
        {services.map((s, i) => {
          const id = s._id || s.id;
          return (
            <div
              key={id || i}
              style={styles.serviceCard}
              onClick={() => {
                navigate(`/prime-categories/${id}`);
              }}
            >
              <img src={s.imageUrl || noImage} alt="s" style={styles.sImg} />
              <div style={{ padding: "18px", textAlign: "center" }}>
                <h4 style={{ margin: "0 0 5px 0", color: "#000", fontWeight: "900" }}>{s.name}</h4>
                <p style={styles.badgeSvc}>Order {s.orderno}</p>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFormData({ orderno: s.orderno, name: s.name, imageUrl: s.imageUrl }); setEditId(id); window.scrollTo(0, 0); }} style={styles.editBtn}>EDIT</button>
                  <button onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (window.confirm("Delete this Prime Service and all its categories?")) {
                      try {
                        await axios.delete(`${API_URL}/${id}`);
                        alert("✅ Service Deleted!");
                        fetchServices();
                      } catch (err) {
                        alert("❌ Error: " + (err.response?.data?.message || err.message));
                      }
                    }
                  }} style={styles.delBtn}>DEL</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: "40px", maxWidth: "1350px", margin: "0 auto", backgroundColor: "#fff", fontFamily: "'Inter', sans-serif" },
  mainTitle: { borderLeft: "6px solid #ffc400", paddingLeft: "15px", marginBottom: "30px", fontWeight: "900", color: "#000", fontSize: "28px" },
  formBox: { background: "#fff", padding: "30px", borderRadius: "20px", border: "1px solid #f1f5f9", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", marginBottom: "40px" },
  form: { display: "flex", flexDirection: "column", gap: "24px" },
  section: { background: "#f8fafc", padding: "20px", borderRadius: "16px", border: "1px solid #edf2f7" },
  sectionLabel: { fontSize: "11px", fontWeight: "800", color: "#64748b", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.05em" },
  flexGroup: { display: "flex", gap: "10px", alignItems: "center" },
  previewRow: { display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "14px" },
  previewThumb: { position: "relative", width: "90px", height: "70px", borderRadius: "10px", overflow: "hidden", border: "2px solid #e2e8f0" },
  thumbImg: { width: "100%", height: "100%", objectFit: "cover" },
  removeThumb: { position: "absolute", top: "3px", right: "3px", background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "50%", width: "18px", height: "18px", fontSize: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  uploadFileBtn: { background: "#000", color: "#fff", padding: "10px 20px", borderRadius: "10px", fontSize: "12px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap" },
  inputSmall: { flex: 1, padding: "10px 14px", border: "1px solid #edf2f7", borderRadius: "10px", fontSize: "13px", outline: "none", background: "#fff" },
  removeBtn: { background: "#fff1f2", color: "#e11d48", border: "1px solid #fee2e2", padding: "8px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" },
  addLinkBtn: { background: "transparent", border: "1.5px dashed #94a3b8", color: "#64748b", padding: "8px 18px", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer", marginTop: "4px" },
  submitBtn: { background: "#ffc400", color: "#000", padding: "15px 30px", border: "none", borderRadius: "12px", fontWeight: "900", cursor: "pointer", fontSize: "15px" },
  cancelBtn: { background: "#f1f5f9", color: "#475569", padding: "15px 25px", border: "none", borderRadius: "12px", fontWeight: "800", cursor: "pointer", fontSize: "14px" },
  listGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "25px", marginBottom: "40px" },
  adCard: { background: "#fff", borderRadius: "15px", overflow: "hidden", border: "1px solid #f1f5f9", boxShadow: "0 5px 15px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column" },
  imgStrip: { display: "flex", gap: "3px", height: "140px", overflow: "hidden", background: "#111" },
  stripImg: { flex: 1, minWidth: 0, height: "100%", objectFit: "cover" },
  noMediaStub: { height: "140px", display: "flex", alignItems: "center", justifyContent: "center", color: "#555", fontSize: "13px", fontWeight: "700", background: "#1a1a1a" },
  cardMeta: { padding: "10px 12px 4px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  badge: { background: "#ffc400", color: "#000", padding: "3px 10px", borderRadius: "20px", fontSize: "10px", fontWeight: "800" },
  countBadge: { color: "#94a3b8", fontSize: "10px", fontWeight: "600" },
  actionBox: { padding: "10px 12px 12px", display: "flex", gap: "10px" },
  tinyEdit: { flex: 1, background: "#f8fafc", border: "1px solid #e2e8f0", padding: "10px", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer", textAlign: "center" },
  tinyDel: { flex: 1, background: "#fff5f5", color: "#c53030", border: "1px solid #fed7d7", padding: "10px", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer", textAlign: "center" },
  serviceGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "35px" },
  serviceCard: { background: "#fff", borderRadius: "24px", overflow: "hidden", border: "1px solid #f1f5f9", boxShadow: "0 8px 16px rgba(0,0,0,0.04)", cursor: "pointer" },
  sImg: { width: "100%", height: "220px", objectFit: "cover" },
  badgeSvc: { fontSize: "11px", background: "#f1f5f9", color: "#64748b", display: "inline-block", padding: "4px 12px", borderRadius: "20px", marginBottom: "15px" },
  editBtn: { flex: 1, background: "#ffc400", padding: "14px", borderRadius: "10px", fontWeight: "800", border: "none", cursor: "pointer" },
  delBtn: { flex: 1, background: "#f44336", color: "#fff", padding: "14px", borderRadius: "10px", fontWeight: "800", border: "none", cursor: "pointer" },
  inputStyle: { padding: "14px 18px", border: "1px solid #cbd5e0", borderRadius: "12px", width: "100%", boxSizing: "border-box", outline: "none" },
  uploadBtnSvc: { background: "#000", color: "#fff", padding: "14px 25px", borderRadius: "12px", fontSize: "12px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap" },
};

export default PrimeService;
