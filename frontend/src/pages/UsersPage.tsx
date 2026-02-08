import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Plus,
    UserCircle,
    Mail,
    Phone,
    Shield,
    CheckCircle2,
    XCircle,
    Settings,
    ChevronRight,
    ChevronLeft,
    Trash2
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { usersService } from '../services/users.service';
import { vehiclesService } from '../services/vehicles.service';
import { unitsService } from '../services/units.service';
import { authService } from '../services/auth.service';
import { toast } from 'react-hot-toast';

const RoleBadge = ({ role }: { role: string }) => {
    const configs: Record<string, { label: string, color: string }> = {
        admin: { label: 'مدير نظام', color: '#8b5cf6' },
        supervisor: { label: 'مشرف', color: '#3b82f6' },
        technician: { label: 'فني', color: '#10b981' },
        trainer: { label: 'مدرب', color: '#eab308' }
    };

    const config = configs[role] || { label: role, color: '#94a3b8' };

    return (
        <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '20px',
            backgroundColor: `${config.color}15`,
            color: config.color,
            fontSize: '0.75rem',
            fontWeight: 600,
            border: `1px solid ${config.color}30`
        }}>
            <Shield size={12} />
            <span>{config.label}</span>
        </div>
    );
};

const StatusBadge = ({ active }: { active: boolean }) => (
    <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 12px',
        borderRadius: '20px',
        backgroundColor: active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        color: active ? '#10b981' : '#ef4444',
        fontSize: '0.75rem',
        fontWeight: 600,
        border: active ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
    }}>
        {active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
        <span>{active ? 'نشط' : 'غير نشط'}</span>
    </div>
);

const UsersPage = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [pagination, setPagination] = useState({ page: 1, pages: 1 });
    const [activeTab, setActiveTab] = useState<'active' | 'pending' | 'units'>('active');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [formData, setFormData] = useState({
        employee_id: '',
        full_name: '',
        email: '',
        password: '',
        role: 'technician',
        phone: ''
    });
    const [availableVehicles, setAvailableVehicles] = useState<any[]>([]);
    const [assignedVehicles, setAssignedVehicles] = useState<number[]>([]);
    const [units, setUnits] = useState<any[]>([]); // Units state
    const [unitId, setUnitId] = useState<number | string>(''); // Selected unit ID for form
    const [selectedUnit, setSelectedUnit] = useState<any>(null); // For viewing users in a unit
    const [newUnitName, setNewUnitName] = useState(''); // New unit input

    const currentUser = authService.getCurrentUser();

    const fetchVehicles = async () => {
        try {
            const res = await vehiclesService.getAll({ limit: 100, status: 'active' });
            setAvailableVehicles(res.data || []);
        } catch (e) {
            console.error('Failed to fetch vehicles', e);
        }
    };

    const fetchUnits = async () => {
        try {
            const res = await unitsService.getUnits();
            setUnits(res.data || []);
        } catch (e) {
            console.error('Failed to fetch units', e);
        }
    };

    useEffect(() => {
        fetchVehicles();
        fetchUnits();
    }, []);

    const fetchUsers = async (page = 1, currentUnitId?: any) => {
        // Use provided unit ID or fallback to state (for pagination/search calls)
        const unitIdToUse = currentUnitId !== undefined ? currentUnitId : (selectedUnit?.id);

        // If in units tab and no unit selected/provided, don't fetch users
        if (activeTab === 'units' && !unitIdToUse) return;

        setLoading(true);
        try {
            const params: any = {
                page,
                limit: 8,
                search,
                role: roleFilter,
            };

            if (activeTab === 'active') {
                params.is_active = true;
            } else if (activeTab === 'pending') {
                params.is_active = false;
            } else if (activeTab === 'units' && unitIdToUse) {
                params.unit_id = unitIdToUse;
            }

            console.log('Fetching users with params:', params); // Debug log

            const response = await usersService.getUsers(params);
            setUsers(response.data);
            setPagination({ page: response.pagination.page, pages: response.pagination.pages });

            if (response.data.length === 0 && page > 1) {
                fetchUsers(page - 1, unitIdToUse);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // If supervisor, restrict view to Technicians only
        if (currentUser?.role === 'supervisor') {
            setRoleFilter('technician');
        }

        // Fetch users if not in units tab OR if in units tab with selected unit
        if (activeTab !== 'units') {
            fetchUsers();
        } else if (activeTab === 'units' && selectedUnit) {
            fetchUsers(1, selectedUnit.id);
        }
    }, [roleFilter, activeTab, selectedUnit]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchUsers(1);
    };

    const handleCreateUnit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Button clicked', newUnitName);
        if (!newUnitName.trim()) {
            toast.error('الرجاء إدخال اسم الوحدة');
            return;
        }

        const toastId = toast.loading('جاري إضافة الوحدة...');
        try {
            console.log('Sending request to create unit...');
            await unitsService.createUnit({ name: newUnitName });
            toast.dismiss(toastId);
            toast.success('تم إنشاء الوحدة بنجاح');
            setNewUnitName('');
            fetchUnits();
        } catch (err: any) {
            toast.dismiss(toastId);
            console.error('Create Unit Error:', err);
            toast.error(err.response?.data?.message || 'فشل إنشاء الوحدة (خطأ في الاتصال)');
        }
    };

    const handleDeleteUnit = async (id: number) => {
        if (window.confirm('هل أنت متأكد من حذف هذه الوحدة؟')) {
            try {
                await unitsService.deleteUnit(id);
                toast.success('تم حذف الوحدة بنجاح');
                fetchUnits();
            } catch (err: any) {
                toast.error(err.response?.data?.message || 'فشل حذف الوحدة');
            }
        }
    };

    const handleApprove = async (id: number) => {
        try {
            await usersService.updateStatus(id, true);
            toast.success('تم قبول المستخدم وتفعيل حسابه');
            fetchUsers(pagination.page);
        } catch (err) {
            toast.error('حدث خطأ أثناء التفعيل');
        }
    };

    const handleReject = async (id: number) => {
        if (window.confirm('هل أنت متأكد من رفض هذا الطلب وحذفه؟')) {
            try {
                await usersService.deleteUser(id);
                toast.success('تم رفض الطلب وحذفه');
                fetchUsers(pagination.page);
            } catch (err) {
                toast.error('حدث خطأ أثناء الرفض');
            }
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
            try {
                await usersService.deleteUser(id);
                toast.success('تم حذف المستخدم بنجاح');
                fetchUsers(pagination.page);
            } catch (err) {
                toast.error('حدث خطأ أثناء الحذف');
            }
        }
    };

    const openModal = async (user: any = null) => {
        console.log('Opening modal for user:', user);
        if (user) {
            setEditingUser(user);
            console.log('Setting unitId to:', user.unit_id);
            setUnitId(user.unit_id || '');
            setFormData({
                employee_id: user.employee_id,
                full_name: user.full_name,
                email: user.email || '',
                password: '', // Don't show password
                role: user.role,
                phone: user.phone || ''
            });
            // If trainer, fetch assigned vehicles
            if (user.role === 'trainer') {
                try {
                    const vehicles = await usersService.getUserVehicles(user.id);
                    setAssignedVehicles(vehicles.data.map((v: any) => v.id));
                } catch (e) {
                    console.error(e);
                    setAssignedVehicles([]);
                }
            } else {
                setAssignedVehicles([]);
            }
        } else {
            console.log('Opening modal for NEW user');
            setEditingUser(null);
            setUnitId('');
            setFormData({
                employee_id: '',
                full_name: '',
                email: '',
                password: '',
                role: 'technician',
                phone: ''
            });
            setAssignedVehicles([]);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { ...formData, unit_id: unitId || null };
        console.log('Submitting user payload:', payload);

        try {
            if (editingUser) {
                await usersService.updateUser(editingUser.id, payload);
                if (formData.role === 'trainer') {
                    await usersService.updateUserVehicles(editingUser.id, assignedVehicles);
                }
                toast.success('تم تحديث بيانات المستخدم بنجاح');
            } else {
                const newUser = await usersService.createUser(payload);
                if (formData.role === 'trainer') {
                    await usersService.updateUserVehicles(newUser.data.id, assignedVehicles);
                }
                toast.success('تم إنشاء الحساب بنجاح');
            }
            setIsModalOpen(false);
            fetchUsers(pagination.page);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'حدث خطأ أثناء حفظ البيانات');
        }
    };

    return (
        <DashboardLayout>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>إدارة المستخدمين</h2>
                        <p style={{ color: 'var(--color-text-muted)' }}>إضافة وتنظيم مستخدمي النظام وصلاحياتهم</p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="neon-button"
                        onClick={() => openModal()}
                    >
                        <Plus size={20} />
                        <span>إضافة مستخدم جديد</span>
                    </motion.button>
                </div>

                {/* Filters Bar */}
                <div className="glass-card" style={{ padding: '16px 24px', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <form onSubmit={handleSearch} style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input
                            className="neon-input"
                            placeholder="ابحث بالاسم، الرقم الوظيفي، أو البريد..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ paddingRight: '45px', background: 'rgba(255,255,255,0.02)' }}
                        />
                    </form>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <select
                            className="neon-input"
                            style={{ width: '160px', padding: '10px 16px', fontSize: '0.9rem' }}
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                        >
                            <option value="">جميع الصلاحيات</option>
                            <option value="admin">مدير نظام</option>
                            <option value="supervisor">مشرف</option>
                            <option value="trainer">مدرب</option>
                            <option value="technician">فني</option>
                        </select>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
                    <button
                        onClick={() => { setActiveTab('active'); setSelectedUnit(null); }}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            borderBottom: activeTab === 'active' ? '2px solid var(--color-primary)' : '2px solid transparent',
                            color: activeTab === 'active' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            padding: '10px 20px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: 600
                        }}
                    >
                        المستخدمين الحاليين
                    </button>
                    <button
                        onClick={() => { setActiveTab('pending'); setSelectedUnit(null); }}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            borderBottom: activeTab === 'pending' ? '2px solid var(--color-primary)' : '2px solid transparent',
                            color: activeTab === 'pending' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            padding: '10px 20px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <span>طلبات التسجيل</span>
                        {/* You could add a badge count here if you fetch counts separate */}
                    </button>
                    {currentUser?.role === 'admin' && (
                        <button
                            onClick={() => { setActiveTab('units'); setSelectedUnit(null); }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                borderBottom: activeTab === 'units' ? '2px solid var(--color-primary)' : '2px solid transparent',
                                color: activeTab === 'units' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                padding: '10px 20px',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <span>إدارة الوحدات</span>
                        </button>
                    )}
                </div>

                {/* Content */}
                {activeTab === 'units' && !selectedUnit ? (
                    <div className="glass-card" style={{ padding: '24px' }}>
                        <h3 style={{ marginBottom: '20px', fontSize: '1.2rem' }}>إدارة الوحدات التنظيمية</h3>

                        <form onSubmit={handleCreateUnit} style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
                            <input
                                className="neon-input"
                                placeholder="اسم الوحدة الجديدة..."
                                value={newUnitName}
                                onChange={(e) => setNewUnitName(e.target.value)}
                                style={{ flex: 1 }}
                            />
                            <button type="submit" className="neon-button">
                                <Plus size={18} />
                                <span>إضافة وحدة</span>
                            </button>
                        </form>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                            {units.map((unit) => (
                                <div
                                    key={unit.id}
                                    onClick={() => {
                                        setUsers([]);
                                        setLoading(true);
                                        setSelectedUnit(unit);
                                    }}
                                    style={{
                                        background: 'rgba(255,255,255,0.03)',
                                        padding: '16px',
                                        borderRadius: '12px',
                                        border: '1px solid var(--glass-border)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                >
                                    <span style={{ fontWeight: 600 }}>{unit.name}</span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteUnit(unit.id); }}
                                        style={{
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            color: '#ef4444',
                                            border: 'none',
                                            padding: '8px',
                                            borderRadius: '8px',
                                            cursor: 'pointer'
                                        }}
                                        title="حذف الوحدة"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            {units.length === 0 && (
                                <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', gridColumn: '1/-1', padding: '20px' }}>
                                    لا توجد وحدات مضافة حالياً
                                </p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="glass-card" style={{ overflow: 'hidden', padding: '0' }}>
                        {activeTab === 'units' && selectedUnit && (
                            <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <button
                                    onClick={() => { setSelectedUnit(null); setUsers([]); }}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'var(--color-text-muted)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px'
                                    }}
                                >
                                    <ChevronRight size={20} />
                                    عودة للوحدات
                                </button>
                                <h3 style={{ margin: 0 }}>مستخدمي وحدة: {selectedUnit.name}</h3>
                            </div>
                        )}
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                                        <th style={{ padding: '20px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>المستخدم</th>
                                        <th style={{ padding: '20px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>المعلومات الشخصية</th>
                                        <th style={{ padding: '20px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>الدور / الصلاحية</th>
                                        <th style={{ padding: '20px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>الحالة</th>
                                        <th style={{ padding: '20px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>آخر ظهور</th>
                                        <th style={{ padding: '20px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} style={{ padding: '100px', textAlign: 'center' }}>
                                                <div className="spinner" style={{ margin: '0 auto' }} />
                                            </td>
                                        </tr>
                                    ) : users.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} style={{ padding: '100px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                                <UserCircle size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                                                <p>لا يوجد مستخدمون يطابقون معايير البحث</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        users.map((user) => (
                                            <motion.tr
                                                key={user.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                                                style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }}
                                            >
                                                <td style={{ padding: '20px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                        <div style={{
                                                            width: '44px',
                                                            height: '44px',
                                                            borderRadius: '12px',
                                                            background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.1), rgba(59, 130, 246, 0.1))',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            border: '1px solid rgba(88, 28, 135, 0.2)'
                                                        }}>
                                                            <UserCircle size={22} color="var(--color-primary)" />
                                                        </div>
                                                        <div>
                                                            <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>{user.full_name}</p>
                                                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>رقم وظيفي: {user.employee_id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                                                            <Mail size={14} color="var(--color-text-muted)" />
                                                            <span>{user.email || '---'}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                                                            <Phone size={14} color="var(--color-text-muted)" />
                                                            <span>{user.phone || '---'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px' }}>
                                                    <RoleBadge role={user.role} />
                                                </td>
                                                <td style={{ padding: '20px' }}>
                                                    <StatusBadge active={user.is_active} />
                                                </td>
                                                <td style={{ padding: '20px' }}>
                                                    <p style={{ fontSize: '0.85rem' }}>
                                                        {user.last_login ? new Date(user.last_login).toLocaleDateString('ar-SA') : 'لم يدخل بعد'}
                                                    </p>
                                                </td>
                                                <td style={{ padding: '20px' }}>
                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                        {activeTab === 'pending' ? (
                                                            <>
                                                                <motion.button
                                                                    whileHover={{ scale: 1.1, backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
                                                                    onClick={() => handleApprove(user.id)}
                                                                    title="قبول"
                                                                    style={{
                                                                        padding: '8px',
                                                                        border: 'none',
                                                                        background: 'transparent',
                                                                        color: '#10b981',
                                                                        cursor: 'pointer',
                                                                        borderRadius: '8px'
                                                                    }}
                                                                >
                                                                    <CheckCircle2 size={18} />
                                                                </motion.button>
                                                                <motion.button
                                                                    whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                                                                    onClick={() => handleReject(user.id)}
                                                                    title="رفض"
                                                                    style={{
                                                                        padding: '8px',
                                                                        border: 'none',
                                                                        background: 'transparent',
                                                                        color: '#ef4444',
                                                                        cursor: 'pointer',
                                                                        borderRadius: '8px'
                                                                    }}
                                                                >
                                                                    <XCircle size={18} />
                                                                </motion.button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <motion.button
                                                                    whileHover={{ scale: 1.1, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                                                                    onClick={() => openModal(user)}
                                                                    style={{
                                                                        padding: '8px',
                                                                        border: 'none',
                                                                        background: 'transparent',
                                                                        color: '#3b82f6',
                                                                        cursor: 'pointer',
                                                                        borderRadius: '8px'
                                                                    }}
                                                                >
                                                                    <Settings size={18} />
                                                                </motion.button>
                                                                <motion.button
                                                                    whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                                                                    onClick={() => handleDelete(user.id)}
                                                                    style={{
                                                                        padding: '8px',
                                                                        border: 'none',
                                                                        background: 'transparent',
                                                                        color: '#ef4444',
                                                                        cursor: 'pointer',
                                                                        borderRadius: '8px'
                                                                    }}
                                                                >
                                                                    <Trash2 size={18} />
                                                                </motion.button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div style={{
                            padding: '20px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'rgba(255,255,255,0.01)',
                            borderTop: '1px solid var(--glass-border)'
                        }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                عرض صفحة {pagination.page} من {pagination.pages}
                            </p>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => fetchUsers(pagination.page - 1)}
                                    disabled={pagination.page <= 1}
                                    className="neon-button"
                                    style={{
                                        padding: '8px 12px',
                                        background: 'rgba(255,255,255,0.05)',
                                        boxShadow: 'none',
                                        opacity: pagination.page <= 1 ? 0.5 : 1
                                    }}
                                >
                                    <ChevronRight size={18} />
                                </button>
                                <button
                                    onClick={() => fetchUsers(pagination.page + 1)}
                                    disabled={pagination.page >= pagination.pages}
                                    className="neon-button"
                                    style={{
                                        padding: '8px 12px',
                                        background: 'rgba(255,255,255,0.05)',
                                        boxShadow: 'none',
                                        opacity: pagination.page >= pagination.pages ? 0.5 : 1
                                    }}
                                >
                                    <ChevronLeft size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* User Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0,0,0,0.8)',
                            backdropFilter: 'blur(10px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000,
                            padding: '20px'
                        }}
                        onClick={() => setIsModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="glass-card"
                            style={{ width: '100%', maxWidth: '500px', padding: '40px', position: 'relative' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '30px', textAlign: 'center' }}>
                                {editingUser ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد'}
                            </h3>

                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>الرقم الوظيفي</label>
                                    <input
                                        required
                                        className="neon-input"
                                        value={formData.employee_id}
                                        onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                                        placeholder="مثال: EMP123"
                                    />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>الاسم الكامل</label>
                                    <input
                                        required
                                        className="neon-input"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        placeholder="الاسم الثلاثي أو الرباعي"
                                    />
                                </div>

                                {!editingUser && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>كلمة المرور</label>
                                        <input
                                            required
                                            type="password"
                                            className="neon-input"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            placeholder="••••••••"
                                            minLength={8}
                                            title="يجب أن تكون كلمة المرور 8 أحرف على الأقل"
                                        />
                                    </div>
                                )}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>الدور</label>
                                    <select
                                        className="neon-input"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="admin">مدير نظام</option>
                                        <option value="supervisor">مشرف</option>
                                        <option value="trainer">مدرب</option>
                                        <option value="technician">فني</option>
                                    </select>
                                </div>

                                {(formData.role === 'supervisor' || formData.role === 'technician') && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>الوحدة</label>
                                        <select
                                            className="neon-input"
                                            value={unitId}
                                            onChange={(e) => setUnitId(e.target.value)}
                                        >
                                            <option value="">-- اختر الوحدة --</option>
                                            {units.map((u) => (
                                                <option key={u.id} value={u.id}>{u.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {formData.role === 'trainer' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                                        <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>تخصيص المركبات (للمدرب فقط)</label>
                                        <div style={{
                                            maxHeight: '150px',
                                            overflowY: 'auto',
                                            border: '1px solid var(--glass-border)',
                                            borderRadius: '8px',
                                            padding: '10px',
                                            background: 'rgba(255,255,255,0.02)'
                                        }}>
                                            {availableVehicles.length === 0 ? (
                                                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>لا توجد مركبات متاحة</p>
                                            ) : (
                                                availableVehicles.map(v => (
                                                    <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={assignedVehicles.includes(v.id)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setAssignedVehicles([...assignedVehicles, v.id]);
                                                                } else {
                                                                    setAssignedVehicles(assignedVehicles.filter(id => id !== v.id));
                                                                }
                                                            }}
                                                            style={{ cursor: 'pointer' }}
                                                        />
                                                        <span style={{ fontSize: '0.9rem' }}>
                                                            {v.plate_number} - {v.vehicle_type} {v.model ? `(${v.model})` : ''}
                                                        </span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                                    <button
                                        type="submit"
                                        className="neon-button"
                                        style={{ flex: 1, height: '50px' }}
                                    >
                                        {editingUser ? 'تحديث البيانات' : 'إنشاء الحساب'}
                                    </button>
                                    <button
                                        type="button"
                                        className="neon-button"
                                        style={{
                                            flex: 1,
                                            height: '50px',
                                            background: 'rgba(255,255,255,0.05)',
                                            boxShadow: 'none'
                                        }}
                                        onClick={() => setIsModalOpen(false)}
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

export default UsersPage;
