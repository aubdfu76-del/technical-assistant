import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Car,
    Search,
    Plus,
    MoreVertical,
    Settings,
    ChevronRight,
    ChevronLeft,
    Camera,
    X,
    Loader2,
    Trash2,
    Check,
    Wrench,
    FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { uploadService } from '../services/upload.service';
import DashboardLayout from '../components/DashboardLayout';
import { vehiclesService, type Vehicle, type VehicleSpecs } from '../services/vehicles.service';
import { authService } from '../services/auth.service';
import { toast } from 'react-hot-toast';

const VehiclesPage = () => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [pagination, setPagination] = useState({ page: 1, pages: 1 });
    const user = authService.getCurrentUser();
    const navigate = useNavigate();

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
    const [activeTab, setActiveTab] = useState<'basic' | 'specs'>('basic');
    const [specsData, setSpecsData] = useState<VehicleSpecs>({});
    const [formData, setFormData] = useState({
        plate_number: '',
        equipment_name: '',
        vehicle_type: 'شاحنة',
        image_url: '',
        model: '',
        manufacturer: '',
        year: new Date().getFullYear(),
        current_km: 0,
        fuel_type: 'ديزل',
        status: 'active' as any,
        custom_fields: [] as Array<{ key: string; value: string }>
    });

    const fetchVehicles = async (page = 1) => {
        console.log('Fetching vehicles for page:', page);
        setLoading(true);
        try {
            const response = await vehiclesService.getAll({
                page,
                limit: 8,
                search,
                status: statusFilter
            });
            console.log('Vehicles response:', response);
            if (response && response.data) {
                setVehicles(response.data || []);
                if (response.pagination) {
                    setPagination({
                        page: response.pagination.page || 1,
                        pages: response.pagination.pages || 1
                    });
                }
            } else {
                setVehicles([]);
            }
        } catch (err) {
            console.error('Fetch vehicles error:', err);
            toast.error('حدث خطأ أثناء جلب البيانات');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVehicles(1);
    }, [statusFilter]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchVehicles(1);
    };

    const openModal = async (vehicle: Vehicle | null = null, tab: 'basic' | 'specs' = 'basic') => {
        setActiveTab(tab);
        if (vehicle) {
            setEditingVehicle(vehicle);
            // Convert basic info to custom_fields format
            const customFields: Array<{ key: string; value: string }> = [];

            // Add fields only if they have values
            if (vehicle.plate_number) customFields.push({ key: 'رقم المعدة', value: vehicle.plate_number });
            if (vehicle.equipment_name || vehicle.vehicle_type) customFields.push({ key: 'اسم المعدة (النوع)', value: vehicle.equipment_name || vehicle.vehicle_type });
            if (vehicle.manufacturer) customFields.push({ key: 'التصنيع (الشركة المصنعة)', value: vehicle.manufacturer });
            if (vehicle.model) customFields.push({ key: 'الموديل (الطراز)', value: vehicle.model });
            if (vehicle.year) customFields.push({ key: 'سنة الموديل', value: String(vehicle.year) });
            if (vehicle.current_km !== null && vehicle.current_km !== undefined) customFields.push({ key: 'المسافة المقطوعة (كم)', value: String(vehicle.current_km) });
            if (vehicle.fuel_type) customFields.push({ key: 'نوع الوقود', value: vehicle.fuel_type });
            if (vehicle.status) customFields.push({ key: 'حالة المعدة', value: vehicle.status });


            setFormData({
                plate_number: vehicle.plate_number,
                equipment_name: vehicle.equipment_name || '',
                vehicle_type: vehicle.vehicle_type,
                model: vehicle.model || '',
                manufacturer: vehicle.manufacturer || '',
                year: vehicle.year || new Date().getFullYear(),
                current_km: vehicle.current_km,
                fuel_type: vehicle.fuel_type || 'ديزل',
                image_url: vehicle.image_url || '',
                status: vehicle.status,
                custom_fields: customFields
            });
            // Fetch specs and convert to unified format
            try {
                const response = await vehiclesService.getSpecs(vehicle.id);
                const fetchedSpecs = response.data || {};

                // Convert basic specs to custom_specs format
                const customSpecs: Array<{ key: string; value: string; category?: string }> = [];

                // Add existing custom specs first (ensure they have category field)
                if (fetchedSpecs.custom_specs && Array.isArray(fetchedSpecs.custom_specs)) {
                    fetchedSpecs.custom_specs.forEach((spec: any) => {
                        customSpecs.push({
                            key: spec.key,
                            value: spec.value,
                            category: spec.category || 'مواصفات عامة'
                        });
                    });
                }

                // Convert basic specs to custom format
                const basicSpecsMap = [
                    { key: 'الطول (متر)', value: fetchedSpecs.length },
                    { key: 'العرض (متر)', value: fetchedSpecs.width },
                    { key: 'الارتفاع (متر)', value: fetchedSpecs.height },
                    { key: 'الوزن الإجمالي (طن)', value: fetchedSpecs.gross_weight },
                    { key: 'سعة الحمولة (طن)', value: fetchedSpecs.payload_capacity },
                    { key: 'قوة المحرك (حصان)', value: fetchedSpecs.power_hp },
                    { key: 'عزم الدوران (نيوتن متر)', value: fetchedSpecs.torque_nm },
                    { key: 'سعة المحرك (سي سي)', value: fetchedSpecs.engine_displacement },
                    { key: 'نوع ناقل الحركة', value: fetchedSpecs.transmission_type },
                    { key: 'سعة خزان الوقود (لتر)', value: fetchedSpecs.fuel_tank_capacity },
                    { key: 'سعة الزيت (لتر)', value: fetchedSpecs.oil_capacity },
                    { key: 'مقاس الإطارات', value: fetchedSpecs.tire_size },
                    { key: 'ضغط الإطارات (PSI)', value: fetchedSpecs.tire_pressure_psi },
                    { key: 'جهد البطارية (فولت)', value: fetchedSpecs.battery_voltage },
                ];

                // Add basic specs that have values (only if not already in custom_specs)
                basicSpecsMap.forEach(spec => {
                    if (spec.value !== null && spec.value !== undefined && spec.value !== '') {
                        // Check if this spec already exists in custom_specs
                        const exists = customSpecs.some(cs => cs.key === spec.key);
                        if (!exists) {
                            customSpecs.push({
                                key: spec.key,
                                value: String(spec.value),
                                category: 'مواصفات عامة'
                            });
                        }
                    }
                });

                setSpecsData({ custom_specs: customSpecs });
            } catch (err) {
                console.error('Error fetching specs:', err);
                setSpecsData({ custom_specs: [] });
            }
        } else {
            setEditingVehicle(null);
            setSpecsData({ custom_specs: [] });
            setFormData({
                plate_number: '',
                equipment_name: '',
                vehicle_type: 'شاحنة',
                model: '',
                manufacturer: '',
                year: new Date().getFullYear(),
                current_km: 0,
                fuel_type: 'ديزل',
                image_url: '',
                status: 'active',
                custom_fields: [
                    { key: 'رقم المعدة', value: '' },
                    { key: 'اسم المعدة (النوع)', value: '' },
                ]
            });
        }
        setIsModalOpen(true);
    };

    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const response = await uploadService.uploadFile(file);
            setFormData({ ...formData, image_url: response.data.url });
            toast.success('تم رفع الصورة بنجاح');
        } catch (err) {
            console.error(err);
            toast.error('فشل في رفع الصورة');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Convert custom_fields back to basic fields
            const fieldsMap: Record<string, string> = {};
            const fieldKeys = new Set<string>();

            (formData.custom_fields || []).forEach(field => {
                if (field.key && field.value) {
                    fieldsMap[field.key] = field.value;
                    fieldKeys.add(field.key);
                }
            });

            const vehicleData = {
                plate_number: fieldsMap['رقم المعدة'] || '',
                equipment_name: fieldsMap['اسم المعدة (النوع)'] || '',
                vehicle_type: fieldsMap['اسم المعدة (النوع)'] || 'شاحنة',
                manufacturer: fieldKeys.has('التصنيع (الشركة المصنعة)') ? (fieldsMap['التصنيع (الشركة المصنعة)'] || '') : null,
                model: fieldKeys.has('الموديل (الطراز)') ? (fieldsMap['الموديل (الطراز)'] || '') : null,
                year: fieldKeys.has('سنة الموديل') ? (parseInt(fieldsMap['سنة الموديل']) || new Date().getFullYear()) : new Date().getFullYear(),
                current_km: fieldKeys.has('المسافة المقطوعة (كم)') ? (parseInt(fieldsMap['المسافة المقطوعة (كم)']) || 0) : 0,
                fuel_type: fieldKeys.has('نوع الوقود') ? (fieldsMap['نوع الوقود'] || 'ديزل') : null,
                status: (fieldsMap['حالة المعدة'] as any) || 'active',
                image_url: formData.image_url || ''
            };



            if (editingVehicle) {
                await vehiclesService.update(editingVehicle.id, vehicleData);
                toast.success('تم تحديث بيانات المعدة بنجاح');
            } else {
                await vehiclesService.create(vehicleData);
                toast.success('تم إضافة المعدة بنجاح');
            }
            setIsModalOpen(false); // Always close modal after successful save
            await fetchVehicles(1);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'حدث خطأ أثناء حفظ البيانات');
        }
    };

    const handleSpecsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingVehicle) return;

        try {
            // Convert custom_specs back to basic specs
            const specsMap: Record<string, string> = {};
            (specsData.custom_specs || []).forEach(spec => {
                specsMap[spec.key] = spec.value;
            });

            const convertedSpecs = {
                length: parseFloat(specsMap['الطول (متر)']) || undefined,
                width: parseFloat(specsMap['العرض (متر)']) || undefined,
                height: parseFloat(specsMap['الارتفاع (متر)']) || undefined,
                gross_weight: parseFloat(specsMap['الوزن الإجمالي (طن)']) || undefined,
                payload_capacity: parseFloat(specsMap['سعة الحمولة (طن)']) || undefined,
                power_hp: parseFloat(specsMap['قوة المحرك (حصان)']) || undefined,
                torque_nm: parseFloat(specsMap['عزم الدوران (نيوتن متر)']) || undefined,
                engine_displacement: parseFloat(specsMap['سعة المحرك (سي سي)']) || undefined,
                transmission_type: specsMap['نوع ناقل الحركة'] || undefined,
                fuel_tank_capacity: parseFloat(specsMap['سعة خزان الوقود (لتر)']) || undefined,
                oil_capacity: parseFloat(specsMap['سعة الزيت (لتر)']) || undefined,
                tire_size: specsMap['مقاس الإطارات'] || undefined,
                tire_pressure_psi: specsMap['ضغط الإطارات (PSI)'] || undefined,
                battery_voltage: specsMap['جهد البطارية (فولت)'] || undefined,
                custom_specs: specsData.custom_specs
            };

            await vehiclesService.saveSpecs(editingVehicle.id, convertedSpecs);
            toast.success('تم حفظ مواصفات المعدة بنجاح');
            setIsModalOpen(false); // Close modal after successful save
        } catch (err: any) {
            console.error('Save specs error:', err);
            toast.error('حدث خطأ أثناء حفظ المواصفات');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('هل أنت متأكد من حذف هذه المعدة نهائياً؟')) return;

        try {
            await vehiclesService.delete(id);
            toast.success('تم حذف المعدة بنجاح');
            await fetchVehicles(1);
        } catch (err: any) {
            console.error('Delete error:', err);
            toast.error(err.response?.data?.message || 'لا يمكن الحذف: قد تكون المعدة مرتبطة ببيانات أخرى أو ليس لديك صلاحية');
        }
    };

    return (
        <DashboardLayout>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>إدارة المعدات</h2>
                        <p style={{ color: 'var(--color-text-muted)' }}>عرض ومراقبة كافة المعدات في النظام</p>
                    </div>
                    {['admin', 'trainer'].includes(user?.role || '') && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="neon-button"
                            onClick={() => openModal()}
                        >
                            <Plus size={20} />
                            <span>إضافة معدة</span>
                        </motion.button>
                    )}
                </div>

                {/* Filters Bar */}
                <div className="glass-card" style={{ padding: '16px 24px', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <form onSubmit={handleSearch} style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input
                            className="neon-input"
                            placeholder="ابحث برقم المعدة، الموديل، أو النوع..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ paddingRight: '45px', background: 'rgba(255,255,255,0.02)' }}
                        />
                    </form>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <select
                            className="neon-input"
                            style={{ width: '160px', padding: '10px 16px', fontSize: '0.9rem' }}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">جميع الحالات</option>
                            <option value="active">نشط</option>
                            <option value="maintenance">في الصيانة</option>
                            <option value="inactive">متوقف</option>
                        </select>
                    </div>
                </div>

                {/* Vehicles Table/Grid */}
                <div className="glass-card" style={{ overflow: 'hidden', padding: '0' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                                    <th style={{ padding: '20px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>رقم المعدة</th>
                                    <th style={{ padding: '20px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>نوع المعدة</th>
                                    {['admin', 'trainer'].includes(user?.role || '') && (
                                        <th style={{ padding: '20px', fontSize: '0.85rem', color: 'var(--color-text-muted)', textAlign: 'left' }}>إجراءات</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={3} style={{ padding: '100px', textAlign: 'center' }}>
                                            <div className="spinner" style={{ margin: '0 auto' }} />
                                        </td>
                                    </tr>
                                ) : vehicles.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} style={{ padding: '100px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                            <Car size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                                            <p>لا توجد معدات تطابق معايير البحث</p>
                                        </td>
                                    </tr>
                                ) : (
                                    <AnimatePresence>
                                        {vehicles.map((vehicle) => (
                                            <motion.tr
                                                key={vehicle.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                                                style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }}
                                            >
                                                <td style={{ padding: '20px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                            {/* Car Icon */}
                                                            <div style={{
                                                                width: '42px',
                                                                height: '42px',
                                                                borderRadius: '10px',
                                                                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                border: '1px solid rgba(59, 130, 246, 0.2)',
                                                                flexShrink: 0
                                                            }}>
                                                                <Car size={20} color="#3b82f6" />
                                                            </div>
                                                            {/* Equipment Image */}
                                                            {vehicle.image_url && (
                                                                <div style={{
                                                                    width: '42px',
                                                                    height: '42px',
                                                                    borderRadius: '10px',
                                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                                    overflow: 'hidden',
                                                                    background: 'rgba(255,255,255,0.05)',
                                                                    flexShrink: 0
                                                                }}>
                                                                    <img
                                                                        src={vehicle.image_url}
                                                                        alt=""
                                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p style={{ fontWeight: 700, fontSize: '1rem' }}>{vehicle.plate_number}</p>
                                                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{vehicle.equipment_name || 'رقم المعدة'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px' }}>
                                                    <p style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-primary)' }}>{vehicle.equipment_name || vehicle.vehicle_type}</p>
                                                </td>
                                                {['admin', 'trainer'].includes(user?.role || '') && (
                                                    <td style={{ padding: '20px' }}>
                                                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-start' }}>
                                                            <motion.button
                                                                whileHover={{ scale: 1.1, backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
                                                                onClick={() => {
                                                                    authService.setSelectedEquipment(vehicle);
                                                                    toast.success(`تم تفعيل المعدة ${vehicle.plate_number}`);
                                                                }}
                                                                title="تفعيل كمعدة نشطة"
                                                                style={{
                                                                    padding: '8px',
                                                                    border: 'none',
                                                                    background: 'transparent',
                                                                    color: '#10b981',
                                                                    cursor: 'pointer',
                                                                    borderRadius: '8px'
                                                                }}
                                                            >
                                                                <Check size={18} />
                                                            </motion.button>
                                                            <motion.button
                                                                whileHover={{ scale: 1.1, backgroundColor: 'rgba(234, 179, 8, 0.1)' }}
                                                                onClick={() => navigate(`/maintenance-execution?vehicle_id=${vehicle.id}`)}
                                                                title="تنفيذ الصيانة"
                                                                style={{
                                                                    padding: '8px',
                                                                    border: 'none',
                                                                    background: 'transparent',
                                                                    color: '#eab308',
                                                                    cursor: 'pointer',
                                                                    borderRadius: '8px'
                                                                }}
                                                            >
                                                                <Wrench size={18} />
                                                            </motion.button>
                                                            <motion.button
                                                                whileHover={{ scale: 1.1, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                                                                onClick={() => openModal(vehicle)}
                                                                style={{
                                                                    padding: '8px',
                                                                    border: 'none',
                                                                    background: 'transparent',
                                                                    color: 'var(--color-primary)',
                                                                    cursor: 'pointer',
                                                                    borderRadius: '8px'
                                                                }}
                                                            >
                                                                <Settings size={18} />
                                                            </motion.button>
                                                            <motion.button
                                                                whileHover={{ scale: 1.1, backgroundColor: 'rgba(168, 85, 247, 0.1)' }}
                                                                onClick={() => openModal(vehicle, 'specs')}
                                                                title="تعديل المواصفات"
                                                                style={{
                                                                    padding: '8px',
                                                                    border: 'none',
                                                                    background: 'transparent',
                                                                    color: '#a855f7',
                                                                    cursor: 'pointer',
                                                                    borderRadius: '8px'
                                                                }}
                                                            >
                                                                <FileText size={18} />
                                                            </motion.button>
                                                            <motion.button
                                                                whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                                                                onClick={() => handleDelete(vehicle.id)}
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
                                                            <motion.button
                                                                whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                                                                style={{
                                                                    padding: '8px',
                                                                    border: 'none',
                                                                    background: 'transparent',
                                                                    color: 'var(--color-text-muted)',
                                                                    cursor: 'pointer',
                                                                    borderRadius: '8px'
                                                                }}
                                                            >
                                                                <MoreVertical size={18} />
                                                            </motion.button>
                                                        </div>
                                                    </td>
                                                )}
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
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
                                onClick={() => fetchVehicles(pagination.page - 1)}
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
                                onClick={() => fetchVehicles(pagination.page + 1)}
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
            </div>

            {/* Vehicle Modal */}
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
                            style={{ width: '100%', maxWidth: '700px', padding: '30px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', textAlign: 'center' }}>
                                {editingVehicle ? 'تعديل بيانات المعدة' : 'إضافة معدة جديدة'}
                            </h3>

                            <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)', marginBottom: '24px' }}>
                                <button
                                    onClick={() => setActiveTab('basic')}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        background: 'transparent',
                                        border: 'none',
                                        borderBottom: activeTab === 'basic' ? '2px solid var(--color-primary)' : '2px solid transparent',
                                        color: activeTab === 'basic' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                        fontWeight: activeTab === 'basic' ? 'bold' : 'normal',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    المعلومات الأساسية
                                </button>
                                <button
                                    onClick={() => setActiveTab('specs')}
                                    disabled={!editingVehicle}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        background: 'transparent',
                                        border: 'none',
                                        borderBottom: activeTab === 'specs' ? '2px solid var(--color-primary)' : '2px solid transparent',
                                        color: !editingVehicle ? 'rgba(255,255,255,0.1)' : activeTab === 'specs' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                        fontWeight: activeTab === 'specs' ? 'bold' : 'normal',
                                        cursor: !editingVehicle ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    مواصفات المعدة
                                </button>
                            </div>

                            {activeTab === 'basic' ? (
                                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div style={{ marginBottom: '10px' }}>
                                        <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '10px' }}>صورة المعدة</label>
                                        <div style={{
                                            width: '100%',
                                            height: '200px',
                                            borderRadius: '16px',
                                            border: '2px dashed var(--glass-border)',
                                            background: formData.image_url ? `url(${formData.image_url}) center/cover no-repeat` : 'rgba(255,255,255,0.02)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            position: 'relative',
                                            transition: 'all 0.3s ease',
                                            overflow: 'hidden'
                                        }}
                                            onClick={() => document.getElementById('image-upload')?.click()}
                                        >
                                            {!formData.image_url && !uploading && (
                                                <>
                                                    <Camera size={40} color="var(--color-text-muted)" style={{ marginBottom: '10px' }} />
                                                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>اضغط لإضافة صورة</p>
                                                </>
                                            )}
                                            {uploading && (
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                                    <Loader2 size={32} className="spinner" color="var(--color-primary)" />
                                                    <p style={{ fontSize: '0.85rem', color: 'var(--color-primary)' }}>جاري الرفع...</p>
                                                </div>
                                            )}
                                            {formData.image_url && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setFormData({ ...formData, image_url: '' });
                                                    }}
                                                    style={{
                                                        position: 'absolute',
                                                        top: '10px',
                                                        left: '10px',
                                                        background: 'rgba(239, 68, 68, 0.8)',
                                                        border: 'none',
                                                        borderRadius: '50%',
                                                        width: '24px',
                                                        height: '24px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'white',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <X size={14} />
                                                </button>
                                            )}
                                            <input
                                                id="image-upload"
                                                type="file"
                                                accept="image/*"
                                                style={{ display: 'none' }}
                                                onChange={handleImageUpload}
                                            />
                                        </div>
                                    </div>

                                    {/* All Basic Information */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <h4 style={{ fontSize: '1rem', marginBottom: '8px', color: 'var(--color-primary)' }}>جميع المعلومات</h4>

                                        {/* List of all fields */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {(formData.custom_fields || []).map((field, index) => (
                                                <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                    <input
                                                        className="neon-input"
                                                        value={field.key}
                                                        onChange={(e) => {
                                                            const newFields = [...(formData.custom_fields || [])];
                                                            newFields[index].key = e.target.value;
                                                            setFormData({ ...formData, custom_fields: newFields });
                                                        }}
                                                        placeholder="اسم الحقل"
                                                        style={{ flex: 1 }}
                                                    />
                                                    <input
                                                        className="neon-input"
                                                        value={field.value}
                                                        onChange={(e) => {
                                                            const newFields = [...(formData.custom_fields || [])];
                                                            newFields[index].value = e.target.value;
                                                            setFormData({ ...formData, custom_fields: newFields });
                                                        }}
                                                        placeholder="القيمة"
                                                        style={{ flex: 1 }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newFields = (formData.custom_fields || []).filter((_, i) => i !== index);
                                                            setFormData({ ...formData, custom_fields: newFields });
                                                        }}
                                                        style={{
                                                            padding: '8px',
                                                            background: 'rgba(239, 68, 68, 0.1)',
                                                            color: '#ef4444',
                                                            border: 'none',
                                                            borderRadius: '8px',
                                                            cursor: 'pointer'
                                                        }}
                                                        title="حذف"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Add new field button */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newFields = [...(formData.custom_fields || []), { key: '', value: '' }];
                                                setFormData({ ...formData, custom_fields: newFields });
                                            }}
                                            className="neon-button"
                                            style={{
                                                width: '100%',
                                                background: 'rgba(59, 130, 246, 0.1)',
                                                borderColor: 'var(--color-primary)',
                                                fontSize: '0.9rem'
                                            }}
                                        >
                                            <Plus size={16} style={{ marginLeft: '8px' }} />
                                            إضافة حقل جديد
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                                        <button
                                            type="submit"
                                            className="neon-button"
                                            style={{ flex: 1, height: '50px' }}
                                        >
                                            {editingVehicle ? 'حفظ التعديلات' : 'إضافة المعدة'}
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
                            ) : (
                                <form onSubmit={handleSpecsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {/* Categorized Specifications */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <h4 style={{ fontSize: '1rem', marginBottom: '8px', color: 'var(--color-primary)' }}>جميع المواصفات</h4>

                                        {/* Group specs by category */}
                                        {(() => {
                                            const grouped: Record<string, Array<{ key: string, value: string, index: number }>> = {};
                                            (specsData.custom_specs || []).forEach((spec: any, index) => {
                                                const category = spec.category || 'مواصفات عامة';
                                                if (!grouped[category]) grouped[category] = [];
                                                grouped[category].push({ key: spec.key, value: spec.value, index });
                                            });

                                            return (
                                                <>
                                                    {Object.entries(grouped).map(([category, specs]) => (
                                                        <div key={category} style={{
                                                            padding: '20px',
                                                            background: 'rgba(255,255,255,0.02)',
                                                            borderRadius: '12px',
                                                            border: '1px solid rgba(255,255,255,0.05)'
                                                        }}>
                                                            {/* Category Header */}
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                                                <h5 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                                                                    {category}
                                                                </h5>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        // Delete all specs in this category
                                                                        const newSpecs = (specsData.custom_specs || []).filter((s: any) =>
                                                                            (s.category || 'مواصفات عامة') !== category
                                                                        );
                                                                        setSpecsData({ ...specsData, custom_specs: newSpecs });
                                                                    }}
                                                                    style={{
                                                                        padding: '6px 12px',
                                                                        background: 'rgba(239, 68, 68, 0.1)',
                                                                        color: '#ef4444',
                                                                        border: 'none',
                                                                        borderRadius: '8px',
                                                                        cursor: 'pointer',
                                                                        fontSize: '0.8rem',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '5px'
                                                                    }}
                                                                    title="حذف القسم بالكامل"
                                                                >
                                                                    <Trash2 size={14} />
                                                                    حذف القسم
                                                                </button>
                                                            </div>

                                                            {/* Specs in this category */}
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                                {specs.map(({ key, value, index }) => (
                                                                    <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                                        <input
                                                                            className="neon-input"
                                                                            value={key}
                                                                            onChange={(e) => {
                                                                                const newSpecs = [...(specsData.custom_specs || [])];
                                                                                newSpecs[index].key = e.target.value;
                                                                                setSpecsData({ ...specsData, custom_specs: newSpecs });
                                                                            }}
                                                                            placeholder="اسم المواصفة"
                                                                            style={{ flex: 1 }}
                                                                        />
                                                                        <input
                                                                            className="neon-input"
                                                                            value={value}
                                                                            onChange={(e) => {
                                                                                const newSpecs = [...(specsData.custom_specs || [])];
                                                                                newSpecs[index].value = e.target.value;
                                                                                setSpecsData({ ...specsData, custom_specs: newSpecs });
                                                                            }}
                                                                            placeholder="القيمة"
                                                                            style={{ flex: 1 }}
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const newSpecs = (specsData.custom_specs || []).filter((_, i) => i !== index);
                                                                                setSpecsData({ ...specsData, custom_specs: newSpecs });
                                                                            }}
                                                                            style={{
                                                                                padding: '8px',
                                                                                background: 'rgba(239, 68, 68, 0.1)',
                                                                                color: '#ef4444',
                                                                                border: 'none',
                                                                                borderRadius: '8px',
                                                                                cursor: 'pointer'
                                                                            }}
                                                                            title="حذف"
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    </div>
                                                                ))}

                                                                {/* Add spec to this category */}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newSpecs = [...(specsData.custom_specs || []), {
                                                                            key: '',
                                                                            value: '',
                                                                            category
                                                                        } as any];
                                                                        setSpecsData({ ...specsData, custom_specs: newSpecs });
                                                                    }}
                                                                    className="neon-button"
                                                                    style={{
                                                                        width: '100%',
                                                                        background: 'rgba(59, 130, 246, 0.05)',
                                                                        borderColor: 'rgba(59, 130, 246, 0.3)',
                                                                        fontSize: '0.85rem',
                                                                        height: '40px'
                                                                    }}
                                                                >
                                                                    <Plus size={14} style={{ marginLeft: '8px' }} />
                                                                    إضافة مواصفة لهذا القسم
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {/* Add new category button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const categoryName = prompt('أدخل اسم القسم الجديد (مثال: المحرك، الجربكس، التعليق):');
                                                            if (categoryName && categoryName.trim()) {
                                                                const newSpecs = [...(specsData.custom_specs || []), {
                                                                    key: '',
                                                                    value: '',
                                                                    category: categoryName.trim()
                                                                } as any];
                                                                setSpecsData({ ...specsData, custom_specs: newSpecs });
                                                            }
                                                        }}
                                                        className="neon-button"
                                                        style={{
                                                            width: '100%',
                                                            background: 'rgba(16, 185, 129, 0.1)',
                                                            borderColor: '#10b981',
                                                            fontSize: '0.9rem'
                                                        }}
                                                    >
                                                        <Plus size={16} style={{ marginLeft: '8px' }} />
                                                        إضافة قسم جديد
                                                    </button>
                                                </>
                                            );
                                        })()}
                                    </div>


                                    <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                                        <button
                                            type="submit"
                                            className="neon-button"
                                            style={{ flex: 1, height: '50px' }}
                                        >
                                            حفظ المواصفات
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
                                            إغلاق
                                        </button>
                                    </div>
                                </form>
                            )}
                        </motion.div>
                    </motion.div>
                )
                }
            </AnimatePresence >
        </DashboardLayout >
    );
};

export default VehiclesPage;
