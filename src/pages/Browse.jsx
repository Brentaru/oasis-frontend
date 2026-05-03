import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { fetchMangaDexSeries } from '../sourceApi';
import { fetchBookmarks, saveBookmarkRemote, isBookmarked } from '../readingStore';
import './Library.css';

function Browse() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [seriesList, setSeriesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [contentRating, setContentRating] = useState('safe,suggestive');
  const [order, setOrder] = useState('followedCount');
  const [genre, setGenre] = useState('all');

  useEffect(() => {
    fetchBookmarks().catch((error) => console.error('Unable to load saved titles:', error));
    loadSeries('', { status, contentRating, order });
  }, []);

  const loadSeries = async (nextQuery, nextFilters = { status, contentRating, order }) => {
    setLoading(true);

    try {
      const data = await fetchMangaDexSeries(nextQuery, 36, nextFilters);
      setSeriesList(filterByGenre(data, nextFilters.genre || genre));
    } catch (err) {
      console.error('Error browsing MangaDex:', err);
      setSeriesList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    loadSeries(query, { status, contentRating, order, genre });
  };

  const handleSeriesClick = (seriesId) => {
    navigate(`/library/${encodeURIComponent(seriesId)}`);
  };

  const handleSave = async (event, series) => {
    event.stopPropagation();
    await saveBookmarkRemote(series);
    setSeriesList((items) => [...items]);
  };

  return (
    <div className="library-page">
      <Navbar />

      <main className="library-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Browse</h1>
            <p className="page-subtitle">Search MangaDex titles and save the ones you want in your library.</p>
          </div>
        </div>

        <form className="browse-search" onSubmit={handleSubmit}>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search manga, manhwa, or manhua"
            className="browse-input"
          />
          <button className="browse-button" type="submit">Search</button>
        </form>

        <div className="browse-filters">
          <label>
            <span>Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">All</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="hiatus">Hiatus</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
          <label>
            <span>Rating</span>
            <select value={contentRating} onChange={(event) => setContentRating(event.target.value)}>
              <option value="safe,suggestive">Safe + Suggestive</option>
              <option value="safe">Safe only</option>
              <option value="safe,suggestive,erotica">Include erotica</option>
            </select>
          </label>
          <label>
            <span>Sort</span>
            <select value={order} onChange={(event) => setOrder(event.target.value)}>
              <option value="followedCount">Popular</option>
              <option value="latestUploadedChapter">Latest chapter</option>
              <option value="updatedAt">Recently updated</option>
              <option value="createdAt">New titles</option>
              <option value="title">Title</option>
            </select>
          </label>
          <label>
            <span>Genre</span>
            <select value={genre} onChange={(event) => setGenre(event.target.value)}>
              <option value="all">All</option>
              <option value="Action">Action</option>
              <option value="Adventure">Adventure</option>
              <option value="Comedy">Comedy</option>
              <option value="Drama">Drama</option>
              <option value="Fantasy">Fantasy</option>
              <option value="Isekai">Isekai</option>
              <option value="Romance">Romance</option>
              <option value="Slice of Life">Slice of Life</option>
              <option value="Supernatural">Supernatural</option>
            </select>
          </label>
          <button
            type="button"
            className="filter-apply"
            onClick={() => loadSeries(query, { status, contentRating, order, genre })}
          >
            Apply
          </button>
        </div>

        {loading && (
          <div className="library-loading">Loading...</div>
        )}

        {!loading && (
          <div className="series-grid">
            {seriesList.length === 0 ? (
              <div className="no-series">No source titles found</div>
            ) : (
              seriesList.map((series) => (
                <div
                  key={series.seriesId}
                  className="series-card"
                  onClick={() => handleSeriesClick(series.seriesId)}
                >
                  <div className="source-badge">{series.source}</div>
                  <button
                    className={`quick-save ${isBookmarked(series.seriesId) ? 'saved' : ''}`}
                    onClick={(event) => handleSave(event, series)}
                    title="Save to library"
                  >
                    {isBookmarked(series.seriesId) ? 'Saved' : 'Save'}
                  </button>
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
                  <div className="series-info">
                    <h3 className="series-title">{series.title}</h3>
                    <p className="series-chapter">{series.genres?.slice(0, 2).join(', ') || series.genre || 'Source title'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function filterByGenre(items, genre) {
  if (!genre || genre === 'all') {
    return items;
  }

  return items.filter((item) => {
    return item.genres?.some((entry) => entry.toLowerCase() === genre.toLowerCase());
  });
}

export default Browse;
