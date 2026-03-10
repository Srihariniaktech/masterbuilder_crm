import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Advertisement.css";

const API_URL = "https://masterbuilder-backend.onrender.com/api/advertisements";

// Helper: extract URL string from either a string or { url, key } object
// Also strips extra surrounding quotes that the backend sometimes stores
const getUrl = (val) => {
    if (!val) return "";
    let str = "";
    if (typeof val === "string") str = val;
    else if (typeof val === "object" && val.url) str = val.url;
    // Remove leading/trailing escaped quotes (e.g. `"https://..."` -> `https://...`)
    return str.replace(/^"|"$/g, "").trim();
};

const Advertisement = () => {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeVideo, setActiveVideo] = useState(null);

    useEffect(() => {
        const fetchAds = async () => {
            try {
                const response = await axios.get(API_URL);
                const data = Array.isArray(response.data) ? response.data : [response.data];
                setAds(data.filter(ad => getUrl(ad.imageUrl) || getUrl(ad.videoUrl)));
            } catch (error) {
                console.error("Error fetching advertisements:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAds();
    }, []);

    const getYouTubeID = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    if (loading) return <div className="ad-skeleton">Loading Advertisements...</div>;
    if (ads.length === 0) return null;

    return (
        <div className="ads-section">
            <div className="ads-grid">
                {ads.map((ad, index) => {
                    const imgUrl = getUrl(ad.imageUrl);
                    const vidUrl = getUrl(ad.videoUrl);

                    return (
                        <div key={ad._id || ad.id || index} className="advertisement-container">
                            <div
                                className="ad-banner"
                                style={{ backgroundImage: `url(${imgUrl || 'https://via.placeholder.com/800x300?text=No+Image'})` }}
                            >
                                <div className="ad-overlay">
                                    <div className="ad-content">
                                        <h2>{ad.title || "Special Promotion"}</h2>
                                        <p>Discover our latest builds and premium services.</p>
                                        {vidUrl && (
                                            <button className="play-btn" onClick={() => setActiveVideo(vidUrl)}>
                                                <span className="play-icon">▶</span> Watch Video
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {activeVideo && (
                <div className="video-modal" onClick={() => setActiveVideo(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setActiveVideo(null)}>&times;</button>
                        {getYouTubeID(activeVideo) ? (
                            <iframe
                                width="100%"
                                height="500"
                                src={`https://www.youtube.com/embed/${getYouTubeID(activeVideo)}?autoplay=1`}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title="YouTube Video"
                            />
                        ) : (
                            <video controls autoPlay className="ad-video">
                                <source src={activeVideo} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Advertisement;
