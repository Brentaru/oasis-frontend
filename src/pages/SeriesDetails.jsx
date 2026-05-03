import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { fetchChapters, fetchSeriesDetails as fetchSourceSeriesDetails } from '../sourceApi';
import { fetchBookmarks, fetchHistory, getHistory, isBookmarked, toggleBookmarkRemote } from '../readingStore';
import './SeriesDetails.css';

function SeriesDetails() {
  const params = useParams();
  const seriesId = decodeURIComponent(params.seriesId);
  const navigate = useNavigate();
  const [series, setSeries] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSeriesDetails();
  }, [seriesId]);

  const loadSeriesDetails = async () => {
    setLoading(true);
    setError('');

    try {
      const seriesData = await fetchSourceSeriesDetails(seriesId);
      setSeries(seriesData);
      const [savedTitles] = await Promise.all([
        fetchBookmarks(),
        fetchHistory()
      ]);
      setSaved(savedTitles.some((item) => item.seriesId === seriesId) || isBookmarked(seriesId));

      const chaptersData = await fetchChapters(seriesId);
      const sortedChapters = chaptersData.sort((a, b) => b.chapterNumber - a.chapterNumber);
      setChapters(sortedChapters);
    } catch (err) {
      console.error('Error fetching series:', err);
      setError('Could not load series details');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/library');
  };

  // Calculate progress percentage
  const getProgressPercent = () => {
    if (!series || !series.totalChapters) return 0;
    const lastHistory = getHistory().find((item) => item.seriesId === seriesId);
    const current = lastHistory?.chapterNumber || series.currentChapter || 0;
    return (current / series.totalChapters) * 100;
  };

  if (loading) {
    return (
      <div className="seriesdetails-page">
        <Navbar />
        <div className="seriesdetails-loading">Loading...</div>
      </div>
    );
  }

  if (error || !series) {
    return (
      <div className="seriesdetails-page">
        <Navbar />
        <div className="seriesdetails-container">
          <div className="seriesdetails-error">
            <p>{error || 'Series not found'}</p>
            <button className="btn btn-primary" onClick={handleBack}>
              Back to Library
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalChapters = series.totalChapters || chapters.length;
  const lastHistory = getHistory().find((item) => item.seriesId === seriesId);
  const currentChapter = lastHistory?.chapterNumber || series.currentChapter || 0;
  const firstChapterData = chapters.length > 0 ? chapters[chapters.length - 1] : null;
  const latestChapterData = chapters.length > 0 ? chapters[0] : null;

  // Get chapter ID for continue reading
  const getContinueChapterId = () => {
    if (currentChapter > 0) {
      const ch = chapters.find(c => c.chapterNumber === currentChapter);
      return ch?.chapterId || firstChapterData?.chapterId || 1;
    }
    return firstChapterData?.chapterId || 1;
  };

  const handleReadChapter = (chapterId) => {
    navigate(`/reader/${encodeURIComponent(seriesId)}/${encodeURIComponent(chapterId)}`);
  };

  const handleToggleSave = async () => {
    const result = await toggleBookmarkRemote(series);
    setSaved(result.saved);
  };

  return (
    <div className="seriesdetails-page">
      <Navbar />

      <div className="seriesdetails-container">
        <div className="series-content">
          {/* Left Side - Cover and Buttons */}
          <div className="series-left">
            <div className="series-cover-wrapper">
              {series.coverImage ? (
                <img src={series.coverImage} alt={series.title} className="series-cover-img" />
              ) : (
                <div className="cover-placeholder">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
                  </svg>
                </div>
              )}
            </div>

            <div className="series-actions">
              <button
                className="btn btn-primary btn-full"
                onClick={() => handleReadChapter(getContinueChapterId())}
              >
                Continue Ch. {currentChapter || 1}
              </button>
              <button
                className="btn btn-outline btn-full"
                onClick={handleToggleSave}
              >
                {saved ? 'Saved in Library' : 'Save to Library'}
              </button>
              {firstChapterData && (
                <button
                  className="btn btn-outline btn-full"
                  onClick={() => handleReadChapter(firstChapterData.chapterId)}
                >
                  First Chapter - Chapter {firstChapterData.chapterNumber}
                </button>
              )}
              {latestChapterData && (
                <button
                  className="btn btn-outline btn-full"
                  onClick={() => handleReadChapter(latestChapterData.chapterId)}
                >
                  New Chapter - Chapter {latestChapterData.chapterNumber}
                </button>
              )}
            </div>
          </div>

          {/* Right Side - Info and Chapters */}
          <div className="series-right">
            <h1 className="series-title">{series.title}</h1>

            <div className="series-facts">
              {series.author && <span>Author: {series.author}</span>}
              {series.artist && <span>Artist: {series.artist}</span>}
              {series.status && <span>Status: {series.status}</span>}
              {series.year && <span>Year: {series.year}</span>}
              {series.contentRating && <span>Rating: {series.contentRating}</span>}
            </div>

            {(series.genres?.length > 0 || series.genre) && (
              <div className="genre-list">
                {(series.genres?.length ? series.genres : [series.genre]).map((genre) => (
                  <span key={genre}>{genre}</span>
                ))}
              </div>
            )}

            {series.description && (
              <p className="series-description">{series.description}</p>
            )}

            <p className="series-meta">
              {totalChapters} Chapters - Updated {series.updatedAgo || 'recently'}
            </p>

            {/* Progress Section */}
            <div className="progress-section">
              <div className="progress-header">
                <span className="progress-label">Your Progress</span>
                <span className="progress-count">{currentChapter} / {totalChapters} chapters</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${getProgressPercent()}%` }}
                ></div>
              </div>
            </div>

            {/* Chapters Section */}
            <div className="chapters-section">
              <h2 className="chapters-title">Chapters</h2>

              {chapters.length === 0 ? (
                <p className="no-chapters">No chapters available</p>
              ) : (
                <div className="chapters-list">
                  {chapters.map((chapter) => (
                    <div
                      key={chapter.chapterId}
                      className="chapter-item"
                      onClick={() => handleReadChapter(chapter.chapterId)}
                    >
                      <span className="chapter-name">
                        Chapter {chapter.chapterNumber}
                        {chapter.title && ` - ${chapter.title}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SeriesDetails;
