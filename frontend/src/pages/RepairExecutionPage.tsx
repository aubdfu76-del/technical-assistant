import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Wrench,
    PlayCircle,
    Settings2,
    Plus,
    X,
    Save,
    Clock,
    Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { repairService, type RepairTask } from '../services/repair.service';
import { authService } from '../services/auth.service';
import { toast } from 'react-hot-toast';
import VehicleMultiSelect from '../components/common/VehicleMultiSelect';

const RepairTaskCard = ({ task, onClick, onDelete }: { task: RepairTask, onClick: any, onDelete?: any }) => {
    return (
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
            onClick={() => onClick(task.id)}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'rgba(139, 92, 246, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(139, 92, 246, 0.2)'
                }}>
                    <Wrench size={20} color="#8b5cf6" />
                </div>
                <div>
                    <h3 style={{ fontSize: '1.05rem', color: '#fff', marginBottom: '4px' }}>{task.title}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{task.description || 'اضغط لبدء تنفيذ عملية الإصلاح ومراجعة الخطوات'}</p>
                    <div style={{ display: 'flex', gap: '15px', marginTop: '4px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>{task.category}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{task.estimated_time}</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="neon-button"
                    style={{
                        padding: '10px 20px',
                        fontSize: '0.85rem',
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid #3b82f6',
                        boxShadow: 'none',
                        color: '#3b82f6'
                    }}
                >
                    <PlayCircle size={16} />
                    <span>بدء حزمة العمل</span>
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
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Trash2 size={18} />
                    </motion.button>
                )}
            </div>
        </motion.div>
    );
};

const AddRepairModal = ({ onClose, onRefresh }: any) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [time, setTime] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedVehicles, setSelectedVehicles] = useState<number[]>([]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await repairService.createTask({
                title,
                description,
                category,
                estimated_time: time,
                difficulty: 'medium',
                vehicle_ids: selectedVehicles
            });
            toast.success('تم إضافة مهمة الإصلاح بنجاح');
            onRefresh();
            onClose();
        } catch (err) {
            console.error(err);
            toast.error('فشل في إضافة مهمة الإصلاح');
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
                    <h3 style={{ fontSize: '1.5rem', color: '#fff' }}>إضافة عملية إصلاح جديدة</h3>
                    <X size={24} style={{ cursor: 'pointer' }} onClick={onClose} />
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>اسم العملية</label>
                        <input
                            required
                            className="neon-input"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="مثال: تغيير فحمات الفرامل"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>الفئة (مثال: محرك، فرامل)</label>
                        <input
                            required
                            className="neon-input"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="الفئة"
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
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>الوقت المتوقع (مثال: 45 دقيقة)</label>
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
                        <span>{loading ? 'جاري الحفظ...' : 'حفظ عملية الإصلاح'}</span>
                    </button>
                </form>
            </motion.div>
        </motion.div>
    );
};

const RepairExecutionPage = () => {
    const [tasks, setTasks] = useState<RepairTask[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    const user = authService.getCurrentUser();
    const canEdit = user?.role === 'admin' || user?.role === 'trainer';

    const fetchTasks = async (query?: string) => {
        setLoading(true);
        try {
            const selectedVehicle = authService.getSelectedEquipment();
            const vehicleId = selectedVehicle ? selectedVehicle.id : undefined;
            const response = await repairService.getTasks(query, 'repair', vehicleId);
            setTasks(response.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handleVehicleChange = () => {
            fetchTasks(search);
        };

        // Initial fetch
        fetchTasks();

        // Listen for custom event or just relpy on mount if the parent handles reload, 
        // but for now, let's assume valid mount specific to vehicle context
        window.addEventListener('storage', handleVehicleChange); // Basic way to sync across tabs

        return () => {
            window.removeEventListener('storage', handleVehicleChange);
        };
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchTasks(search);
    };

    const handleDeleteTask = async (id: number) => {
        if (window.confirm('هل أنت متأكد من حذف عملية الإصلاح هذه؟')) {
            try {
                await repairService.deleteTask(id);
                toast.success('تم حذف العملية بنجاح');
                fetchTasks(search);
            } catch (err) {
                console.error(err);
                toast.error('فشل في حذف العملية');
            }
        }
    };

    return (
        <DashboardLayout>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>تنفيذ الإصلاح</h1>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>محرك البحث التقني لخطوات الفك والتركيب</p>
                    </div>
                    {canEdit && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="neon-button"
                            onClick={() => setIsModalOpen(true)}
                            style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', border: '1px solid #3b82f6', width: 'auto', padding: '0 25px' }}
                        >
                            <Plus size={18} />
                            <span>إضافة اصلاح جديد</span>
                        </motion.button>
                    )}
                </div>

                {/* Search Bar */}
                <div className="glass-card" style={{ padding: '24px' }}>
                    <form onSubmit={handleSearch} style={{ position: 'relative' }}>
                        <Search size={22} style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input
                            className="neon-input"
                            placeholder="ابحث عن عملية إصلاح (مثال: محرك، فرامل، مساعدات...)"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ paddingRight: '60px', height: '60px', fontSize: '1.1rem', background: 'rgba(255,255,255,0.02)' }}
                        />
                    </form>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                        {['الفرامل', 'المحرك', 'الكهرباء', 'التعليق'].map((tag) => (
                            <span
                                key={tag}
                                onClick={() => { setSearch(tag); fetchTasks(tag); }}
                                style={{
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    padding: '6px 14px',
                                    borderRadius: '20px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--glass-border)',
                                    color: 'var(--color-text-muted)',
                                    transition: 'all 0.3s'
                                }}
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Tasks List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-text-muted)', marginBottom: '10px' }}>
                        <Settings2 size={18} />
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>نتائج البحث ({Array.isArray(tasks) ? tasks.length : 0})</span>
                    </div>

                    <AnimatePresence mode="popLayout">
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '50px' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
                        ) : (Array.isArray(tasks) ? tasks : []).length === 0 ? (
                            <div className="glass-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                <Search size={48} style={{ opacity: 0.2, marginBottom: '20px' }} />
                                <p>لم يتم العثور على نتائج للبحث الحالي</p>
                            </div>
                        ) : (
                            tasks.map((task) => (
                                <RepairTaskCard
                                    key={task.id}
                                    task={task}
                                    onClick={(id: number) => navigate(`/repair/work-package/${id}`)}
                                    onDelete={canEdit ? () => handleDeleteTask(task.id) : undefined}
                                />
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <AddRepairModal
                        onClose={() => setIsModalOpen(false)}
                        onRefresh={fetchTasks}
                    />
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
};

export default RepairExecutionPage;
