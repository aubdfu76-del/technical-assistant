import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Book,
    Search,
    Plus,
    FileText,
    Trash2,
    Download,
    Eye,
    Upload,
    Loader2,
    Calendar,
    HardDrive,
    Car
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { aiService, type TechnicalManual } from '../services/ai.service';
import { authService } from '../services/auth.service';
import { vehiclesService, type Vehicle } from '../services/vehicles.service';
import { toast } from 'react-hot-toast';

const ManualsPage = () => {
    const [manuals, setManuals] = useState<TechnicalManual[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const user = authService.getCurrentUser();
    const canEdit = user?.role === 'admin' || user?.role === 'trainer';

    // Upload Modal State
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        vehicle_id: ''
    });

    const [selectedEquipment, setSelectedEquipment] = useState(authService.getSelectedEquipment());

    // Listen for storage changes (when equipment is selected in top bar)
    useEffect(() => {
        const handleStorageChange = () => {
            setSelectedEquipment(authService.getSelectedEquipment());
        };
        window.addEventListener('storage', handleStorageChange);
        // Custom interval check for same-tab updates if events don't fire
        const interval = setInterval(handleStorageChange, 1000);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, []);

    const fetchManuals = async () => {
        setLoading(true);
        try {
            const [manualsData, vehiclesData] = await Promise.all([
                aiService.getManuals(),
                vehiclesService.getAll({ limit: 1000 })
            ]);
            setManuals(manualsData);
            setVehicles(vehiclesData.data || []);
        } catch (err) {
            console.error('Fetch data error:', err);
            toast.error('حدث خطأ أثناء جلب البيانات');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchManuals();
    }, []);

    const handleDelete = async (id: string, title: string) => {
        if (!window.confirm(`هل أنت متأكد من حذف الكراسة "${title}"؟`)) return;

        try {
            await aiService.deleteManual(id);
            toast.success('تم حذف الكراسة بنجاح');
            fetchManuals();
        } catch (err) {
            toast.error('حدث خطأ أثناء حذف الكراسة');
        }
    };

    const handleFileUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile || !formData.title) {
            toast.error('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        setUploading(true);
        try {
            await aiService.uploadManual(
                selectedFile,
                formData.title,
                formData.description,
                formData.vehicle_id
            );
            toast.success('تم رفع الكراسة بنجاح');
            setShowUploadModal(false);
            setSelectedFile(null);
            setFormData({ title: '', description: '', vehicle_id: '' });
            fetchManuals();
        } catch (err) {
            toast.error('حدث خطأ أثناء رفع الكراسة');
        } finally {
            setUploading(false);
        }
    };

    const filteredManuals = manuals.filter(m => {
        // Filter by search text
        const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase()) ||
            m.description?.toLowerCase().includes(search.toLowerCase());

        // Filter by selected equipment (if any)
        // Check for exact ID match (new format) or Plate Number match (old format)
        const matchesEquipment = !selectedEquipment ||
            String(m.vehicle_type) === String(selectedEquipment.id) ||
            (typeof m.vehicle_type === 'string' && m.vehicle_type.includes(selectedEquipment.plate_number));

        return matchesSearch && matchesEquipment;
    });

    const formatFileSize = (bytes: string | number) => {
        const b = typeof bytes === 'string' ? parseInt(bytes) : bytes;
        if (isNaN(b)) return 'N/A';
        if (b === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(b) / Math.log(k));
        return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <DashboardLayout>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>الكراسات الفنية والمراجع</h2>
                        <p style={{ color: 'var(--color-text-muted)' }}>المكتبة الشاملة للكتيبات الفنية وأدلة الصيانة</p>
                    </div>
                    {canEdit && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="neon-button"
                            onClick={() => setShowUploadModal(true)}
                        >
                            <Plus size={20} />
                            <span>إضافة كراسة فنية</span>
                        </motion.button>
                    )}
                </div>

                {/* Search Bar */}
                <div className="glass-card" style={{ padding: '16px 24px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input
                            className="neon-input"
                            placeholder="ابحث عن كراسة، دليل، أو مركب..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ paddingRight: '45px', width: '100%' }}
                        />
                    </div>
                </div>

                {/* Manuals Grid */}
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
                        <div className="spinner" />
                    </div>
                ) : filteredManuals.length === 0 ? (
                    <div className="glass-card" style={{ padding: '100px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        <Book size={64} style={{ opacity: 0.1, marginBottom: '20px' }} />
                        <p>لا توجد كراسات فنية مطابقة للبحث</p>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                        gap: '20px'
                    }}>
                        {filteredManuals.map((manual) => (
                            <motion.div
                                key={manual.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-card group"
                                style={{
                                    padding: '24px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '16px',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    border: '1px solid var(--glass-border)',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                    <div style={{
                                        width: '56px',
                                        height: '56px',
                                        borderRadius: '16px',
                                        background: 'linear-gradient(135deg, rgba(194,178,128,0.1), rgba(85,107,47,0.1))',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '1px solid rgba(194,178,128,0.2)',
                                        flexShrink: 0
                                    }}>
                                        <FileText size={28} color="#C2B280" />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {manual.title}
                                        </h3>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                <Calendar size={12} />
                                                <span>{new Date(manual.created_at).toLocaleDateString('ar-SA')}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                <HardDrive size={12} />
                                                <span>{formatFileSize(manual.file_size)}</span>
                                            </div>
                                            {manual.vehicle_type && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--color-highlight)' }}>
                                                    <Car size={12} />
                                                    <span>
                                                        {(() => {
                                                            // Try to find vehicle by ID
                                                            const vehicle = vehicles.find(v => String(v.id) === String(manual.vehicle_type));
                                                            if (vehicle) return `${vehicle.plate_number} - ${vehicle.equipment_name || vehicle.vehicle_type}`;

                                                            // Fallback to displaying the raw value (legacy support)
                                                            return manual.vehicle_type;
                                                        })()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <p style={{
                                    fontSize: '0.9rem',
                                    color: 'var(--color-text-muted)',
                                    lineHeight: '1.6',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    minHeight: '2.8em'
                                }}>
                                    {manual.description || 'لا يوجد وصف متاح لهذه الكراسة الفنية.'}
                                </p>

                                <div style={{
                                    marginTop: 'auto',
                                    paddingTop: '16px',
                                    borderTop: '1px solid var(--glass-border)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <motion.a
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            href={`http://localhost:3000/uploads/manuals/${manual.file_path}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: '8px',
                                                background: 'rgba(59, 130, 246, 0.1)',
                                                color: '#3b82f6',
                                                fontSize: '0.85rem',
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                textDecoration: 'none'
                                            }}
                                        >
                                            <Eye size={16} />
                                            عرض
                                        </motion.a>
                                        <motion.a
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            href={`http://localhost:3000/api/ai/manuals/${manual.id}/download`}
                                            download
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: '8px',
                                                background: 'rgba(16, 185, 129, 0.1)',
                                                color: '#10b981',
                                                fontSize: '0.85rem',
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                textDecoration: 'none'
                                            }}
                                        >
                                            <Download size={16} />
                                            تحميل
                                        </motion.a>
                                    </div>

                                    {canEdit && (
                                        <motion.button
                                            whileHover={{ scale: 1.1, color: '#ef4444' }}
                                            onClick={() => handleDelete(manual.id, manual.title)}
                                            style={{
                                                padding: '8px',
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'rgba(239, 68, 68, 0.6)',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <Trash2 size={18} />
                                        </motion.button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            <AnimatePresence>
                {showUploadModal && (
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
                        onClick={() => !uploading && setShowUploadModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="glass-card"
                            style={{ width: '100%', maxWidth: '500px', padding: '30px', position: 'relative' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '24px', textAlign: 'center' }}>رفع كراسة فنية جديدة</h3>

                            <form onSubmit={handleFileUpload} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {/* File Upload Area */}
                                <div
                                    onClick={() => !uploading && document.getElementById('manual-file-upload')?.click()}
                                    style={{
                                        border: '2px dashed var(--glass-border)',
                                        borderRadius: '16px',
                                        padding: '40px 20px',
                                        textAlign: 'center',
                                        cursor: uploading ? 'not-allowed' : 'pointer',
                                        background: selectedFile ? 'rgba(194,178,128,0.05)' : 'rgba(255,255,255,0.02)',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    {selectedFile ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                            <FileText size={48} color="#C2B280" />
                                            <p style={{ fontWeight: 600 }}>{selectedFile.name}</p>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                                {formatFileSize(selectedFile.size)}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedFile(null);
                                                }}
                                                style={{ border: 'none', background: 'transparent', color: '#ef4444', fontSize: '0.8rem', marginTop: '10px' }}
                                            >
                                                تغيير الملف
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload size={40} style={{ color: 'var(--color-text-muted)', marginBottom: '12px' }} />
                                            <p style={{ fontSize: '1rem', fontWeight: 600 }}>اختر ملف PDF</p>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>أو اسحب وأفلت الملف هنا</p>
                                        </>
                                    )}
                                    <input
                                        id="manual-file-upload"
                                        type="file"
                                        accept=".pdf"
                                        style={{ display: 'none' }}
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                if (file.type !== 'application/pdf') {
                                                    toast.error('يرجى رفع ملفات PDF فقط');
                                                    return;
                                                }
                                                setSelectedFile(file);
                                                if (!formData.title) setFormData({ ...formData, title: file.name.replace('.pdf', '') });
                                            }
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>عنوان الكراسة</label>
                                    <input
                                        className="neon-input"
                                        placeholder="مثال: دليل صيانة محرك مرسيدس"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        disabled={uploading}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>المعدة المسندة</label>
                                    <select
                                        className="neon-input"
                                        value={formData.vehicle_id}
                                        onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                                        disabled={uploading}
                                        style={{ width: '100%', padding: '12px' }}
                                    >
                                        <option value="">اختر المعدة...</option>
                                        {vehicles.map(vehicle => (
                                            <option key={vehicle.id} value={vehicle.id}>
                                                {vehicle.plate_number} - {vehicle.equipment_name || vehicle.vehicle_type}
                                            </option>
                                        ))}
                                    </select>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-highlight)', marginTop: '8px' }}>
                                        💡 يجب إسناد الكراسة لمعدة محددة لضمان دقة البحث لاحقاً
                                    </p>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>الوصف (اختياري)</label>
                                    <textarea
                                        className="neon-input"
                                        placeholder="اكتب وصفاً مختصراً لمحتوى الكراسة..."
                                        rows={3}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        disabled={uploading}
                                        style={{ resize: 'none' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                                    <button
                                        type="button"
                                        className="neon-button"
                                        style={{ flex: 1, background: 'rgba(255,255,255,0.05)', boxShadow: 'none' }}
                                        onClick={() => setShowUploadModal(false)}
                                        disabled={uploading}
                                    >
                                        إلغاء
                                    </button>
                                    <button
                                        type="submit"
                                        className="neon-button"
                                        style={{ flex: 2 }}
                                        disabled={uploading || !selectedFile || !formData.title || !formData.vehicle_id}
                                    >
                                        {uploading ? (
                                            <>
                                                <Loader2 size={18} className="spinner" />
                                                جاري الرفع...
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={18} />
                                                رفع الكراسة
                                            </>
                                        )}
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

export default ManualsPage;
