import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, ArrowRight, ShieldCheck, UserPlus, X, Briefcase, Mail, Phone, Wrench, GraduationCap } from 'lucide-react';
import { authService } from '../services/auth.service';
import { unitsService } from '../services/units.service'; // Added import
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const LoginPage: React.FC = () => {
    const [employeeId, setEmployeeId] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [regRole, setRegRole] = useState('supervisor');
    const [regLoading, setRegLoading] = useState(false);
    const [units, setUnits] = useState<any[]>([]); // Units state
    const [regData, setRegData] = useState({
        full_name: '',
        employee_id: '',
        password: '',
        email: '',
        phone: '',
        unit_id: '' // Added unit_id
    });

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setRegLoading(true);

        try {
            await authService.register({ ...regData, role: regRole });
            toast.success('تم إرسال طلبك بنجاح. يرجى انتظار موافقة المسؤول.');
            setShowRegisterModal(false);
            setRegData({ full_name: '', employee_id: '', password: '', email: '', phone: '', unit_id: '' });
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'فشل التسجيل');
        } finally {
            setRegLoading(false);
        }
    };

    const openRegisterModal = async (role: string) => {
        setRegRole(role);
        setShowRegisterModal(true);
        // Fetch units if needed
        if (role === 'supervisor' || role === 'technician') {
            try {
                const res = await unitsService.getUnits();
                setUnits(res.data || []);
            } catch (e) {
                console.error('Failed to fetch units', e);
            }
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await authService.login(employeeId, password);
            if (response.success) {
                toast.success(`مرحباً بك، ${response.data.user.full_name}`);
                navigate('/select-equipment');
            } else {
                toast.error(response.message || 'فشل تسجيل الدخول');
            }
        } catch (err: any) {
            console.error('Login Error:', err);
            const msg = err.response?.data?.message || err.message || 'خطأ غير معروف في الاتصال';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '20px'
        }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="glass-card"
                style={{
                    width: '100%',
                    maxWidth: '450px',
                    padding: '40px',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                <div style={{
                    position: 'absolute',
                    top: '-50px',
                    right: '-50px',
                    width: '150px',
                    height: '150px',
                    background: 'radial-gradient(circle, var(--color-primary) 0%, transparent 70%)',
                    opacity: 0.15,
                    zIndex: 0
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>

                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                            style={{
                                width: '80px',
                                height: '80px',
                                background: 'rgba(6, 182, 212, 0.1)', // Cyan tint
                                borderRadius: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 20px',
                                border: '1px solid rgba(6, 182, 212, 0.3)',
                                boxShadow: '0 0 20px rgba(6, 182, 212, 0.2)'
                            }}
                        >
                            <img src="/logo.svg" alt="Logo" style={{ width: '50px', height: '50px' }} />
                        </motion.div>
                        <h1 style={{ fontSize: '2.5rem', marginBottom: '8px', background: 'linear-gradient(to right, #22d3ee, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>نظام المساعد الذكي</h1>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}>
                            الإدارة التقنية الذكية لأسطول المركبات
                        </p>
                    </div>


                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-highlight)', marginLeft: '4px' }}>
                                رقم الموظف
                            </label>
                            <div style={{ position: 'relative' }}>
                                <User size={18} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary)' }} />
                                <input
                                    type="text"
                                    className="neon-input"
                                    placeholder="مثال: ADMIN001"
                                    value={employeeId}
                                    onChange={(e) => setEmployeeId(e.target.value)}
                                    style={{ paddingRight: '45px', textAlign: 'right' }}
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-highlight)', marginLeft: '4px' }}>
                                كلمة المرور
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary)' }} />
                                <input
                                    type="password"
                                    className="neon-input"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    style={{ paddingRight: '45px', textAlign: 'right' }}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="neon-button"
                            disabled={loading}
                            style={{ marginTop: '10px', width: '100%', height: '56px', fontSize: '1.1rem' }}
                        >
                            {loading ? (
                                <div className="spinner" />
                            ) : (
                                <>
                                    <span>تسجيل الدخول</span>
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                        <button
                            onClick={() => openRegisterModal('supervisor')}
                            style={{
                                flex: 1,
                                background: 'rgba(6, 182, 212, 0.05)',
                                border: '1px solid rgba(6, 182, 212, 0.2)',
                                borderRadius: '12px',
                                color: 'var(--color-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                padding: '12px',
                                transition: 'all 0.2s',
                            }}
                        >
                            <UserPlus size={18} />
                            <span>تسجيل مشرف</span>
                        </button>
                        <button
                            onClick={() => openRegisterModal('technician')}
                            style={{
                                flex: 1,
                                background: 'rgba(16, 185, 129, 0.05)',
                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                borderRadius: '12px',
                                color: 'var(--color-accent)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                padding: '12px',
                                transition: 'all 0.2s',
                            }}
                        >
                            <Wrench size={18} />
                            <span>تسجيل فني</span>
                        </button>
                        <button
                            onClick={() => openRegisterModal('trainer')}
                            style={{
                                flex: 1,
                                background: 'rgba(234, 179, 8, 0.05)',
                                border: '1px solid rgba(234, 179, 8, 0.2)',
                                borderRadius: '12px',
                                color: '#eab308',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                padding: '12px',
                                transition: 'all 0.2s',
                            }}
                        >
                            <GraduationCap size={18} />
                            <span>تسجيل مدرب</span>
                        </button>
                    </div>

                    <div style={{
                        marginTop: '30px',
                        paddingTop: '20px',
                        borderTop: '1px solid var(--glass-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        color: 'var(--color-text-muted)',
                        fontSize: '0.8rem'
                    }}>
                        <ShieldCheck size={16} />
                        <span>نظام مراقبة تقني مشفر</span>
                    </div>
                </div>
            </motion.div>

            <style>{`
        .spinner {
          width: 24px;
          height: 24px;
          border: 3px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>


            {/* Registration Modal */}
            {
                showRegisterModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'rgba(0,0,0,0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        backdropFilter: 'blur(5px)'
                    }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="glass-card"
                            style={{
                                width: '90%',
                                maxWidth: '500px',
                                padding: '30px',
                                position: 'relative',
                                maxHeight: '90vh',
                                overflowY: 'auto'
                            }}
                        >
                            <button
                                onClick={() => setShowRegisterModal(false)}
                                style={{
                                    position: 'absolute',
                                    left: '20px',
                                    top: '20px',
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--color-text-muted)',
                                    cursor: 'pointer'
                                }}
                            >
                                <X size={24} />
                            </button>

                            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                                <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>
                                    {regRole === 'supervisor' ? 'تسجيل مشرف جديد' : regRole === 'trainer' ? 'تسجيل مدرب جديد' : 'تسجيل فني جديد'}
                                </h2>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                    يرجى تعبئة البيانات التالية لتقديم طلب تسجيل
                                </p>
                            </div>

                            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div>
                                    <label style={{ fontSize: '0.85rem', marginBottom: '5px', display: 'block' }}>الاسم الكامل</label>
                                    <div style={{ position: 'relative' }}>
                                        <User size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                                        <input
                                            type="text"
                                            className="neon-input"
                                            value={regData.full_name}
                                            onChange={(e) => setRegData({ ...regData, full_name: e.target.value })}
                                            placeholder="الاسم الثلاثي"
                                            required
                                            style={{ paddingRight: '40px' }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.85rem', marginBottom: '5px', display: 'block' }}>رقم الموظف</label>
                                    <div style={{ position: 'relative' }}>
                                        <Briefcase size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                                        <input
                                            type="text"
                                            className="neon-input"
                                            value={regData.employee_id}
                                            onChange={(e) => setRegData({ ...regData, employee_id: e.target.value })}
                                            placeholder="الرقم الوظيفي"
                                            required
                                            style={{ paddingRight: '40px' }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.85rem', marginBottom: '5px', display: 'block' }}>البريد الإلكتروني (اختياري)</label>
                                    <div style={{ position: 'relative' }}>
                                        <Mail size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                                        <input
                                            type="email"
                                            className="neon-input"
                                            value={regData.email}
                                            onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                                            placeholder="example@domain.com"
                                            style={{ paddingRight: '40px' }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.85rem', marginBottom: '5px', display: 'block' }}>رقم الجوال (اختياري)</label>
                                    <div style={{ position: 'relative' }}>
                                        <Phone size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                                        <input
                                            type="tel"
                                            className="neon-input"
                                            value={regData.phone}
                                            onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                                            placeholder="05xxxxxxxx"
                                            style={{ paddingRight: '40px' }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.85rem', marginBottom: '5px', display: 'block' }}>كلمة المرور</label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                                        <input
                                            type="password"
                                            className="neon-input"
                                            value={regData.password}
                                            onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                                            placeholder="كلمة المرور"
                                            required
                                            style={{ paddingRight: '40px' }}
                                        />
                                    </div>
                                </div>

                                {(regRole === 'supervisor' || regRole === 'technician') && (
                                    <div>
                                        <label style={{ fontSize: '0.85rem', marginBottom: '5px', display: 'block' }}>الوحدة التنظيمية</label>
                                        <div style={{ position: 'relative' }}>
                                            <Briefcase size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                                            <select
                                                className="neon-input"
                                                value={regData.unit_id || ''}
                                                onChange={(e) => setRegData({ ...regData, unit_id: e.target.value })}
                                                style={{ paddingRight: '40px' }}
                                                required
                                            >
                                                <option value="">-- اختر الوحدة --</option>
                                                {units.map((unit: any) => (
                                                    <option key={unit.id} value={unit.id}>{unit.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="neon-button"
                                    disabled={regLoading}
                                    style={{ marginTop: '10px', height: '48px' }}
                                >
                                    {regLoading ? 'جاري التسجيل...' : 'إرسال طلب التسجيل'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )
            }
        </div >
    );
};

export default LoginPage;
