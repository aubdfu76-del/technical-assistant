import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { read, utils, writeFile } from 'xlsx';
import {
    Search,
    Wrench,
    PlayCircle,
    Settings2,
    Plus,
    X,
    Save,
    Clock,
    FileSpreadsheet,
    FileUp,
    Download,
    ChevronDown,
    Trash2
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { repairService, type RepairTask } from '../services/repair.service';
import { authService } from '../services/auth.service';
import { toast } from 'react-hot-toast';
import VehicleMultiSelect from '../components/common/VehicleMultiSelect';

const MaintenanceTaskCard = ({ task, onClick, onDelete }: { task: RepairTask, onClick: any, onDelete?: any }) => {
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
                    background: 'rgba(16, 185, 129, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(16, 185, 129, 0.2)'
                }}>
                    <Wrench size={20} color="#10b981" />
                </div>
                <div>
                    <h3 style={{ fontSize: '1.05rem', color: '#fff', marginBottom: '4px' }}>{task.title}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{task.description || 'اضغط لبدء تنفيذ عملية الصيانة ومراجعة الخطوات'}</p>
                    <div style={{ display: 'flex', gap: '15px', marginTop: '4px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>{task.category}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{task.estimated_time}</span>
                    </div>
                </div>
            </div>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
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
};

const AddSectionModal = ({ onClose, onRefresh, vehicleId }: any) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState('59, 130, 246');
    const [loading, setLoading] = useState(false);

    // Vehicle Selection
    const [selectedVehicles, setSelectedVehicles] = useState<number[]>(vehicleId ? [parseInt(vehicleId)] : []);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await repairService.createSection({
                title,
                description,
                icon: 'Wrench', // Default for now, could add icon picker later
                color,
                vehicle_ids: selectedVehicles
            });
            toast.success('تم إضافة القسم بنجاح');
            onRefresh();
            onClose();
        } catch (err: any) {
            console.error(err);
            const errorMsg = err.response?.data?.message || err.message || 'فشل في إضافة القسم';
            toast.error(errorMsg);
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
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
            }}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="glass-card"
                style={{ width: '100%', maxWidth: '500px', padding: '30px', border: '1px solid var(--glass-border)' }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '1.5rem', color: '#fff' }}>إضافة قسم صيانة جديد</h3>
                    <X size={24} style={{ cursor: 'pointer' }} onClick={onClose} />
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>عنوان القسم</label>
                        <input required className="neon-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: نظام العادم" />
                    </div>

                    {/* Vehicle Selection */}
                    <VehicleMultiSelect
                        selectedIds={selectedVehicles}
                        onChange={setSelectedVehicles}
                    />

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>الوصف</label>
                        <textarea className="neon-input" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="وصف موجز لمحتويات القسم" />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>لون التمييز (RGB)</label>
                        <input className="neon-input" value={color} onChange={(e) => setColor(e.target.value)} placeholder="مثال: 59, 130, 246" />
                        <div style={{ marginTop: '8px', padding: '10px', background: `rgba(${color}, 0.2)`, borderRadius: '8px', border: `1px solid rgba(${color}, 0.5)`, textAlign: 'center', fontSize: '0.8rem' }}>
                            معاينة اللون
                        </div>
                    </div>
                    <button type="submit" className="neon-button" style={{ marginTop: '10px' }} disabled={loading}>
                        <Save size={18} />
                        <span>{loading ? 'جاري الحفظ...' : 'حفظ القسم'}</span>
                    </button>
                </form>
            </motion.div>
        </motion.div>
    );
};

// Update AddMaintenanceModal to accept initialCategory
const AddMaintenanceModal = ({ onClose, onRefresh, initialCategory, vehicleId }: any) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState(initialCategory || '');
    const [time, setTime] = useState('');
    const [difficulty, setDifficulty] = useState('medium');
    const [technicians, setTechnicians] = useState(1);
    const [safety, setSafety] = useState('');
    const [workshop, setWorkshop] = useState('');
    const [loading, setLoading] = useState(false);

    // Vehicle Selection
    const [selectedVehicles, setSelectedVehicles] = useState<number[]>(vehicleId ? [parseInt(vehicleId)] : []);
    // Dynamic Steps State
    const [steps, setSteps] = useState<{ id: number, text: string }[]>([{ id: 1, text: '' }]);

    const handleStepChange = (id: number, val: string) => {
        setSteps(steps.map(s => s.id === id ? { ...s, text: val } : s));
    };

    const addStep = () => {
        setSteps([...steps, { id: steps.length + 1, text: '' }]);
    };

    const removeStep = (id: number) => {
        if (steps.length > 1) {
            setSteps(steps.filter(s => s.id !== id).map((s, i) => ({ ...s, id: i + 1 })));
        }
    };

    // Tools State
    const [tools, setTools] = useState<string[]>([]);
    const [toolInput, setToolInput] = useState('');

    const handleAddTool = () => {
        if (toolInput.trim() && !tools.includes(toolInput.trim())) {
            setTools([...tools, toolInput.trim()]);
            setToolInput('');
        }
    };

    const removeTool = (idx: number) => {
        setTools(tools.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Join steps for description temporarily or as structured text
            const stepsDescription = steps.map(s => `الخطوة ${s.id}: ${s.text}`).join('\n');
            const combinedDescription = description ? `${description}\n\n${stepsDescription}` : stepsDescription;

            await repairService.createTask({
                title,
                description: combinedDescription,
                category,
                estimated_time: time,
                difficulty,
                technicians_count: technicians,
                safety_procedures: safety,
                workshop_requirements: workshop,
                required_tools: tools.join(','),
                task_type: 'maintenance',
                vehicle_ids: selectedVehicles
            });

            toast.success('تم إضافة مهمة الصيانة بنجاح');
            onRefresh();
            onClose();
        } catch (err) {
            console.error(err);
            toast.error('فشل في إضافة مهمة الصيانة');
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
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
            }}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="glass-card"
                style={{ width: '100%', maxWidth: '800px', padding: '30px', border: '1px solid var(--glass-border)', maxHeight: '90vh', overflowY: 'auto' }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '1.5rem', color: '#fff' }}>إضافة حزمة صيانة شاملة</h3>
                    <X size={24} style={{ cursor: 'pointer' }} onClick={onClose} />
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>اسم العملية</label>
                            <input required className="neon-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: تغيير زيت المحرك وفلاتر" />
                        </div>

                        {/* Vehicle Selection in Task Modal */}
                        <div style={{ gridColumn: 'span 2' }}>
                            <VehicleMultiSelect
                                selectedIds={selectedVehicles}
                                onChange={setSelectedVehicles}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>الفئة</label>
                            <input required className="neon-input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="الفئة" />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>مستوى الصعوبة</label>
                            <select className="neon-input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={{ background: '#0f172a' }}>
                                <option value="easy">سهل</option>
                                <option value="medium">متوسط</option>
                                <option value="hard">صعب</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>وصف مختصر (اختياري)</label>
                        <textarea className="neon-input" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="وصف موجز للمهمة" />
                    </div>

                    {/* Dynamic Steps Section */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>خطوات التنفيذ</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {steps.map((step, index) => (
                                <div key={step.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                    <div style={{
                                        minWidth: '24px', height: '24px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)',
                                        color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', marginTop: '10px'
                                    }}>
                                        {index + 1}
                                    </div>
                                    <textarea
                                        required
                                        className="neon-input"
                                        value={step.text}
                                        onChange={(e) => handleStepChange(step.id, e.target.value)}
                                        rows={2}
                                        placeholder={`وصف الخطوة ${index + 1}...`}
                                        style={{ flex: 1 }}
                                    />
                                    {steps.length > 1 && (
                                        <button type="button" onClick={() => removeStep(step.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', marginTop: '10px' }}>
                                            <X size={18} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addStep}
                                className="neon-button"
                                style={{ background: 'transparent', border: '1px dashed var(--glass-border)', marginTop: '5px', width: '100%', justifyContent: 'center' }}
                            >
                                <Plus size={16} /> إضافة خطوة جديدة
                            </button>
                        </div>
                    </div>

                    {/* Tools Section */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>الأدوات المطلوبة</label>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                            <input
                                className="neon-input"
                                value={toolInput}
                                onChange={(e) => setToolInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTool())}
                                placeholder="اكتب اسم الأداة (مثال: مفتاح 14)"
                            />
                            <button type="button" onClick={handleAddTool} className="neon-button" style={{ width: 'auto', padding: '0 20px' }}>+</button>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {tools.map((t, i) => (
                                <span key={i} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '4px 12px', borderRadius: '12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {t} <X size={14} style={{ cursor: 'pointer' }} onClick={() => removeTool(i)} />
                                </span>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>الوقت المتوقع</label>
                            <div style={{ position: 'relative' }}>
                                <Clock size={18} style={{ position: 'absolute', right: '12px', top: '15px', color: 'var(--color-text-muted)' }} />
                                <input className="neon-input" style={{ paddingRight: '40px' }} value={time} onChange={(e) => setTime(e.target.value)} placeholder="مثال: 45 دقيقة" />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>عدد الفنيين</label>
                            <input type="number" className="neon-input" value={technicians} onChange={(e) => setTechnicians(Number(e.target.value))} min={1} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>إجراءات السلامة</label>
                            <textarea className="neon-input" value={safety} onChange={(e) => setSafety(e.target.value)} rows={3} placeholder="تحذيرات السلامة..." />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>متطلبات الورشة</label>
                            <textarea className="neon-input" value={workshop} onChange={(e) => setWorkshop(e.target.value)} rows={3} placeholder="حفرة، رافعة، كهرباء..." />
                        </div>
                    </div>

                    <div style={{ padding: '15px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px dashed rgba(59, 130, 246, 0.3)' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <PlayCircle size={16} />
                            ملاحظة: يمكنك إضافة الصور والفيديوهات وخطوات العمل التفصيلية بعد حفظ البيانات الأساسية للحزمة.
                        </p>
                    </div>

                    <button type="submit" className="neon-button" style={{ marginTop: '10px' }} disabled={loading}>
                        <Save size={18} />
                        <span>{loading ? 'جاري الحفظ...' : 'حفظ ومتابعة للوسائط'}</span>
                    </button>
                </form>
            </motion.div>
        </motion.div>
    );
};

const ExcelImportModal = ({ onClose, onRefresh, currentCategory }: any) => {
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Upload, 2: Preview

    const downloadTemplate = () => {
        const template = [
            {
                "اسم العملية": "مثال: تغيير زيت المحرك",
                "الفئة": currentCategory || "محرك",
                "الوصف": "وصف عام للمهمة (اختياري)",
                "الوقت": "30 دقيقة",
                "الصعوبة": "easy",
                "عدد الفنيين": 1,
                "الخطوات": "الخطوة الأولى\nالخطوة الثانية (استخدم Alt+Enter لسطر جديد)",
                "الأدوات": "مفك, زيت 5W30",
                "إجراءات السلامة": "ارتداء قفازات واقية",
                "متطلبات الورشة": "رافعة سيارات"
            }
        ];
        const ws = utils.json_to_sheet(template);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Template");
        writeFile(wb, "maintenance_template.xlsx");
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setLoading(true);

        try {
            const buffer = await selectedFile.arrayBuffer();
            const workbook = read(buffer);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = utils.sheet_to_json(worksheet);
            setPreviewData(jsonData);
            setStep(2);
        } catch (err) {
            console.error(err);
            toast.error('فشل في قراءة الملف. تأكد من أنه ملف Excel صالح.');
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (!previewData.length) return;
        setLoading(true);
        let successCount = 0;
        let failCount = 0;

        // Basic English mapping for difficulty
        const difficultyMap: any = {
            'سهل': 'easy',
            'متوسط': 'medium',
            'صعب': 'hard',
            'easy': 'easy',
            'medium': 'medium',
            'hard': 'hard'
        };

        try {
            for (const row of previewData) {
                // Map row data to task object
                // Combine description and steps
                let combinedDescription = '';
                if (row["الوصف"]) combinedDescription += row["الوصف"] + "\n\n";
                if (row["الخطوات"]) combinedDescription += "الخطوات:\n" + row["الخطوات"];

                const task = {
                    title: row["اسم العملية"],
                    category: row["الفئة"] || currentCategory,
                    estimated_time: row["الوقت"],
                    difficulty: difficultyMap[row["الصعوبة"]] || 'medium',
                    technicians_count: row["عدد الفنيين"] || 1,
                    description: combinedDescription,
                    required_tools: row["الأدوات"],
                    safety_procedures: row["إجراءات السلامة"],
                    workshop_requirements: row["متطلبات الورشة"],
                    task_type: 'maintenance'
                };

                if (!task.title) {
                    continue;
                }

                try {
                    await repairService.createTask(task);
                    successCount++;
                } catch (e) {
                    console.error(e);
                    failCount++;
                }
            }

            toast.success(`تم استيراد ${successCount} عملية بنجاح`);
            if (failCount > 0) toast.error(`فشل استيراد ${failCount} عملية`);
            onRefresh();
            onClose();
        } catch (err) {
            console.error(err);
            toast.error('حدث خطأ غير متوقع أثناء الاستيراد');
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
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
            }}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="glass-card"
                style={{ width: '100%', maxWidth: '700px', padding: '30px', border: '1px solid var(--glass-border)', maxHeight: '90vh', overflowY: 'auto' }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '1.5rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FileSpreadsheet color="#3b82f6" />
                        استيراد من Excel
                    </h3>
                    <X size={24} style={{ cursor: 'pointer' }} onClick={onClose} />
                </div>

                {step === 1 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', alignItems: 'center', padding: '20px' }}>
                        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                            <p>قم بتحميل ملف Excel يحتوي على بيانات الصيانة. يمكنك تحميل النموذج أولاً.</p>
                        </div>

                        <button
                            onClick={downloadTemplate}
                            className="neon-button"
                            style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', width: 'auto' }}
                        >
                            <Download size={18} /> تحميل نموذج Excel
                        </button>

                        <div style={{
                            width: '100%', height: '200px',
                            border: '2px dashed var(--glass-border)',
                            borderRadius: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            position: 'relative',
                            background: 'rgba(255,255,255,0.01)'
                        }}>
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleFileUpload}
                                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                            />
                            <FileUp size={48} color="var(--color-text-muted)" style={{ marginBottom: '15px' }} />
                            <p style={{ color: 'var(--color-text-muted)' }}>اسحب الملف هنا أو اضغط للاختيار</p>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ color: '#fff' }}>معاينة البيانات ({previewData.length} سجل)</h4>
                            <button onClick={() => { setStep(1); setPreviewData([]); }} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                                إعادة تحميل
                            </button>
                        </div>

                        <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <thead style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-primary)' }}>
                                    <tr>
                                        <th style={{ padding: '10px', textAlign: 'right' }}>العملية</th>
                                        <th style={{ padding: '10px', textAlign: 'right' }}>الفئة</th>
                                        <th style={{ padding: '10px', textAlign: 'right' }}>الوصف</th>
                                        <th style={{ padding: '10px', textAlign: 'right' }}>الخطوات</th>
                                        <th style={{ padding: '10px', textAlign: 'right' }}>الوقت</th>
                                        <th style={{ padding: '10px', textAlign: 'right' }}>الصعوبة</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.slice(0, 50).map((row, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                            <td style={{ padding: '10px' }}>{row["اسم العملية"]}</td>
                                            <td style={{ padding: '10px' }}>{row["الفئة"]}</td>
                                            <td style={{ padding: '10px', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row["الوصف"] || '-'}</td>
                                            <td style={{ padding: '10px', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row["الخطوات"] || '-'}</td>
                                            <td style={{ padding: '10px' }}>{row["الوقت"]}</td>
                                            <td style={{ padding: '10px' }}>{row["الصعوبة"]}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {previewData.length > 50 && <p style={{ padding: '10px', textAlign: 'center', color: 'var(--color-text-muted)' }}>... والمزيد</p>}
                        </div>

                        <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                            <button onClick={handleImport} className="neon-button" disabled={loading} style={{ flex: 1 }}>
                                {loading ? 'جاري الاستيراد...' : 'تأكيد وحفظ البيانات'}
                            </button>
                            <button onClick={onClose} className="neon-button" style={{ flex: 1, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: '#ef4444' }}>
                                إلغاء
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

// Dynamically import icons to avoid huge bundle
import { Droplets, Filter, Disc, Activity, Circle, Zap, Thermometer, ChevronRight, LayoutGrid } from 'lucide-react';

const MaintenanceExecutionPage = () => {
    const [sections, setSections] = useState<any[]>([]);
    const [tasks, setTasks] = useState<RepairTask[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [isAddMaintenanceOpen, setIsAddMaintenanceOpen] = useState(false);
    const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'sections' | 'tasks'>('sections');
    const [activeSection, setActiveSection] = useState<any>(null);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const vehicleId = searchParams.get('vehicle_id');

    const user = authService.getCurrentUser();
    const canEdit = user?.role === 'admin' || user?.role === 'trainer';

    const fetchSections = async () => {
        setLoading(true);
        try {
            const selectedVehicle = authService.getSelectedEquipment();
            const vehicleId = selectedVehicle ? selectedVehicle.id : undefined;
            const response = await repairService.getSections(vehicleId);
            if (response.success) {
                setSections(response.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handleVehicleChange = () => {
            fetchSections();
            if (viewMode === 'tasks' && activeSection) {
                fetchTasks(activeSection.title);
            }
        };

        fetchSections();
        window.addEventListener('storage', handleVehicleChange);
        return () => window.removeEventListener('storage', handleVehicleChange);
    }, []);

    const fetchTasks = async (query: string = '', section?: string) => {
        setLoading(true);
        const searchTerm = section || query;
        const selectedVehicle = authService.getSelectedEquipment();
        const vehicleId = selectedVehicle ? selectedVehicle.id : undefined;
        try {
            const response = await repairService.getTasks(searchTerm, 'maintenance', vehicleId);
            setTasks(response.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSectionClick = (section: any) => {
        setActiveSection(section);
        setSearch(section.title); // Pre-fill search with section title loosely
        setViewMode('tasks');
        fetchTasks(section.title);
    };

    const handleBackToSections = () => {
        setViewMode('sections');
        setActiveSection(null);
        setSearch('');
        setTasks([]);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchTasks(search);
    };

    const handleDeleteSection = async (e: any, id: number) => {
        e.stopPropagation();
        if (window.confirm('هل أنت متأكد من حذف هذا القسم؟ سيتم حذف جميع المهام داخله.')) {
            try {
                await repairService.deleteSection(id);
                toast.success('تم حذف القسم بنجاح');
                fetchSections();
            } catch (err) {
                console.error(err);
                toast.error('فشل في حذف القسم');
            }
        }
    };

    const handleDeleteTask = async (id: number) => {
        if (window.confirm('هل أنت متأكد من حذف حزمة العمل هذه؟')) {
            try {
                await repairService.deleteTask(id);
                toast.success('تم حذف حزمة العمل بنجاح');
                fetchTasks(search);
            } catch (err) {
                console.error(err);
                toast.error('فشل في حذف حزمة العمل');
            }
        }
    };

    const getIcon = (name: string) => {
        const icons: any = { Droplets, Filter, Disc, Activity, Circle, Zap, Thermometer, Wrench };
        return icons[name] || Wrench;
    };

    return (
        <DashboardLayout>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {viewMode === 'tasks' && (
                            <motion.button
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                onClick={handleBackToSections}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '40px',
                                    height: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: '#fff'
                                }}
                            >
                                <ChevronRight size={24} />
                            </motion.button>
                        )}
                        <div>
                            <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>
                                {viewMode === 'sections' ? 'أقسام تنفيذ الصيانة' : activeSection?.title || 'تنفيذ الصيانة'}
                            </h1>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>
                                {viewMode === 'sections' ? 'اختر القسم لعرض حزم العمل المتاحة' : `حزم العمل الخاصة بـ ${activeSection?.title || 'نتائج البحث'}`}
                            </p>
                        </div>
                    </div>
                    {canEdit && (
                        <div style={{ position: 'relative' }}>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="neon-button"
                                onClick={() => viewMode === 'sections' ? setIsAddSectionOpen(true) : setIsDropdownOpen(!isDropdownOpen)}
                                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                                style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid #10b981', width: 'auto', padding: '0 25px' }}
                            >
                                <Plus size={18} />
                                <span>{viewMode === 'sections' ? 'إضافة قسم جديد' : 'إضافة حزمة عمل'}</span>
                                {viewMode === 'tasks' && <ChevronDown size={16} style={{ marginRight: '8px' }} />}
                            </motion.button>

                            <AnimatePresence>
                                {isDropdownOpen && viewMode === 'tasks' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="glass-card"
                                        style={{
                                            position: 'absolute',
                                            top: '120%',
                                            left: 0,
                                            width: '200px',
                                            padding: '8px',
                                            zIndex: 50,
                                            background: 'rgba(20, 20, 30, 0.95)',
                                            border: '1px solid var(--glass-border)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '4px'
                                        }}
                                    >
                                        <button
                                            onClick={() => { setIsDropdownOpen(false); setIsAddMaintenanceOpen(true); }}
                                            className="dropdown-item"
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '10px',
                                                padding: '10px 12px', width: '100%',
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#fff',
                                                cursor: 'pointer',
                                                borderRadius: '8px',
                                                textAlign: 'right',
                                                fontSize: '0.9rem'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <Plus size={16} color="#10b981" />
                                            إضافة يدوية
                                        </button>
                                        <button
                                            onClick={() => { setIsDropdownOpen(false); setIsExcelImportOpen(true); }}
                                            className="dropdown-item"
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '10px',
                                                padding: '10px 12px', width: '100%',
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#fff',
                                                cursor: 'pointer',
                                                borderRadius: '8px',
                                                textAlign: 'right',
                                                fontSize: '0.9rem'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <FileSpreadsheet size={16} color="#3b82f6" />
                                            استيراد من Excel
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                <AnimatePresence mode="wait">
                    {viewMode === 'sections' ? (
                        <motion.div
                            key="sections"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}
                        >
                            {sections.map((section) => {
                                const Icon = getIcon(section.icon);
                                return (
                                    <motion.div
                                        key={section.id}
                                        whileHover={{ y: -5, borderColor: `rgba(${section.color}, 0.5)` }}
                                        onClick={() => handleSectionClick(section)}
                                        className="glass-card"
                                        style={{
                                            padding: '30px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            textAlign: 'center',
                                            gap: '20px',
                                            border: '1px solid var(--glass-border)',
                                            background: `linear-gradient(145deg, rgba(${section.color}, 0.05), transparent)`,
                                            position: 'relative'
                                        }}
                                    >
                                        {canEdit && (
                                            <button
                                                onClick={(e) => handleDeleteSection(e, section.id)}
                                                style={{
                                                    position: 'absolute',
                                                    top: '15px',
                                                    left: '15px',
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
                                                    transition: 'all 0.2s'
                                                }}
                                                title="حذف القسم"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                        <div style={{
                                            width: '70px',
                                            height: '70px',
                                            borderRadius: '20px',
                                            background: `rgba(${section.color}, 0.1)`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: `1px solid rgba(${section.color}, 0.2)`,
                                            boxShadow: `0 0 20px rgba(${section.color}, 0.1)`
                                        }}>
                                            <Icon size={32} color={`rgb(${section.color})`} />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{section.title}</h3>
                                            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{section.description}</p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="tasks"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
                        >
                            {/* Search within Section */}
                            <div className="glass-card" style={{ padding: '20px', display: 'flex', gap: '15px' }}>
                                <div style={{ flex: 1, position: 'relative' }}>
                                    <Search size={20} style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                                    <form onSubmit={handleSearchSubmit}>
                                        <input
                                            className="neon-input"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="ابحث داخل هذا القسم..."
                                            style={{ paddingRight: '45px', background: 'rgba(255,255,255,0.02)' }}
                                        />
                                    </form>
                                </div>
                                <button
                                    onClick={handleBackToSections}
                                    style={{
                                        background: 'transparent',
                                        border: '1px solid var(--glass-border)',
                                        color: 'var(--color-text-muted)',
                                        borderRadius: '12px',
                                        padding: '0 20px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <LayoutGrid size={18} />
                                    <span>كل الأقسام</span>
                                </button>
                            </div>

                            {/* Tasks Grid */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-text-muted)' }}>
                                    <Settings2 size={18} />
                                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>حزم العمل المتاحة ({Array.isArray(tasks) ? tasks.length : 0})</span>
                                </div>

                                {loading ? (
                                    <div style={{ textAlign: 'center', padding: '50px' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
                                ) : (Array.isArray(tasks) ? tasks : []).length === 0 ? (
                                    <div className="glass-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                        <Search size={48} style={{ opacity: 0.2, marginBottom: '20px' }} />
                                        <p>لا توجد مهام صيانة مضافة في هذا القسم حالياً</p>
                                        {canEdit && (
                                            <button className="neon-button" style={{ marginTop: '20px', width: 'auto', margin: '20px auto' }} onClick={() => setIsAddMaintenanceOpen(true)}>
                                                <Plus size={16} /> إضافة حزمة عمل في هذا القسم
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    tasks.map((task) => (
                                        <MaintenanceTaskCard
                                            key={task.id}
                                            task={task}
                                            onClick={(id: number) => navigate(`/maintenance/work-package/${id}`)}
                                            onDelete={canEdit ? () => handleDeleteTask(task.id) : undefined}
                                        />
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {isAddMaintenanceOpen && (
                        <AddMaintenanceModal
                            onClose={() => setIsAddMaintenanceOpen(false)}
                            onRefresh={() => {
                                if (viewMode === 'tasks' && activeSection) {
                                    fetchTasks(activeSection.title);
                                } else {
                                    fetchTasks(search);
                                }
                            }}
                            initialCategory={viewMode === 'tasks' && activeSection ? activeSection.title : ''}
                            vehicleId={vehicleId}
                        />
                    )}
                </AnimatePresence>
                <AnimatePresence>
                    {isExcelImportOpen && (
                        <ExcelImportModal
                            onClose={() => setIsExcelImportOpen(false)}
                            onRefresh={() => fetchTasks(search)}
                            currentCategory={activeSection?.title}
                        />
                    )}
                </AnimatePresence>
                <AnimatePresence>
                    {isAddSectionOpen && (
                        <AddSectionModal
                            onClose={() => setIsAddSectionOpen(false)}
                            onRefresh={fetchSections}
                            vehicleId={vehicleId}
                        />
                    )}
                </AnimatePresence>
            </div>
        </DashboardLayout>
    );
};

export default MaintenanceExecutionPage;
