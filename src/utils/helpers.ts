export const APP_ICON = 'https://i.ibb.co/BVndHkpX/1791541921524.png';
export const TELEGRAM_URL = 'https://t.me/GBFreestudy';

// Deterministic gradient / badge generation for batches without thumbnails
export function getBatchBanner(title: string): { bg: string; badge: string; icon: string } {
  const lower = title.toLowerCase();
  if (lower.includes('math')) {
    return {
      bg: 'from-blue-900 via-indigo-950 to-slate-950',
      badge: 'MATHS SPECIAL',
      icon: '📐'
    };
  }
  if (lower.includes('english') || lower.includes('vocab') || lower.includes('grammer') || lower.includes('comprehension')) {
    return {
      bg: 'from-sky-900 via-slate-900 to-indigo-950',
      badge: 'ENGLISH SPECIAL',
      icon: '📖'
    };
  }
  if (lower.includes('reasoning')) {
    return {
      bg: 'from-cyan-900 via-blue-950 to-slate-950',
      badge: 'REASONING SPECIAL',
      icon: '🧠'
    };
  }
  if (lower.includes('science')) {
    return {
      bg: 'from-teal-900 via-slate-900 to-blue-950',
      badge: 'SCIENCE SPECIAL',
      icon: '🔬'
    };
  }
  if (lower.includes('gs') || lower.includes('gk')) {
    return {
      bg: 'from-emerald-950 via-slate-900 to-indigo-950',
      badge: 'GENERAL STUDIES',
      icon: '🌍'
    };
  }
  if (lower.includes('railway') || lower.includes('vande')) {
    return {
      bg: 'from-amber-950 via-slate-900 to-blue-950',
      badge: 'RAILWAY SPECIAL',
      icon: '🚂'
    };
  }
  if (lower.includes('ai') || lower.includes('graphic') || lower.includes('video editing')) {
    return {
      bg: 'from-purple-950 via-indigo-950 to-slate-950',
      badge: 'MASTERY COURSE',
      icon: '⚡'
    };
  }
  return {
    bg: 'from-blue-950 via-slate-900 to-purple-950',
    badge: 'PREMIUM BATCH',
    icon: '🎯'
  };
}

export function formatDuration(durationText?: string, secsStr?: string): string {
  if (secsStr && parseInt(secsStr, 10) > 0) {
    let s = parseInt(secsStr, 10);
    const h = Math.floor(s / 3600);
    s %= 3600;
    const m = Math.floor(s / 60);
    s %= 60;
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }
  if (durationText) {
    return durationText.replace('mins', ':').replace('secs', '').replace(/\s+/g, '');
  }
  return '';
}

export function formatDateTime(dateStr?: string): string {
  if (!dateStr) return 'Available';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}
