import React from 'react';
import { Send, Bookmark, Sparkles, BookOpen, ExternalLink, HelpCircle } from 'lucide-react';
import { APP_ICON, TELEGRAM_URL } from '../utils/helpers.ts';

interface NavbarProps {
  currentTab: 'new' | 'wishlist';
  onSelectTab: (tab: 'new' | 'wishlist') => void;
  enrolledCount: number;
  totalBatchCount: number;
  onOpenTelegramModal: () => void;
  onGoHome: () => void;
  isInsideCourse: boolean;
  onOpenAboutModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  enrolledCount,
  totalBatchCount,
  onOpenTelegramModal,
  onGoHome,
  isInsideCourse,
  onOpenAboutModal
}) => {
  return (
    <header className="sticky top-0 z-40 nav-glass border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
        {/* Brand & Logo */}
        <button
          onClick={onGoHome}
          className="flex items-center gap-3 group text-left focus:outline-none"
        >
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-2xl overflow-hidden ring-2 ring-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.3)] group-hover:ring-blue-400 group-hover:scale-105 transition-all">
            <img
              src={APP_ICON}
              alt="GB STUDY"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback icon
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-extrabold text-xl sm:text-2xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
                GB STUDY
              </span>
              <span className="hidden xs:inline-block text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                FREE
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-stone-400 font-medium tracking-wide hidden sm:block">
              Free Premium Batches & Quality Education
            </p>
          </div>
        </button>

        {/* Center Navigation (when on home) */}
        {!isInsideCourse && (
          <nav className="hidden md:flex items-center gap-2 p-1 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
            <button
              onClick={() => onSelectTab('new')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                currentTab === 'new'
                  ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                  : 'text-stone-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-200" />
              Latest Batches
              <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-black">
                {totalBatchCount}
              </span>
            </button>

            <button
              onClick={() => onSelectTab('wishlist')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                currentTab === 'wishlist'
                  ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                  : 'text-stone-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 text-blue-200" />
              Enrolled Batches
              {enrolledCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-black">
                  {enrolledCount}
                </span>
              )}
            </button>
          </nav>
        )}

        {/* Right CTA: Telegram + Quick Info */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenAboutModal}
            className="p-2 sm:px-3 sm:py-2 text-stone-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all text-xs font-semibold flex items-center gap-1.5"
            title="About GB STUDY"
          >
            <HelpCircle className="w-4 h-4 text-blue-400" />
            <span className="hidden lg:inline">Help & Info</span>
          </button>

          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-extrabold text-white bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-[0_0_20px_rgba(37,99,235,0.45)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] transition-all btn-click-effect border border-blue-400/30"
          >
            <Send className="w-4 h-4 text-white group-hover:rotate-12 transition-transform" />
            <span className="hidden xs:inline">Telegram</span>
            <ExternalLink className="w-3 h-3 opacity-70 hidden sm:inline" />
          </a>
        </div>
      </div>
    </header>
  );
};
