/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  X,
  Bookmark,
  Sparkles,
  Send,
  BookOpen,
  ChevronDown,
  Layers,
  GraduationCap,
  ExternalLink,
  Flame,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { Navbar } from './components/Navbar.tsx';
import { BatchCard } from './components/BatchCard.tsx';
import { CourseView } from './components/CourseView.tsx';
import { VideoPlayerModal } from './components/VideoPlayerModal.tsx';
import { PdfViewerModal } from './components/PdfViewerModal.tsx';
import { TelegramModal } from './components/TelegramModal.tsx';
import { AboutModal } from './components/AboutModal.tsx';
import type { Batch, ContentItem } from './types.ts';
import { TELEGRAM_URL, APP_ICON } from './utils/helpers.ts';
import localBatchesData from './data/batches.json';

const ITEMS_PER_PAGE = 12;

export default function App() {
  // Batches state (initialized from local JSON for instant paint, updated via API)
  const initialBatches: Batch[] = (localBatchesData.new || []) as Batch[];
  const [batches, setBatches] = useState<Batch[]>(initialBatches);
  const [loadingBatches, setLoadingBatches] = useState<boolean>(false);

  // Tabs: 'new' (all latest batches) or 'wishlist' (enrolled batches)
  const [currentTab, setCurrentTab] = useState<'new' | 'wishlist'>('new');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [displayedCount, setDisplayedCount] = useState<number>(ITEMS_PER_PAGE);

  // Enrolled list (persisted in localStorage)
  const [enrolledIds, setEnrolledIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('gbstudy_enrolled') || localStorage.getItem('studybee_wishlist');
      return saved ? JSON.parse(saved).map(String) : [];
    } catch {
      return [];
    }
  });

  // Navigation / Modal states
  const [activeBatch, setActiveBatch] = useState<Batch | null>(null);
  const [activeVideo, setActiveVideo] = useState<{
    item: ContentItem;
    playlist: ContentItem[];
  } | null>(null);
  const [activePdf, setActivePdf] = useState<{ url: string; title: string } | null>(null);
  const [showTelegramModal, setShowTelegramModal] = useState<boolean>(false);
  const [showAboutModal, setShowAboutModal] = useState<boolean>(false);

  // Auto-show Telegram Popup on initial visit as requested
  useEffect(() => {
    const hasSeen = sessionStorage.getItem('gbstudy_telegram_shown');
    if (!hasSeen) {
      const timer = setTimeout(() => {
        setShowTelegramModal(true);
        sessionStorage.setItem('gbstudy_telegram_shown', 'true');
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  // Fetch dynamic batches on mount
  useEffect(() => {
    async function loadBatches() {
      try {
        const res = await fetch('/api/batches');
        if (res.ok) {
          const data = await res.json();
          const list = [...(data.new || []), ...(data.old || [])];
          if (list.length > 0) {
            setBatches(list);
          }
        }
      } catch (err) {
        console.warn('Using local batches data:', err);
      } finally {
        setLoadingBatches(false);
      }
    }
    loadBatches();
  }, []);

  // Sync URL search params with active batch (support direct links & browser back)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get('id') || params.get('courseId');
    if (idParam && batches.length > 0) {
      const found = batches.find((b) => String(b.id) === String(idParam));
      if (found) setActiveBatch(found);
    }
  }, [batches]);

  // Toggle batch enrollment
  const handleToggleEnroll = (batchId: string | number) => {
    const idStr = String(batchId);
    setEnrolledIds((prev) => {
      const next = prev.includes(idStr)
        ? prev.filter((id) => id !== idStr)
        : [...prev, idStr];
      try {
        localStorage.setItem('gbstudy_enrolled', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Open batch
  const handleOpenBatch = (batch: Batch) => {
    setActiveBatch(batch);
    const url = new URL(window.location.href);
    url.searchParams.set('id', String(batch.id));
    window.history.pushState({}, '', url.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Back to home
  const handleBackToHome = () => {
    setActiveBatch(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('id');
    url.searchParams.delete('courseId');
    window.history.pushState({}, '', url.toString());
  };

  // Categories list
  const categories = [
    'All',
    'Maths Special',
    'English',
    'Reasoning',
    'GS & GK',
    'Science',
    'Railway & SSC',
    'Mastery & Computer'
  ];

  // Filter batches
  const filteredBatches = useMemo(() => {
    let list = batches;

    // Filter by tab
    if (currentTab === 'wishlist') {
      list = list.filter((b) => enrolledIds.includes(String(b.id)));
    }

    // Filter by category
    if (selectedCategory !== 'All') {
      const cat = selectedCategory.toLowerCase();
      list = list.filter((b) => {
        const title = b.title.toLowerCase();
        if (cat.includes('math')) return title.includes('math');
        if (cat.includes('english')) return title.includes('english') || title.includes('vocab') || title.includes('grammer') || title.includes('comprehension');
        if (cat.includes('reasoning')) return title.includes('reasoning');
        if (cat.includes('gs') || cat.includes('gk')) return title.includes('gs') || title.includes('gk');
        if (cat.includes('science')) return title.includes('science');
        if (cat.includes('railway') || cat.includes('ssc')) return title.includes('railway') || title.includes('vande') || title.includes('ssc') || title.includes('cgl') || title.includes('chsl') || title.includes('gd') || title.includes('upsi') || title.includes('police') || title.includes('pet');
        if (cat.includes('mastery') || cat.includes('computer')) return title.includes('computer') || title.includes('ai') || title.includes('graphic') || title.includes('editing');
        return true;
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((b) => b.title.toLowerCase().includes(q) || String(b.id).includes(q));
    }

    return list;
  }, [batches, currentTab, selectedCategory, searchQuery, enrolledIds]);

  const displayedBatches = filteredBatches.slice(0, displayedCount);

  // Video Playlist handlers
  const handlePlayVideo = (videoItem: ContentItem, playlist: ContentItem[]) => {
    setActiveVideo({ item: videoItem, playlist });
  };

  const currentVideoIndex = activeVideo
    ? activeVideo.playlist.findIndex((v) => v.id === activeVideo.item.id)
    : -1;
  const hasNextVideo = currentVideoIndex >= 0 && currentVideoIndex < (activeVideo?.playlist.length || 0) - 1;
  const hasPrevVideo = currentVideoIndex > 0;

  const handleNextVideo = () => {
    if (activeVideo && hasNextVideo) {
      setActiveVideo({
        item: activeVideo.playlist[currentVideoIndex + 1],
        playlist: activeVideo.playlist
      });
    }
  };

  const handlePrevVideo = () => {
    if (activeVideo && hasPrevVideo) {
      setActiveVideo({
        item: activeVideo.playlist[currentVideoIndex - 1],
        playlist: activeVideo.playlist
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans page-bg text-stone-100">
      {/* Top Banner for Telegram Community */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white py-2 px-4 text-xs font-bold flex items-center justify-between z-40 border-b border-white/10">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <span className="truncate">
              📢 Join <strong>GB STUDY Telegram Channel</strong> for daily class PDFs, exam notes & new batch updates!
            </span>
          </div>
          <button
            onClick={() => setShowTelegramModal(true)}
            className="flex-shrink-0 bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg text-[11px] font-extrabold flex items-center gap-1.5 transition-colors"
          >
            <Send className="w-3 h-3" />
            Join Free
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setDisplayedCount(ITEMS_PER_PAGE);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        enrolledCount={enrolledIds.length}
        totalBatchCount={batches.length}
        onOpenTelegramModal={() => setShowTelegramModal(true)}
        onGoHome={handleBackToHome}
        isInsideCourse={Boolean(activeBatch)}
        onOpenAboutModal={() => setShowAboutModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 relative z-10 pb-16">
        {activeBatch ? (
          /* Single Batch / Course Content View */
          <CourseView
            batch={activeBatch}
            onBackToHome={handleBackToHome}
            onPlayVideo={handlePlayVideo}
            onOpenPdf={(url, title) => setActivePdf({ url, title })}
          />
        ) : (
          /* Batches Directory View */
          <div>
            {/* Hero Header */}
            <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-extrabold uppercase tracking-widest mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                GB STUDY • 100% FREE EDUCATION
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white font-heading tracking-tight leading-tight mb-3">
                India's Top Competitive Exam Batches
              </h1>
              <p className="text-sm sm:text-base text-stone-300 leading-relaxed">
                Access full syllabus video lectures, comprehensive chapter-wise study materials, and handwritten PDFs with zero registration barrier.
              </p>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
              {/* Tabs: Latest vs Enrolled */}
              <div className="flex items-center gap-2 p-1.5 bg-[#130a1c] rounded-2xl border border-white/10 backdrop-blur-md">
                <button
                  onClick={() => {
                    setCurrentTab('new');
                    setDisplayedCount(ITEMS_PER_PAGE);
                  }}
                  className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                    currentTab === 'new'
                      ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.35)]'
                      : 'text-stone-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-blue-200" />
                  Latest Batches
                  <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-black">
                    {batches.length}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setCurrentTab('wishlist');
                    setDisplayedCount(ITEMS_PER_PAGE);
                  }}
                  className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                    currentTab === 'wishlist'
                      ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.35)]'
                      : 'text-stone-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Bookmark className="w-4 h-4 text-blue-200" />
                  My Enrolled
                  {enrolledIds.length > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black">
                      {enrolledIds.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-[380px] group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-500 group-focus-within:text-blue-400 transition-colors">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Search batches by name, exam or subject..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setDisplayedCount(ITEMS_PER_PAGE);
                  }}
                  className="w-full bg-[#130a1c] border border-white/10 text-white text-xs sm:text-sm rounded-2xl pl-11 pr-11 py-3.5 placeholder:text-stone-500 focus:outline-none focus:border-blue-500/60 focus:bg-[#190d26] transition-all shadow-inner"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-stone-500 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto hide-scroll pb-2 mb-8">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setDisplayedCount(ITEMS_PER_PAGE);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                    selectedCategory === cat
                      ? 'bg-blue-600/30 text-blue-300 border-blue-500/40 shadow-sm'
                      : 'bg-white/5 text-stone-400 border-white/5 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Batches Grid */}
            {displayedBatches.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {displayedBatches.map((batch, index) => (
                  <BatchCard
                    key={batch.id}
                    batch={batch}
                    isEnrolled={enrolledIds.includes(String(batch.id))}
                    onToggleEnroll={handleToggleEnroll}
                    onOpenBatch={handleOpenBatch}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="flex flex-col items-center justify-center py-24 text-center bg-[#130a1c]/40 rounded-3xl border border-white/5 p-6">
                <div className="w-18 h-18 rounded-full bg-white/5 flex items-center justify-center mb-4 text-stone-500">
                  <BookOpen className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No Batches Found</h3>
                <p className="text-stone-400 text-xs sm:text-sm max-w-sm mb-4">
                  {currentTab === 'wishlist'
                    ? "You haven't enrolled in any batches yet. Click ENROLL on any batch to save it here!"
                    : searchQuery
                    ? `No batch matches "${searchQuery}". Try a different keyword.`
                    : 'No batches in this category.'}
                </p>
                {currentTab === 'wishlist' && (
                  <button
                    onClick={() => setCurrentTab('new')}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md"
                  >
                    Explore Latest Batches
                  </button>
                )}
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-blue-400 font-bold hover:underline"
                  >
                    Clear Search Query
                  </button>
                )}
              </div>
            )}

            {/* Load More Button */}
            {displayedCount < filteredBatches.length && (
              <div className="w-full flex justify-center mt-12 mb-8">
                <button
                  onClick={() => setDisplayedCount((prev) => prev + ITEMS_PER_PAGE)}
                  className="px-8 py-3.5 bg-[#130a1c] border border-blue-500/30 hover:border-blue-400 hover:bg-blue-600/10 rounded-2xl text-white font-extrabold text-xs sm:text-sm transition-all btn-click-effect flex items-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.15)] hover:shadow-[0_0_25px_rgba(37,99,235,0.3)]"
                >
                  <span>Load More Batches</span>
                  <ChevronDown className="w-4 h-4 text-blue-400" />
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Video Player Modal */}
      {activeVideo && activeBatch && (
        <VideoPlayerModal
          courseId={activeBatch.id}
          videoId={activeVideo.item.id}
          videoTitle={activeVideo.item.Title || activeVideo.item.title}
          onClose={() => setActiveVideo(null)}
          onOpenPdf={(url, title) => setActivePdf({ url, title })}
          onNextVideo={handleNextVideo}
          onPrevVideo={handlePrevVideo}
          hasNext={hasNextVideo}
          hasPrev={hasPrevVideo}
        />
      )}

      {/* PDF Viewer Modal */}
      {activePdf && (
        <PdfViewerModal
          pdfUrl={activePdf.url}
          pdfTitle={activePdf.title}
          onClose={() => setActivePdf(null)}
        />
      )}

      {/* Telegram Channel Popup Modal */}
      <TelegramModal
        isOpen={showTelegramModal}
        onClose={() => setShowTelegramModal(false)}
      />

      {/* About Modal */}
      <AboutModal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
      />

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#09050d] py-10 px-4 sm:px-6 relative z-10 text-stone-400 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden ring-1 ring-blue-500/30">
              <img src={APP_ICON} alt="GB STUDY" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-heading font-extrabold text-base text-white">GB STUDY</p>
              <p className="text-[11px] text-stone-500">Free Educational Portal for Competitive Exams</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <button
              onClick={() => {
                setActiveBatch(null);
                setCurrentTab('new');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-blue-400 transition-colors"
            >
              All Batches
            </button>
            <button
              onClick={() => {
                setActiveBatch(null);
                setCurrentTab('wishlist');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-blue-400 transition-colors"
            >
              Enrolled Batches
            </button>
            <button
              onClick={() => setShowTelegramModal(true)}
              className="hover:text-blue-400 transition-colors flex items-center gap-1"
            >
              <Send className="w-3 h-3 text-blue-400" />
              Telegram Channel
            </button>
            <button
              onClick={() => setShowAboutModal(true)}
              className="hover:text-blue-400 transition-colors"
            >
              About
            </button>
          </div>

          <p className="text-[11px] text-stone-600 text-center md:text-right">
            © {new Date().getFullYear()} GB STUDY. Dedicated to student empowerment.
          </p>
        </div>
      </footer>
    </div>
  );
}
