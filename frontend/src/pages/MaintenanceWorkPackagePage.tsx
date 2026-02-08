import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight,
    Play,
    Info,
    CheckCircle2,
    Clock,
    Wrench,
    Briefcase,
    ShieldCheck,
    Users,
    MonitorPlay,
    Edit,
    X,
    Save,
    Film,
    Image as ImageIcon,
    Trash2,
    Upload,
    ChevronLeft
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { authService } from '../services/auth.service';
import { repairService, type RepairTaskDetails } from '../services/repair.service';
import { uploadService } from '../services/upload.service';
import { toast } from 'react-hot-toast';

const getFullUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const baseUrl = 'http://localhost:3000';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

const MediaGallery = ({ media, onDelete, onReorder, canEdit }: {
    media: any[],
    onDelete?: (id: number) => void,
    onReorder?: (id: number, direction: 'left' | 'right') => void,
    canEdit?: boolean
}) => {
    const [activeIdx, setActiveIdx] = useState(0);

    if (!media || media.length === 0) return (
        <div style={{ height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '24px', border: '1px dashed var(--glass-border)' }}>
            <MonitorPlay size={48} color="var(--color-text-muted)" style={{ marginBottom: '16px' }} />
            <p style={{ color: 'var(--color-text-muted)' }}>لا توجد وسائط تعليمية لهذه العملية</p>
        </div>
    );

    const currentMedia = media[activeIdx];
    const fullUrl = getFullUrl(currentMedia?.url);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ position: 'relative', height: '450px', background: '#000', borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                <AnimatePresence mode="wait">
                    {currentMedia?.media_type === 'image' || currentMedia?.type === 'image' ? (
                        <motion.img
                            key={fullUrl}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            src={fullUrl}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                    ) : (
                        <motion.video
                            key={fullUrl}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            controls
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            src={fullUrl}
                        >
                            <source src={fullUrl} type="video/mp4" />
                            متصفحك لا يدعم تشغيل الفيديو.
                        </motion.video>
                    )}
                </AnimatePresence>

                <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', padding: '20px', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', zIndex: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ color: '#fff', fontWeight: 600 }}>الوسائط المرفقة {activeIdx + 1}</p>
                        {canEdit && (
                            <div style={{ display: 'flex', gap: '8px', pointerEvents: 'auto' }}>
                                {/* Reorder Buttons */}
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onReorder) onReorder(currentMedia.id, 'right');
                                    }}
                                    disabled={activeIdx === media.length - 1} // Right (next)
                                    className="glass-card"
                                    style={{
                                        padding: '8px',
                                        background: activeIdx === media.length - 1 ? 'rgba(255,255,255,0.05)' : 'rgba(59, 130, 246, 0.2)',
                                        border: 'none',
                                        cursor: activeIdx === media.length - 1 ? 'default' : 'pointer',
                                        opacity: activeIdx === media.length - 1 ? 0.3 : 1
                                    }}
                                >
                                    <ArrowRight size={18} color="#fff" />
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onReorder) onReorder(currentMedia.id, 'left');
                                    }}
                                    disabled={activeIdx === 0} // Left (prev)
                                    className="glass-card"
                                    style={{
                                        padding: '8px',
                                        background: activeIdx === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(59, 130, 246, 0.2)',
                                        border: 'none',
                                        cursor: activeIdx === 0 ? 'default' : 'pointer',
                                        opacity: activeIdx === 0 ? 0.3 : 1
                                    }}
                                >
                                    <ChevronLeft size={18} color="#fff" />
                                </motion.button>

                                {/* Delete Button */}
                                <motion.button
                                    whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.8)' }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onDelete) onDelete(currentMedia.id);
                                    }}
                                    style={{
                                        padding: '8px',
                                        background: 'rgba(239, 68, 68, 0.5)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        marginRight: '12px'
                                    }}
                                >
                                    <Trash2 size={18} color="#fff" />
                                </motion.button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '10px' }}>
                {media.map((m, idx) => (
                    <motion.div
                        key={idx}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => setActiveIdx(idx)}
                        style={{
                            width: '100px',
                            height: '70px',
                            borderRadius: '12px',
                            background: '#222',
                            cursor: 'pointer',
                            border: activeIdx === idx ? '2px solid #10b981' : '1px solid var(--glass-border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            flexShrink: 0
                        }}
                    >
                        {m.media_type === 'image' || m.type === 'image' ? (
                            <img src={getFullUrl(m.url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000' }}>
                                <Play size={16} color="#fff" />
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

const EditMaintenanceWorkPackageModal = ({ task, onClose, onRefresh }: { task: RepairTaskDetails, onClose: () => void, onRefresh: () => void }) => {
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description);
    const [category, setCategory] = useState(task.category);
    const [safety, setSafety] = useState(task.safety_procedures || '');
    const [workshop, setWorkshop] = useState(task.workshop_requirements || '');
    const [technicians, setTechnicians] = useState(task.technicians_count || 1);
    const [time, setTime] = useState(task.estimated_time || '');
    const [tools, setTools] = useState<string[]>(() => {
        if (!task.required_tools) return [];
        return task.required_tools.split(',').map(t => t.trim()).filter(Boolean);
    });
    const [toolInput, setToolInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

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
        if (!title.trim()) {
            toast.error('يرجى إدخال اسم العملية');
            return;
        }

        setLoading(true);
        try {
            // Automatically add tool if there's something in the input
            let finalTools = [...tools];
            if (toolInput.trim() && !finalTools.includes(toolInput.trim())) {
                finalTools.push(toolInput.trim());
            }

            const response = await repairService.updateTask(task.id, {
                title: title.trim(),
                description: description.trim(),
                category: category.trim(),
                difficulty: task.difficulty,
                estimated_time: time.trim(),
                safety_procedures: safety.trim(),
                workshop_requirements: workshop.trim(),
                technicians_count: Number(technicians) || 1,
                required_tools: finalTools.join(','),
                task_type: 'maintenance'
            });

            if (response && response.success) {
                toast.success('تم تحديث حزمة العمل بنجاح');
                onRefresh();
                onClose();
            } else {
                throw new Error(response?.message || 'فشل التحديث');
            }
        } catch (err: any) {
            console.error('❌ Update task error:', err);
            toast.error(err.message || 'فشل في حفظ التعديلات');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const uploadRes = await uploadService.uploadFile(file);
            if (uploadRes && uploadRes.data && uploadRes.data.url) {
                const type = file.type.startsWith('video') ? 'video' : 'image';
                await repairService.addMedia(task.id, {
                    url: uploadRes.data.url,
                    type: type
                });
                toast.success('تم رفع الملف بنجاح');
                onRefresh();
            } else {
                toast.error('فشل في معالجة الملف المرفوع');
            }
        } catch (err) {
            console.error('❌ Upload media error:', err);
            toast.error('فشل في رفع الملف');
        } finally {
            setUploading(false);
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
                    <h3 style={{ fontSize: '1.5rem', color: '#fff' }}>تعديل حزمة الصيانة: {task.title}</h3>
                    <X size={24} style={{ cursor: 'pointer' }} onClick={onClose} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>اسم العملية</label>
                        <input className="neon-input" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>

                    <div style={{ display: 'flex', gap: '20px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>الفئة</label>
                            <input className="neon-input" value={category} onChange={(e) => setCategory(e.target.value)} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>الوقت المتوقع</label>
                            <input className="neon-input" value={time} onChange={(e) => setTime(e.target.value)} />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>الوصف العام</label>
                        <textarea className="neon-input" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
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
                                style={{ width: 'auto', padding: '0 25px', height: 'auto', fontSize: '1rem', background: 'rgba(16, 185, 129, 0.1)' }}
                            >
                                <span style={{ marginRight: '8px' }}>+</span> إضافة
                            </button>
                        </div>

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
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>إجراءات السلامة</label>
                            <textarea className="neon-input" value={safety} onChange={(e) => setSafety(e.target.value)} rows={4} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>متطلبات الورشة</label>
                            <textarea className="neon-input" value={workshop} onChange={(e) => setWorkshop(e.target.value)} rows={4} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>عدد الفنيين</label>
                            <input type="number" className="neon-input" value={technicians} onChange={(e) => setTechnicians(parseInt(e.target.value) || 1)} min="1" />
                        </div>
                    </div>

                    <div style={{ marginTop: '10px' }}>
                        <label style={{ display: 'block', marginBottom: '12px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>الوسائط (صور وفيديوهات)</label>
                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                            <label
                                className="glass-card"
                                style={{
                                    width: '100px',
                                    height: '100px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: uploading ? 'wait' : 'pointer',
                                    border: '1px dashed #10b981',
                                    gap: '8px',
                                    background: 'rgba(16, 185, 129, 0.05)'
                                }}
                            >
                                <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} disabled={uploading} accept="image/*,video/*" />
                                {uploading ? <div className="spinner" style={{ width: '20px', height: '20px' }} /> : <Upload size={24} color="#10b981" />}
                                <span style={{ fontSize: '0.7rem', color: '#10b981' }}>{uploading ? 'جاري الرفع' : 'رفع ملف'}</span>
                            </label>

                            {/* Task-level Media */}
                            {task.taskMedia?.map((m, idx) => (
                                <div key={`task-${idx}`} style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                                    {(m.type === 'video' || m.media_type === 'video') ? (
                                        <video src={m.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <img src={m.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    )}
                                    <div style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(0,0,0,0.6)', borderRadius: '6px', padding: '4px', backdropFilter: 'blur(4px)' }}>
                                        {(m.type === 'video' || m.media_type === 'video') ? <Film size={12} color="#fff" /> : <ImageIcon size={12} color="#fff" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button onClick={handleUpdate} className="neon-button" style={{ marginTop: '20px' }} disabled={loading}>
                        <Save size={18} />
                        <span>{loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
                    </button>

                </div>
            </motion.div>
        </motion.div>
    );
};

const MaintenanceWorkPackagePage = () => {
    const { taskId } = useParams();
    const navigate = useNavigate();
    const [task, setTask] = useState<RepairTaskDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const user = authService.getCurrentUser();
    const canEdit = user?.role === 'admin' || user?.role === 'trainer';

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            if (taskId) {
                const response = await repairService.getTaskDetails(Number(taskId));
                if (response && response.success && response.data) {
                    setTask(response.data);
                } else {
                    setError('لم يتم العثور على بيانات مهمة الصيانة');
                }
            }
        } catch (err: any) {
            console.error('❌ Fetch maintenance task error:', err);
            setError('حدث خطأ أثناء تحميل المهمة. يرجى المحاولة مرة أخرى.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [taskId]);

    if (loading) return (
        <DashboardLayout>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <div className="spinner" />
            </div>
        </DashboardLayout>
    );

    if (error || !task) return (
        <DashboardLayout>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '20px' }}>
                <div style={{ padding: '40px', textAlign: 'center' }} className="glass-card">
                    <h2 style={{ color: '#ef4444', marginBottom: '16px' }}>{error || 'البيانات غير متوفرة'}</h2>
                    <button onClick={() => navigate('/maintenance')} className="neon-button" style={{ margin: '0 auto' }}>
                        <ArrowRight size={20} />
                        <span>العودة للخلف</span>
                    </button>
                </div>
            </div>
        </DashboardLayout>
    );

    const allMedia = [
        ...(task.taskMedia || []),
        ...(task.steps || []).flatMap(s => s.media || [])
    ];

    return (
        <DashboardLayout>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <motion.button
                            whileHover={{ x: -2 }}
                            onClick={() => navigate('/maintenance')}
                            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
                        >
                            <ArrowRight size={24} />
                        </motion.button>
                        <div>
                            <h2 style={{ fontSize: '1.8rem' }}>حزمة تنفيذ الصيانة</h2>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>الدليل الفني المتكامل للصيانة</p>
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
                        <div className="glass-card" style={{ padding: '8px 20px', display: 'flex', gap: '15px', alignItems: 'center', borderColor: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <Clock size={18} color="#10b981" />
                                <span style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: 700 }}>الوقت: {task.estimated_time || 'غير محدد'}</span>
                            </div>
                            <div style={{ width: '1px', height: '20px', background: 'rgba(16, 185, 129, 0.3)' }} />
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <Users size={18} color="#10b981" />
                                <span style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: 700 }}>فنيين: {task.technicians_count || 1}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1.5, minWidth: '500px' }}>
                        <MediaGallery
                            media={allMedia}
                            canEdit={canEdit}
                            onDelete={async (mediaId) => {
                                console.log(`Frontend requesting delete for ID: ${mediaId}`);
                                if (confirm('هل أنت متأكد من حذف هذه الوسائط؟')) {
                                    try {
                                        await repairService.deleteMedia(mediaId);
                                        toast.success('تم حذف الوسائط بنجاح');
                                        fetchData();
                                    } catch (e: any) {
                                        console.error('Delete error:', e);
                                        const errorMsg = e.response?.data?.message || e.message || 'فشل في الحذف';
                                        toast.error(errorMsg);
                                    }
                                }
                            }}
                            onReorder={async (mediaId, direction) => {
                                const currentIndex = allMedia.findIndex(m => m.id === mediaId);
                                if (currentIndex === -1) return;

                                const newIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
                                if (newIndex < 0 || newIndex >= allMedia.length) return;

                                const newMediaList = [...allMedia];
                                [newMediaList[currentIndex], newMediaList[newIndex]] = [newMediaList[newIndex], newMediaList[currentIndex]];

                                try {
                                    const updates = newMediaList.map((item, index) => ({
                                        id: item.id,
                                        order_index: index
                                    }));

                                    await repairService.reorderMediaBatch(updates);

                                    toast.success('تم تغيير الترتيب');
                                    fetchData();
                                } catch (e: any) {
                                    console.error('Reorder error:', e);
                                    const errorMsg = e.response?.data?.message || e.message || 'فشل تغيير الترتيب';
                                    toast.error(errorMsg);
                                }
                            }}
                        />
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', minWidth: '350px' }}>
                        <div className="glass-card" style={{ padding: '30px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                <Info size={24} color="#10b981" />
                                <h3 style={{ fontSize: '1.3rem' }}>{task.title}</h3>
                            </div>

                            <div style={{ marginBottom: '30px' }}>
                                <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '4px', height: '16px', background: '#10b981', borderRadius: '2px' }} />
                                    خطوات التنفيذ:
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {task.steps && task.steps.map((step, idx) => (
                                        <div key={idx} style={{
                                            padding: '16px',
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
                                                color: '#10b981',
                                                fontWeight: 'bold',
                                                minWidth: '24px',
                                                borderLeft: '2px solid rgba(16, 185, 129, 0.3)',
                                                paddingLeft: '12px'
                                            }}>
                                                {step.step_number || idx + 1}
                                            </span>
                                            <div>
                                                <p style={{ color: '#fff', fontWeight: 500, marginBottom: '4px' }}>{step.instruction}</p>
                                                {step.tool_required && (
                                                    <span style={{ fontSize: '0.8rem', color: '#f59e0b' }}>
                                                        <Briefcase size={12} style={{ display: 'inline', marginLeft: '5px' }} />
                                                        الأطقم: {step.tool_required}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ marginBottom: '30px' }}>
                                <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Wrench size={18} color="#f59e0b" />
                                    العدد المطلوبة:
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
                                    {task.required_tools ? (
                                        task.required_tools.split(',').map((tool, idx) => (
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
                                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>سيتم استخدام العدد اليدوية القياسية</p>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div>
                                    <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>
                                        <ShieldCheck size={18} color="#10b981" />
                                        احتياطات السلامة:
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {task.safety_procedures ? (
                                            task.safety_procedures.split('\n').filter(Boolean).map((proc, idx) => (
                                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <CheckCircle2 size={14} color="#10b981" />
                                                    <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{proc.trim()}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <CheckCircle2 size={14} color="#10b981" />
                                                <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>استخدم معدات الوقاية الشخصية القياسية (PPE)</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>
                                        <Briefcase size={18} color="#8b5cf6" />
                                        متطلبات الورشة:
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {task.workshop_requirements ? (
                                            task.workshop_requirements.split('\n').filter(Boolean).map((req, idx) => (
                                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <CheckCircle2 size={14} color="#8b5cf6" />
                                                    <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{req.trim()}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <Info size={14} color="#8b5cf6" />
                                                <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>لا توجد متطلبات خاصة للورشة</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="neon-button"
                                style={{ width: '100%', marginTop: '40px', height: '56px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#10b981' }}
                                onClick={() => navigate('/maintenance')}
                            >
                                <CheckCircle2 size={20} />
                                <span>تأكيد إتمام عملية الصيانة</span>
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isEditModalOpen && task && (
                    <EditMaintenanceWorkPackageModal
                        task={task}
                        onClose={() => setIsEditModalOpen(false)}
                        onRefresh={fetchData}
                    />
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
};

export default MaintenanceWorkPackagePage;
