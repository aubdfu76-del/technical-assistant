import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    AlertCircle,
    Activity,
    CheckCircle2,
    Cpu,
    ArrowLeft
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { diagnosisService, type CommonFaultDetails } from '../services/diagnosis.service';

const CommonFaultDetailsPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [data, setData] = useState<CommonFaultDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
                        style={{ flex: 1, padding: '30px', minWidth: '400px' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <div style={{ width: '40px', height: '40px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <AlertCircle size={24} color="#ef4444" />
                            </div>
                            <h3 style={{ fontSize: '1.2rem' }}>الأعراض المحتملة</h3>
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
                        style={{ flex: 1, padding: '30px', minWidth: '400px' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <div style={{ width: '40px', height: '40px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Cpu size={24} color="#8b5cf6" />
                            </div>
                            <h3 style={{ fontSize: '1.2rem' }}>الأسباب المحتملة</h3>
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
        </DashboardLayout>
    );
};

export default CommonFaultDetailsPage;
