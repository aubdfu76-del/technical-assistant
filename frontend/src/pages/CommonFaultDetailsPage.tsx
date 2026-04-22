import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    AlertCircle,
    Activity,
    CheckCircle2,
    Cpu,
    ArrowLeft,
    Edit2,
    Plus,
    Trash2,
    Save,
    X as CloseIcon
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { Modal } from '../components/Modal';
import { diagnosisService, type CommonFaultDetails } from '../services/diagnosis.service';

const CommonFaultDetailsPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [data, setData] = useState<CommonFaultDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Editing states
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editType, setEditType] = useState<'symptoms' | 'causes'>('symptoms');
    const [editList, setEditList] = useState<string[]>([]);
    const [newItem, setNewItem] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await diagnosisService.getCommonFaultDetails(Number(id));
            if (response && response.success && response.data) {
                setData(response.data);
            } else {
                setError(response?.message || 'لم يتم العثور على بيانات العطل');
            }
        } catch (err: any) {
            console.error('❌ Fetch fault details error:', err);
            setError('حدث خطأ أثناء تحميل تفاصيل العطل. يرجى التأكد من تشغيل الـ Backend.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const handleOpenEdit = (type: 'symptoms' | 'causes') => {
        setEditType(type);
        setEditList(type === 'symptoms' ? [...(data?.symptoms || [])] : [...(data?.causes || [])]);
        setNewItem('');
        setIsEditModalOpen(true);
    };

    const handleAddItem = () => {
        if (newItem.trim()) {
            setEditList([...editList, newItem.trim()]);
            setNewItem('');
        }
    };

    const handleRemoveItem = (index: number) => {
        setEditList(editList.filter((_, i) => i !== index));
    };

    const handleUpdateItem = (index: number, value: string) => {
        const newList = [...editList];
        newList[index] = value;
        setEditList(newList);
    };

    const handleSave = async () => {
        if (!data || !id) return;

        setSaving(true);
        try {
            const updateData = {
                ...data,
                symptoms: editType === 'symptoms' ? editList : data.symptoms,
                causes: editType === 'causes' ? editList : data.causes
            };

            const response = await diagnosisService.updateCommonFault(Number(id), updateData);
            if (response.success) {
                setData(updateData);
                setIsEditModalOpen(false);
            } else {
                alert(response.message || 'فشل التحديث');
            }
        } catch (err) {
            console.error('❌ Update error:', err);
            alert('حدث خطأ أثناء حفظ التغييرات');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <DashboardLayout>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <div className="spinner" />
            </div>
        </DashboardLayout>
    );

    if (error || !data) return (
        <DashboardLayout>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '20px' }}>
                <div style={{ padding: '40px', textAlign: 'center' }} className="glass-card">
                    <h2 style={{ color: '#ef4444', marginBottom: '16px' }}>{error || 'العطل غير موجود'}</h2>
                    <button onClick={() => navigate('/diagnosis/common')} className="neon-button" style={{ margin: '0 auto' }}>
                        <ArrowRight size={20} />
                        <span>العودة للأعطال الشائعة</span>
                    </button>
                </div>
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                {/* Header Navigation with Next Step */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <motion.button
                            whileHover={{ x: -2 }}
                            onClick={() => navigate('/diagnosis/common')}
                            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
                        >
                            <ArrowRight size={24} />
                        </motion.button>
                        <h2 style={{ fontSize: '1.8rem' }}>الأعراض والأسباب</h2>
                    </div>

                    <div className="glass-card" style={{ padding: '8px 20px', display: 'flex', gap: '8px', alignItems: 'center', borderColor: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)' }}>
                        <Activity size={18} color="#3b82f6" />
                        <span style={{ fontSize: '0.9rem', color: '#3b82f6', fontWeight: 700 }}>{data.title}</span>
                    </div>
                </div>

                {/* Stepper Header (Updated to Step 2) */}
                <div className="glass-card" style={{ padding: '15px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    {[
                        { id: 1, label: 'الأعطال الشائعة', active: false },
                        { id: 2, label: 'الأعراض والأسباب', active: true },
                        { id: 3, label: 'اختبار النظام', active: false },
                        { id: 4, label: 'إجراءات التشخيص', active: false }
                    ].map((step) => (
                        <div key={step.id} style={{
                            padding: '8px 20px',
                            borderRadius: '30px',
                            background: step.active ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                            color: step.active ? '#3b82f6' : 'var(--color-text-muted)',
                            border: step.active ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent'
                        }}>
                            {step.label}
                        </div>
                    ))}
                </div>

                {/* Content Section */}
                <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                    {/* Symptoms Column */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="glass-card"
                        style={{ flex: 1, padding: '30px', minWidth: '400px', position: 'relative' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <AlertCircle size={24} color="#ef4444" />
                                </div>
                                <h3 style={{ fontSize: '1.2rem' }}>الأعراض المحتملة</h3>
                            </div>

                            <button
                                onClick={() => handleOpenEdit('symptoms')}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'var(--color-text-muted)',
                                    padding: '8px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'; e.currentTarget.style.color = '#3b82f6'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                            >
                                <Edit2 size={16} />
                                <span style={{ fontSize: '0.85rem' }}>تعديل</span>
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {(data.symptoms || []).map((symptom, idx) => (
                                <div key={idx} style={{
                                    padding: '16px',
                                    borderRadius: '12px',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid var(--glass-border)',
                                    display: 'flex',
                                    gap: '12px'
                                }}>
                                    <div style={{ minWidth: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', marginTop: '8px' }} />
                                    <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)' }}>{symptom}</p>
                                </div>
                            ))}
                            {(!data.symptoms || data.symptoms.length === 0) && (
                                <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>لا توجد أعراض مسجلة</p>
                            )}
                        </div>
                    </motion.div>

                    {/* Causes Column */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="glass-card"
                        style={{ flex: 1, padding: '30px', minWidth: '400px', position: 'relative' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Cpu size={24} color="#8b5cf6" />
                                </div>
                                <h3 style={{ fontSize: '1.2rem' }}>الأسباب المحتملة</h3>
                            </div>

                            <button
                                onClick={() => handleOpenEdit('causes')}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'var(--color-text-muted)',
                                    padding: '8px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'; e.currentTarget.style.color = '#8b5cf6'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                            >
                                <Edit2 size={16} />
                                <span style={{ fontSize: '0.85rem' }}>تعديل</span>
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {(data.causes || []).map((cause, idx) => (
                                <div key={idx} style={{
                                    padding: '16px',
                                    borderRadius: '12px',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid var(--glass-border)',
                                    display: 'flex',
                                    gap: '12px'
                                }}>
                                    <CheckCircle2 size={18} color="#8b5cf6" style={{ marginTop: '2px' }} />
                                    <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)' }}>{cause}</p>
                                </div>
                            ))}
                            {(!data.causes || data.causes.length === 0) && (
                                <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>لا توجد أسباب مسجلة</p>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Recommendation & Navigation Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card"
                    style={{
                        padding: '40px',
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.05))',
                        border: '2px solid rgba(59, 130, 246, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '40px',
                        flexWrap: 'wrap'
                    }}
                >
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>النظام المُرشح للفحص</h3>
                        <p style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 600, marginBottom: '8px' }}>
                            <span style={{ color: '#3b82f6' }}>{data.recommended_system}</span> (نظام {data.category})
                        </p>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                            بناءً على الأعراض المختارة، ينصح النظام بالبدء بفحص الدوائر الكهربائية والحساسات المرتبطة بهذا النظام أولاً.
                        </p>
                    </div>

                    <button
                        className="neon-button"
                        onClick={() => navigate(`/diagnosis/system?target=${data.recommended_system}`)}
                        style={{ padding: '20px 40px', fontSize: '1.1rem', gap: '12px' }}
                    >
                        <span>انتقل لفحص الأنظمة</span>
                        <ArrowLeft size={24} />
                    </button>
                </motion.div>
            </div>

            {/* Edit Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title={editType === 'symptoms' ? 'تعديل الأعراض المحتملة' : 'تعديل الأسباب المحتملة'}
                maxWidth="600px"
            >
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Add New Item */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="text"
                            value={newItem}
                            onChange={(e) => setNewItem(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                            placeholder={editType === 'symptoms' ? 'أضف عرضاً جديداً...' : 'أضف سبباً جديداً...'}
                            className="glass-input"
                            style={{ flex: 1, padding: '12px 16px' }}
                        />
                        <button
                            onClick={handleAddItem}
                            className="neon-button"
                            style={{ padding: '0 20px', height: 'auto' }}
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    {/* Items List */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        maxHeight: '400px',
                        overflowY: 'auto',
                        paddingRight: '8px'
                    }}>
                        {editList.map((item, idx) => (
                            <div key={idx} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px',
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '12px'
                            }}>
                                <input
                                    type="text"
                                    value={item}
                                    onChange={(e) => handleUpdateItem(idx, e.target.value)}
                                    style={{
                                        flex: 1,
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#fff',
                                        fontSize: '0.95rem',
                                        outline: 'none'
                                    }}
                                />
                                <button
                                    onClick={() => handleRemoveItem(idx)}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#ef4444',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '6px',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                        {editList.length === 0 && (
                            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '20px' }}>
                                القائمة فارغة. أضف بعض العناصر.
                            </p>
                        )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                        <button
                            onClick={() => setIsEditModalOpen(false)}
                            style={{
                                padding: '12px 24px',
                                background: 'transparent',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: '#fff',
                                borderRadius: '10px',
                                cursor: 'pointer'
                            }}
                        >
                            إلغاء
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="neon-button"
                            style={{ padding: '12px 30px', gap: '8px' }}
                        >
                            {saving ? (
                                <div className="spinner" style={{ width: '18px', height: '18px' }} />
                            ) : (
                                <Save size={18} />
                            )}
                            <span>{saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}</span>
                        </button>
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    );
};

export default CommonFaultDetailsPage;
