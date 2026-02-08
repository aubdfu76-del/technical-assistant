import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    Car,
    AlertCircle,
    CheckCircle2,
    TrendingUp,
    Clock,
    Wrench,
    PlayCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { dashboardService } from '../services/dashboard.service';
import { authService } from '../services/auth.service';
import { vehiclesService, type VehicleSpecs } from '../services/vehicles.service';

const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <motion.div
        whileHover={{ y: -10 }}
        className="glass-card"
        style={{ padding: '24px', flex: 1, minWidth: '240px' }}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                background: `rgba(${color}, 0.1)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid rgba(${color}, 0.2)`
            }}>
                <Icon color={`rgb(${color})`} size={28} />
            </div>
            {trend && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#10b981',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    background: 'rgba(16, 185, 129, 0.05)',
                    padding: '4px 10px',
                    borderRadius: '20px'
                }}>
                    <TrendingUp size={14} />
                    <span>{trend}</span>
                </div>
            )}
        </div>
        <h3 style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>{title}</h3>
        <p style={{ fontSize: '1.8rem', fontWeight: 800 }}>{value}</p>
    </motion.div>
);

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const selectedEquipment = authService.getSelectedEquipment();

    const [vehicleSpecs, setVehicleSpecs] = useState<VehicleSpecs | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const statsRes = await dashboardService.getStats();
                setStats(statsRes.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        const fetchSpecs = async () => {
            if (selectedEquipment) {
                try {
                    const response = await vehiclesService.getSpecs(selectedEquipment.id);
                    console.log('Fetched specs:', response.data);
                    console.log('Custom specs:', response.data?.custom_specs);
                    setVehicleSpecs(response.data);
                } catch (err) {
                    console.error('Error fetching specs:', err);
                    setVehicleSpecs(null);
                }
            } else {
                setVehicleSpecs(null);
            }
        };
        fetchSpecs();
    }, [selectedEquipment]);

    if (loading) return (
        <DashboardLayout>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <div className="spinner" />
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                {/* Header Section */}
                <div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>مرحباً بك في لوحة تحكم المساعد التقني الذكي</h2>
                </div>

                {/* Quick Actions Section (Moved to Top) */}
                <div className="glass-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>إجراءات سريعة</h3>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                        <button
                            onClick={() => navigate('/vehicles')}
                            className="neon-button"
                            style={{ flex: 1, minWidth: '200px', height: '60px', fontSize: '1rem' }}
                        >
                            <Car size={20} />
                            إدارة الأسطول والمركبات
                        </button>
                        <button
                            onClick={() => navigate('/repair')}
                            className="neon-button"
                            style={{
                                flex: 1, minWidth: '200px', height: '60px', fontSize: '1rem',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--glass-border)'
                            }}
                        >
                            <PlayCircle size={20} />
                            تنفيذ الإصلاح
                        </button>
                        <button
                            onClick={() => navigate('/maintenance')}
                            className="neon-button"
                            style={{
                                flex: 1, minWidth: '200px', height: '60px', fontSize: '1rem',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--glass-border)'
                            }}
                        >
                            <Clock size={20} />
                            تنفيذ الصيانة
                        </button>
                        <button
                            onClick={() => navigate('/diagnosis')}
                            className="neon-button"
                            style={{
                                flex: 1, minWidth: '200px', height: '60px', fontSize: '1rem',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--glass-border)'
                            }}
                        >
                            <AlertCircle size={20} />
                            تحري الأعطال
                        </button>
                        <button
                            onClick={() => navigate('/users')}
                            className="neon-button"
                            style={{
                                flex: 1, minWidth: '200px', height: '60px', fontSize: '1rem',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--glass-border)'
                            }}
                        >
                            <Users size={20} />
                            المستخدمين
                        </button>
                        <button
                            onClick={() => navigate('/ojt')}
                            className="neon-button"
                            style={{
                                flex: 1, minWidth: '200px', height: '60px', fontSize: '1rem',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--glass-border)'
                            }}
                        >
                            <Wrench size={20} />
                            التدريب على رأس العمل
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    {/* Equipment Specifications Section */}
                    <div className="glass-card" style={{ flex: 1.5, padding: '24px', minWidth: '400px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>مواصفات المعدة</h3>
                            <Wrench size={18} color="var(--color-text-muted)" />
                        </div>

                        {selectedEquipment ? (
                            <div style={{ display: 'flex', gap: '30px', alignItems: 'center', flexWrap: 'wrap' }}>
                                {/* Equipment Image Box (The "Icon") */}
                                <div style={{
                                    width: '120px',
                                    height: '120px',
                                    borderRadius: '24px',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid var(--glass-border)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                                }}>
                                    {selectedEquipment.image_url ? (
                                        <img
                                            src={selectedEquipment.image_url}
                                            alt={selectedEquipment.plate_number}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <Car size={48} color="rgba(59, 130, 246, 0.5)" />
                                    )}
                                    <div style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        background: 'rgba(59, 130, 246, 0.8)',
                                        padding: '4px',
                                        textAlign: 'center'
                                    }}>
                                        <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'white' }}>{selectedEquipment.plate_number}</p>
                                    </div>
                                </div>

                                {/* Details Grid */}
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {/* Basic Information Section */}
                                    <div>
                                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', color: 'var(--color-primary)' }}>المعلومات الأساسية</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 15px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>الشركة:</span>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{selectedEquipment.manufacturer || '-'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 15px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>الموديل:</span>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{selectedEquipment.model || '-'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 15px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600 }}>العداد:</span>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)' }}>{selectedEquipment.current_km?.toLocaleString()} كم</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 15px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>الوقود:</span>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{selectedEquipment.fuel_type || '-'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 15px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>السنة:</span>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{selectedEquipment.year || '-'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 15px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>الحالة:</span>
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700,
                                                    padding: '2px 10px',
                                                    borderRadius: '8px',
                                                    background: selectedEquipment.status === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                                    color: selectedEquipment.status === 'active' ? '#10b981' : '#ef4444'
                                                }}>
                                                    {selectedEquipment.status === 'active' ? 'نشط' : 'غير نشط'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Categorized Specifications */}
                                    {vehicleSpecs?.custom_specs && vehicleSpecs.custom_specs.length > 0 && (() => {
                                        // Group specs by category
                                        const grouped: Record<string, Array<{ key: string, value: string }>> = {};
                                        vehicleSpecs.custom_specs.forEach((spec: any) => {
                                            const category = spec.category || 'مواصفات عامة';
                                            if (!grouped[category]) grouped[category] = [];
                                            grouped[category].push({ key: spec.key, value: spec.value });
                                        });

                                        return Object.entries(grouped).map(([category, specs]) => (
                                            <div key={category}>
                                                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', color: 'var(--color-primary)' }}>{category}</h4>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                                                    {specs.map((spec, idx) => (
                                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 15px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{spec.key}:</span>
                                                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{spec.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '16px', background: 'rgba(255,255,255,0.01)', borderRadius: '16px', border: '1px dashed var(--glass-border)' }}>
                                <Car size={40} style={{ opacity: 0.2 }} />
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ fontWeight: 600, marginBottom: '4px' }}>لم يتم اختيار معدة نشطة</p>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>يرجى اختيار معدة من إدارة الأسطول لعرض مواصفاتها هنا</p>
                                </div>
                                <button
                                    onClick={() => navigate('/vehicles')}
                                    className="neon-button"
                                    style={{ height: '35px', fontSize: '0.8rem', marginTop: '10px' }}
                                >
                                    الذهاب لإدارة الأسطول
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="glass-card" style={{ flex: 1, padding: '24px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))', border: '1px solid rgba(59, 130, 246, 0.2)', minWidth: '300px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>مساحة مخصصة</h3>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '200px',
                            border: '1px dashed var(--glass-border)',
                            borderRadius: '12px',
                            color: 'var(--color-text-muted)'
                        }}>
                            <p>سيتم تحديد المحتوى لاحقاً</p>
                        </div>

                        <div style={{
                            marginTop: '30px',
                            padding: '16px',
                            borderRadius: '16px',
                            background: 'rgba(59, 130, 246, 0.05)',
                            border: '1px dotted rgba(59, 130, 246, 0.3)'
                        }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: '4px' }}>تنبيه ذكي</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>هناك 3 مركبات تقترب من موعد الصيانة الدورية. يرجى مراجعة جدول الصيانة.</p>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Dashboard;
