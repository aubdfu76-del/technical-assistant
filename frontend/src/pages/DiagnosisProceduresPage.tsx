import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight,
    Settings2,
    PlayCircle,
    FileText,
    Plus,
    X,
    Save,
    Clock,
    Trash2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import api, { authService } from '../services/auth.service';
import { systemsService } from '../services/systems.service';
import VehicleMultiSelect from '../components/common/VehicleMultiSelect';

const ProcedureCard = ({ item, onClick, onDelete }: any) => (
    <motion.div
        whileHover={{ x: -10 }}
        className="glass-card"
        style={{
            padding: '20px 30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1px solid var(--glass-border)',
            background: 'rgba(255, 255, 255, 0.02)',
            cursor: 'pointer'
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
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
                <FileText size={20} color="#3b82f6" />
            </div>
            <div>
                <h4 style={{ fontSize: '1.05rem', color: '#fff', marginBottom: '4px' }}>{item.title}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{item.description || 'اضغط للدخول إلى حزمة العمل والمواصفات'}</p>
            </div>
        </div>

        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => { e.stopPropagation(); onClick(item.id); }}
            className="neon-button"
            style={{
                padding: '10px 20px',
                fontSize: '0.85rem',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid #10b981',
                boxShadow: 'none',
                color: '#10b981'
            }}
        >
            <PlayCircle size={16} />
            <span>بدء حزمة عمل</span>
        </motion.button>
        {onDelete && (
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                style={{
                    padding: '10px',
                    borderRadius: '12px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid #ef4444',
                    color: '#ef4444',
                    cursor: 'pointer',
                    marginLeft: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <Trash2 size={18} />
            </motion.button>
        )}
    </motion.div>
);

const AddProcedureModal = ({ systemId, onClose, onRefresh }: any) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [time, setTime] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedVehicles, setSelectedVehicles] = useState<number[]>([]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await systemsService.createItem({
                system_id: Number(systemId),
                title,
                description,
                estimated_time: time,
                vehicle_ids: selectedVehicles
            });
            onRefresh();
            onClose();
        } catch (err) {
            console.error(err);
            alert('فشل في إضافة الإجراء');
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
                style={{ width: '100%', maxWidth: '500px', padding: '30px', border: '1px solid var(--glass-border)' }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '1.5rem', color: '#fff' }}>إضافة إجراء تشخيص جديد</h3>
                    <X size={24} style={{ cursor: 'pointer' }} onClick={onClose} />
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>اسم الإجراء</label>
                        <input
                            required
                            className="neon-input"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="مثال: فحص ضغط الوقود"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>وصف مختصر</label>
                        <textarea
                            className="neon-input"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            placeholder="وصف الإجراء للتقني"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>الوقت المتوقع (مثال: 30 دقيقة)</label>
                        <div style={{ position: 'relative' }}>
                            <Clock size={18} style={{ position: 'absolute', right: '12px', top: '15px', color: 'var(--color-text-muted)' }} />
                            <input
                                className="neon-input"
                                style={{ paddingRight: '40px' }}
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                            />
                        </div>
                    </div>

                    <VehicleMultiSelect
                        selectedIds={selectedVehicles}
                        onChange={setSelectedVehicles}
                    />

                    <button type="submit" className="neon-button" style={{ marginTop: '10px' }} disabled={loading}>
                        <Save size={18} />
                        <span>{loading ? 'جاري الحفظ...' : 'حفظ الإجراء'}</span>
                    </button>
                </form>
            </motion.div>
        </motion.div>
    );
};

const DiagnosisProceduresPage = () => {
    const { systemId } = useParams();
    const navigate = useNavigate();
    const [items, setItems] = useState<any[]>([]);
    const [systemName, setSystemName] = useState('');
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const user = authService.getCurrentUser();
    const canEdit = user?.role === 'admin' || user?.role === 'trainer';

    const fetchData = async () => {
        setLoading(true);
        try {
            const selectedVehicle = authService.getSelectedEquipment();
            const vehicleId = selectedVehicle ? selectedVehicle.id : undefined;
            const response = await api.get(`/diagnosis/systems/${systemId}/items`, { params: { vehicle_id: vehicleId } });
            setItems(response.data.data);

            const systemsRes = await api.get('/diagnosis/systems');
            const currentSystem = systemsRes.data.data.find((s: any) => s.id === Number(systemId));
            if (currentSystem) setSystemName(currentSystem.name);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handleVehicleChange = () => {
            fetchData();
        };

        fetchData();
        window.addEventListener('storage', handleVehicleChange);
        return () => window.removeEventListener('storage', handleVehicleChange);
    }, [systemId]);

    const handleDelete = async (id: number) => {
        if (window.confirm('هل أنت متأكد من حذف هذا الإجراء؟')) {
            try {
                await systemsService.deleteItem(id);
                toast.success('تم حذف الإجراء بنجاح');
                fetchData();
            } catch (err: any) {
                console.error(err);
                toast.error('فشل في حذف الإجراء');
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
                            onClick={() => navigate('/diagnosis/system')}
                            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
                        >
                            <ArrowRight size={24} />
                        </motion.button>
                        <div>
                            <h2 style={{ fontSize: '1.8rem' }}>إجراءات التشخيص</h2>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>نظام: <span style={{ color: '#3b82f6' }}>{systemName}</span></p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        {canEdit && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="neon-button"
                                onClick={() => setIsModalOpen(true)}
                                style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', border: '1px solid #3b82f6' }}
                            >
                                <Plus size={18} />
                                <span>إضافة إجراء جديد</span>
                            </motion.button>
                        )}
                        <div className="glass-card" style={{ padding: '8px 20px', display: 'flex', gap: '8px', alignItems: 'center', borderColor: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)' }}>
                            <Settings2 size={18} color="#3b82f6" />
                            <span style={{ fontSize: '0.9rem', color: '#3b82f6', fontWeight: 700 }}>الخطوة 2: الفحص الفني</span>
                        </div>
                    </div>
                </div>

                {/* Stepper Header (Step 2) */}
                <div className="glass-card" style={{ padding: '15px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    {[
                        { id: 1, label: 'اختيار النظام', active: false },
                        { id: 2, label: 'إجراءات التشخيص', active: true }
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

                {/* Procedures List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '50px' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
                    ) : items.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '100px', color: 'var(--color-text-muted)' }}>لا توجد إجراءات مسجلة لهذا النظام</div>
                    ) : (
                        items.map((item) => (
                            <ProcedureCard
                                key={item.id}
                                item={item}
                                onClick={(id: number) => navigate(`/diagnosis/work-package/${id}`)}
                                onDelete={canEdit ? () => handleDelete(item.id) : undefined}
                            />
                        ))
                    )}
                </div>
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <AddProcedureModal
                        systemId={systemId}
                        onClose={() => setIsModalOpen(false)}
                        onRefresh={fetchData}
                    />
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
};

export default DiagnosisProceduresPage;
