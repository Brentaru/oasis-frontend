import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProfileMenu from '../components/ProfileMenu';
import {
  fetchChapterNavigation,
  fetchChapterPages,
  fetchChapters,
  fetchSeriesDetails,
  isMangaDexSeries
} from '../sourceApi';
import { saveHistoryRemote } from '../readingStore';
import { getStoredAuth } from '../authSession';
import { fetchJson } from '../apiConfig';
import './Reader.css';

function Reader() {
  const params = useParams();
  const seriesId = decodeURIComponent(params.seriesId);
  const chapterId = decodeURIComponent(params.chapterId);
  const navigate = useNavigate();

  const [series, setSeries] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [pages, setPages] = useState([]);
  const [navigation, setNavigation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [readingMode, setReadingMode] = useState(() => localStorage.getItem('oasis.readingMode') || 'vertical');
  const [pageIndex, setPageIndex] = useState(0);
  const [zoom, setZoom] = useState(() => Number(localStorage.getItem('oasis.readerZoom') || 100));

  const userId = getStoredAuth().userId;

  useEffect(() => {
    fetchReaderData();
  }, [seriesId, chapterId]);

  const fetchReaderData = async () => {
    setLoading(true);
    try {
      const [seriesData, chaptersData, pagesData, navData] = await Promise.all([
        fetchSeriesDetails(seriesId),
        fetchChapters(seriesId),
        fetchChapterPages(seriesId, chapterId),
        fetchChapterNavigation(seriesId, chapterId)
      ]);

      setSeries(seriesData);
      setChapters(chaptersData);
      setPages(pagesData);
      setNavigation(navData);
      setPageIndex(0);

      const current = chaptersData.find(ch => ch.chapterId == chapterId);
      saveHistoryRemote({
        seriesId,
        sourceId: seriesData.sourceId,
        chapterId,
        chapterNumber: current?.chapterNumber || 1,
        chapterTitle: current?.title || '',
        totalChapters: seriesData.totalChapters || chaptersData.length,
        title: seriesData.title,
        coverImage: seriesData.coverImage,
        genre: seriesData.genre,
        status: seriesData.status,
        source: seriesData.source,
        lastReadPage: 1
      }).catch((err) => console.error('Error saving history:', err));

      saveProgress(chaptersData);

    } catch (err) {
      console.error('Error fetching reader data:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = async (chapterList) => {
    if (isMangaDexSeries(seriesId) || !userId) {
      return;
    }

    try {
      const currentChapter = chapterList.find(ch => ch.chapterId == chapterId);
      const chapterNumber = currentChapter?.chapterNumber || 1;

      await fetchJson(`/reader/progress/${userId}/${seriesId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId: parseInt(chapterId),
          chapterNumber: chapterNumber,
          lastReadPage: 1
        })
      });
    } catch (err) {
      console.error('Error saving progress:', err);
    }
  };

  const handlePrevChapter = () => {
    if (navigation?.previousChapterId) {
      navigate(`/reader/${encodeURIComponent(seriesId)}/${encodeURIComponent(navigation.previousChapterId)}`);
    }
  };

  const handleNextChapter = () => {
    if (navigation?.nextChapterId) {
      navigate(`/reader/${encodeURIComponent(seriesId)}/${encodeURIComponent(navigation.nextChapterId)}`);
    }
  };

  const handleChapterSelect = (selectedChapterId) => {
    setDropdownOpen(false);
    navigate(`/reader/${encodeURIComponent(seriesId)}/${encodeURIComponent(selectedChapterId)}`);
  };

  const handleModeChange = (mode) => {
    setReadingMode(mode);
    localStorage.setItem('oasis.readingMode', mode);
    setPageIndex(0);
  };

  const handleNextPage = () => {
    setPageIndex((current) => Math.min(lastPageIndex(), current + 1));
  };

  const handleZoomChange = (nextZoom) => {
    const safeZoom = Math.max(80, Math.min(200, nextZoom));
    setZoom(safeZoom);
    localStorage.setItem('oasis.readerZoom', String(safeZoom));
  };

  const lastPageIndex = () => Math.max(0, pages.length - 1);

  const handlePrevPage = () => {
    setPageIndex((current) => Math.max(0, current - 1));
  };

  const pageProgress = pages.length === 0 ? 0 : ((Math.min(pageIndex + 1, pages.length)) / pages.length) * 100;

  const currentChapter = chapters.find(ch => ch.chapterId == chapterId);
  const chapterNumber = currentChapter?.chapterNumber || 1;

  return (
    <div className="reader-page">
      <nav className="reader-topnav">
        <div className="reader-brand" onClick={() => navigate('/dashboard')}>
          <span className="reader-brand-dot"></span>
          <span>Oasis</span>
        </div>
        <div className="reader-nav-links">
          <button onClick={() => navigate('/dashboard')}>Home</button>
          <button onClick={() => navigate('/library')}>Library</button>
          <button onClick={() => navigate('/browse')}>Browse</button>
        </div>
        <ProfileMenu compact />
      </nav>

      <div className="reader-toolbar">
        <button
          className="toolbar-back"
          onClick={() => navigate(`/library/${encodeURIComponent(seriesId)}`)}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.42-1.41L7.83 13H20v-2z"/>
          </svg>
          Back
        </button>

        <button
          className="toolbar-icon-btn"
          onClick={handlePrevChapter}
          disabled={!navigation?.previousChapterId}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
          </svg>
        </button>

        <div className="chapter-selector">
          <button
            className="title-pill"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <span className="title-pill-name">{series?.title || 'Loading...'}</span>
            <span className="title-pill-separator"></span>
            <span className="chapter-label">Chapter {chapterNumber} ▾</span>
          </button>

          {dropdownOpen && (
            <div className="chapter-dropdown">
              {chapters.map((ch) => (
                <button
                  key={ch.chapterId}
                  className={`dropdown-item ${ch.chapterId == chapterId ? 'active' : ''}`}
                  onClick={() => handleChapterSelect(ch.chapterId)}
                >
                  Chapter {ch.chapterNumber}
                  {ch.title && ` - ${ch.title}`}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          className="toolbar-icon-btn"
          onClick={handleNextChapter}
          disabled={!navigation?.nextChapterId}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
          </svg>
        </button>

        <span className="toolbar-spacer"></span>

        <div className="reader-mode-toggle">
          <button
            className={readingMode === 'vertical' ? 'active' : ''}
            onClick={() => handleModeChange('vertical')}
          >
            Vertical
          </button>
          <button
            className={readingMode === 'single' ? 'active' : ''}
            onClick={() => handleModeChange('single')}
          >
            Page
          </button>
        </div>

        <div className="zoom-control">
          <button onClick={() => handleZoomChange(zoom - 10)}>-</button>
          <span>{zoom}%</span>
          <button onClick={() => handleZoomChange(zoom + 10)}>+</button>
        </div>
      </div>

      <div className={`reader-body ${readingMode === 'vertical' ? 'vertical-mode' : 'page-mode'}`}>
        {loading ? (
          <div className="reader-loading">Loading chapter...</div>
        ) : pages.length === 0 ? (
          <div className="reader-empty">No pages available</div>
        ) : readingMode === 'single' ? (
          <>
            <button className="floating-page-arrow left" onClick={handlePrevPage} disabled={pageIndex === 0}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
            </button>
            <div className="single-page-view" style={{ '--reader-zoom': zoom }}>
              <img
                src={pages[pageIndex].imageUrl}
                alt={`Page ${pages[pageIndex].pageNumber}`}
                className="reader-page-image"
              />
            </div>
            <button className="floating-page-arrow right" onClick={handleNextPage} disabled={pageIndex >= lastPageIndex()}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="m8.59 16.59 1.41 1.41 6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </>
        ) : (
          <div className="vertical-pages" style={{ '--reader-zoom': zoom }}>
            {pages.map((page) => (
              <img
                key={page.pageId}
                src={page.imageUrl}
                alt={`Page ${page.pageNumber}`}
                className="reader-page-image"
              />
            ))}
          </div>
        )}
      </div>

      <div className="reader-status-bar">
        <div className="reader-progress">
          <span style={{ width: `${pageProgress}%` }}></span>
        </div>
        <div className="reader-page-pill">
          Page {Math.min(pageIndex + 1, pages.length || 1)} / {pages.length || 1}
        </div>
      </div>

      <div className="chapter-footer">
        <button
          className="chapter-footer-prev"
          onClick={handlePrevChapter}
          disabled={!navigation?.previousChapterId}
        >
          Previous chapter
        </button>
        <button
          className="chapter-footer-next"
          onClick={handleNextChapter}
          disabled={!navigation?.nextChapterId}
        >
          Next chapter
        </button>
      </div>
    </div>
  );
}

export default Reader;
