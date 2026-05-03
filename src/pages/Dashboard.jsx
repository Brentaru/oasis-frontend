import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { fetchMangaDexSeries } from '../sourceApi';
import { fetchBookmarks, fetchHistory } from '../readingStore';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState([]);
  const [history, setHistory] = useState([]);
  const [discover, setDiscover] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHome();
  }, []);

  const loadHome = async () => {
    setLoading(true);
    try {
      const [savedTitles, recentHistory, sourceTitles] = await Promise.all([
        fetchBookmarks(),
        fetchHistory(),
        fetchMangaDexSeries('', 12)
      ]);
      setBookmarks(savedTitles);
      setHistory(recentHistory);
      setDiscover(sourceTitles);
    } catch (err) {
      console.error('Error loading discover titles:', err);
      setDiscover([]);
    } finally {
      setLoading(false);
    }
  };

  const openSeries = (seriesId) => {
    navigate(`/library/${encodeURIComponent(seriesId)}`);
  };

  const openReader = (item) => {
    navigate(`/reader/${encodeURIComponent(item.seriesId)}/${encodeURIComponent(item.chapterId)}`);
  };

  const continueItem = history[0] || null;
  const savedPreview = bookmarks.slice(0, 6);
  const historyBySeries = new Map(history.map((item) => [item.seriesId, item]));

  return (
    <div className="dashboard">
      <Navbar />

      <main className="dashboard-container">
        {loading ? (
          <div className="dashboard-loading">Loading...</div>
        ) : (
          <>
            <section className="home-hero">
              <div>
                <p className="eyebrow">Oasis Reader</p>
                <h1 className="home-title">Pick up your reads or find something new.</h1>
                <p className="home-copy">
                  Saved titles and reading history sync with your Oasis account.
                </p>
              </div>

              <div className="hero-actions">
                <button className="btn btn-primary" onClick={() => navigate('/browse')}>
                  Browse sources
                </button>
                <button className="btn btn-outline" onClick={() => navigate('/library')}>
                  View library
                </button>
              </div>
            </section>

            {continueItem && (
              <section className="continue-panel" onClick={() => openSeries(continueItem.seriesId)}>
                <div className="continue-cover">
                  {continueItem.coverImage && <img src={continueItem.coverImage} alt={continueItem.title} />}
                </div>
                <div className="continue-info">
                  <span className="section-kicker">Continue reading</span>
                  <h2>{continueItem.title}</h2>
                  <p>Chapter {continueItem.chapterNumber || 1}</p>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={(event) => {
                    event.stopPropagation();
                    openReader(continueItem);
                  }}
                >
                  Resume
                </button>
              </section>
            )}

            <section className="home-section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Saved Library</h2>
                  <p className="section-subtitle">Titles you bookmarked from Browse.</p>
                </div>
                <button className="text-button" onClick={() => navigate('/library')}>View all</button>
              </div>

              {savedPreview.length === 0 ? (
                <EmptyState text="No saved titles yet. Browse a title and tap Save." action="Browse" onClick={() => navigate('/browse')} />
              ) : (
                <div className="compact-grid">
                  {savedPreview.map((item) => (
                    <TitleCard
                      key={item.seriesId}
                      item={item}
                      progress={historyBySeries.get(item.seriesId)}
                      onClick={() => openSeries(item.seriesId)}
                      onResume={openReader}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="home-section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Discover</h2>
                  <p className="section-subtitle">Popular source titles to start reading quickly.</p>
                </div>
                <button className="text-button" onClick={() => navigate('/browse')}>Search</button>
              </div>

              <div className="compact-grid">
                {discover.map((item) => (
                  <TitleCard key={item.seriesId} item={item} onClick={() => openSeries(item.seriesId)} />
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function TitleCard({ item, progress, onClick, onResume }) {
  return (
    <button className="title-card" onClick={onClick}>
      <span className="source-badge">{item.source || 'local'}</span>
      <span className="title-cover">
        {item.coverImage && <img src={item.coverImage} alt={item.title} />}
      </span>
      <span className="title-info">
        <strong>{item.title}</strong>
        <small>{progress ? `Chapter ${progress.chapterNumber || 1}` : (item.genres?.slice(0, 2).join(', ') || item.genre || 'Source title')}</small>
        {progress && (
          <span
            className="mini-resume"
            onClick={(event) => {
              event.stopPropagation();
              onResume(progress);
            }}
          >
            Resume
          </span>
        )}
      </span>
    </button>
  );
}

function EmptyState({ text, action, onClick }) {
  return (
    <div className="empty-state">
      <p>{text}</p>
      {action && <button className="btn btn-outline" onClick={onClick}>{action}</button>}
    </div>
  );
}

export default Dashboard;
