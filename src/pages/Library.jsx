import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { fetchBookmarks, fetchHistory, removeBookmarkRemote } from '../readingStore';
import './Library.css';

function Library() {
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState([]);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState('saved');

  async function loadLibrary() {
    try {
      const [savedTitles, recentHistory] = await Promise.all([
        fetchBookmarks(),
        fetchHistory()
      ]);
      setBookmarks(savedTitles);
      setHistory(recentHistory);
    } catch (error) {
      console.error('Unable to load library:', error);
    }
  }

  useEffect(() => {
    loadLibrary();
  }, []);

  const openSeries = (seriesId) => {
    navigate(`/library/${encodeURIComponent(seriesId)}`);
  };

  const openReader = (item) => {
    navigate(`/reader/${encodeURIComponent(item.seriesId)}/${encodeURIComponent(item.chapterId)}`);
  };

  const handleRemove = async (event, seriesId) => {
    event.stopPropagation();
    setBookmarks(await removeBookmarkRemote(seriesId));
  };

  return (
    <div className="library-page">
      <Navbar />

      <main className="library-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Library</h1>
            <p className="page-subtitle">Saved titles and recent chapters from your account.</p>
          </div>
          <button className="browse-button" onClick={() => navigate('/browse')}>Browse</button>
        </div>

        <div className="library-tabs">
          <button className={tab === 'saved' ? 'active' : ''} onClick={() => setTab('saved')}>
            Saved
          </button>
          <button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>
            History
          </button>
        </div>

        {tab === 'saved' && (
          bookmarks.length === 0 ? (
            <div className="no-series">
              <p>No saved titles yet.</p>
              <button className="browse-button" onClick={() => navigate('/browse')}>Find titles</button>
            </div>
          ) : (
            <div className="series-grid">
              {bookmarks.map((series) => (
                <article
                  key={series.seriesId}
                  className="series-card"
                  onClick={() => openSeries(series.seriesId)}
                >
                  <div className="source-badge">{series.source || 'local'}</div>
                  <button
                    className="card-remove"
                    onClick={(event) => handleRemove(event, series.seriesId)}
                    title="Remove from library"
                  >
                    x
                  </button>
                  <SeriesCover series={series} />
                  <div className="series-info">
                    <h3 className="series-title">{series.title}</h3>
                    <p className="series-chapter">{series.genre || series.status || 'Saved title'}</p>
                  </div>
                </article>
              ))}
            </div>
          )
        )}

        {tab === 'history' && (
          history.length === 0 ? (
            <div className="no-series">No reading history yet.</div>
          ) : (
            <div className="history-stack">
              {history.map((item) => (
                <article
                  key={`${item.seriesId}-${item.chapterId}`}
                  className="library-history-row"
                >
                  <span className="history-thumb">
                    {item.coverImage && <img src={item.coverImage} alt={item.title} />}
                  </span>
                  <span className="history-copy">
                    <strong>{item.title}</strong>
                    <small>Chapter {item.chapterNumber || 1}{item.totalChapters ? ` / ${item.totalChapters}` : ''}</small>
                    <span className="history-progress">
                      <span style={{ width: `${historyPercent(item)}%` }}></span>
                    </span>
                  </span>
                  <span className="history-actions">
                    <button onClick={() => openSeries(item.seriesId)}>Details</button>
                    <button onClick={() => openReader(item)}>Resume</button>
                  </span>
                </article>
              ))}
            </div>
          )
        )}
      </main>
    </div>
  );
}

function historyPercent(item) {
  if (!item.totalChapters || !item.chapterNumber) {
    return 0;
  }

  return Math.min(100, Math.max(0, (item.chapterNumber / item.totalChapters) * 100));
}

function SeriesCover({ series }) {
  return (
    <div className="series-cover">
      {series.coverImage ? (
        <img src={series.coverImage} alt={series.title} />
      ) : (
        <div className="cover-placeholder">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
          </svg>
        </div>
      )}
    </div>
  );
}

export default Library;
