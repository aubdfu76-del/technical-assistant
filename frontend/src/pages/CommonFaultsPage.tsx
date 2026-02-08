import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    Search,
    Plus,
    AlertTriangle,
    ChevronLeft,
    Info,
    Zap,
    Flame,
    RefreshCw,
    Trash2,
    Save,
    X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import DashboardLayout from '../components/DashboardLayout';
import { diagnosisService, type CommonFault } from '../services/diagnosis.service';
import { authService } from '../services/auth.service';
import { useNavigate } from 'react-router-dom';
import VehicleMultiSelect from '../components/common/VehicleMultiSelect';

const SeverityBadge = ({ severity }: { severity: string }) => {
    const configs: any = {
        critical: { label: 'حرجة', color: '#ef4444', icon: Flame },
        high: { label: 'عالية', color: '#f97316', icon: Zap },
        medium: { label: 'متوسطة', color: '#f59e0b', icon: AlertTriangle },
        low: { label: 'منخفضة', color: '#10b981', icon: Info }
    };
    const config = configs[severity] || configs.low;
    const Icon = config.icon;

    return (
        <div style={{
            padding: '4px 12px',
            borderRadius: '20px',
            background: `${config.color}20`,
            color: config.color,
            fontSize: '0.75rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            border: `1px solid ${config.color}30`
        }}>
            <Icon size={14} />
            <span>{config.label}</span>
        </div>
    );
};

const AddCommonFaultModal = ({ onClose, onRefresh }: any) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [severity, setSeverity] = useState('medium');
    const [category, setCategory] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedVehicles, setSelectedVehicles] = useState<number[]>([]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await diagnosisService.createCommonFault({
                title,
                description,
                severity,
                category,
                vehicle_ids: selectedVehicles, // Send vehicle IDs
                recommended_system: 'engine',
                symptoms: [],
                causes: []
            });
            toast.success('تم إضافة العطل بنجاح');
            onRefresh();
            onClose();
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'فشل في إضافة العطل');
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
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
            }}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="glass-card"
                style={{ width: '100%', maxWidth: '600px', padding: '30px', border: '1px solid var(--glass-border)' }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '1.5rem', color: '#fff' }}>إضافة عطل شائع جديد</h3>
                    <X size={24} style={{ cursor: 'pointer' }} onClick={onClose} />
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>عنوان العطل</label>
                        <input required className="neon-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: ارتفاع حرارة المحرك" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>التصنيف</label>
                            <input required className="neon-input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="مثال: محرك" />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>الخطورة</label>
                            <select className="neon-input" value={severity} onChange={(e) => setSeverity(e.target.value)} style={{ background: '#0f172a' }}>
                                <option value="low">منخفضة</option>
                                <option value="medium">متوسطة</option>
                                <option value="high">عالية</option>
                                <option value="critical">حرجة</option>
                            </select>
                        </div>
                    </div>

                    <VehicleMultiSelect
                        selectedIds={selectedVehicles}
                        onChange={setSelectedVehicles}
                    />

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>الوصف</label>
                        <textarea className="neon-input" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="وصف المشكلة..." />
                    </div>

                    <button type="submit" className="neon-button" style={{ marginTop: '10px' }} disabled={loading}>
                        <Save size={18} />
                        <span>{loading ? 'جاري الحفظ...' : 'حفظ العطل'}</span>
                    </button>
                </form>
            </motion.div>
        </motion.div>
    );
};

const CommonFaultsPage = () => {
    const [faults, setFaults] = useState<CommonFault[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await diagnosisService.getCommonFaults();
            if (response && response.success && Array.isArray(response.data)) {
                setFaults(response.data);
            } else {
                setFaults([]);
                setError(response?.message || 'فشل في تحميل البيانات');
            }
        } catch (err: any) {
            console.error('❌ Fetch common faults error:', err);
            setError('حدث خطأ أثناء الاتصال بالسيرفر. يرجى التأكد من تشغيل الـ Backend.');
            setFaults([]);
        } finally {
            setLoading(false);
        }
    };

    const user = authService.getCurrentUser();
    const canEdit = user?.role === 'admin' || user?.role === 'trainer';

    const handleDeleteFault = async (e: any, id: number) => {
        e.stopPropagation();
        if (window.confirm('هل أنت متأكد من حذف هذا العطل؟')) {
            try {
                await diagnosisService.deleteCommonFault(id);
                toast.success('تم حذف العطل بنجاح');
                fetchData();
            } catch (err: any) {
                console.error(err);
                toast.error('فشل في حذف العطل');
            }
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredFaults = Array.isArray(faults)
        ? faults.filter(f =>
            (f.title || '').toLowerCase().includes(search.toLowerCase()) ||
            (f.category || '').toLowerCase().includes(search.toLowerCase())
        )
        : [];

    return (
        <DashboardLayout>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                {/* Header Navigation */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <motion.button
                            whileHover={{ x: -5 }}
                            onClick={() => navigate('/diagnosis')}
                            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
                        >
                            <ArrowRight size={24} />
                        </motion.button>
                        <h2 style={{ fontSize: '1.8rem' }}>الأعطال الشائعة</h2>
                    </div>
                    {canEdit && (
                        <button className="neon-button" onClick={() => setIsModalOpen(true)}>
                            <Plus size={18} />
                            <span>إضافة عطل</span>
                        </button>
                    )}
                </div>

                {/* Stepper (Wizard) Header - كما في الصورة */}
                <div className="glass-card" style={{ padding: '15px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    {[
                        { id: 1, label: 'الأعطال الشائعة', active: true },
                        { id: 2, label: 'الأعراض والأسباب', active: false },
                        { id: 3, label: 'اختبار النظام', active: false },
                        { id: 4, label: 'إجراءات التشخيص', active: false }
                    ].map((step) => (
                        <div key={step.id} style={{
                            padding: '8px 20px',
                            borderRadius: '30px',
                            background: step.active ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                            color: step.active ? '#3b82f6' : 'var(--color-text-muted)',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            border: step.active ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent'
                        }}>
                            <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                background: step.active ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                                color: step.active ? '#fff' : 'inherit',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem'
                            }}>{step.id}</div>
                            {step.label}
                        </div>
                    ))}
                </div>

                {/* Error State */}
                {error && (
                    <div className="glass-card" style={{ padding: '30px', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)' }}>
                        <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
                        <h3 style={{ color: '#ef4444', marginBottom: '10px' }}>خطأ في التحميل</h3>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '20px' }}>{error}</p>
                        <button onClick={fetchData} className="neon-button" style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', color: '#3b82f6', margin: '0 auto' }}>
                            <RefreshCw size={18} />
                            <span>إعادة المحاولة</span>
                        </button>
                    </div>
                )}

                {/* Info Box */}
                {!error && (
                    <div className="glass-card" style={{ padding: '24px', background: 'rgba(59, 130, 246, 0.03)', border: '1px solid rgba(59, 130, 246, 0.1)', display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Info color="#f59e0b" size={24} />
                        </div>
                        <div>
                            <h4 style={{ color: '#fff', marginBottom: '4px' }}>ابدأ من هنا</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                اختر العطل المشابه لما تواجهه. ستتمكن من رؤية الأعراض والأسباب المحتملة، ثم الانتقال لخطوات التشخيص التفصيلية.
                            </p>
                        </div>
                    </div>
                )}

                {/* Search Bar */}
                {!error && (
                    <div style={{ position: 'relative' }}>
                        <Search size={20} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input
                            className="neon-input"
                            placeholder="البحث في الأعطال..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ paddingRight: '50px', background: 'rgba(255,255,255,0.02)' }}
                        />
                    </div>
                )}

                {/* Faults List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {loading && !error ? (
                        <div style={{ textAlign: 'center', padding: '50px' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
                    ) : filteredFaults.map((fault) => (
                        <motion.div
                            key={fault.id}
                            whileHover={{ x: -10, backgroundColor: 'rgba(255,255,255,0.03)' }}
                            onClick={() => navigate(`/diagnosis/common/${fault.id}`)}
                            className="glass-card"
                            style={{
                                padding: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                border: '1px solid var(--glass-border)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                <div style={{
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: '16px',
                                    background: 'rgba(245, 158, 11, 0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1px solid rgba(245, 158, 11, 0.1)'
                                }}>
                                    <AlertTriangle size={28} color="#f59e0b" />
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                                        <h3 style={{ fontSize: '1.15rem', color: '#fff' }}>{fault.title}</h3>
                                        <SeverityBadge severity={fault.severity} />
                                    </div>
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '10px' }}>{fault.description}</p>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--color-text-muted)' }}>
                                            {fault.category}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600 }}>{fault.symptoms_count} أعراض</span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                <ChevronLeft size={24} color="var(--color-text-muted)" />
                                {canEdit && (
                                    <button
                                        onClick={(e) => handleDeleteFault(e, fault.id)}
                                        style={{
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            border: '1px solid #ef4444',
                                            borderRadius: '8px',
                                            width: '32px',
                                            height: '32px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#ef4444',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            zIndex: 5
                                        }}
                                        title="حذف العطل"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                    {!loading && !error && filteredFaults.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '100px', color: 'var(--color-text-muted)' }}>
                            لا توجد أعطال مسجلة حالياً
                        </div>
                    )}
                </div>
            </div>
            {isModalOpen && (
                <AddCommonFaultModal
                    onClose={() => setIsModalOpen(false)}
                    onRefresh={fetchData}
                />
            )}
        </DashboardLayout>
    );
};

export default CommonFaultsPage;
