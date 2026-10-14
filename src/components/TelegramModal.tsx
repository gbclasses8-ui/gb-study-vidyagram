import React from 'react';
import { Send, X, CheckCircle, Bell, ArrowRight, ShieldCheck } from 'lucide-react';
import { TELEGRAM_URL, APP_ICON } from '../utils/helpers.ts';

interface TelegramModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TelegramModal: React.FC<TelegramModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleJoin = () => {
    window.open(TELEGRAM_URL, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-gradient-to-b from-[#180e28] to-[#0d0716] border border-blue-500/30 rounded-3xl p-6 sm:p-7 shadow-[0_20px_60px_-15px_rgba(37,99,235,0.4)] z-10 overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-blue-500/25 rounded-full blur-3xl pointer-events-none" />

        {/* Close icon */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors z-20"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with App Logo + Telegram Icon */}
        <div className="flex flex-col items-center text-center mt-2 mb-6">
          <div className="relative mb-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-blue-500/30 shadow-[0_0_25px_rgba(37,99,235,0.4)]">
              <img src={APP_ICON} alt="GB STUDY" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg ring-2 ring-[#180e28]">
              <Send className="w-4 h-4" />
            </div>
          </div>

          <span className="text-[11px] font-black tracking-widest uppercase px-3 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 mb-2">
            OFFICIAL COMMUNITY
          </span>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight font-heading">
            Join GB STUDY Telegram Channel
          </h2>

          <p className="text-sm text-stone-300 mt-2 leading-relaxed">
            Get instant updates on new batch releases, daily study notes, class PDFs, exam notifications, and live lecture links!
          </p>
        </div>

        {/* Highlights */}
        <div className="space-y-2.5 mb-6 text-xs text-stone-300 bg-white/5 border border-white/5 rounded-2xl p-4">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <span>Daily updated lecture PDFs & handwritten class notes</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <span>Fast notifications for all competitive exam batches</span>
          </div>
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>100% Free educational materials for students</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleJoin}
            className="flex-1 py-3.5 px-5 rounded-2xl font-black text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-[0_4px_20px_rgba(37,99,235,0.45)] flex items-center justify-center gap-2 btn-click-effect transition-all"
          >
            <Send className="w-4 h-4" />
            Join Telegram
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="py-3.5 px-5 rounded-2xl font-bold text-sm text-stone-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
