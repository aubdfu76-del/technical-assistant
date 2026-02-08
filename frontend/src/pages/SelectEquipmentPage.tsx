import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Car,
    Search,
    ChevronRight,
    Activity,
    AlertTriangle,
    LogOut
} from 'lucide-react';
import { vehiclesService, type Vehicle } from '../services/vehicles.service';
import { authService } from '../services/auth.service';
import { toast } from 'react-hot-toast';

const SelectEquipmentPage = () => {
    const [equipments, setEquipments] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEquipments = async () => {
            try {
                const response = await vehiclesService.getAll({ limit: 50 });
                if (response && response.data) {
                    setEquipments(response.data || []);
                } else {
                    setEquipments([]);
                }
            } catch (err: any) {
                console.error(err);
                if (err.response?.status === 401) {
                    toast.error('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً');
                    authService.logout();
                    navigate('/login');
                } else {
                    toast.error(err.response?.data?.message || 'فشل في جلب قائمة المعدات. تأكد من اتصال الخادم.');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchEquipments();
    }, []);

    const handleSelect = (equipment: Vehicle) => {
        authService.setSelectedEquipment(equipment);
        toast.success(`تم اختيار المعدة: ${equipment.plate_number}`);
        navigate('/dashboard');
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const filteredEquipments = Array.isArray(equipments) ? equipments.filter(eq => {
        const plate = eq?.plate_number || '';
        const type = eq?.vehicle_type || '';
        const term = search.toLowerCase();
        return plate.toLowerCase().includes(term) || type.toLowerCase().includes(term);
    }) : [];

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--color-bg)',
            padding: '40px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
        }}>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ width: '100%', maxWidth: '1000px', marginBottom: '40px', textAlign: 'center' }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <div style={{
                            width: '50px',
                            height: '50px',
                            background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Car color="white" size={28} />
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>اختيار المعدة</h1>
                            <p style={{ color: 'var(--color-text-muted)' }}>يرجى اختيار المعدة التي تنوي العمل عليها الآن</p>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                        onClick={handleLogout}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '12px',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            background: 'transparent',
                            color: '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            cursor: 'pointer',
                            fontWeight: 600
                        }}
                    >
                        <LogOut size={18} />
                        <span>تسجيل الخروج</span>
                    </motion.button>
                </div>

                <div className="glass-card" style={{ padding: '10px 20px', display: 'flex', gap: '15px', alignItems: 'center', borderRadius: '20px' }}>
                    <Search color="var(--color-text-muted)" size={20} />
                    <input
                        className="neon-input"
                        placeholder="ابحث برقم المعدة أو النوع..."
                        style={{ border: 'none', background: 'transparent', fontSize: '1.1rem', boxShadow: 'none' }}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </motion.div>

            <div style={{
                width: '100%',
                maxWidth: '1200px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '24px'
            }}>
                <AnimatePresence>
                    {loading ? (
                        [1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="glass-card" style={{ height: '180px', opacity: 0.3 }}>
                                <div className="spinner" style={{ margin: '80px auto' }} />
                            </div>
                        ))
                    ) : filteredEquipments.length > 0 ? (
                        filteredEquipments.map((eq, idx) => (
                            <motion.div
                                key={eq.id}
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                whileHover={{ y: -5, borderColor: 'var(--color-primary)' }}
                                className="glass-card"
                                onClick={() => handleSelect(eq)}
                                style={{
                                    padding: '24px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '16px',
                                    transition: 'all 0.3s ease',
                                    border: '1px solid var(--glass-border)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: '12px',
                                        background: 'rgba(59, 130, 246, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '1px solid rgba(59, 130, 246, 0.2)'
                                    }}>
                                        <Car color="#3b82f6" size={24} />
                                    </div>
                                    <div style={{
                                        padding: '4px 10px',
                                        borderRadius: '8px',
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        background: eq.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                        color: eq.status === 'active' ? '#10b981' : '#f59e0b',
                                        border: `1px solid ${eq.status === 'active' ? '#10b98133' : '#f59e0b33'}`
                                    }}>
                                        {eq.status === 'active' ? 'جاهز للعمل' : 'في الصيانة'}
                                    </div>
                                </div>

                                <div>
                                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '4px' }}>{eq.plate_number}</h3>
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{eq.vehicle_type} - {eq.manufacturer} {eq.model}</p>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                        <Activity size={14} />
                                        <span>{(eq.current_km || 0).toLocaleString()} كم</span>
                                    </div>
                                    <motion.div
                                        whileHover={{ x: 5 }}
                                        style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, fontSize: '0.9rem' }}
                                    >
                                        <span>اختيار</span>
                                        <ChevronRight size={18} />
                                    </motion.div>
                                </div>

                                <div style={{
                                    position: 'absolute',
                                    bottom: '-20px',
                                    left: '-20px',
                                    width: '100px',
                                    height: '100px',
                                    background: 'radial-gradient(circle, var(--color-primary) 0%, transparent 70%)',
                                    opacity: 0.05,
                                    zIndex: 0
                                }} />
                            </motion.div>
                        ))
                    ) : (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>
                            <AlertTriangle size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                            <p>لا توجد معدات تطابق بحثك</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            <style>{`
                .spinner {
                    width: 32px;
                    height: 32px;
                    border: 3px solid rgba(255,255,255,0.1);
                    border-top-color: var(--color-primary);
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default SelectEquipmentPage;
