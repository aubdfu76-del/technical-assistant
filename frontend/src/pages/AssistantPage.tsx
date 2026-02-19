import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Send, User, FileText, Sparkles, Loader2,
    Wrench, Upload, Book, X, Search, Brain, Plus, Trash2, Car, RefreshCw, Eye
} from 'lucide-react';
import { Modal } from '../components/Modal';
import PdfPageViewer from '../components/PdfPageViewer';
import DashboardLayout from '../components/DashboardLayout';
import { aiService } from '../services/ai.service';
import type { Citation as AICitation, TechnicalManual } from '../services/ai.service';
import { toast } from 'react-hot-toast';
import { authService, API_BASE_URL } from '../services/auth.service';
import { vehiclesService } from '../services/vehicles.service';
import '../styles/ai-message.css';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    citations?: AICitation[];
    timestamp: Date;
}

// Helper to parse bold text (**text**)
const parseBold = (text: string): React.ReactNode[] => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return part;
    });
};

// Filter out page header/footer lines like "--- Page 1 of 50 ---"
const isPageFooter = (line: string): boolean => {
    const trimmed = line.trim();
    return /^-{2,}\s*(Page\s+)?\d+\s*(of\s+\d+)?\s*-{2,}$/.test(trimmed) ||
        /^---\s*Page\s+\d+\s*---$/.test(trimmed) ||
        /^-{2,}\s*of\s+\d+\s+\d+\s*-{2,}$/.test(trimmed) ||
        /^-{2,}\s*\d+\s+of\s+\d+\s*-{2,}$/.test(trimmed);
};

const ChatBubble = ({ message, onViewPage }: { message: Message, onViewPage: (manualId: string, page: number, title: string) => void }) => {
    const isUser = message.role === 'user';

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                marginBottom: '32px',
                ...(isUser ? {} : {
                    background: 'rgba(85,107,47,0.05)',
                    borderTop: '1px solid rgba(194,178,128,0.1)',
                    borderBottom: '1px solid rgba(194,178,128,0.1)',
                    padding: '24px 0'
                })
            }}
        >
            <div style={{ maxWidth: '56rem', margin: '0 auto', display: 'flex', gap: '20px' }}>
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: isUser ? 'none' : '0 0 20px rgba(194,178,128,0.3)',
                        background: isUser
                            ? 'rgba(255,255,255,0.08)'
                            : 'linear-gradient(to bottom right, #C2B280, #8B7355)'
                    }}
                >
                    {isUser ? (
                        <User size={18} style={{ color: 'var(--color-text-muted)' }} />
                    ) : (
                        <Brain size={18} style={{ color: '#2B2D31' }} />
                    )}
                </motion.div>

                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: isUser ? 'var(--color-text-muted)' : 'var(--color-highlight)' }}>
                            {isUser ? 'أنت' : 'المساعد الفني الذكي'}
                        </span>
                        {!isUser && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '50px', background: 'rgba(194,178,128,0.1)', border: '1px solid rgba(194,178,128,0.2)' }}>
                                <Sparkles size={10} style={{ color: 'var(--color-highlight)' }} />
                                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-highlight)' }}>AI</span>
                            </div>
                        )}
                    </div>

                    <div className="ai-message-content" dir="rtl" style={{ color: isUser ? 'var(--color-white)' : 'var(--color-text)' }}>
                        {message.content.split('\n').map((line, idx) => {
                            // Empty lines
                            if (!line.trim()) return <div key={idx} style={{ height: '8px' }} />;

                            // Skip page headers/footers
                            if (isPageFooter(line)) return null;

                            // Headers (### or ##)
                            if (line.startsWith('### ') || line.startsWith('## ')) {
                                return (
                                    <div key={idx} className="message-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px', marginTop: '16px' }}>
                                        {parseBold(line.replace(/^#+\s/, ''))}
                                    </div>
                                );
                            }

                            // Horizontal Rule
                            if (line.trim() === '---') {
                                return <hr key={idx} style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '16px 0' }} />;
                            }

                            // Bullet Points
                            if (line.trim().startsWith('- ')) {
                                return (
                                    <div key={idx} className="message-list-item" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginRight: '16px' }}>
                                        <span style={{ color: 'var(--color-highlight)', marginTop: '4px' }}>•</span>
                                        <span style={{ lineHeight: '1.7' }}>{parseBold(line.trim().substring(2))}</span>
                                    </div>
                                );
                            }

                            // Numbered Lists
                            if (/^\d+\.\s/.test(line.trim())) {
                                const match = line.trim().match(/^(\d+)\.\s(.*)/);
                                if (match) {
                                    return (
                                        <div key={idx} className="message-list-item" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px', marginRight: '16px' }}>
                                            <span style={{ color: 'var(--color-highlight)', fontFamily: 'monospace', fontSize: '14px', marginTop: '2px', minWidth: '20px' }}>{match[1]}.</span>
                                            <span style={{ lineHeight: '1.7' }}>{parseBold(match[2])}</span>
                                        </div>
                                    );
                                }
                            }

                            // Warning Blocks
                            if (line.startsWith('⚠️') || line.includes('تحذير:')) {
                                return (
                                    <div key={idx} className="message-warning">
                                        {parseBold(line)}
                                    </div>
                                );
                            }

                            // Tip/Info Blocks
                            if (line.startsWith('💡') || line.startsWith('📌')) {
                                return (
                                    <div key={idx} className="message-tip">
                                        {parseBold(line)}
                                    </div>
                                );
                            }

                            // Emoji Headers (📖, 🛠️, 🚗, 🔍)
                            if (/^(?:📖|🛠️|🚗|🔍)/.test(line)) {
                                return (
                                    <div key={idx} className="message-header" style={{ marginTop: '20px' }}>
                                        {parseBold(line)}
                                    </div>
                                );
                            }

                            // Default paragraph
                            return (
                                <p key={idx} style={{ marginBottom: '8px', lineHeight: '1.7', color: '#e2e8f0' }}>
                                    {parseBold(line)}
                                </p>
                            );
                        })}
                    </div>

                    {message.citations && message.citations.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            style={{ marginTop: '20px' }}
                        >
                            {/* Inline page images from referenced manuals */}
                            {message.citations.filter(c => c.type === 'manual' && c.pages && c.pages.length > 0).map((citation, cIdx) => (
                                <div key={`pages-${cIdx}`} style={{ marginTop: '16px' }}>
                                    {citation.pages!.map((pageNum) => (
                                        <PdfPageViewer
                                            key={`${citation.doc_id}-p${pageNum}`}
                                            manualId={citation.doc_id}
                                            pageNumber={pageNum}
                                            title={citation.doc_title}
                                            onClickFullSize={() => onViewPage(citation.doc_id, pageNum, citation.doc_title)}
                                        />
                                    ))}
                                </div>
                            ))}

                            {/* Source cards */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                                <Search size={12} />
                                <span>المصادر المستخدمة</span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                                {message.citations.map((citation, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 * idx }}
                                        style={{
                                            padding: '12px',
                                            borderRadius: '10px',
                                            border: '1px solid var(--glass-border)',
                                            background: 'var(--glass-bg)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: '12px',
                                            transition: 'border-color 0.2s ease',
                                        }}
                                        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-highlight)'; }}
                                        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--glass-border)'; }}
                                    >
                                        <div style={{
                                            padding: '8px',
                                            borderRadius: '8px',
                                            background: citation.type === 'manual' ? 'rgba(59,130,246,0.1)' : citation.type === 'fault' ? 'rgba(239,68,68,0.1)' : 'rgba(168,85,247,0.1)',
                                        }}>
                                            {citation.type === 'manual' ? (
                                                <Book size={16} style={{ color: '#3b82f6' }} />
                                            ) : citation.type === 'fault' ? (
                                                <Wrench size={16} style={{ color: '#ef4444' }} />
                                            ) : (
                                                <FileText size={16} style={{ color: '#a855f7' }} />
                                            )}
                                        </div>

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-white)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {citation.doc_title}
                                                </div>
                                                {citation.type === 'manual' && citation.page && (
                                                    <span style={{ fontSize: '10px', background: 'rgba(59,130,246,0.2)', color: '#60a5fa', padding: '2px 6px', borderRadius: '4px' }}>
                                                        ص {citation.page}
                                                    </span>
                                                )}
                                            </div>

                                            <div style={{ fontSize: '11px', marginTop: '4px', color: 'var(--color-text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {citation.snippet}
                                            </div>

                                            {citation.type === 'manual' && citation.page && (
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        onViewPage(citation.doc_id, citation.page!, citation.doc_title);
                                                    }}
                                                    style={{
                                                        marginTop: '8px',
                                                        fontSize: '11px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        padding: '4px 8px',
                                                        borderRadius: '6px',
                                                        background: 'rgba(255,255,255,0.05)',
                                                        border: 'none',
                                                        color: 'var(--color-highlight)',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    <Eye size={12} />
                                                    عرض الصفحة
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

const UploadModal = ({ onClose, onUploadSuccess, vehicles }: { onClose: () => void; onUploadSuccess: () => void; vehicles: any[] }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedVehicleId, setSelectedVehicleId] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                toast.error('يرجى اختيار ملف PDF فقط');
                return;
            }
            if (file.size > 100 * 1024 * 1024) {
                toast.error('حجم الملف يجب أن يكون أقل من 100MB');
                return;
            }
            setSelectedFile(file);
            if (!title) setTitle(file.name.replace('.pdf', ''));
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !title.trim()) {
            toast.error('يرجى اختيار ملف وإدخال العنوان');
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        try {
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 10, 90));
            }, 200);

            await aiService.uploadManual(selectedFile, title, description, selectedVehicleId);

            clearInterval(progressInterval);
            setUploadProgress(100);

            toast.success('تم رفع الكراسة بنجاح!');
            onUploadSuccess();
            setTimeout(onClose, 500);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'فشل رفع الملف');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={onClose}>
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={(e) => e.stopPropagation()}
                className="glass-card w-full max-w-2xl p-8 relative"
            >
                <button onClick={onClose} className="absolute top-4 left-4 p-2 hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-colors">
                    <X size={18} style={{ color: 'var(--color-text-muted)' }} />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', boxShadow: 'var(--shadow-neon)' }}>
                        <Upload size={24} style={{ color: 'white' }} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold" style={{ color: 'var(--color-white)' }}>رفع كراسة فنية جديدة</h3>
                        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>PDF حتى 100MB</p>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                        />
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 hover:bg-[rgba(255,255,255,0.02)] transition-all cursor-pointer"
                            style={{ borderColor: selectedFile ? 'var(--color-primary)' : 'var(--glass-border)' }}
                        >
                            {selectedFile ? (
                                <>
                                    <FileText size={40} style={{ color: 'var(--color-primary)' }} />
                                    <div className="text-center">
                                        <p className="font-medium" style={{ color: 'var(--color-text)' }}>{selectedFile.name}</p>
                                        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <FileText size={40} style={{ color: 'var(--color-text-muted)' }} />
                                    <p className="font-medium" style={{ color: 'var(--color-text)' }}>اضغط لاختيار ملف PDF</p>
                                </>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-2" style={{ color: 'var(--color-text)' }}>عنوان الكراسة *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="مثال: دليل صيانة مرسيدس أكتروس 2024"
                            className="neon-input"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-2" style={{ color: 'var(--color-text)' }}>الوصف</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="وصف مختصر عن محتوى الكراسة..."
                            className="neon-input"
                            rows={3}
                            style={{ resize: 'vertical' }}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-2" style={{ color: 'var(--color-text)' }}>المركبة المخصصة</label>
                        <select
                            value={selectedVehicleId}
                            onChange={(e) => setSelectedVehicleId(e.target.value)}
                            className="neon-input"
                        >
                            <option value="">جميع المركبات (عام)</option>
                            {vehicles.map((vehicle) => (
                                <option key={vehicle.id} value={vehicle.id}>
                                    {vehicle.plate_number} - {vehicle.vehicle_type}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                            💡 اختر مركبة محددة أو اترك "جميع المركبات" للكراسات العامة
                        </p>
                    </div>

                    {uploading && (
                        <div>
                            <div className="flex justify-between text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>
                                <span>جاري الرفع...</span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${uploadProgress}%` }}
                                    style={{ height: '100%', background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))' }}
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 mt-2">
                        <button
                            onClick={onClose}
                            disabled={uploading}
                            className="flex-1 px-4 py-3 rounded-lg font-medium transition-colors"
                            style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-muted)' }}
                        >
                            إلغاء
                        </button>
                        <button
                            onClick={handleUpload}
                            disabled={!selectedFile || !title.trim() || uploading}
                            className="neon-button flex-1"
                            style={{ opacity: (!selectedFile || !title.trim() || uploading) ? 0.5 : 1 }}
                        >
                            {uploading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    جاري الرفع...
                                </>
                            ) : (
                                <>
                                    <Upload size={18} />
                                    رفع الآن
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const AssistantPage = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: 'مرحباً بك في المساعد الفني الذكي! 🚀\n\nأنا هنا لمساعدتك في:\n• تشخيص الأعطال الفنية\n• البحث في الكراسات والأدلة\n• تقديم إرشادات الصيانة الدقيقة\n\nكيف يمكنني مساعدتك اليوم؟',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | undefined>(undefined);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [manuals, setManuals] = useState<TechnicalManual[]>([]);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [selectedVehicle, setSelectedVehicle] = useState<string>('');
    const [reprocessingId, setReprocessingId] = useState<string | null>(null);
    const [viewingPage, setViewingPage] = useState<{ manualId: string, page: number, title: string } | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const user = authService.getCurrentUser();
    const canEdit = user?.role === 'admin' || user?.role === 'trainer';

    useEffect(() => {
        loadManuals();
        loadVehicles();
    }, []);

    const loadVehicles = async () => {
        try {
            const data = await vehiclesService.getAll();
            setVehicles(data.data || []);
        } catch (error) {
            console.error('Failed to load vehicles:', error);
        }
    };

    const loadManuals = async () => {
        try {
            const data = await aiService.getManuals();
            setManuals(data);
        } catch (error) {
            console.error('Failed to load manuals:', error);
        }
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await aiService.sendMessage(userMessage.content, sessionId, selectedVehicle);
            if (response.session_id && !sessionId) setSessionId(response.session_id);

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.answer,
                citations: response.citations,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            toast.error('خطأ في الاتصال بالخادم');
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.',
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReprocess = async (manualId: string) => {
        setReprocessingId(manualId);
        try {
            const result = await aiService.reprocessManual(manualId);
            if (result.success) {
                toast.success(result.message || 'تم إعادة معالجة الكراسة بنجاح!');
            } else {
                toast.error(result.message || 'فشل إعادة المعالجة');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'فشل إعادة معالجة الكراسة');
        } finally {
            setReprocessingId(null);
        }
    };

    return (
        <DashboardLayout>
            <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 120px)' }}>
                <motion.div
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="glass-card"
                    style={{ width: '300px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}
                >
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '15px', color: 'var(--color-white)' }}>قاعدة المعرفة</h3>
                        <div className="text-xs font-bold mb-3" style={{ color: 'var(--color-text-muted)', paddingRight: '10px' }}>
                            الكراسات المتاحة ({manuals.length})
                        </div>
                        {canEdit && (
                            <button
                                onClick={() => {
                                    console.log('🔴 Button clicked! Opening upload modal...');
                                    setShowUploadModal(true);
                                }}
                                className="neon-button"
                                style={{ width: '100%', fontSize: '0.9rem', padding: '12px', marginBottom: '20px' }}
                            >
                                <Plus size={18} />
                                إضافة كراسة
                            </button>
                        )}
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {manuals.length === 0 ? (
                            <div className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
                                <Book size={32} className="mx-auto mb-2 opacity-30" />
                                <p className="text-sm">لا توجد كراسات فنية</p>
                                {canEdit && <p className="text-xs mt-1">اضغط على "إضافة كراسة" لرفع ملفات PDF</p>}
                            </div>
                        ) : (
                            manuals.map((manual) => (
                                <motion.div
                                    key={manual.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="group flex items-center gap-3 p-3 rounded-lg mb-2 transition-all relative"
                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid transparent' }}
                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-highlight)'}
                                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
                                >
                                    <Book size={16} style={{ color: 'var(--color-primary)' }} />
                                    <span className="text-sm truncate flex-1" style={{ color: 'var(--color-text)' }}>{manual.title}</span>
                                    {canEdit && (
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleReprocess(manual.id);
                                                }}
                                                disabled={reprocessingId === manual.id}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-blue-500/20 transition-all"
                                                title="إعادة استخراج المحتوى"
                                            >
                                                <RefreshCw size={14} className={reprocessingId === manual.id ? 'animate-spin' : ''} style={{ color: '#3b82f6' }} />
                                            </button>
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (window.confirm(`هل أنت متأكد من حذف الكراسة "${manual.title}"؟`)) {
                                                        try {
                                                            await aiService.deleteManual(manual.id);
                                                            toast.success('تم حذف الكراسة بنجاح');
                                                            loadManuals();
                                                        } catch (error: any) {
                                                            toast.error(error.response?.data?.message || 'فشل حذف الكراسة');
                                                        }
                                                    }
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-red-500/20 transition-all"
                                                title="حذف الكراسة"
                                            >
                                                <Trash2 size={14} style={{ color: '#ef4444' }} />
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            ))
                        )}
                    </div>
                </motion.div>

                <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {/* Vehicle Selector */}
                    <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--glass-border)', background: 'rgba(194,178,128,0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Car size={18} style={{ color: 'var(--color-highlight)' }} />
                            <select
                                value={selectedVehicle}
                                onChange={(e) => setSelectedVehicle(e.target.value)}
                                className="neon-input"
                                style={{ flex: 1, padding: '8px 12px', fontSize: '14px' }}
                            >
                                <option value="">جميع المركبات</option>
                                {vehicles.map((vehicle) => (
                                    <option key={vehicle.id} value={vehicle.id}>
                                        {vehicle.plate_number} - {vehicle.vehicle_type}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {selectedVehicle && (
                            <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
                                💡 البحث مخصص للمركبة المختارة فقط
                            </p>
                        )}
                    </div>

                    <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{
                            width: '45px',
                            height: '45px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: 'var(--shadow-neon)'
                        }}>
                            <Brain size={24} style={{ color: 'white' }} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-white)' }}>المساعد الفني الذكي</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>متصل • جاهز للمساعدة</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '30px 20px', paddingBottom: '150px' }}>
                        {messages.map((msg) => (
                            <ChatBubble
                                key={msg.id}
                                message={msg}
                                onViewPage={(manualId, page, title) => setViewingPage({ manualId, page, title })}
                            />
                        ))}

                        {isLoading && (
                            <div className="mb-8 bg-[rgba(85,107,47,0.05)] border-y border-[rgba(194,178,128,0.1)] py-6">
                                <div className="max-w-4xl mx-auto flex gap-5">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', boxShadow: 'var(--shadow-neon)' }}>
                                        <Brain size={18} style={{ color: 'white' }} className="animate-pulse" />
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        {[0, 1, 2].map((i) => (
                                            <motion.div
                                                key={i}
                                                animate={{ scale: [1, 1.3, 1] }}
                                                transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                                                className="w-2 h-2 rounded-full"
                                                style={{ background: 'var(--color-highlight)' }}
                                            />
                                        ))}
                                        <span className="text-sm mr-2" style={{ color: 'var(--color-text-muted)' }}>جاري التفكير...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '20px 30px 30px',
                        background: 'linear-gradient(to top, var(--color-surface), transparent)',
                        pointerEvents: 'none'
                    }}>
                        <form onSubmit={handleSendMessage} style={{ pointerEvents: 'all', maxWidth: '900px', margin: '0 auto' }}>
                            <div style={{
                                display: 'flex',
                                gap: '12px',
                                background: 'var(--color-surface-soft)',
                                padding: '12px',
                                borderRadius: '16px',
                                border: '1px solid var(--glass-border)',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                            }}>
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="اكتب رسالتك هنا..."
                                    className="neon-input"
                                    style={{ flex: 1, margin: 0, background: 'transparent', border: 'none', padding: '12px' }}
                                    disabled={isLoading}
                                />

                                <button
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    className="neon-button"
                                    style={{ padding: '12px 24px', minWidth: 'auto' }}
                                >
                                    {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                                </button>
                            </div>
                            <p className="text-center mt-2" style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                                <Sparkles size={10} style={{ display: 'inline', marginLeft: '4px' }} />
                                مدعوم بالذكاء الاصطناعي المتقدم
                            </p>
                        </form>
                    </div>
                </div>
            </div>

            {showUploadModal && <UploadModal onClose={() => setShowUploadModal(false)} onUploadSuccess={loadManuals} vehicles={vehicles} />}

            <Modal
                isOpen={!!viewingPage}
                onClose={() => setViewingPage(null)}
                title={viewingPage ? `${viewingPage.title} - صفحة ${viewingPage.page}` : ''}
                maxWidth="900px"
            >
                {viewingPage && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px', background: 'rgba(0,0,0,0.5)', minHeight: '600px' }}>
                        <iframe
                            src={`${API_BASE_URL}/ai/manuals/${viewingPage.manualId}/pdf#page=${viewingPage.page}`}
                            style={{
                                width: '100%',
                                height: '600px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                background: 'white',
                            }}
                            title={`${viewingPage.title} - صفحة ${viewingPage.page}`}
                        />
                        <div style={{ marginTop: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <a
                                href={`${API_BASE_URL}/ai/manuals/${viewingPage.manualId}/pdf#page=${viewingPage.page}`}
                                target="_blank"
                                rel="noreferrer"
                                className="neon-button"
                                style={{ padding: '8px 16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
                            >
                                <Eye size={16} />
                                فتح PDF في تبويب جديد
                            </a>
                            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                                📄 صفحة {viewingPage.page}
                            </span>
                        </div>
                    </div>
                )}
            </Modal>
        </DashboardLayout>
    );
};

export default AssistantPage;
