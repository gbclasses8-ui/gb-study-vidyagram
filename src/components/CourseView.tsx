import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Folder,
  Play,
  FileText,
  Calendar,
  Clock,
  Search,
  X,
  Share2,
  RefreshCw,
  Sparkles,
  BookOpen,
  Download,
  AlertTriangle
} from 'lucide-react';
import type { Batch, ContentItem, BreadcrumbItem } from '../types.ts';
import { formatDuration, formatDateTime, getBatchBanner } from '../utils/helpers.ts';

interface CourseViewProps {
  batch: Batch;
  onBackToHome: () => void;
  onPlayVideo: (videoItem: ContentItem, playlist: ContentItem[]) => void;
  onOpenPdf: (pdfUrl: string, title: string) => void;
}

export const CourseView: React.FC<CourseViewProps> = ({
  batch,
  onBackToHome,
  onPlayVideo,
  onOpenPdf
}) => {
  const [navigationStack, setNavigationStack] = useState<BreadcrumbItem[]>([
    { id: '-1', title: batch.title }
  ]);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'folders' | 'videos' | 'pdfs'>('all');
  const [copiedToast, setCopiedToast] = useState(false);

  const currentFolder = navigationStack[navigationStack.length - 1];

  // Fetch current folder contents
  const fetchContents = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/folder_contents?course_id=${batch.id}&parent_id=${currentFolder.id}&start=0`
      );
      if (!res.ok) throw new Error('Failed to load course contents');
      const json = await res.json();

      if (json.status === 200 && Array.isArray(json.data)) {
        setItems(json.data);
      } else if (Array.isArray(json)) {
        setItems(json);
      } else {
        throw new Error(json.message || 'No contents available');
      }
    } catch (err: unknown) {
      const e = err as Error;
      console.error('Fetch contents error:', e);
      setError(e.message || 'Unable to load contents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
    setSearchQuery('');
  }, [batch.id, currentFolder.id]);

  const handleFolderClick = (item: ContentItem) => {
    const title = item.Title || item.title || 'Subfolder';
    setNavigationStack((prev) => [...prev, { id: item.id, title }]);
  };

  const handleBreadcrumbClick = (index: number) => {
    setNavigationStack((prev) => prev.slice(0, index + 1));
  };

  const handleGoBack = () => {
    if (navigationStack.length > 1) {
      setNavigationStack((prev) => prev.slice(0, -1));
    } else {
      onBackToHome();
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const type = (item.material_type || item.type || '').toUpperCase();
    const title = (item.Title || item.title || '').toLowerCase();
    const matchesSearch = !searchQuery || title.includes(searchQuery.toLowerCase().trim());

    if (!matchesSearch) return false;

    if (filterType === 'folders') return type === 'FOLDER';
    if (filterType === 'videos') return type === 'VIDEO';
    if (filterType === 'pdfs') return type === 'PDF' || type === 'NOTES';
    return true;
  });

  // Extract all playable video items in the current folder for playlist auto-advance
  const videoPlaylist = items.filter((i) => (i.material_type || i.type || '').toUpperCase() === 'VIDEO');

  const banner = getBatchBanner(batch.title);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 animate-fadeIn pb-24">
      {/* Top Bar: Back Button & Course Share */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={handleGoBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-200 hover:text-white border border-white/10 text-xs sm:text-sm font-bold transition-all btn-click-effect shadow-sm"
        >
          <ChevronLeft className="w-4 h-4 text-blue-400" />
          <span>{navigationStack.length > 1 ? 'Previous Folder' : 'Back to Batches'}</span>
        </button>

        <div className="flex items-center gap-2">
          {copiedToast && (
            <span className="text-xs text-blue-400 font-bold bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-500/20">
              Link Copied!
            </span>
          )}
          <button
            onClick={handleShare}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Share Course"
          >
            <Share2 className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </div>

      {/* Batch Hero Card */}
      <div className="relative rounded-3xl p-5 sm:p-7 mb-8 overflow-hidden border border-blue-500/25 bg-gradient-to-r from-[#170c26] via-[#12081d] to-[#0a0510] shadow-[0_15px_40px_-15px_rgba(37,99,235,0.25)]">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center gap-5 sm:gap-6 relative z-10">
          {/* Batch Thumbnail */}
          <div className="w-full sm:w-56 aspect-[16/9] rounded-2xl overflow-hidden bg-black/60 border border-white/10 flex-shrink-0 shadow-lg">
            {batch.thumbnail ? (
              <img
                src={batch.thumbnail}
                alt={batch.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${banner.bg} p-3 flex flex-col justify-between`}>
                <span className="text-2xl">{banner.icon}</span>
                <span className="text-[10px] font-black text-blue-300 tracking-wider">
                  {banner.badge}
                </span>
              </div>
            )}
          </div>

          {/* Batch Information */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-extrabold uppercase tracking-wider border border-blue-500/30">
                ACTIVE BATCH
              </span>
              <span className="text-xs text-stone-400">ID #{batch.id}</span>
            </div>

            <h1 className="text-lg sm:text-2xl font-black text-white font-heading leading-tight mb-3">
              {batch.title}
            </h1>

            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed max-w-3xl">
              Complete course syllabus including full concept lectures, practice sessions, handwritten class notes, and high-quality downloadable PDFs.
            </p>
          </div>
        </div>
      </div>

      {/* Dynamic Breadcrumbs */}
      <div className="flex items-center gap-1.5 overflow-x-auto hide-scroll py-2 px-1 mb-6 text-xs text-stone-400">
        <button
          onClick={onBackToHome}
          className="hover:text-blue-400 transition-colors flex-shrink-0 font-medium"
        >
          All Batches
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-stone-600 flex-shrink-0" />

        {navigationStack.map((crumb, idx) => {
          const isLast = idx === navigationStack.length - 1;
          return (
            <React.Fragment key={crumb.id + idx}>
              <button
                onClick={() => handleBreadcrumbClick(idx)}
                className={`flex-shrink-0 max-w-[200px] truncate transition-colors font-medium ${
                  isLast ? 'text-blue-400 font-bold pointer-events-none' : 'hover:text-white'
                }`}
                title={crumb.title}
              >
                {crumb.title}
              </button>
              {!isLast && <ChevronRight className="w-3.5 h-3.5 text-stone-600 flex-shrink-0" />}
            </React.Fragment>
          );
        })}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        {/* Search inside folder */}
        <div className="relative flex-1 max-w-md group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500 group-focus-within:text-blue-400 transition-colors">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search lectures or notes in this folder..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#130a1c] border border-white/10 text-white text-xs sm:text-sm rounded-xl pl-10 pr-9 py-2.5 placeholder:text-stone-500 focus:outline-none focus:border-blue-500/60 focus:bg-[#1a0f26] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Type Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto hide-scroll p-1 bg-white/5 rounded-xl border border-white/5">
          {(['all', 'folders', 'videos', 'pdfs'] as const).map((ft) => (
            <button
              key={ft}
              onClick={() => setFilterType(ft)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                filterType === ft
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-stone-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {ft === 'pdfs' ? 'Notes / PDFs' : ft}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              className="h-20 rounded-2xl bg-[#130a1c] border border-white/5 skel"
            />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-[#130a1c]/60 rounded-3xl border border-red-500/20 p-6">
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-3 border border-red-500/20">
            <AlertTriangle className="w-7 h-7 text-red-400" />
          </div>
          <h3 className="text-white font-bold text-base mb-1">Failed to Load Content</h3>
          <p className="text-stone-400 text-xs max-w-sm mb-4">{error}</p>
          <button
            onClick={fetchContents}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 transition-all btn-click-effect shadow-md"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-[#130a1c]/40 rounded-3xl border border-white/5 p-6">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-stone-500">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-white font-bold text-lg mb-1">No Items Found</h3>
          <p className="text-stone-400 text-xs max-w-xs mb-4">
            {searchQuery
              ? `No lectures or notes match "${searchQuery}".`
              : 'This folder does not contain any materials currently.'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-blue-400 font-bold hover:underline"
            >
              Clear Search
            </button>
          )}
        </div>
      )}

      {/* Items List */}
      {!loading && !error && filteredItems.length > 0 && (
        <div className="space-y-3">
          {filteredItems.map((item, idx) => {
            const type = (item.material_type || item.type || '').toUpperCase();
            const title = item.Title || item.title || 'Untitled';
            const pdfUrl = item.pdf_link || item.file_link || item.download_link;

            // 1. FOLDER ITEM
            if (type === 'FOLDER') {
              const videoCount = parseInt(String(item.videos_count || 0), 10);
              const fileCount = parseInt(String(item.files_count || 0), 10);
              const countBadges: string[] = [];
              if (videoCount > 0) countBadges.push(`${videoCount} Video${videoCount > 1 ? 's' : ''}`);
              if (fileCount > 0) countBadges.push(`${fileCount} PDF${fileCount > 1 ? 's' : ''}`);
              const countText = countBadges.length > 0 ? countBadges.join(' • ') : 'Browse Folder';

              return (
                <div
                  key={item.id + idx}
                  onClick={() => handleFolderClick(item)}
                  className="row-card rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 text-blue-400 group-hover:scale-105 transition-transform shadow-[inset_0_0_12px_rgba(37,99,235,0.15)]">
                      <Folder className="w-6 h-6 fill-blue-500/20 text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                        {title}
                      </h3>
                      <p className="text-xs text-stone-400 font-medium mt-0.5">
                        {countText}
                      </p>
                    </div>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-600/30 text-stone-400 group-hover:text-white transition-all flex-shrink-0">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              );
            }

            // 2. VIDEO ITEM
            if (type === 'VIDEO') {
              const durationStr = formatDuration(item.duration, item.duration_in_secs);
              const dateStr = item.date_and_time || formatDateTime(item.event_date);
              const isUpcoming = parseInt(String(item.live_status || 0), 10) === 2;

              return (
                <div
                  key={item.id + idx}
                  className="row-card rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                >
                  <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0 w-full sm:w-auto flex-1">
                    {/* Video thumbnail or icon */}
                    <div
                      onClick={() => onPlayVideo(item, videoPlaylist)}
                      className="relative w-28 sm:w-36 aspect-video rounded-xl overflow-hidden bg-black flex-shrink-0 cursor-pointer border border-white/10 group-hover:border-blue-500/40 transition-colors"
                    >
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt={title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-950 to-slate-950 flex items-center justify-center text-blue-400">
                          <Play className="w-6 h-6 fill-blue-400 text-blue-400" />
                        </div>
                      )}
                      {durationStr && (
                        <div className="absolute bottom-1.5 right-1.5 bg-black/80 backdrop-blur-xs px-1.5 py-0.5 rounded text-[10px] font-mono text-white font-bold">
                          {durationStr}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3
                        onClick={() => onPlayVideo(item, videoPlaylist)}
                        className="text-xs sm:text-sm font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2 cursor-pointer leading-snug mb-1"
                      >
                        {title}
                      </h3>
                      <div className="flex items-center gap-3 text-[11px] text-stone-400">
                        {dateStr && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-stone-500" />
                            {dateStr}
                          </span>
                        )}
                        <span className="px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-300 font-semibold text-[10px]">
                          LECTURE
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons (BLUE themed) */}
                  <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                    {isUpcoming ? (
                      <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-bold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Upcoming
                      </span>
                    ) : (
                      <button
                        onClick={() => onPlayVideo(item, videoPlaylist)}
                        className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black tracking-wider flex items-center gap-1.5 transition-all btn-click-effect shadow-[0_2px_10px_rgba(37,99,235,0.35)]"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Watch</span>
                      </button>
                    )}

                    {/* Associated PDF button if exists */}
                    {pdfUrl && (
                      <button
                        onClick={() => onOpenPdf(pdfUrl, `${title} - Notes`)}
                        className="px-3 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
                        title="View Class Notes"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Notes</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            }

            // 3. PDF / NOTES ITEM
            if (type === 'PDF' || type === 'NOTES' || pdfUrl) {
              const dateStr = formatDateTime(item.event_date);

              return (
                <div
                  key={item.id + idx}
                  className="row-card rounded-2xl p-4 flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 text-indigo-300 group-hover:scale-105 transition-transform shadow-[inset_0_0_10px_rgba(99,102,241,0.15)]">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3
                        onClick={() => pdfUrl && onOpenPdf(pdfUrl, title)}
                        className="text-xs sm:text-sm font-bold text-white group-hover:text-blue-400 transition-colors truncate cursor-pointer"
                      >
                        {title}
                      </h3>
                      <p className="text-[11px] text-stone-400 font-medium mt-0.5">
                        {dateStr || 'Study Material & Notes'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => pdfUrl && onOpenPdf(pdfUrl, title)}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black tracking-wider flex items-center gap-1.5 transition-all btn-click-effect shadow-[0_2px_10px_rgba(37,99,235,0.35)]"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Open Notes</span>
                    </button>
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      )}
    </div>
  );
};
