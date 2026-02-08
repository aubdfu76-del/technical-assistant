import React, { useEffect, useState } from 'react';
import {
    Zap,
    Droplet,
    Car,
    Settings,
    Gauge,
    Plus,
    ChevronLeft,
    ArrowRight,
    X,
    Activity,
    Thermometer,
    Fuel,
    Wrench,
    Battery,
    Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import api, { authService } from '../services/auth.service';
import { systemsService } from '../services/systems.service';
import { toast } from 'react-hot-toast';
import VehicleMultiSelect from '../components/common/VehicleMultiSelect';

const IconMap: any = {
    zap: Zap,
    droplet: Droplet,
    car: Car,
    settings: Settings,
    gauge: Gauge,
    thermometer: Thermometer,
    fuel: Fuel,
    wrench: Wrench,
    battery: Battery,
    activity: Activity
};

const SystemCard = ({ system, isHighlighted, onClick, onDelete }: any) => {
    const Icon = IconMap[system.icon_name] || Settings;

    return (
        <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            onClick={() => onClick(system)}
            className="glass-card"
            style={{
                padding: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                border: isHighlighted ? '2px solid #3b82f6' : '1px solid var(--glass-border)',
                background: isHighlighted ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                minWidth: '400px',
                flex: '1 0 45%',
                transition: 'all 0.3s ease',
                boxShadow: isHighlighted ? '0 0 20px rgba(59, 130, 246, 0.2)' : 'none'
            }}
        >
            <ChevronLeft size={20} color="var(--color-text-muted)" />

            {onDelete && (
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    style={{
                        marginRight: '15px',
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
                        zIndex: 10
                    }}
                    title="حذف النظام"
                >
                    <Trash2 size={16} />
                </button>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', textAlign: 'right', flex: 1, justifyContent: 'flex-end' }}>
                <div>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '4px', color: isHighlighted ? '#3b82f6' : '#fff' }}>{system.name}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{system.items_count} عناصر فحص</p>
                </div>
                <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    background: isHighlighted ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${isHighlighted ? '#3b82f6' : 'var(--glass-border)'}`
                }}>
                    <Icon size={28} color={isHighlighted ? '#3b82f6' : 'var(--color-text-muted)'} />
                </div>
            </div>
        </motion.div>
    );
};

const SystemTestingPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [systems, setSystems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const targetSystem = searchParams.get('target');
    const user = authService.getCurrentUser();
    const canEdit = ['admin', 'trainer'].includes(user?.role || '');

    // Add System Modal State
    const [isSystemModalOpen, setIsSystemModalOpen] = useState(false);
    const [systemFormData, setSystemFormData] = useState({
        name: '',
        description: '',
        icon_name: 'settings'
    });
    const [selectedVehicles, setSelectedVehicles] = useState<number[]>([]);

    const fetchSystems = async () => {
        try {
            setLoading(true);
            const selectedVehicle = authService.getSelectedEquipment();
            const vehicleId = selectedVehicle ? selectedVehicle.id : undefined;
            const response = await api.get('/diagnosis/systems', { params: { vehicle_id: vehicleId } });
            setSystems(response.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handleVehicleChange = () => {
            fetchSystems();
        };

        fetchSystems();

        window.addEventListener('storage', handleVehicleChange);
        return () => window.removeEventListener('storage', handleVehicleChange);
    }, []);

    const handleCreateSystem = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/diagnosis/systems', { ...systemFormData, vehicle_ids: selectedVehicles });
            toast.success('تم إضافة النظام بنجاح');
            setIsSystemModalOpen(false);
            setSystemFormData({ name: '', description: '', icon_name: 'settings' });
            setSelectedVehicles([]);
            fetchSystems();
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.message || 'حدث خطأ أثناء إضافة النظام');
        }
    };

    const handleDeleteSystem = async (id: number) => {
        if (window.confirm('هل أنت متأكد من حذف هذا النظام؟ سيتم حذف جميع عناصر الفحص داخله.')) {
            try {
                await systemsService.deleteSystem(id);
                toast.success('تم حذف النظام بنجاح');
                fetchSystems();
            } catch (err: any) {
                console.error(err);
                toast.error('فشل في حذف النظام');
            }
        }
    };

    return (
        <DashboardLayout>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <motion.button
                            whileHover={{ x: -2 }}
                            onClick={() => navigate('/diagnosis')}
                            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
                        >
                            <ArrowRight size={24} />
                        </motion.button>
                        <div>
                            <h2 style={{ fontSize: '1.8rem' }}>فحص الأنظمة</h2>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>اختر النظام المراد فحصه</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        {canEdit && (
                            <>
                                <button
                                    className="neon-button"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', boxShadow: 'none' }}
                                >
                                    <Plus size={18} />
                                    <span>إضافة عنصر</span>
                                </button>
                                <button
                                    className="neon-button"
                                    onClick={() => setIsSystemModalOpen(true)}
                                >
                                    <Plus size={18} />
                                    <span>إضافة نظام</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Stepper Header (Step 1) */}
                <div className="glass-card" style={{ padding: '15px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    {[
                        { id: 1, label: 'اختيار النظام', active: true },
                        { id: 2, label: 'إجراءات التشخيص', active: false }
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

                {/* Systems Grid */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'flex-start' }}>
                    {loading ? (
                        <div style={{ width: '100%', textAlign: 'center', padding: '50px' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
                    ) : systems.map((system) => (
                        <SystemCard
                            key={system.id}
                            system={system}
                            isHighlighted={targetSystem === system.name || (targetSystem === 'Battery System' && system.name === 'النظام الكهربائي')}
                            onClick={(s: any) => navigate(`/diagnosis/system/${s.id}`)}
                            onDelete={canEdit ? () => handleDeleteSystem(system.id) : undefined}
                        />
                    ))}
                </div>
            </div>

            {/* Add System Modal */}
            <AnimatePresence>
                {isSystemModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.8)',
                            backdropFilter: 'blur(10px)',
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
                            exit={{ scale: 0.9, y: 20 }}
                            className="glass-card"
                            style={{
                                width: '100%',
                                maxWidth: '500px',
                                padding: '40px',
                                position: 'relative',
                                background: '#0a0b14',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}
                        >
                            <button
                                onClick={() => setIsSystemModalOpen(false)}
                                style={{
                                    position: 'absolute',
                                    top: '20px',
                                    right: '20px',
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--color-text-muted)',
                                    cursor: 'pointer'
                                }}
                            >
                                <X size={24} />
                            </button>

                            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '20px',
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 16px',
                                    color: '#3b82f6',
                                    border: '1px solid rgba(59, 130, 246, 0.2)'
                                }}>
                                    <Activity size={32} />
                                </div>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>إضافة نظام فحص جديد</h3>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>أدخل تفاصيل النظام التقني المراد تفعيله</p>
                            </div>

                            <form onSubmit={handleCreateSystem} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>اسم النظام</label>
                                    <input
                                        required
                                        type="text"
                                        className="neon-input"
                                        placeholder="مثال: نظام الهيدروليك"
                                        value={systemFormData.name}
                                        onChange={(e) => setSystemFormData({ ...systemFormData, name: e.target.value })}
                                        style={{ width: '100%' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>وصف مختصر</label>
                                    <textarea
                                        className="neon-input"
                                        placeholder="وصف وظيفة النظام وما يتم فحصه فيه..."
                                        value={systemFormData.description}
                                        onChange={(e) => setSystemFormData({ ...systemFormData, description: e.target.value })}
                                        style={{ width: '100%', height: '100px', resize: 'none', paddingTop: '12px' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>أيقونة النظام</label>
                                    <select
                                        className="neon-input"
                                        value={systemFormData.icon_name}
                                        onChange={(e) => setSystemFormData({ ...systemFormData, icon_name: e.target.value })}
                                        style={{ width: '100%' }}
                                    >
                                        <option value="settings">إعدادات (افتراضي)</option>
                                        <option value="zap">كهرباء (Zap)</option>
                                        <option value="droplet">سوائل (Droplet)</option>
                                        <option value="fuel">وقود (Fuel)</option>
                                        <option value="thermometer">حرارة/تبريد (Thermometer)</option>
                                        <option value="battery">بطارية (Battery)</option>
                                        <option value="gauge">مقاييس/ضغط (Gauge)</option>
                                        <option value="wrench">صيانة (Wrench)</option>
                                        <option value="car">هيكل/حركة (Car)</option>
                                        <option value="activity">نشاط (Activity)</option>
                                    </select>
                                </div>

                                <VehicleMultiSelect
                                    selectedIds={selectedVehicles}
                                    onChange={setSelectedVehicles}
                                />

                                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                                    <button type="submit" className="neon-button" style={{ flex: 1, height: '50px' }}>
                                        حفظ النظام
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsSystemModalOpen(false)}
                                        className="neon-button"
                                        style={{
                                            flex: 1,
                                            height: '50px',
                                            background: 'rgba(255,255,255,0.05)',
                                            boxShadow: 'none',
                                            border: '1px solid rgba(255,255,255,0.1)'
                                        }}
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
};

export default SystemTestingPage;
