import React, { useState } from 'react';
import { Check, Plus, ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import type { Batch } from '../types.ts';
import { getBatchBanner } from '../utils/helpers.ts';

interface BatchCardProps {
  batch: Batch;
  isEnrolled: boolean;
  onToggleEnroll: (batchId: string | number) => void;
  onOpenBatch: (batch: Batch) => void;
  index: number;
}

export const BatchCard: React.FC<BatchCardProps> = ({
  batch,
  isEnrolled,
  onToggleEnroll,
  onOpenBatch,
  index
}) => {
  const [imgError, setImgError] = useState(false);
  const banner = getBatchBanner(batch.title);
  const hasRealThumb = Boolean(batch.thumbnail && batch.thumbnail.trim() !== '' && !imgError);

  const handleEnrollClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleEnroll(batch.id);
  };

  const handleStudyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenBatch(batch);
  };

  return (
    <div
      onClick={() => onOpenBatch(batch)}
      className="premium-card rounded-2xl overflow-hidden group flex flex-col relative cursor-pointer transition-all duration-300 hover:scale-[1.02]"
      style={{
        animationDelay: `${(index % 12) * 45}ms`
      }}
    >
      {/* Thumbnail or Fallback Artwork */}
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-[#09050d]">
        {hasRealThumb ? (
          <img
            src={batch.thumbnail}
            alt={batch.title}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${banner.bg} p-5 flex flex-col justify-between relative overflow-hidden`}>
            {/* Ambient pattern */}
            <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-blue-500/10 blur-xl pointer-events-none" />
            <div className="flex items-center justify-between z-10">
              <span className="text-2xl drop-shadow">{banner.icon}</span>
              <span className="text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/30">
                {banner.badge}
              </span>
            </div>
            <div className="z-10">
              <p className="text-xs font-bold text-white/90 line-clamp-2 leading-tight">
                {batch.title}
              </p>
            </div>
          </div>
        )}

        {/* Gradient shadow overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#130a1c] via-[#130a1c]/25 to-transparent pointer-events-none" />

        {/* Floating Tag */}
        <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded-lg z-10">
          <span className="text-pink-400 text-[10px] font-black tracking-wider uppercase flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" />
            BATCH
          </span>
        </div>

        {/* Enrolled Badge if already enrolled */}
        {isEnrolled && (
          <div className="absolute top-2.5 left-2.5 bg-pink-600/95 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-md">
            <Check className="w-3 h-3 stroke-[3]" />
            ENROLLED
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 relative z-10 justify-between">
        <div>
          <h3 className="text-stone-200 font-bold text-sm sm:text-[15px] leading-snug mb-3 line-clamp-2 group-hover:text-pink-400 transition-colors">
            {batch.title}
          </h3>
          <p className="text-[11px] text-stone-500 font-medium flex items-center gap-1.5 mb-4">
            <BookOpen className="w-3.5 h-3.5 text-pink-400" />
            Batch ID: #{batch.id} • All Lectures & Notes Included
          </p>
        </div>

        {/* Action Buttons: BOTH ARE PINK as requested! */}
        <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-white/10 mt-auto">
          {/* ENROLL Button - Pink styled */}
          {isEnrolled ? (
            <button
              onClick={handleEnrollClick}
              className="bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-400/40 px-3 sm:px-3.5 py-2 rounded-xl text-[11px] font-black tracking-wider flex items-center gap-1.5 transition-colors shadow-inner btn-click-effect"
              title="Click to toggle enrollment"
            >
              <Check className="w-3.5 h-3.5 stroke-[3] text-pink-300" />
              ENROLLED
            </button>
          ) : (
            <button
              onClick={handleEnrollClick}
              className="bg-pink-600 hover:bg-pink-500 text-white px-3 sm:px-3.5 py-2 rounded-xl text-[11px] font-black tracking-wider flex items-center gap-1.5 transition-all shadow-[0_3px_14px_rgba(236,72,153,0.45)] hover:shadow-[0_4px_18px_rgba(236,72,153,0.65)] btn-click-effect"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              ENROLL
            </button>
          )}

          {/* STUDY / LET'S STUDY Button - Vivid Pink styled */}
          <button
            onClick={handleStudyClick}
            className="bg-gradient-to-r from-pink-600 via-pink-500 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white font-black px-3.5 sm:px-4 py-2 rounded-xl text-[11px] uppercase tracking-wider flex items-center gap-1.5 transition-all btn-click-effect shadow-[0_4px_16px_rgba(236,72,153,0.45)] hover:shadow-[0_6px_22px_rgba(236,72,153,0.7)]"
          >
            <span>Let's Study</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
