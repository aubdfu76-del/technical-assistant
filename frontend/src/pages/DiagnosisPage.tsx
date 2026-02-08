
import { motion } from 'framer-motion';
import {
    History,
    Cpu,
    ChevronRight,
    AlertTriangle,
    Settings2,
    Activity
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useNavigate } from 'react-router-dom';

const DiagnosisCard = ({ title, description, icon: Icon, color, onClick, delay }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.6 }}
        whileHover={{
            y: -15,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderColor: `rgba(${color}, 0.5)`,
            boxShadow: `0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(${color}, 0.2)`
        }}
        onClick={onClick}
        className="glass-card"
        style={{
            flex: 1,
            minWidth: '350px',
            padding: '40px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '24px',
            borderWidth: '2px',
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
    >
        <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '30px',
            background: `linear-gradient(135deg, rgba(${color}, 0.2), rgba(${color}, 0.05))`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid rgba(${color}, 0.3)`,
            marginBottom: '10px'
        }}>
            <Icon size={48} color={`rgb(${color})`} />
        </div>

        <div>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '12px', color: '#fff' }}>{title}</h2>
            <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.6', fontSize: '1rem', maxWidth: '300px' }}>
                {description}
            </p>
        </div>

        <div style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: `rgb(${color})`,
            fontWeight: 700,
            fontSize: '1.1rem'
        }}>
            <ChevronRight size={26} />
        </div>
    </motion.div>
);

const DiagnosisPage = () => {
    const navigate = useNavigate();

    return (
        <DashboardLayout>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '40px',
                height: '100%',
                paddingTop: '20px'
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center' }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '10px',
                            background: 'rgba(59, 130, 246, 0.1)',
                            padding: '8px 20px',
                            borderRadius: '30px',
                            color: 'var(--color-primary)',
                            marginBottom: '16px',
                            border: '1px solid rgba(59, 130, 246, 0.2)'
                        }}
                    >
                        <Activity size={18} />
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', letterSpacing: '1px' }}>SYSTEM DIAGNOSIS</span>
                    </motion.div>
                    <h1 style={{ fontSize: '3rem', marginBottom: '16px' }}>تحري الأعطال الذكي</h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                        اختر أسلوب الفحص المناسب للمركبة للوصول إلى العطل بأسرع وقت وأقل جهد
                    </p>
                </div>

                {/* Options Grid */}
                <div style={{
                    display: 'flex',
                    gap: '30px',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    alignItems: 'stretch',
                    marginTop: '20px'
                }}>
                    <DiagnosisCard
                        title="الأعطال الشائعة"
                        description="الوصول السريع لمكتبة الأعطال المتكررة وحلولها التقنية المجربة مبقاً."
                        icon={History}
                        color="59, 130, 246" // Blue
                        delay={0.2}
                        onClick={() => navigate('/diagnosis/common')}
                    />

                    <DiagnosisCard
                        title="فحص الأنظمة"
                        description="إجراء فحص عميق لكافة أنظمة المركبة (المحرك، الحساسات، الكهرباء) عبر بروتوكول التشخيص."
                        icon={Cpu}
                        color="139, 92, 246" // Purple
                        delay={0.4}
                        onClick={() => navigate('/diagnosis/system')}
                    />
                </div>

                {/* Footer Info */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    style={{
                        marginTop: 'auto',
                        textAlign: 'center',
                        padding: '30px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '24px',
                        border: '1px solid var(--glass-border)'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '40px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <AlertTriangle size={20} color="#f59e0b" />
                            <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>قاعدة بيانات محدثة (2026)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Settings2 size={20} color="#3b82f6" />
                            <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>متوافق مع بروتوكول OBD-II</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </DashboardLayout>
    );
};

export default DiagnosisPage;
