import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Send, User, FileText, Sparkles, Loader2,
    Wrench, Upload, Book, X, Search, Brain, Plus, Trash2, Car
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { aiService } from '../services/ai.service';
import type { Citation as AICitation, TechnicalManual } from '../services/ai.service';
import { toast } from 'react-hot-toast';
import { authService } from '../services/auth.service';
import { vehiclesService } from '../services/vehicles.service';
import '../styles/ai-message.css';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    citations?: AICitation[];
    timestamp: Date;
}

const ChatBubble = ({ message }: { message: Message }) => {
    const isUser = message.role === 'user';

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-8 ${isUser ? '' : 'bg-[rgba(85,107,47,0.05)] border-y border-[rgba(194,178,128,0.1)] py-6'}`}
        >
            <div className="max-w-4xl mx-auto flex gap-5">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg ${isUser
                        ? 'bg-[rgba(255,255,255,0.08)]'
                        : 'bg-gradient-to-br from-[#C2B280] to-[#8B7355] shadow-[0_0_20px_rgba(194,178,128,0.3)]'
                        }`}
                >
                    {isUser ? (
                        <User size={18} style={{ color: 'var(--color-text-muted)' }} />
                    ) : (
                        <Brain size={18} style={{ color: '#2B2D31' }} />
                    )}
                </motion.div>

                <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold" style={{ color: isUser ? 'var(--color-text-muted)' : 'var(--color-highlight)' }}>
                            {isUser ? 'أنت' : 'المساعد الفني الذكي'}
                        </span>
                        {!isUser && (
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(194,178,128,0.1)', border: '1px solid rgba(194,178,128,0.2)' }}>
                                <Sparkles size={10} style={{ color: 'var(--color-highlight)' }} />
                                <span className="text-[10px] font-bold" style={{ color: 'var(--color-highlight)' }}>AI</span>
                            </div>
                        )}
                    </div>

                    <div
                        className="ai-message-content"
                        style={{
                            color: isUser ? 'var(--color-white)' : 'var(--color-text)'
                        }}
                    >
                        {message.content.split('\n').map((line, idx) => {
                            // Skip empty lines but keep spacing
                            if (line.trim() === '') {
                                return <div key={idx} style={{ height: '8px' }} />;
                            }

                            // Check for different line types
                            const isMainHeader = /^📖\s*\*\*/.test(line);
                            const isWarning = /^⚠️\s*\*\*/.test(line);
                            const isTip = /^💡\s*\*\*/.test(line);
                            const isListItem = /^[\d]+\.\s/.test(line);
                            const isBullet = /^[-•]\s/.test(line);
                            const isSource = /^\(المصدر:/.test(line);
                            const isBold = /\*\*.*\*\*/.test(line);

                            // Clean the line from markdown
                            let cleanLine = line.replace(/\*\*/g, '');

                            // Main header (📖 من الكراسة...)
                            if (isMainHeader) {
                                return (
                                    <div key={idx} className="message-header">
                                        {cleanLine}
                                    </div>
                                );
                            }

                            // Warning section
                            if (isWarning) {
                                return (
                                    <div key={idx} className="message-warning">
                                        <strong>{cleanLine}</strong>
                                    </div>
                                );
                            }

                            // Tip section
                            if (isTip) {
                                return (
                                    <div key={idx} className="message-tip">
                                        <strong>{cleanLine}</strong>
                                    </div>
                                );
                            }

                            // Source citation
                            if (isSource) {
                                return (
                                    <div key={idx} className="message-source">
                                        {cleanLine}
                                    </div>
                                );
                            }

                            // List items
                            if (isListItem || isBullet) {
                                return (
                                    <div key={idx} className="message-list-item">
                                        {cleanLine}
                                    </div>
                                );
                            }

                            // Bold text
                            if (isBold) {
                                return (
                                    <div key={idx} className="message-section">
                                        <strong>{cleanLine}</strong>
                                    </div>
                                );
                            }

                            // Regular text
                            return (
                                <div key={idx} style={{ marginBottom: '8px', lineHeight: '1.7' }}>
                                    {cleanLine}
                                </div>
                            );
                        })}
                    </div>

                    {message.citations && message.citations.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="mt-5 space-y-3"
                        >
                            <div className="flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--color-text-muted)' }}>
                                <Search size={12} />
                                <span>المصادر المستخدمة</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {message.citations.map((citation, idx) => (
                                    <motion.a
                                        key={idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 * idx }}
                                        href={citation.link || '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="glass-card group flex items-start gap-3 p-4 hover:border-[var(--color-highlight)] transition-all cursor-pointer"
                                        style={{ borderColor: 'var(--glass-border)' }}
                                    >
                                        <div className={`p-2 rounded-lg ${citation.type === 'manual'
                                            ? 'bg-[rgba(59,130,246,0.1)]'
                                            : citation.type === 'fault'
                                                ? 'bg-[rgba(239,68,68,0.1)]'
                                                : 'bg-[rgba(168,85,247,0.1)]'
                                            }`}>
                                            {citation.type === 'manual' ? (
                                                <Book size={16} style={{ color: '#3b82f6' }} />
                                            ) : citation.type === 'fault' ? (
                                                <Wrench size={16} style={{ color: '#ef4444' }} />
                                            ) : (
                                                <FileText size={16} style={{ color: '#a855f7' }} />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-semibold truncate group-hover:text-[var(--color-highlight)] transition-colors" style={{ color: 'var(--color-white)' }}>
                                                {citation.doc_title}
                                            </div>
                                            <div className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>
                                                {citation.snippet}
                                            </div>
                                        </div>
                                    </motion.a>
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
                            <ChatBubble key={msg.id} message={msg} />
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
        </DashboardLayout>
    );
};

export default AssistantPage;
