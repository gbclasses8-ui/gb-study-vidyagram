import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  AlertCircle
} from 'lucide-react';

interface PdfViewerModalProps {
  pdfUrl: string;
  pdfTitle: string;
  onClose: () => void;
}

// Declare pdfjsLib on window
declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  pdfUrl,
  pdfTitle,
  onClose
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [useIframeFallback, setUseIframeFallback] = useState(false);

  // Proxied URL for fetching binary data and for downloading
  const proxiedUrl = `/api/pdf_proxy?url=${encodeURIComponent(pdfUrl)}`;

  // Load PDF via pdfjsLib
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    async function loadPdf() {
      try {
        // Wait for pdfjsLib to be available
        let attempts = 0;
        while (!window.pdfjsLib && attempts < 25) {
          await new Promise((r) => setTimeout(r, 100));
          attempts++;
        }

        if (!window.pdfjsLib) {
          // Fall back to iframe if pdfjs library fails to load
          setUseIframeFallback(true);
          setLoading(false);
          return;
        }

        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        // Fetch PDF arrayBuffer
        const response = await fetch(proxiedUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();

        if (isCancelled) return;

        const loadingTask = window.pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuffer),
          cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
          cMapPacked: true
        });

        const doc = await loadingTask.promise;
        if (isCancelled) return;

        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        setCurrentPage(1);
        setLoading(false);
      } catch (err: unknown) {
        if (isCancelled) return;
        const e = err as Error;
        console.warn('PDF.js error, falling back to iframe/direct:', e.message);
        setUseIframeFallback(true);
        setLoading(false);
      }
    }

    loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [proxiedUrl]);

  // Render current page onto canvas
  useEffect(() => {
    if (!pdfDoc || useIframeFallback) return;

    let isRendering = true;

    async function renderPage() {
      try {
        const page = await pdfDoc.getPage(currentPage);
        if (!isRendering) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        // Auto-scale on mobile screens if scale is default
        const viewport = page.getViewport({ scale, rotation });
        const pixelRatio = window.devicePixelRatio || 1;

        canvas.width = viewport.width * pixelRatio;
        canvas.height = viewport.height * pixelRatio;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        await page.render(renderContext).promise;
      } catch (err) {
        console.error('Error rendering page:', err);
      }
    }

    renderPage();

    return () => {
      isRendering = false;
    };
  }, [pdfDoc, currentPage, scale, rotation, useIframeFallback]);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((p) => p + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((p) => p - 1);
  };

  const handleZoomIn = () => {
    setScale((s) => Math.min(s + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setScale((s) => Math.max(s - 0.25, 0.6));
  };

  const handleRotate = () => {
    setRotation((r) => (r + 90) % 360);
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = proxiedUrl;
    a.download = `${pdfTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-black/90 backdrop-blur-md select-none">
      <div
        ref={containerRef}
        className="relative w-full h-[96vh] sm:h-[92vh] max-w-5xl bg-[#11071c] border border-blue-500/30 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header Toolbar */}
        <div className="px-3.5 py-2.5 sm:px-6 sm:py-3.5 bg-[#170c26] border-b border-white/10 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center flex-shrink-0 border border-blue-500/30">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-bold text-white truncate max-w-xs sm:max-w-md md:max-w-xl">
                {pdfTitle}
              </h2>
              <p className="text-[10px] sm:text-[11px] text-blue-400 font-semibold">
                GB STUDY • In-App Document Reader
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handleDownload}
              className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md btn-click-effect"
              title="Download PDF to device"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-1.5 sm:p-2 bg-white/5 hover:bg-white/10 text-stone-300 rounded-xl transition-colors hidden sm:flex"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 bg-white/10 hover:bg-red-500 text-white rounded-xl transition-colors"
              title="Close Reader"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Secondary Control Bar (Page & Zoom navigation) */}
        {!useIframeFallback && totalPages > 0 && (
          <div className="px-3 py-2 bg-[#140a22] border-b border-white/5 flex items-center justify-between text-xs text-stone-300 overflow-x-auto hide-scroll gap-2">
            {/* Page navigation */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-2 font-mono font-bold text-white text-[11px] sm:text-xs">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Zoom & Rotation controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleZoomOut}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <span className="font-mono text-[11px] font-bold px-1 text-stone-400">
                {Math.round(scale * 100)}%
              </span>

              <button
                onClick={handleZoomIn}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleRotate}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors ml-1"
                title="Rotate 90°"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Reader Canvas Container */}
        <div className="relative flex-1 bg-[#09050d] overflow-auto flex items-start justify-center p-2 sm:p-4">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#09050d] z-10 text-stone-400">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-xs font-semibold">Opening Study Notes & PDF Document...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center p-8 text-center max-w-md my-auto">
              <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
              <p className="text-white text-xs font-bold mb-3">{error}</p>
              <button
                onClick={() => setUseIframeFallback(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
              >
                Try Direct Viewer
              </button>
            </div>
          )}

          {useIframeFallback ? (
            /* Fallback embedded frame */
            <iframe
              src={`${proxiedUrl}#toolbar=1&navpanes=0`}
              title={pdfTitle}
              className="w-full h-full border-0 rounded-xl"
            />
          ) : (
            /* Native HTML5 Canvas rendering */
            <div className="shadow-2xl rounded-lg overflow-hidden border border-white/10 bg-white">
              <canvas ref={canvasRef} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
