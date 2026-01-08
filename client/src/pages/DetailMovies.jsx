import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./DetailMovies.css";

const DetailMovies = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("episodes");
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:5000/api/movie/${id}`)
      .then(res => res.json())
      .then(json => {
        setData(json);
        // Set tập phim đầu tiên làm mặc định
        if (json.episodes && json.episodes.length > 0) {
          setSelectedEpisode(json.episodes[0].episode_number);
        }
        setLoading(false);
      })
      .catch(err => {
        setError("Không thể tải dữ liệu phim");
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div style={{color:'#fff',textAlign:'center',marginTop:60}}>Đang tải dữ liệu phim...</div>;
  if (error || !data) return <div style={{color:'#fff',textAlign:'center',marginTop:60}}>{error || "Không tìm thấy phim"}</div>;

  // Thêm hàm xử lý click thể loại
  const handleGenreClick = (genre) => {
    navigate(`/movies?genre=${encodeURIComponent(genre)}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="detail-movies-bg">
      <div className="detail-movies-container">
        <div className="detail-movies-banner" style={{backgroundImage: `url('${data.bg_url || data.poster_url}')`, backgroundPosition: 'center', backgroundSize: 'cover', backgroundRepeat: 'no-repeat'}}>
          <div className="detail-movies-banner-overlay">
            <div className="detail-movies-content">
              <div className="detail-movies-poster-section">
                <img className="detail-movies-poster" src={data.poster_url} alt={data.title} />
                <div className="detail-movies-info">
                  <h2 className="detail-movies-title">{data.title}</h2>
                  <div className="detail-movies-badges">
                    {data.age_limit && <span className="badge badge-age">{data.age_limit}</span>}
                    {data.release_year && <span className="badge">{data.release_year}</span>}
                    {data.duration && <span className="badge">{data.duration}</span>}
                  </div>
                  <div className="detail-movies-meta">
                    {data.genres && data.genres.map((g, i) => (
                      <span className="detail-movies-tag" key={i} onClick={() => handleGenreClick(g)} style={{ cursor: 'pointer' }}>{g}</span>
                    ))}
                  </div>
                  {/* Thông tin thêm */}
                  <div className="detail-movies-extra-info">
                    {data.duration && <div><span className="extra-label">Thời lượng:</span> {data.duration}</div>}
                    {data.countries && <div><span className="extra-label">Quốc gia:</span> {data.countries.join(', ')}</div>}
                    {data.producers && <div><span className="extra-label">Sản xuất:</span> {data.producers.join(', ')}</div>}
                    {data.directors && <div><span className="extra-label">Đạo diễn:</span> {data.directors.join(', ')}</div>}
                  </div>
                  <div style={{marginBottom: 0}}>
                    <div className={`detail-movies-desc${expanded ? ' expanded' : ''}`}>
                      <span style={{color:'#fff', fontWeight:500, }}>Giới thiệu: </span>
                      <span style={{whiteSpace:'pre-line'}}>{data.description}</span>
                    </div>
                    <button
                      className={`show-more-btn${expanded ? ' collapse' : ' inline'}`}
                      onClick={() => setExpanded(e => !e)}
                      tabIndex={0}
                      style={{marginTop: 4, marginLeft: 0, display: 'inline-block'}}
                    >
                      {expanded ? 'Thu gọn' : 'Hiển thị thêm'}
                      <span style={{fontSize:'1.1em', marginLeft:2, fontWeight:700}}>{expanded ? '▲' : '▼'}</span>
                    </button>
                  </div>
                  <div className="detail-movies-actions-row">
                    <button 
                      className="detail-movies-watch-btn"
                      onClick={() => navigate(`/watch/${id}${selectedEpisode > 1 ? `?ep=${selectedEpisode}` : ''}`)}
                    >
                      Xem Ngay
                    </button>
                    <button className="action-btn"><span className="action-icon">❤</span><span>Yêu thích</span></button>
                    <button className="action-btn"><span className="action-icon">＋</span><span>Thêm vào</span></button>
                    <button className="action-btn"><span className="action-icon" style={{lineHeight:0}}>
                      <svg width="36" height="36" viewBox="0 0 240 240" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="120" cy="120" r="120" fill="none"/>
                        <path d="M54 120.5l131.5-54.5c6.5-2.5 12.5 1.5 10.5 9.5l-22.5 105c-1.5 6.5-6 8-12 5.5l-33-24-16 15.5c-1.5 1.5-2.5 2.5-5.5 2.5l2-34 62-56c2.5-2-0.5-3-4-1l-77 48-33-10.5c-7-2-7-7-1.5-9.5z"/>
                      </svg>
                    </span><span>Chia sẻ</span></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="detail-movies-tabs">
          <button className={activeTab === "episodes" ? "active" : ""} onClick={() => setActiveTab("episodes")}>Tập phim</button>
          <button className={activeTab === "actors" ? "active" : ""} onClick={() => setActiveTab("actors")}>Diễn viên</button>
          <button className={activeTab === "suggested" ? "active" : ""} onClick={() => setActiveTab("suggested")}>Đề xuất</button>
        </div>
        {activeTab === "episodes" && (
          <div className="episode-list">
            {data.episodes && data.episodes.length > 0 ? data.episodes.map((ep, i) => (
              <button
                key={i}
                className={`episode-btn${selectedEpisode === ep.episode_number ? ' active' : ''}`}
                onClick={() => {
                  setSelectedEpisode(ep.episode_number);
                  navigate(`/watch/${id}?ep=${ep.episode_number}`);
                }}
              >
                <span className="episode-icon" style={{display:'flex',alignItems:'center'}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" style={{display:'block'}}>
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </span> Tập {ep.episode_number}
              </button>
            )) : <div style={{color:'#fff',margin:'24px 0'}}>Chưa có tập phim</div>}
          </div>
        )}
        {activeTab === "actors" && (
          <div className="actor-list">
            {data.actors && data.actors.length > 0 ? data.actors.map((actor, idx) => (
              <div className="actor-card" key={idx}>
                <img className="actor-img" src={actor.profile_pic_url} alt={actor.name} />
                <div className="actor-name">{actor.name}</div>
              </div>
            )) : <div style={{color:'#fff',margin:'24px 0'}}>Chưa có diễn viên</div>}
          </div>
        )}
        {activeTab === "suggested" && (
          <div style={{ margin: '40px 0 0 0' }}>
            {data.suggested && data.suggested.length > 0 ? (
              <div style={{ width: '100%' }}>
                <div className="movies-list">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px 0' }}>
                    {data.suggested.map((movie, idx) => (
                      <div
                        className="movies-card-suggest movies-card-item"
                        key={movie.id ? `movie-${movie.id}` : `idx-${idx}`}
                        style={{ width: 200, margin: '0 12px 32px 12px', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                        onClick={() => navigate(`/movies/${movie.id}`)}
                      >
                        <div className="movies-card-imgbox">
                          <img
                            src={movie.poster_url}
                            alt={movie.title}
                            className="movies-card-img"
                          />
                          {movie.badge && (
                            <span className={`movies-badge movies-badge-${movie.badge}`}>{movie.badge}</span>
                          )}
                        </div>
                        <div className="movies-card-content">
                          <div className="movies-card-title">{movie.title}</div>
                          {movie.original_title && movie.original_title !== movie.title && (
                            <div className="movies-card-original">{movie.original_title}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: '#bdbdbd', fontSize: 22, fontWeight: 500, textAlign: 'center' }}>Không có đề xuất</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailMovies; 