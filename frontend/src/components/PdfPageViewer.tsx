import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Loader2, AlertCircle, ZoomIn } from 'lucide-react';
import { API_BASE_URL } from '../services/auth.service';

// Setup PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

// Cache for loaded PDFs to avoid re-downloading
const pdfCache: Map<string, pdfjsLib.PDFDocumentProxy> = new Map();

interface PdfPageViewerProps {
    manualId: string;
    pageNumber: number;
    title: string;
    onClickFullSize?: () => void;
}

const PdfPageViewer: React.FC<PdfPageViewerProps> = ({ manualId, pageNumber, title, onClickFullSize }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [rendered, setRendered] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const renderPage = async () => {
            try {
                setLoading(true);
                setError(null);
                setRendered(false);

                // Get or fetch PDF document
                let pdfDoc: pdfjsLib.PDFDocumentProxy;
                const cacheKey = manualId;

                if (pdfCache.has(cacheKey)) {
                    pdfDoc = pdfCache.get(cacheKey)!;
                } else {
                    // Fetch PDF with authentication
                    const token = localStorage.getItem('token');
                    const pdfUrl = `${API_BASE_URL}/ai/manuals/${manualId}/pdf`;

                    const response = await fetch(pdfUrl, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }

                    const data = await response.arrayBuffer();

                    if (cancelled) return;

                    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(data) });
                    pdfDoc = await loadingTask.promise;
                    pdfCache.set(cacheKey, pdfDoc);
                }

                if (cancelled) return;

                // Check page range
                if (pageNumber < 1 || pageNumber > pdfDoc.numPages) {
                    setError(`الصفحة ${pageNumber} غير موجودة (الكراسة تحتوي ${pdfDoc.numPages} صفحة)`);
                    setLoading(false);
                    return;
                }

                // Get the page
                const page = await pdfDoc.getPage(pageNumber);

                if (cancelled) return;

                const canvas = canvasRef.current;
                if (!canvas) return;

                const context = canvas.getContext('2d');
                if (!context) return;

                // Calculate scale for good quality rendering
                const desiredWidth = 700; // pixels width for the rendered page
                const unscaledViewport = page.getViewport({ scale: 1 });
                const scale = desiredWidth / unscaledViewport.width;
                const viewport = page.getViewport({ scale });

                // Set canvas dimensions
                canvas.width = viewport.width;
                canvas.height = viewport.height;

                // Render the page
                const renderContext = {
                    canvasContext: context,
                    viewport: viewport,
                };

                await page.render(renderContext).promise;

                if (!cancelled) {
                    setRendered(true);
                    setLoading(false);
                }

            } catch (err: any) {
                console.error('PDF page render error:', err);
                if (!cancelled) {
                    setError(err.message || 'فشل تحميل الصفحة');
                    setLoading(false);
                }
            }
        };

        renderPage();

        return () => {
            cancelled = true;
        };
    }, [manualId, pageNumber]);

    return (
        <div style={{
            marginTop: '12px',
            marginBottom: '16px',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid rgba(194,178,128,0.2)',
            background: '#0d0d1a',
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                background: 'linear-gradient(135deg, rgba(194,178,128,0.15), rgba(194,178,128,0.05))',
                borderBottom: '1px solid rgba(194,178,128,0.15)',
            }} dir="rtl">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>📄</span>
                    <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-highlight)' }}>
                            صفحة {pageNumber}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                            {title}
                        </div>
                    </div>
                </div>
                {rendered && onClickFullSize && (
                    <button
                        onClick={onClickFullSize}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: '1px solid rgba(194,178,128,0.3)',
                            background: 'rgba(194,178,128,0.1)',
                            color: 'var(--color-highlight)',
                            cursor: 'pointer',
                            fontSize: '11px',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <ZoomIn size={12} />
                        تكبير
                    </button>
                )}
            </div>

            {/* Content */}
            <div style={{
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: loading ? '300px' : 'auto',
                background: 'white',
                cursor: onClickFullSize ? 'pointer' : 'default',
            }}
                onClick={rendered && onClickFullSize ? onClickFullSize : undefined}
            >
                {/* Loading state */}
                {loading && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        background: '#1a1a2e',
                        zIndex: 2,
                    }}>
                        <Loader2
                            size={32}
                            style={{
                                color: 'var(--color-highlight)',
                                animation: 'spin 1s linear infinite'
                            }}
                        />
                        <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                            جاري تحميل صفحة {pageNumber}...
                        </span>
                    </div>
                )}

                {/* Error state */}
                {error && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        background: '#1a1a2e',
                        padding: '20px',
                        zIndex: 2,
                    }}>
                        <AlertCircle size={24} style={{ color: '#ef4444' }} />
                        <span style={{ fontSize: '13px', color: '#ef4444', textAlign: 'center' }}>
                            {error}
                        </span>
                    </div>
                )}

                {/* Canvas for PDF rendering */}
                <canvas
                    ref={canvasRef}
                    style={{
                        maxWidth: '100%',
                        height: 'auto',
                        display: rendered ? 'block' : 'none',
                    }}
                />
            </div>
        </div>
    );
};

export default PdfPageViewer;
