import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight,
    Play,
    Image as ImageIcon,
    Info,
    CheckCircle2,
    Clock,
    MonitorPlay,
    Edit,
    X,
    Save,
    Film,
    Upload as UploadIcon,
    Trash2,
    Edit2,
    Wrench,
    Briefcase,
    ShieldCheck,
    Hammer,
    Users
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { authService } from '../services/auth.service';
import { systemsService, type DiagnosisItem, type DiagnosisMedia } from '../services/systems.service';
import { uploadService } from '../services/upload.service';
import { toast } from 'react-hot-toast';
import '../styles/video-player.css';

const MediaGallery = ({ media, canEdit, onMediaDelete, onMediaUpdate }: {
    media: DiagnosisMedia[],
    canEdit: boolean,
    onMediaDelete?: (mediaId: number) => void,
    onMediaUpdate?: (mediaId: number, newUrl: string) => void
}) => {
    const [activeIdx, setActiveIdx] = useState(0);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editUrl, setEditUrl] = useState('');

    if (!media || media.length === 0) return (
        <div style={{ height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '24px', border: '1px dashed var(--glass-border)' }}>
            <MonitorPlay size={48} color="var(--color-text-muted)" style={{ marginBottom: '16px' }} />
            <p style={{ color: 'var(--color-text-muted)' }}>لا توجد وسائط تعليمية لهذا الإجراء</p>
        </div>
    );

    const currentMedia = media[activeIdx];

    const handleDelete = () => {
        if (onMediaDelete && currentMedia) {
            onMediaDelete(currentMedia.id);
            setShowDeleteConfirm(false);
            if (activeIdx >= media.length - 1) {
                setActiveIdx(Math.max(0, activeIdx - 1));
            }
        }
    };

    const handleEdit = () => {
        if (onMediaUpdate && currentMedia && editUrl) {
            onMediaUpdate(currentMedia.id, editUrl);
            setShowEditModal(false);
            setEditUrl('');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ position: 'relative', height: '450px', background: '#000', borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                <AnimatePresence mode="wait">
                    {currentMedia?.type === 'image' ? (
                        <motion.img
                            key={currentMedia.url}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            src={currentMedia.url}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                    ) : (
                        <motion.video
                            key={currentMedia?.url}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            controls
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            src={currentMedia?.url}
                        >
                            <source src={currentMedia?.url} type="video/mp4" />
                            <source src={currentMedia?.url} type="video/webm" />
                            متصفحك لا يدعم تشغيل الفيديو.
                        </motion.video>
                    )}
                </AnimatePresence>

                <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', padding: '20px', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ color: '#fff', fontWeight: 600 }}>الوسائط المرفقة {activeIdx + 1}</p>
                        {canEdit && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => {
                                        setEditUrl(currentMedia?.url || '');
                                        setShowEditModal(true);
                                    }}
                                    style={{
                                        background: 'rgba(245, 158, 11, 0.9)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '8px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <Edit2 size={18} color="#fff" />
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setShowDeleteConfirm(true)}
                                    style={{
                                        background: 'rgba(239, 68, 68, 0.9)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '8px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <Trash2 size={18} color="#fff" />
                                </motion.button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 100
                    }}>
                        <div className="glass-card" style={{ padding: '30px', textAlign: 'center', maxWidth: '400px' }}>
                            <Trash2 size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
                            <h3 style={{ color: '#fff', marginBottom: '12px' }}>تأكيد الحذف</h3>
                            <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>
                                هل أنت متأكد من حذف هذه الوسائط؟ لا يمكن التراجع عن هذا الإجراء.
                            </p>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        background: 'rgba(255,255,255,0.1)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        cursor: 'pointer'
                                    }}
                                >
                                    إلغاء
                                </button>
                                <button
                                    onClick={handleDelete}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        background: '#ef4444',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        fontWeight: 600
                                    }}
                                >
                                    حذف
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit URL Modal */}
                {showEditModal && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 100
                    }}>
                        <div className="glass-card" style={{ padding: '30px', width: '90%', maxWidth: '500px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <h3 style={{ color: '#fff' }}>تعديل رابط الوسائط</h3>
                                <X size={24} style={{ cursor: 'pointer' }} onClick={() => setShowEditModal(false)} />
                            </div>
                            <input
                                className="neon-input"
                                value={editUrl}
                                onChange={(e) => setEditUrl(e.target.value)}
                                placeholder="أدخل الرابط الجديد..."
                                style={{ marginBottom: '20px' }}
                            />
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        background: 'rgba(255,255,255,0.1)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        cursor: 'pointer'
                                    }}
                                >
                                    إلغاء
                                </button>
                                <button
                                    onClick={handleEdit}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        background: '#f59e0b',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        fontWeight: 600
                                    }}
                                >
                                    حفظ
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '10px' }}>
                {media.map((m, idx) => (
                    <motion.div
                        key={m.id}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => setActiveIdx(idx)}
                        style={{
                            width: '100px',
                            height: '70px',
                            borderRadius: '12px',
                            background: '#222',
                            cursor: 'pointer',
                            border: activeIdx === idx ? '2px solid #3b82f6' : '1px solid var(--glass-border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            flexShrink: 0
                        }}
                    >
                        {m.type === 'image' ? (
                            <img
                                src={m.url}
                                alt=""
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100x70?text=Error';
                                }}
                            />
                        ) : (
                            <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000' }}>
                                <video
                                    src={m.url}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    muted
                                />
                                <div style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    background: 'rgba(59, 130, 246, 0.9)',
                                    borderRadius: '50%',
                                    width: '30px',
                                    height: '30px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Play size={16} color="#fff" />
                                </div>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

const EditWorkPackageModal = ({ item, onClose, onRefresh }: { item: DiagnosisItem, onClose: () => void, onRefresh: () => void }) => {
    const [steps, setSteps] = useState(() => {
        if (!item.work_package_content) return '';
        return item.work_package_content
            .split(/\n|\\n/)
            .map(s => s.trim())
            .filter(Boolean)
            .map(s => s.replace(/^\d+[\.\-\)]\s*/, '')) // Remove manual numbers
            .join('\n');
    });
    const [tools, setTools] = useState<string[]>(() => {
        if (!item.required_tools) return [];
        return item.required_tools.split(',').map(t => t.trim()).filter(Boolean);
    });
    const [safety, setSafety] = useState(item.safety_procedures || '');
    const [workshop, setWorkshop] = useState(item.workshop_requirements || '');
    const [technicians, setTechnicians] = useState(item.technicians_count || 1);
    const [toolInput, setToolInput] = useState('');
    const [time, setTime] = useState(item.estimated_time || '');
    const [loading, setLoading] = useState(false);

    // Media local state
    const [mediaUrl, setMediaUrl] = useState('');
    const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
    const [uploading, setUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const response = await uploadService.uploadFile(file);
            setMediaUrl(response.data.url);
            setMediaType(response.data.type);
            toast.success('تم رفع الملف بنجاح');
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.message || 'فشل في رفع الملف');
        } finally {
            setUploading(false);
        }
    };

    const handleAddTool = () => {
        if (toolInput.trim()) {
            if (!tools.includes(toolInput.trim())) {
                setTools([...tools, toolInput.trim()]);
            }
            setToolInput('');
        }
    };

    const removeTool = (idx: number) => {
        setTools(tools.filter((_, i) => i !== idx));
    };

    const handleUpdate = async () => {
        setLoading(true);
        try {
            // Automatically add tool if there's something in the input
            let finalTools = [...tools];
            if (toolInput.trim() && !finalTools.includes(toolInput.trim())) {
                finalTools.push(toolInput.trim());
            }

            await systemsService.updateItem(item.id, {
                title: item.title,
                description: item.description,
                estimated_time: time,
                work_package_content: steps,
                required_tools: finalTools.join(','),
                safety_procedures: safety,
                workshop_requirements: workshop,
                technicians_count: technicians
            });

            if (mediaUrl) {
                await systemsService.addMedia(item.id, {
                    type: mediaType,
                    url: mediaUrl
                });
            }

            toast.success('تم تحديث حزمة العمل بنجاح');
            onRefresh();
            onClose();
        } catch (err) {
            console.error(err);
            toast.error('فشل في حفظ التعديلات');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.8)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '20px'
            }}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="glass-card"
                style={{ width: '100%', maxWidth: '700px', padding: '30px', border: '1px solid var(--glass-border)', maxHeight: '90vh', overflowY: 'auto' }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '1.5rem', color: '#fff' }}>تعديل حزمة العمل: {item.title}</h3>
                    <X size={24} style={{ cursor: 'pointer' }} onClick={onClose} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>خطوات العمل (كل خطوة في سطر منفصل وبدون ترقيم)</label>
                        <textarea
                            className="neon-input"
                            value={steps}
                            onChange={(e) => setSteps(e.target.value)}
                            rows={8}
                            placeholder="الخطوة الأولى&#10;الخطوة الثانية&#10;الخطوة الثالثة..."
                        />
                        <p style={{ fontSize: '0.75rem', color: 'rgba(245, 158, 11, 0.8)', marginTop: '8px' }}>
                            * لا تقم بكتابة الأرقام (1, 2, ..)؛ سيقوم النظام بترقيم الخطوات تلقائياً عند العرض.
                        </p>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '12px', fontSize: '1.1rem', color: '#fff', fontWeight: 600 }}>الأدوات المطلوبة</label>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                            <input
                                className="neon-input"
                                value={toolInput}
                                onChange={(e) => setToolInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTool())}
                                placeholder="اسم الأداة (مثال: مفتاح ربط 10 ملم)"
                                style={{ flex: 1 }}
                            />
                            <button
                                type="button"
                                onClick={handleAddTool}
                                className="neon-button"
                                style={{ width: 'auto', padding: '0 25px', height: 'auto', fontSize: '1rem', background: 'rgba(59, 130, 246, 0.1)' }}
                            >
                                <span style={{ marginRight: '8px' }}>+</span> إضافة
                            </button>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                            أدخل اسم الأداة واضغط "إضافة" أو Enter لإضافتها للقائمة
                        </p>

                        {/* Display added tools list */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            {tools.map((tool, idx) => (
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    key={idx}
                                    style={{
                                        background: 'rgba(245, 158, 11, 0.1)',
                                        color: '#f59e0b',
                                        padding: '6px 14px',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        border: '1px solid rgba(245, 158, 11, 0.2)'
                                    }}
                                >
                                    <Briefcase size={14} />
                                    <span>{tool}</span>
                                    <X
                                        size={14}
                                        style={{ cursor: 'pointer', opacity: 0.7 }}
                                        onClick={() => removeTool(idx)}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '20px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>الوقت المتوقع</label>
                            <input
                                className="neon-input"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                placeholder="مثال: 45 دقيقة"
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>عدد الفنيين</label>
                            <input
                                type="number"
                                className="neon-input"
                                value={technicians}
                                onChange={(e) => setTechnicians(parseInt(e.target.value) || 1)}
                                min="1"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '20px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>إجراءات السلامة (كل إجراء في سطر)</label>
                            <textarea
                                className="neon-input"
                                value={safety}
                                onChange={(e) => setSafety(e.target.value)}
                                rows={4}
                                placeholder="ارتداء القفازات&#10;تأمين المركبة..."
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>متطلبات الورشة (كل مطلب في سطر)</label>
                            <textarea
                                className="neon-input"
                                value={workshop}
                                onChange={(e) => setWorkshop(e.target.value)}
                                rows={4}
                                placeholder="إضاءة جيدة&#10;نظافة المكان..."
                            />
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
                        <h4 style={{ fontSize: '1rem', color: '#fff', marginBottom: '16px' }}>إضافة وسائط تعليمية (اختياري)</h4>
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                            <button
                                onClick={() => setMediaType('image')}
                                style={{
                                    flex: 1, padding: '10px', borderRadius: '8px',
                                    background: mediaType === 'image' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                                    border: `1px solid ${mediaType === 'image' ? '#3b82f6' : 'var(--glass-border)'}`,
                                    color: mediaType === 'image' ? '#3b82f6' : '#fff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                }}
                            >
                                <ImageIcon size={18} /> صور
                            </button>
                            <button
                                onClick={() => setMediaType('video')}
                                style={{
                                    flex: 1, padding: '10px', borderRadius: '8px',
                                    background: mediaType === 'video' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                                    border: `1px solid ${mediaType === 'video' ? '#3b82f6' : 'var(--glass-border)'}`,
                                    color: mediaType === 'video' ? '#3b82f6' : '#fff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                }}
                            >
                                <Film size={18} /> فيديو
                            </button>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <input
                                    className="neon-input"
                                    value={mediaUrl}
                                    onChange={(e) => setMediaUrl(e.target.value)}
                                    placeholder="رابط (URL) أو اختر ملف من اليسار..."
                                    style={{ paddingLeft: '40px' }}
                                />
                                {uploading && (
                                    <div className="spinner" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px' }} />
                                )}
                            </div>
                            <label style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '12px',
                                background: 'rgba(59, 130, 246, 0.1)',
                                border: '1px solid #3b82f6',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: '#3b82f6',
                                flexShrink: 0
                            }}>
                                <input type="file" hidden onChange={handleFileChange} accept="image/*,video/*" />
                                <UploadIcon size={20} />
                            </label>
                        </div>
                    </div>

                    <button className="neon-button" style={{ marginTop: '20px' }} onClick={handleUpdate} disabled={loading}>
                        <Save size={18} />
                        <span>{loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}</span>
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

const WorkPackagePage = () => {
    const { itemId } = useParams();
    const [item, setItem] = useState<DiagnosisItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const user = authService.getCurrentUser();
    const canEdit = user?.role === 'admin' || user?.role === 'trainer';

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            if (itemId) {
                const response = await systemsService.getItemDetails(Number(itemId));
                if (response && response.success && response.data) {
                    setItem(response.data);
                } else {
                    setError('لم يتم العثور على بيانات حزمة العمل');
                }
            }
        } catch (err: any) {
            console.error('❌ Fetch work package error:', err);
            setError('حدث خطأ أثناء تحميل حزمة العمل. يرجى المحاولة مرة أخرى.');
        } finally {
            setLoading(false);
        }
    };

    const handleMediaDelete = async (mediaId: number) => {
        console.log('🗑️ Attempting to delete media:', mediaId);
        try {
            console.log('📡 Calling deleteMedia API...');
            const result = await systemsService.deleteMedia(mediaId);
            console.log('✅ Delete result:', result);
            toast.success('تم حذف الوسائط بنجاح');
            fetchData(); // Refresh data
        } catch (err: any) {
            console.error('❌ Delete media error:', err);
            console.error('❌ Error response:', err.response);
            toast.error(err.response?.data?.message || 'فشل في حذف الوسائط');
        }
    };

    const handleMediaUpdate = async (mediaId: number, newUrl: string) => {
        try {
            const currentMedia = item?.media?.find(m => m.id === mediaId);
            if (!currentMedia) return;

            await systemsService.updateMedia(mediaId, {
                type: currentMedia.type,
                url: newUrl,
                thumbnail_url: currentMedia.thumbnail_url
            });
            toast.success('تم تحديث الوسائط بنجاح');
            fetchData(); // Refresh data
        } catch (err: any) {
            console.error('❌ Update media error:', err);
            toast.error(err.response?.data?.message || 'فشل في تحديث الوسائط');
        }
    };

    useEffect(() => {
        fetchData();
    }, [itemId]);

    if (loading) return (
        <DashboardLayout>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <div className="spinner" />
            </div>
        </DashboardLayout>
    );

    if (error || !item) return (
        <DashboardLayout>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '20px' }}>
                <div style={{ padding: '40px', textAlign: 'center' }} className="glass-card">
                    <h2 style={{ color: '#ef4444', marginBottom: '16px' }}>{error || 'البيانات غير متوفرة'}</h2>
                    <button onClick={() => window.history.back()} className="neon-button" style={{ margin: '0 auto' }}>
                        <ArrowRight size={20} />
                        <span>العودة للخلف</span>
                    </button>
                </div>
            </div>
        </DashboardLayout>
    );

    // Parse steps from work_package_content and clean up any manual numbering
    const steps = item.work_package_content
        ? item.work_package_content
            .split(/\n|\\n/)
            .map(s => s.trim())
            .filter(Boolean)
            .map(s => s.replace(/^\d+[\.\-\)]\s*/, '')) // Remove leading "1.", "1-", "1)" etc.
        : [];

    return (
        <DashboardLayout>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <motion.button
                            whileHover={{ x: -2 }}
                            onClick={() => window.history.back()}
                            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
                        >
                            <ArrowRight size={24} />
                        </motion.button>
                        <div>
                            <h2 style={{ fontSize: '1.8rem' }}>حزمة العمل الفنية</h2>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>الدليل الإرشادي المرئي للفني</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {canEdit && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="neon-button"
                                onClick={() => setIsEditModalOpen(true)}
                                style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid #f59e0b', padding: '10px 20px' }}
                            >
                                <Edit size={18} />
                                <span>تعديل الحزمة</span>
                            </motion.button>
                        )}
                        <div className="glass-card" style={{ padding: '8px 20px', display: 'flex', gap: '15px', alignItems: 'center', borderColor: '#8b5cf6', background: 'rgba(139, 92, 246, 0.1)' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <Clock size={18} color="#8b5cf6" />
                                <span style={{ fontSize: '0.9rem', color: '#8b5cf6', fontWeight: 700 }}>الوقت: {item.estimated_time || 'غير محدد'}</span>
                            </div>
                            <div style={{ width: '1px', height: '20px', background: 'rgba(139, 92, 246, 0.3)' }} />
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <Users size={18} color="#8b5cf6" />
                                <span style={{ fontSize: '0.9rem', color: '#8b5cf6', fontWeight: 700 }}>فنيين: {item.technicians_count || 1}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                    {/* Left Side: Media Explorer */}
                    <div style={{ flex: 1.5, minWidth: '500px' }}>
                        <MediaGallery
                            media={item.media || []}
                            canEdit={canEdit}
                            onMediaDelete={handleMediaDelete}
                            onMediaUpdate={handleMediaUpdate}
                        />
                    </div>

                    {/* Right Side: Instructions & Requirements */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', minWidth: '350px' }}>
                        <div className="glass-card" style={{ padding: '30px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                <Info size={24} color="#3b82f6" />
                                <h3 style={{ fontSize: '1.3rem' }}>{item.title}</h3>
                            </div>

                            <div style={{ marginBottom: '30px' }}>
                                <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '4px', height: '16px', background: '#3b82f6', borderRadius: '2px' }} />
                                    خطوات العمل:
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {steps.map((step, idx) => (
                                        <div key={idx} style={{
                                            padding: '12px 16px',
                                            background: 'rgba(255,255,255,0.03)',
                                            borderRadius: '12px',
                                            border: '1px solid var(--glass-border)',
                                            fontSize: '0.95rem',
                                            color: 'var(--color-text-muted)',
                                            lineHeight: '1.6',
                                            display: 'flex',
                                            gap: '12px'
                                        }}>
                                            <span style={{
                                                color: '#3b82f6',
                                                fontWeight: 'bold',
                                                minWidth: '24px',
                                                borderLeft: '2px solid rgba(59, 130, 246, 0.3)',
                                                paddingLeft: '12px'
                                            }}>
                                                {idx + 1}
                                            </span>
                                            <span>{step}</span>
                                        </div>
                                    ))}
                                    {steps.length === 0 && (
                                        <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.8' }}>
                                            {item.description || 'يرجى اتباع الخطوات الموضحة في الوسائط التعليمية المرفقة لضمان دقة الفحص وسلامة المركبة.'}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Required Tools Section */}
                            <div style={{ marginBottom: '30px' }}>
                                <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Wrench size={18} color="#f59e0b" />
                                    العدة المستخدمة:
                                </h4>
                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '8px',
                                    background: 'rgba(245, 158, 11, 0.05)',
                                    padding: '16px',
                                    borderRadius: '16px',
                                    border: '1px dashed rgba(245, 158, 11, 0.3)'
                                }}>
                                    {item.required_tools ? (
                                        item.required_tools.split(',').map((tool, idx) => (
                                            <span key={idx} style={{
                                                background: 'rgba(245, 158, 11, 0.1)',
                                                color: '#f59e0b',
                                                padding: '4px 12px',
                                                borderRadius: '20px',
                                                fontSize: '0.85rem',
                                                border: '1px solid rgba(245, 158, 11, 0.2)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}>
                                                <Briefcase size={12} />
                                                {tool.trim()}
                                            </span>
                                        ))
                                    ) : (
                                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>لا توجد عدة محددة لهذا الإجراء</p>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div>
                                    <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>
                                        <ShieldCheck size={18} color="#10b981" />
                                        إجراءات السلامة:
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {item.safety_procedures ? (
                                            item.safety_procedures.split('\n').filter(Boolean).map((proc, idx) => (
                                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <CheckCircle2 size={14} color="#10b981" />
                                                    <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{proc.trim()}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem italic' }}>لم يتم تدوين إجراءات سلامة خاصة</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>
                                        <Hammer size={18} color="#3b82f6" />
                                        متطلبات الورشة:
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {item.workshop_requirements ? (
                                            item.workshop_requirements.split('\n').filter(Boolean).map((req, idx) => (
                                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ width: '4px', height: '4px', background: '#3b82f6', borderRadius: '50%' }} />
                                                    <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{req.trim()}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem italic' }}>لا توجد متطلبات ورشة خاصة</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="neon-button"
                                style={{ width: '100%', marginTop: '40px', height: '56px' }}
                                onClick={() => window.history.back()}
                            >
                                <CheckCircle2 size={20} />
                                <span>تأكيد إتمام حزمة العمل</span>
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isEditModalOpen && item && (
                    <EditWorkPackageModal
                        item={item}
                        onClose={() => setIsEditModalOpen(false)}
                        onRefresh={fetchData}
                    />
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
};

export default WorkPackagePage;
