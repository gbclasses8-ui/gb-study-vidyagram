import React from 'react';
import { X, Send, BookOpen, Sparkles, CheckCircle, Smartphone } from 'lucide-react';
import { APP_ICON, TELEGRAM_URL } from '../utils/helpers.ts';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#150c22] border border-blue-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl z-10 overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-blue-500/30">
            <img src={APP_ICON} alt="GB STUDY" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white font-heading">GB STUDY</h2>
            <p className="text-xs text-blue-400 font-semibold">Free & Accessible Exam Preparation</p>
          </div>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-stone-300 leading-relaxed mb-6">
          <p>
            Welcome to <strong className="text-white">GB STUDY</strong> — your complete portal for competitive examination batches, mathematics, reasoning, science, GS, English, and vocational skill batches.
          </p>

          <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <span><strong>No Login Required:</strong> Browse, study, and download notes directly without creating any accounts.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <Smartphone className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <span><strong>Mobile & Desktop Friendly:</strong> Optimized video player and smooth responsive navigation on all devices.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <span><strong>Instant Notes & PDFs:</strong> High-resolution lecture PDFs accessible right inside your browser.</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-[0_4px_15px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2 transition-all btn-click-effect"
          >
            <Send className="w-4 h-4" />
            Join Telegram Channel
          </a>
          <button
            onClick={onClose}
            className="py-3 px-5 rounded-xl font-bold text-xs sm:text-sm text-stone-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
