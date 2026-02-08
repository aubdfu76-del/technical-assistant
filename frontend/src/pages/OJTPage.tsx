import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    GraduationCap,
    Plus,
    Search,
    Clock,
    Users,
    CheckCircle2,
    Edit2,
    Trash2,
    BookOpen,
    Award,
    User,
    FileText,
    Video,
    PlayCircle,
    X,
    FileQuestion,
    ArrowRight,
    Image as ImageIcon,
    Save,
    ArrowLeft
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { authService } from '../services/auth.service';
import { vehiclesService } from '../services/vehicles.service';
import { uploadService } from '../services/upload.service';
import toast from 'react-hot-toast';

// --- Types ---

interface TrainingProgram {
    id: number;
    title: string;
    description: string;
    category: string;
    duration_hours: number;
    instructor: string;
    status: 'active' | 'completed' | 'pending';
    enrolled_count: number;
    completion_rate: number;
    created_at: string;
    materials: TrainingMaterial[];
    target_vehicles?: string[]; // 'all' or specific vehicle codes like 'm113a3'
}

interface TrainingMaterial {
    id: number;
    type: 'video' | 'document' | 'presentation';
    title: string;
    url: string;
}

interface TestOption {
    id: string;
    text: string;
}

interface TestQuestion {
    id: string;
    text: string;
    image_url?: string;
    options: TestOption[];
    correct_option_id: string;
}

interface TestItem {
    id: number;
    title: string;
    description: string;
    questions_count: number;
    duration_minutes: number;
    passing_score: number;
    status: 'active' | 'draft' | 'closed';
    created_by: string;
    created_at: string;
    assigned_to: string[];
    questions?: TestQuestion[];
    target_vehicles?: string[]; // 'all' or specific vehicle codes like 'm113a3'
}

// --- Icons Helper ---
const getMaterialIcon = (type: string) => {
    switch (type) {
        case 'video': return <Video size={16} />;
        case 'document': return <FileText size={16} />;
        case 'presentation': return <BookOpen size={16} />;
        default: return <FileText size={16} />;
    }
};

const getStatusInfo = (status: string) => {
    switch (status) {
        case 'active': return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', text: 'منشور (مرئي للفنيين)' };
        case 'completed': return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', text: 'مكتمل' };
        case 'pending': return { bg: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', text: 'قيد الانتظار' };
        case 'draft': return { bg: 'rgba(156, 163, 175, 0.1)', color: '#9ca3af', text: 'مسودة (مخفي)' };
        case 'closed': return { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', text: 'مغلق' };
        default: return { bg: 'rgba(156, 163, 175, 0.1)', color: '#9ca3af', text: 'غير معروف' };
    }
};

// --- Modals Components ---

const Modal = ({ isOpen, onClose, title, children, maxWidth = '600px' }: any) => {
    if (!isOpen) return null;
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(5px)', backgroundColor: 'rgba(0,0,0,0.7)'
        }} onClick={onClose}>
            <div
                onClick={(e) => e.stopPropagation()}
                className="glass-card"
                style={{
                    width: '90%', maxWidth: maxWidth, maxHeight: '90vh', overflowY: 'auto',
                    padding: '24px', position: 'relative', border: '1px solid var(--glass-border)',
                    backgroundColor: '#1e1e2e', // A slightly lighter dark background than #111 to standout
                    display: 'flex', flexDirection: 'column',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>{title}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {children}
                </div>
            </div>
        </div>
    );
};

// --- Test Builder Component ---
const TestBuilder = ({ onClose, onSave, initialData, availableVehicles }: { onClose: () => void, onSave: (test: TestItem) => void, initialData?: TestItem | null, availableVehicles: Array<{ code: string, name: string }> }) => {
    const [step, setStep] = useState(1); // 1: Info, 2: Questions
    const [testInfo, setTestInfo] = useState({
        title: initialData?.title || '',
        description: initialData?.description || '',
        duration_minutes: initialData?.duration_minutes || 30,
        passing_score: initialData?.passing_score || 70,
        target_vehicle: initialData?.target_vehicles?.[0] || 'all',
        is_published: initialData?.status === 'active',
        assigned_to: initialData?.assigned_to || ['technician', 'supervisor']
    });
    const [questions, setQuestions] = useState<TestQuestion[]>(initialData?.questions || []);

    // Current Question Editor State
    const [currentQuestion, setCurrentQuestion] = useState<Partial<TestQuestion>>({
        text: '',
        options: [
            { id: '1', text: '' },
            { id: '2', text: '' }
        ],
        correct_option_id: '1'
    });
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleInfoChange = (field: string, value: any) => {
        setTestInfo(prev => ({ ...prev, [field]: value }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
                setCurrentQuestion(prev => ({ ...prev, image_url: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const addOption = () => {
        setCurrentQuestion(prev => ({
            ...prev,
            options: [...(prev.options || []), { id: Date.now().toString(), text: '' }]
        }));
    };

    const updateOption = (id: string, text: string) => {
        setCurrentQuestion(prev => ({
            ...prev,
            options: prev.options?.map(opt => opt.id === id ? { ...opt, text } : opt)
        }));
    };

    const removeOption = (id: string) => {
        if ((currentQuestion.options?.length || 0) <= 2) return; // Minimum 2 options
        setCurrentQuestion(prev => ({
            ...prev,
            options: prev.options?.filter(opt => opt.id !== id)
        }));
    };

    const saveQuestion = () => {
        if (!currentQuestion.text || !currentQuestion.options?.every(o => o.text)) {
            toast.error('يرجى ملء نص السؤال وجميع الخيارات');
            return;
        }

        const newQuestion: TestQuestion = {
            id: Date.now().toString(),
            text: currentQuestion.text!,
            image_url: currentQuestion.image_url,
            options: currentQuestion.options!,
            correct_option_id: currentQuestion.correct_option_id!
        };

        setQuestions([...questions, newQuestion]);
        // Reset editor
        setCurrentQuestion({
            text: '',
            options: [{ id: '1', text: '' }, { id: '2', text: '' }],
            correct_option_id: '1',
            image_url: undefined
        });
        setImagePreview(null);
        toast.success('تم إضافة السؤال');
    };

    const removeQuestion = (id: string) => {
        setQuestions(questions.filter(q => q.id !== id));
    };

    const handleFinalSave = () => {
        if (questions.length === 0) {
            toast.error('يجب إضافة سؤال واحد على الأقل');
            return;
        }

        const newTest: TestItem = {
            id: initialData?.id || Date.now(),
            title: testInfo.title,
            description: testInfo.description,
            duration_minutes: testInfo.duration_minutes,
            passing_score: testInfo.passing_score,
            questions_count: questions.length,
            status: testInfo.is_published ? 'active' : 'draft',
            created_by: initialData?.created_by || 'المستخدم الحالي',
            created_at: initialData?.created_at || new Date().toLocaleDateString('en-CA'),
            assigned_to: testInfo.assigned_to,
            target_vehicles: [testInfo.target_vehicle],
            questions: questions
        };

        onSave(newTest);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '400px' }}>

            {/* Steps Indicator */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <div style={{ flex: 1, height: '4px', background: step === 1 ? 'var(--color-primary)' : 'var(--glass-border)', borderRadius: '2px' }} />
                <div style={{ flex: 1, height: '4px', background: step === 2 ? 'var(--color-primary)' : 'var(--glass-border)', borderRadius: '2px' }} />
            </div>

            {step === 1 ? (
                // --- Step 1: Test Details ---
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>عنوان الاختبار</label>
                        <input
                            type="text"
                            value={testInfo.title}
                            onChange={(e) => handleInfoChange('title', e.target.value)}
                            className="glass-input"
                            style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
                            placeholder="مثال: اختبار صيانة المحركات المستوى الأول"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>الوصف</label>
                        <textarea
                            value={testInfo.description}
                            onChange={(e) => handleInfoChange('description', e.target.value)}
                            className="glass-input"
                            style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', minHeight: '80px' }}
                            placeholder="وصف مختصر لمحتوى الاختبار"
                        />
                    </div>

                    {/* Vehicle Targeting & Publishing */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>تخصيص لعربة</label>
                            <select
                                value={testInfo.target_vehicle}
                                onChange={(e) => handleInfoChange('target_vehicle', e.target.value)}
                                className="glass-input"
                                style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', cursor: 'pointer' }}
                            >
                                <option value="all" style={{ background: '#333' }}>جميع العربات</option>
                                {availableVehicles.map(v => (
                                    <option key={v.code} value={v.code} style={{ background: '#333' }}>{v.name}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ display: 'block', color: 'var(--color-text-muted)' }}>حالة النشر</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '46px', background: 'rgba(255,255,255,0.05)', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                                <input
                                    type="checkbox"
                                    checked={testInfo.is_published}
                                    onChange={(e) => handleInfoChange('is_published', e.target.checked)}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#10b981' }}
                                    id="publish-toggle"
                                />
                                <label htmlFor="publish-toggle" style={{ cursor: 'pointer', flex: 1, fontSize: '0.9rem' }}>
                                    {testInfo.is_published ? 'منشور (يظهر للفنيين)' : 'مسودة (مخفي)'}
                                </label>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ display: 'block', color: 'var(--color-text-muted)' }}>موجه إلى (الأدوار)</label>
                        <div style={{ display: 'flex', gap: '20px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={testInfo.assigned_to.includes('technician')}
                                    onChange={(e) => {
                                        const newAssigned = e.target.checked
                                            ? [...testInfo.assigned_to, 'technician']
                                            : testInfo.assigned_to.filter(r => r !== 'technician');
                                        handleInfoChange('assigned_to', newAssigned);
                                    }}
                                    style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                                />
                                <span style={{ fontSize: '0.9rem' }}>فني</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={testInfo.assigned_to.includes('supervisor')}
                                    onChange={(e) => {
                                        const newAssigned = e.target.checked
                                            ? [...testInfo.assigned_to, 'supervisor']
                                            : testInfo.assigned_to.filter(r => r !== 'supervisor');
                                        handleInfoChange('assigned_to', newAssigned);
                                    }}
                                    style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                                />
                                <span style={{ fontSize: '0.9rem' }}>مشرف</span>
                            </label>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '15px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>المدة (دقيقة)</label>
                            <input
                                type="number"
                                value={testInfo.duration_minutes}
                                onChange={(e) => handleInfoChange('duration_minutes', Number(e.target.value))}
                                className="glass-input"
                                style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>درجة النجاح (%)</label>
                            <input
                                type="number"
                                value={testInfo.passing_score}
                                onChange={(e) => handleInfoChange('passing_score', Number(e.target.value))}
                                className="glass-input"
                                style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
                            />
                        </div>
                    </div>
                </div>
            ) : (
                // --- Step 2: Questions Editor ---
                <div style={{ display: 'flex', gap: '20px', height: '500px' }}>
                    {/* Left: Questions List */}
                    <div style={{ width: '250px', borderLeft: '1px solid var(--glass-border)', paddingLeft: '20px', overflowY: 'auto' }}>
                        <h4 style={{ marginBottom: '15px', color: 'var(--color-text-muted)' }}>الأسئلة ({questions.length})</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {questions.map((q, idx) => (
                                <div key={q.id} style={{
                                    padding: '10px',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '8px',
                                    fontSize: '0.85rem',
                                    position: 'relative',
                                    cursor: 'pointer'
                                }}>
                                    <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>{idx + 1}.</span> {q.text.substring(0, 30)}...
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeQuestion(q.id); }}
                                        style={{ position: 'absolute', left: '5px', top: '5px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            {questions.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>لم يتم إضافة أسئلة بعد</p>}
                        </div>
                    </div>

                    {/* Right: Editor */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>نص السؤال</label>
                            <input
                                type="text"
                                value={currentQuestion.text}
                                onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
                                className="glass-input"
                                style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
                                placeholder="اكتب السؤال هنا..."
                            />
                        </div>

                        {/* Image Upload */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>صورة توضيحية (اختياري)</label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    border: '1px dashed var(--glass-border)',
                                    borderRadius: '8px',
                                    padding: '20px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    background: 'rgba(255,255,255,0.02)',
                                    display: 'flex',
                                    flexDirection: 'column', // Changed to column to stack image and text
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px'
                                }}
                            >
                                {imagePreview ? (
                                    <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                                        <img src={imagePreview} alt="Preview" style={{ maxHeight: '150px', borderRadius: '4px' }} />
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setImagePreview(null); setCurrentQuestion({ ...currentQuestion, image_url: undefined }); }}
                                            style={{ position: 'absolute', top: -10, right: -10, background: '#ef4444', borderRadius: '50%', border: 'none', color: 'white', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <ImageIcon size={24} color="var(--color-text-muted)" />
                                        <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>اضغط لرفع صورة</span>
                                    </>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                />
                            </div>
                        </div>

                        {/* Options */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <label style={{ color: 'var(--color-text-muted)' }}>الخيارات (حدد الإجابة الصحيحة)</label>
                                <button onClick={addOption} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Plus size={14} /> إضافة خيار
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {currentQuestion.options?.map((opt, idx) => (
                                    <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <input
                                            type="radio"
                                            name="correctOption"
                                            checked={currentQuestion.correct_option_id === opt.id}
                                            onChange={() => setCurrentQuestion({ ...currentQuestion, correct_option_id: opt.id })}
                                            style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: '#10b981' }}
                                        />
                                        <input
                                            type="text"
                                            value={opt.text}
                                            onChange={(e) => updateOption(opt.id, e.target.value)}
                                            style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
                                            placeholder={`الخيار ${idx + 1}`}
                                        />
                                        <button
                                            onClick={() => removeOption(opt.id)}
                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: currentQuestion.options!.length > 2 ? 1 : 0.3 }}
                                            disabled={currentQuestion.options!.length <= 2}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={saveQuestion}
                            className="neon-button"
                            style={{ alignSelf: 'flex-end', marginTop: '10px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#10b981' }}
                        >
                            <Plus size={16} /> إضافة السؤال للقائمة
                        </button>
                    </div>
                </div>
            )}

            {/* Actions Footer */}
            <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={onClose}
                        style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                    >
                        إلغاء
                    </button>
                    {step === 2 && (
                        <button
                            onClick={() => setStep(1)}
                            style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <ArrowRight size={16} /> السابق
                        </button>
                    )}
                </div>

                {step === 1 ? (
                    <button
                        onClick={() => {
                            if (!testInfo.title) { toast.error('يرجى كتابة عنوان الاختبار'); return; }
                            setStep(2);
                        }}
                        className="neon-button"
                        style={{ marginLeft: 'auto', width: 'auto', padding: '10px 30px' }}
                    >
                        التالي <ArrowLeft size={16} />
                    </button>
                ) : (
                    <button
                        onClick={handleFinalSave}
                        className="neon-button"
                        style={{ width: 'auto', padding: '10px 30px', background: 'var(--color-primary)' }}
                    >
                        <Save size={16} /> حفظ الاختبار
                    </button>
                )}
            </div>
        </div>
    );
};

// --- Program Builder Component ---
const ProgramBuilder = ({ onClose, onSave, initialData, availableVehicles }: {
    onClose: () => void,
    onSave: (program: TrainingProgram) => void,
    initialData?: TrainingProgram | null,
    availableVehicles: Array<{ code: string, name: string }>
}) => {
    const user = authService.getCurrentUser();
    const [programInfo, setProgramInfo] = useState({
        title: initialData?.title || '',
        description: initialData?.description || '',
        category: initialData?.category || 'صيانة المحركات',
        duration_hours: initialData?.duration_hours || 24,
        instructor: initialData?.instructor || user?.full_name || '',
        status: initialData?.status || 'active' as 'active' | 'completed' | 'pending'
    });

    const [materials, setMaterials] = useState<TrainingMaterial[]>(initialData?.materials || []);
    const [currentMaterial, setCurrentMaterial] = useState<Partial<TrainingMaterial>>({
        type: 'video',
        title: '',
        url: ''
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Target vehicles state
    const [targetVehicles, setTargetVehicles] = useState<string[]>(initialData?.target_vehicles || ['all']);

    const handleInfoChange = (field: string, value: any) => {
        setProgramInfo(prev => ({ ...prev, [field]: value }));
    };

    const handleVehicleToggle = (vehicle: string) => {
        if (vehicle === 'all') {
            // اختيار "جميع العربات" - إلغاء جميع الاختيارات الأخرى
            setTargetVehicles(['all']);
        } else {
            // اختيار عربة محددة
            setTargetVehicles(prev => {
                // إزالة "all" من القائمة
                const withoutAll = prev.filter(v => v !== 'all');

                // التحقق إذا كانت العربة محددة مسبقاً
                if (withoutAll.includes(vehicle)) {
                    // إلغاء تحديد العربة
                    const newList = withoutAll.filter(v => v !== vehicle);
                    // إذا لم يبق أي عربة محددة، العودة إلى "all"
                    return newList.length === 0 ? ['all'] : newList;
                } else {
                    // إضافة العربة إلى القائمة
                    return [...withoutAll, vehicle];
                }
            });
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);

            // Auto-fill title if empty
            if (!currentMaterial.title) {
                const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
                setCurrentMaterial(prev => ({ ...prev, title: fileName }));
            }

            // Upload file to server
            try {
                setIsUploading(true);
                toast.loading('جاري رفع الملف...', { id: 'upload' });
                const response = await uploadService.uploadFile(file);

                console.log('Upload response:', response);

                // Backend returns: { success: true, data: { url: '...', filename: '...', type: '...' } }
                const serverUrl = response.data?.url || response.url || response.fileUrl || response.path;
                console.log('Server URL:', serverUrl);

                if (!serverUrl) {
                    throw new Error('لم يتم الحصول على رابط الملف من السيرفر');
                }

                setCurrentMaterial(prev => ({ ...prev, url: serverUrl }));

                toast.success('تم رفع الملف بنجاح', { id: 'upload' });
                setIsUploading(false);
            } catch (error: any) {
                console.error('File upload error:', error);
                const errorMessage = error.response?.data?.message || error.message || 'فشل رفع الملف. حاول مرة أخرى';
                toast.error(errorMessage, { id: 'upload' });
                setSelectedFile(null);
                setIsUploading(false);
                if (e.target) {
                    e.target.value = '';
                }
            }
        }
    };

    const addMaterial = () => {
        console.log('Adding material:', currentMaterial);
        console.log('Selected file:', selectedFile);

        if (!currentMaterial.title) {
            toast.error('يرجى ملء عنوان المادة');
            return;
        }

        if (!currentMaterial.url) {
            toast.error('يرجى الانتظار حتى يتم رفع الملف، أو اختر ملفاً جديداً');
            return;
        }

        const newMaterial: TrainingMaterial = {
            id: Date.now(),
            type: currentMaterial.type as 'video' | 'document' | 'presentation',
            title: currentMaterial.title!,
            url: currentMaterial.url!
        };

        setMaterials([...materials, newMaterial]);
        setCurrentMaterial({ type: 'video', title: '', url: '' });
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        toast.success('تم إضافة المادة التدريبية');
    };

    const removeMaterial = (id: number) => {
        setMaterials(materials.filter(m => m.id !== id));
    };

    const handleFinalSave = () => {
        if (!programInfo.title || !programInfo.instructor) {
            toast.error('يرجى ملء العنوان واسم المدرب');
            return;
        }

        const newProgram: TrainingProgram = {
            id: initialData?.id || Date.now(),
            title: programInfo.title,
            description: programInfo.description,
            category: programInfo.category,
            duration_hours: programInfo.duration_hours,
            instructor: programInfo.instructor,
            status: programInfo.status,
            enrolled_count: initialData?.enrolled_count || 0,
            completion_rate: initialData?.completion_rate || 0,
            created_at: initialData?.created_at || new Date().toLocaleDateString('en-CA'),
            materials: materials,
            target_vehicles: targetVehicles
        };

        onSave(newProgram);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '400px' }}>
            {/* Program Details Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>عنوان البرنامج</label>
                    <input
                        type="text"
                        value={programInfo.title}
                        onChange={(e) => handleInfoChange('title', e.target.value)}
                        className="glass-input"
                        style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
                        placeholder="مثال: صيانة المحركات الديزل"
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>الوصف</label>
                    <textarea
                        value={programInfo.description}
                        onChange={(e) => handleInfoChange('description', e.target.value)}
                        className="glass-input"
                        style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', minHeight: '100px' }}
                        placeholder="وصف شامل للبرنامج التدريبي ومحتوياته"
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>الفئة</label>
                        <select
                            value={programInfo.category}
                            onChange={(e) => handleInfoChange('category', e.target.value)}
                            className="glass-input"
                            style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', cursor: 'pointer' }}
                        >
                            <option value="صيانة المحركات" style={{ background: '#333' }}>صيانة المحركات</option>
                            <option value="أنظمة السلامة" style={{ background: '#333' }}>أنظمة السلامة</option>
                            <option value="الكهرباء" style={{ background: '#333' }}>الكهرباء</option>
                            <option value="الهيدروليك" style={{ background: '#333' }}>الهيدروليك</option>
                            <option value="التشخيص" style={{ background: '#333' }}>التشخيص</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>المدة (ساعة)</label>
                        <input
                            type="number"
                            value={programInfo.duration_hours}
                            onChange={(e) => handleInfoChange('duration_hours', Number(e.target.value))}
                            className="glass-input"
                            style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
                            min="1"
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>اسم المدرب</label>
                        <input
                            type="text"
                            value={programInfo.instructor}
                            onChange={(e) => handleInfoChange('instructor', e.target.value)}
                            className="glass-input"
                            style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
                            placeholder="م. أحمد محمد"
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>الحالة</label>
                        <select
                            value={programInfo.status}
                            onChange={(e) => handleInfoChange('status', e.target.value)}
                            className="glass-input"
                            style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', cursor: 'pointer' }}
                        >
                            <option value="active" style={{ background: '#333' }}>نشط</option>
                            <option value="pending" style={{ background: '#333' }}>قيد الانتظار</option>
                            <option value="completed" style={{ background: '#333' }}>مكتمل</option>
                        </select>
                    </div>
                </div>

                {/* Vehicle Selection */}
                <div>
                    <label style={{ display: 'block', marginBottom: '12px', color: 'var(--color-text-muted)' }}>تخصيص البرنامج للعربات</label>
                    <div style={{
                        padding: '15px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '12px',
                        border: '1px solid var(--glass-border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                    }}>
                        {/* All Vehicles Option */}
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '8px',
                            background: targetVehicles.includes('all') ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                            border: targetVehicles.includes('all') ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid transparent',
                            transition: 'all 0.3s ease'
                        }}>
                            <input
                                type="checkbox"
                                checked={targetVehicles.includes('all')}
                                onChange={() => handleVehicleToggle('all')}
                                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#d4af37' }}
                            />
                            <span style={{ fontSize: '0.95rem', fontWeight: targetVehicles.includes('all') ? 600 : 400 }}>جميع العربات</span>
                        </label>

                        {/* Specific Vehicles */}
                        <div style={{ paddingRight: '10px', borderRight: '2px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {availableVehicles.map(vehicle => (
                                <label key={vehicle.code} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    cursor: 'pointer',
                                    padding: '6px',
                                    borderRadius: '6px',
                                    background: targetVehicles.includes(vehicle.code) ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={targetVehicles.includes(vehicle.code)}
                                        onChange={() => handleVehicleToggle(vehicle.code)}
                                        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#10b981' }}
                                    />
                                    <span style={{ fontSize: '0.9rem' }}>{vehicle.name}</span>
                                </label>
                            ))}
                        </div>

                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '5px' }}>
                            {targetVehicles.includes('all')
                                ? '✓ البرنامج متاح لجميع العربات'
                                : `✓ البرنامج مخصص لـ ${targetVehicles.length} عربة`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Training Materials Section */}
            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
                <h4 style={{ marginBottom: '15px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookOpen size={20} />
                    المواد التدريبية ({materials.length})
                </h4>

                {/* Materials List */}
                {materials.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                        {materials.map((material) => (
                            <div key={material.id} style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                padding: '12px', background: 'rgba(255,255,255,0.03)',
                                border: '1px solid var(--glass-border)', borderRadius: '8px'
                            }}>
                                {getMaterialIcon(material.type)}
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>{material.title}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{material.url}</p>
                                </div>
                                <button
                                    onClick={() => removeMaterial(material.id)}
                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add Material Form */}
                <div style={{ padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                    <p style={{ fontSize: '0.9rem', marginBottom: '12px', color: 'var(--color-text-muted)' }}>إضافة مادة تدريبية جديدة</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <select
                            value={currentMaterial.type}
                            onChange={(e) => setCurrentMaterial({ ...currentMaterial, type: e.target.value as any })}
                            style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', cursor: 'pointer' }}
                        >
                            <option value="video" style={{ background: '#333' }}>📹 فيديو</option>
                            <option value="document" style={{ background: '#333' }}>📄 مستند</option>
                            <option value="presentation" style={{ background: '#333' }}>📊 عرض تقديمي</option>
                        </select>
                        <input
                            type="text"
                            value={currentMaterial.title}
                            onChange={(e) => setCurrentMaterial({ ...currentMaterial, title: e.target.value })}
                            placeholder="عنوان المادة"
                            style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
                        />

                        {/* File Upload Button */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept={currentMaterial.type === 'video' ? 'video/*' : currentMaterial.type === 'document' ? '.pdf,.doc,.docx' : '.ppt,.pptx'}
                            onChange={handleFileSelect}
                        />
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                padding: '12px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px dashed var(--glass-border)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <FileText size={20} color="var(--color-primary)" />
                            <div style={{ flex: 1 }}>
                                {selectedFile ? (
                                    <>
                                        <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#10b981' }}>✓ تم اختيار الملف</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{selectedFile.name}</p>
                                    </>
                                ) : (
                                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>اضغط لاختيار الملف من جهازك</p>
                                )}
                            </div>
                            {selectedFile && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedFile(null);
                                        setCurrentMaterial({ ...currentMaterial, url: '' });
                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                    }}
                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        <button
                            onClick={addMaterial}
                            disabled={isUploading}
                            className="neon-button"
                            style={{
                                background: isUploading ? 'rgba(100, 100, 100, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                border: `1px solid ${isUploading ? 'rgba(100, 100, 100, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                                color: isUploading ? '#888' : '#10b981',
                                cursor: isUploading ? 'not-allowed' : 'pointer',
                                opacity: isUploading ? 0.6 : 1
                            }}
                        >
                            <Plus size={16} /> {isUploading ? 'جاري الرفع...' : 'إضافة المادة'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Actions Footer */}
            <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                    onClick={onClose}
                    style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', cursor: 'pointer' }}
                >
                    إلغاء
                </button>
                <button
                    onClick={handleFinalSave}
                    className="neon-button"
                    style={{ padding: '10px 30px', background: 'var(--color-primary)' }}
                >
                    <Save size={16} /> حفظ البرنامج
                </button>
            </div>
        </div>
    );
};

const ProgramDetailsModal = ({ program, onClose, onMaterialClick }: { program: TrainingProgram; onClose: () => void; onMaterialClick: (m: TrainingMaterial) => void }) => {
    return (
        <Modal isOpen={!!program} onClose={onClose} title={program.title}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '8px', fontSize: '0.9rem' }}>الوصف</p>
                    <p style={{ lineHeight: '1.6' }}>{program.description}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div style={{ padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>المدرب</p>
                        <p style={{ fontWeight: 600 }}>{program.instructor}</p>
                    </div>
                    <div style={{ padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>المدة</p>
                        <p style={{ fontWeight: 600 }}>{program.duration_hours} ساعة</p>
                    </div>
                    <div style={{ padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>الفئة</p>
                        <p style={{ fontWeight: 600 }}>{program.category}</p>
                    </div>
                    <div style={{ padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>تاريخ الإنشاء</p>
                        <p style={{ fontWeight: 600 }}>{program.created_at}</p>
                    </div>
                </div>

                <div>
                    <h4 style={{ marginBottom: '10px', fontSize: '1rem' }}>المواد التدريبية</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {program.materials.map((material) => (
                            <div
                                key={material.id}
                                onClick={() => onMaterialClick(material)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '12px', background: 'rgba(59, 130, 246, 0.05)',
                                    border: '1px solid rgba(59, 130, 246, 0.1)', borderRadius: '8px',
                                    cursor: 'pointer'
                                }}>
                                {getMaterialIcon(material.type)}
                                <span style={{ flex: 1, fontSize: '0.9rem' }}>{material.title}</span>
                                <PlayCircle size={16} color="var(--color-primary)" />
                            </div>
                        ))}
                    </div>
                </div>

                <button className="neon-button" style={{ marginTop: '10px' }} onClick={onClose}>
                    إغلاق
                </button>
            </div>
        </Modal>
    );
};

const OJTPage = () => {
    // --- State ---
    const [activeTab, setActiveTab] = useState<'programs' | 'tests'>('programs');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');

    // Modals State
    const [showAddProgramModal, setShowAddProgramModal] = useState(false);
    const [showAddTestModal, setShowAddTestModal] = useState(false);
    const [selectedProgram, setSelectedProgram] = useState<TrainingProgram | null>(null);
    const [editingProgram, setEditingProgram] = useState<TrainingProgram | null>(null);
    const [editingTest, setEditingTest] = useState<TestItem | null>(null);
    const [viewingMaterial, setViewingMaterial] = useState<TrainingMaterial | null>(null);
    const [activeTest, setActiveTest] = useState<TestItem | null>(null);

    // Vehicles State
    const [availableVehicles, setAvailableVehicles] = useState<Array<{ code: string, name: string }>>([]);

    // Fetch available vehicles on mount
    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                console.log('🚗 Fetching vehicles from API...');
                const response = await vehiclesService.getAll();
                console.log('📦 Full API Response:', response);

                // Check if response is successful
                if (!response || response.error || !response.success) {
                    throw new Error(response?.error || 'Failed to fetch vehicles');
                }

                const vehicles = response.vehicles || response.data?.vehicles || response.data || [];
                console.log('🚙 Vehicles array:', vehicles);

                if (!Array.isArray(vehicles)) {
                    console.error('❌ Vehicles is not an array:', vehicles);
                    throw new Error('Invalid vehicles data format');
                }

                if (vehicles.length === 0) {
                    console.warn('⚠️ No vehicles found in database');
                    setAvailableVehicles([]);
                    return;
                }

                const vehicleList = vehicles.map((v: any) => ({
                    code: v.vehicle_type?.toLowerCase() || `vehicle_${v.id}`,
                    name: v.vehicle_type || v.equipment_name || v.name || `عربة ${v.id}`
                }));
                console.log('✅ Processed vehicle list:', vehicleList);
                setAvailableVehicles(vehicleList);
            } catch (error: any) {
                console.error('❌ Failed to fetch vehicles:', error);
                console.error('❌ Error details:', error.response?.data || error.message);
                // Fallback to default vehicles if fetch fails
                console.warn('⚠️ Using fallback vehicles');
                setAvailableVehicles([
                    { code: 'm113a3', name: 'M113A3' },
                    { code: 'm88a1', name: 'M88A1' },
                    { code: 'm109', name: 'M109' }
                ]);
            }
        };
        fetchVehicles();
    }, []);

    // Data Mock - Default Programs
    const defaultPrograms: TrainingProgram[] = [
        {
            id: 1,
            title: 'صيانة المحركات الديزل',
            description: 'برنامج تدريبي شامل لصيانة وإصلاح محركات الديزل للمركبات الثقيلة، يغطي فك وتركيب الأجزاء الرئيسية وتشخيص الأعطال الشائعة.',
            category: 'صيانة المحركات',
            duration_hours: 40,
            instructor: 'م. أحمد محمد',
            status: 'active',
            enrolled_count: 12,
            completion_rate: 75,
            created_at: '2026-01-15',
            materials: [
                { id: 1, type: 'video', title: 'مقدمة في محركات الديزل', url: '#' },
                { id: 2, type: 'document', title: 'دليل الصيانة الوقائية', url: '#' }
            ]
        },
        {
            id: 2,
            title: 'أنظمة الفرامل الهيدروليكية',
            description: 'تدريب متقدم على فحص وصيانة أنظمة الفرامل الهيدروليكية، يشمل تغيير الزيوت وفحص التسريبات وتغيير الأقمشة.',
            category: 'أنظمة السلامة',
            duration_hours: 24,
            instructor: 'م. خالد علي',
            status: 'active',
            enrolled_count: 8,
            completion_rate: 90,
            created_at: '2026-01-20',
            materials: [
                { id: 3, type: 'presentation', title: 'مكونات نظام الفرامل', url: '#' }
            ]
        },
        {
            id: 3,
            title: 'الأنظمة الكهربائية للمركبات',
            description: 'دورة تدريبية في تشخيص وإصلاح الأعطال الكهربائية، قراءة المدوّنات، واستخدام أجهزة القياس.',
            category: 'الكهرباء',
            duration_hours: 32,
            instructor: 'م. سعد الدين',
            status: 'pending',
            enrolled_count: 5,
            completion_rate: 0,
            created_at: '2026-02-01',
            materials: []
        }
    ];

    // Programs State with localStorage
    const [programs, setPrograms] = useState<TrainingProgram[]>(() => {
        const saved = localStorage.getItem('ojt_programs');
        return saved ? JSON.parse(saved) : defaultPrograms;
    });

    // Save programs to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('ojt_programs', JSON.stringify(programs));
    }, [programs]);

    // Data Mock
    const defaultTests: TestItem[] = [
        {
            id: 1,
            title: 'اختبار أساسيات أنظمة التعليق',
            description: 'اختبار نظري يغطي المبادئ الأساسية لأنظمة التعليق والمساعدات.',
            questions_count: 20,
            duration_minutes: 45,
            passing_score: 70,
            status: 'active',
            created_by: 'م. أحمد محمد',
            created_at: '2026-01-25',
            assigned_to: ['technician'],
            target_vehicles: ['all']
        },
        {
            id: 2,
            title: 'اختبار السلامة المهنية',
            description: 'اختبار إلزامي لجميع الفنيين حول إجراءات السلامة داخل الورشة.',
            questions_count: 15,
            duration_minutes: 30,
            passing_score: 80,
            status: 'active',
            created_by: 'الإدارة',
            created_at: '2026-01-10',
            assigned_to: ['technician', 'supervisor'],
            target_vehicles: ['all']
        },
        {
            id: 3,
            title: 'تشخيص أعطال المحركات المتقدم',
            description: 'اختبار للمستوى المتقدم لتشخيص مشاكل الحقن والاحتراق.',
            questions_count: 25,
            duration_minutes: 60,
            passing_score: 75,
            status: 'draft',
            created_by: 'م. خالد علي',
            created_at: '2026-02-01',
            assigned_to: ['technician'],
            target_vehicles: ['all']
        },
        {
            id: 4,
            title: '🎯 اختبار تجريبي - صيانة M113A3',
            description: 'اختبار تجريبي منشور لاختبار النظام. يغطي أساسيات صيانة عربة M113A3 بما في ذلك المحرك والنقل والتعليق.',
            questions_count: 10,
            duration_minutes: 20,
            passing_score: 60,
            status: 'active',
            created_by: 'النظام',
            created_at: '2026-02-03',
            assigned_to: ['technician', 'supervisor'],
            target_vehicles: ['all'],
            questions: [
                {
                    id: 'q1',
                    text: 'ما هو نوع المحرك المستخدم في عربة M113A3؟',
                    options: [
                        { id: 'a', text: 'محرك ديزل 6 أسطوانات' },
                        { id: 'b', text: 'محرك بنزين 8 أسطوانات' },
                        { id: 'c', text: 'محرك ديزل 4 أسطوانات' },
                        { id: 'd', text: 'محرك كهربائي' }
                    ],
                    correct_option_id: 'a'
                },
                {
                    id: 'q2',
                    text: 'كم عدد العجلات في نظام الجنزير لعربة M113A3؟',
                    options: [
                        { id: 'a', text: '4 عجلات' },
                        { id: 'b', text: '6 عجلات' },
                        { id: 'c', text: '8 عجلات' },
                        { id: 'd', text: '10 عجلات' }
                    ],
                    correct_option_id: 'b'
                },
                {
                    id: 'q3',
                    text: 'ما هي السعة التقريبية لخزان الوقود في M113A3؟',
                    options: [
                        { id: 'a', text: '95 لتر' },
                        { id: 'b', text: '150 لتر' },
                        { id: 'c', text: '360 لتر' },
                        { id: 'd', text: '500 لتر' }
                    ],
                    correct_option_id: 'c'
                },
                {
                    id: 'q4',
                    text: 'ما هو الفاصل الزمني الموصى به لتغيير زيت المحرك؟',
                    options: [
                        { id: 'a', text: 'كل 50 ساعة تشغيل' },
                        { id: 'b', text: 'كل 100 ساعة تشغيل' },
                        { id: 'c', text: 'كل 250 ساعة تشغيل' },
                        { id: 'd', text: 'كل 500 ساعة تشغيل' }
                    ],
                    correct_option_id: 'c'
                },
                {
                    id: 'q5',
                    text: 'أي من التالي يعتبر من إجراءات السلامة الأساسية قبل بدء الصيانة؟',
                    options: [
                        { id: 'a', text: 'فصل البطارية' },
                        { id: 'b', text: 'تشغيل المحرك' },
                        { id: 'c', text: 'رفع الضغط الهيدروليكي' },
                        { id: 'd', text: 'فتح جميع الأبواب' }
                    ],
                    correct_option_id: 'a'
                },
                {
                    id: 'q6',
                    text: 'ما هو نوع نظام التبريد المستخدم في M113A3؟',
                    options: [
                        { id: 'a', text: 'تبريد بالهواء' },
                        { id: 'b', text: 'تبريد بالماء' },
                        { id: 'c', text: 'تبريد بالزيت' },
                        { id: 'd', text: 'لا يوجد نظام تبريد' }
                    ],
                    correct_option_id: 'b'
                },
                {
                    id: 'q7',
                    text: 'كم عدد أفراد الطاقم الذي يمكن أن تحمله M113A3؟',
                    options: [
                        { id: 'a', text: '6 أفراد' },
                        { id: 'b', text: '8 أفراد' },
                        { id: 'c', text: '11 فرد' },
                        { id: 'd', text: '15 فرد' }
                    ],
                    correct_option_id: 'c'
                },
                {
                    id: 'q8',
                    text: 'ما هي أهمية فحص شد الجنزير بشكل دوري؟',
                    options: [
                        { id: 'a', text: 'لتحسين استهلاك الوقود فقط' },
                        { id: 'b', text: 'لمنع انزلاق الجنزير وتلف المكونات' },
                        { id: 'c', text: 'لزيادة السرعة القصوى' },
                        { id: 'd', text: 'لتقليل الضوضاء' }
                    ],
                    correct_option_id: 'b'
                },
                {
                    id: 'q9',
                    text: 'أي من الأدوات التالية ضرورية لفحص ضغط الزيت؟',
                    options: [
                        { id: 'a', text: 'مفتاح عزم' },
                        { id: 'b', text: 'مقياس ضغط (Pressure Gauge)' },
                        { id: 'c', text: 'ملتيميتر' },
                        { id: 'd', text: 'ميزان حرارة' }
                    ],
                    correct_option_id: 'b'
                },
                {
                    id: 'q10',
                    text: 'ما هو الإجراء الصحيح عند اكتشاف تسرب في نظام الوقود؟',
                    options: [
                        { id: 'a', text: 'تجاهله إذا كان بسيطاً' },
                        { id: 'b', text: 'إيقاف التشغيل فوراً وإصلاح التسرب' },
                        { id: 'c', text: 'الاستمرار في التشغيل حتى نفاد الوقود' },
                        { id: 'd', text: 'زيادة سرعة المحرك' }
                    ],
                    correct_option_id: 'b'
                }
            ]
        }
    ];

    const [tests, setTests] = useState<TestItem[]>(() => {
        const saved = localStorage.getItem('ojt_tests');
        return saved ? JSON.parse(saved) : defaultTests;
    });

    // Save tests to local storage whenever they change
    useEffect(() => {
        localStorage.setItem('ojt_tests', JSON.stringify(tests));
    }, [tests]);

    const user = authService.getCurrentUser();
    // Only Admin and Trainer can manage training programs and tests
    // Supervisor can only manage users
    const isAdmin = user?.role === 'admin' || user?.role === 'trainer';


    // Categories
    const categories = ['all', 'صيانة المحركات', 'أنظمة السلامة', 'الكهرباء', 'الهيدروليك', 'التشخيص'];

    // Filtering Logic
    // Retrieve vehicle from context using authService
    const selectedEquipmentObj = authService.getSelectedEquipment();
    const selectedVehicleType = selectedEquipmentObj?.vehicle_type?.toLowerCase() || 'all';

    // Filter programs based on search, category, and vehicle
    const filteredPrograms = programs.filter(program => {
        const matchesSearch = program.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            program.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === 'all' || program.category === filterCategory;

        // Vehicle filtering
        const programVehicles = program.target_vehicles || ['all'];
        const matchAll = programVehicles.includes('all');
        const matchSpecific = selectedVehicleType !== 'all' && programVehicles.map(v => v.toLowerCase()).includes(selectedVehicleType);
        const matchesVehicle = matchAll || matchSpecific;

        return matchesSearch && matchesCategory && matchesVehicle;
    });

    const filteredTests = tests.filter(test => {
        const matchesSearch = test.title.toLowerCase().includes(searchQuery.toLowerCase());

        // Vehicle Check (Apply to everyone including Admin)
        const testVehicles = test.target_vehicles || ['all'];
        const matchAll = testVehicles.includes('all');
        const matchSpecific = selectedVehicleType !== 'all' && testVehicles.map(v => v.toLowerCase()).includes(selectedVehicleType);
        const matchesVehicle = selectedVehicleType === 'all' || matchAll || matchSpecific;

        if (isAdmin) {
            return matchesSearch && matchesVehicle;
        } else {
            // For technicians: only active tests AND assigned to their role AND matches vehicle
            const matchesStatus = test.status === 'active';
            const isAssigned = (test.assigned_to || []).includes(user?.role || 'technician') || user?.role === 'supervisor';

            // Vehicle check is now applied via matchesVehicle

            // Debug logging
            console.log('Test Filter Debug:', {
                testTitle: test.title,
                testStatus: test.status,
                matchesStatus,
                isAssigned,
                userRole: user?.role,
                testVehicles,
                selectedVehicleType,
                matchAll,
                matchSpecific,
                finalResult: matchesSearch && matchesStatus && isAssigned && matchesVehicle
            });

            return matchesSearch && matchesStatus && isAssigned && matchesVehicle;
        }
    });

    // Stats
    const stats = {
        programs: {
            total: programs.length,
            active: programs.filter(p => p.status === 'active').length,
            enrolled: programs.reduce((sum, p) => sum + p.enrolled_count, 0)
        },
        tests: {
            total: tests.length,
            active: tests.filter(t => t.status === 'active').length,
            myAssigned: tests.length // Mocked for now
        }
    };

    // --- Handlers ---
    const handleDeleteProgram = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('هل أنت متأكد من حذف هذا البرنامج؟')) {
            setPrograms(prev => prev.filter(p => p.id !== id));
            toast.success('تم حذف البرنامج بنجاح');
        }
    };

    const handleEditProgram = (program: TrainingProgram, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingProgram(program);
        setShowAddProgramModal(true);
    };

    const handleDeleteTest = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('هل أنت متأكد من حذف هذا الاختبار؟')) {
            setTests(prev => prev.filter(t => t.id !== id));
            toast.success('تم حذف الاختبار بنجاح');
        }
    };

    const handleSaveNewTest = (savedTest: TestItem) => {
        setTests(prev => {
            const exists = prev.some(t => t.id === savedTest.id);
            if (exists) {
                return prev.map(t => t.id === savedTest.id ? savedTest : t);
            }
            return [savedTest, ...prev];
        });
        setShowAddTestModal(false);
        setEditingTest(null);
        toast.success(editingTest ? 'تم تحديث الاختبار بنجاح' : 'تم إنشاء الاختبار بنجاح');
    };

    const handleSaveNewProgram = (savedProgram: TrainingProgram) => {
        setPrograms(prev => {
            const exists = prev.some(p => p.id === savedProgram.id);
            if (exists) {
                return prev.map(p => p.id === savedProgram.id ? savedProgram : p);
            }
            return [savedProgram, ...prev];
        });
        setShowAddProgramModal(false);
        toast.success('تم حفظ البرنامج التدريبي بنجاح');
    };

    // --- Render ---
    return (
        <DashboardLayout>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* Header & Tabs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                            <h2 style={{ fontSize: '2rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <GraduationCap size={32} color="var(--color-primary)" />
                                التدريب والاختبارات
                            </h2>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                                منصة التعليم المستمر وتقييم الأداء للفنيين
                            </p>
                        </div>
                        {isAdmin && (
                            <button
                                onClick={() => {
                                    if (activeTab === 'programs') {
                                        setShowAddProgramModal(true);
                                    } else {
                                        setEditingTest(null);
                                        setShowAddTestModal(true);
                                    }
                                }}
                                className="neon-button"
                                style={{ height: '45px', fontSize: '0.95rem' }}
                            >
                                <Plus size={20} />
                                {activeTab === 'programs' ? 'إضافة برنامج تدريبي' : 'إنشاء اختبار جديد'}
                            </button>
                        )}
                    </div>

                    {/* Tabs Switcher */}
                    <div style={{
                        display: 'flex',
                        gap: '10px',
                        padding: '6px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '16px',
                        width: 'fit-content',
                        border: '1px solid var(--glass-border)'
                    }}>
                        <button
                            onClick={() => setActiveTab('programs')}
                            style={{
                                padding: '10px 24px',
                                borderRadius: '12px',
                                background: activeTab === 'programs' ? 'var(--color-primary)' : 'transparent',
                                color: activeTab === 'programs' ? 'white' : 'var(--color-text-muted)',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <BookOpen size={18} />
                            البرامج التدريبية
                        </button>
                        <button
                            onClick={() => setActiveTab('tests')}
                            style={{
                                padding: '10px 24px',
                                borderRadius: '12px',
                                background: activeTab === 'tests' ? 'var(--color-primary)' : 'transparent',
                                color: activeTab === 'tests' ? 'white' : 'var(--color-text-muted)',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <FileQuestion size={18} />
                            اختباراتي
                        </button>
                    </div>
                </div>

                {/* Stats Section (Changes based on tab) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                    {activeTab === 'programs' ? (
                        <>
                            <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                                    <BookOpen size={24} />
                                </div>
                                <div>
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>إجمالي البرامج</p>
                                    <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.programs.total}</p>
                                </div>
                            </div>
                            <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                                    <CheckCircle2 size={24} />
                                </div>
                                <div>
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>البرامج النشطة</p>
                                    <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.programs.active}</p>
                                </div>
                            </div>
                            <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                                    <Users size={24} />
                                </div>
                                <div>
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>المتدربين</p>
                                    <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.programs.enrolled}</p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                                    <FileQuestion size={24} />
                                </div>
                                <div>
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>إجمالي الاختبارات</p>
                                    <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.tests.total}</p>
                                </div>
                            </div>
                            <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                                    <CheckCircle2 size={24} />
                                </div>
                                <div>
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>اختبارات مفتوحة</p>
                                    <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.tests.active}</p>
                                </div>
                            </div>
                            <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24' }}>
                                    <Award size={24} />
                                </div>
                                <div>
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>متوسط الدرجات</p>
                                    <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>--</p>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Search Bar */}
                <div style={{ position: 'relative' }}>
                    <Search size={20} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input
                        type="text"
                        placeholder={activeTab === 'programs' ? "البحث في البرامج التدريبية..." : "البحث في الاختبارات..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="glass-input"
                        style={{
                            width: '100%',
                            padding: '16px 50px 16px 16px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '16px',
                            fontSize: '1rem',
                            color: 'white'
                        }}
                    />
                </div>

                {/* Content Logic */}
                <AnimatePresence mode="wait">
                    {activeTab === 'programs' ? (
                        <motion.div
                            key="programs-grid"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}
                        >
                            {/* Filter Buttons for Programs */}
                            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setFilterCategory(cat)}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '20px',
                                            background: filterCategory === cat ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                                            color: filterCategory === cat ? 'white' : 'var(--color-text-muted)',
                                            border: `1px solid ${filterCategory === cat ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)'}`,
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {cat === 'all' ? 'الكل' : cat}
                                    </button>
                                ))}
                            </div>

                            {filteredPrograms.length > 0 ? (
                                filteredPrograms.map((program) => {
                                    const statusInfo = getStatusInfo(program.status);
                                    return (
                                        <div key={program.id} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div style={{ padding: '6px 12px', background: statusInfo.bg, color: statusInfo.color, borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }}>
                                                    {statusInfo.text}
                                                </div>
                                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 10px', borderRadius: '8px', fontSize: '0.75rem' }}>
                                                    {program.category}
                                                </div>
                                            </div>

                                            <div>
                                                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>{program.title}</h3>
                                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: '1.5', height: '40px', overflow: 'hidden' }}>{program.description}</p>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                                    <Clock size={14} />
                                                    {program.duration_hours} ساعة
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                                    <Users size={14} />
                                                    {program.enrolled_count} متدرب
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                                    <User size={14} />
                                                    {program.instructor}
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '10px' }}>
                                                <button
                                                    onClick={() => setSelectedProgram(program)}
                                                    className="neon-button"
                                                    style={{ flex: 1, height: '36px', fontSize: '0.9rem' }}
                                                >
                                                    <PlayCircle size={16} />
                                                    عرض التفاصيل
                                                </button>
                                                {isAdmin && (
                                                    <>
                                                        <button
                                                            onClick={(e) => handleEditProgram(program, e)}
                                                            style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '8px', color: '#3b82f6', cursor: 'pointer' }}
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleDeleteProgram(program.id, e)}
                                                            style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer' }}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                                    لا توجد برامج تطابق البحث
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="tests-grid"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}
                        >
                            {filteredTests.length > 0 ? (
                                filteredTests.map((test) => {
                                    const statusInfo = getStatusInfo(test.status);
                                    return (
                                        <div key={test.id} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', overflow: 'hidden' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div style={{ padding: '6px 12px', background: statusInfo.bg, color: statusInfo.color, borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }}>
                                                    {statusInfo.text}
                                                </div>
                                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 10px', borderRadius: '8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Clock size={12} />
                                                    {test.duration_minutes} دقيقة
                                                </div>
                                            </div>

                                            <div>
                                                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>{test.title}</h3>
                                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: '1.5' }}>{test.description}</p>
                                            </div>

                                            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between' }}>
                                                <div style={{ textAlign: 'center' }}>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>عدد الأسئلة</p>
                                                    <p style={{ fontWeight: 700 }}>{test.questions_count}</p>
                                                </div>
                                                <div style={{ textAlign: 'center' }}>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>درجة النجاح</p>
                                                    <p style={{ fontWeight: 700, color: '#10b981' }}>{test.passing_score}%</p>
                                                </div>
                                            </div>

                                            {/* Action Buttons for Tests */}
                                            <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '10px' }}>
                                                {isAdmin ? (
                                                    <button
                                                        onClick={() => {
                                                            setEditingTest(test);
                                                            setShowAddTestModal(true);
                                                        }}
                                                        className="neon-button"
                                                        style={{ flex: 1, height: '36px', fontSize: '0.9rem' }}
                                                    >
                                                        <Edit2 size={16} />
                                                        إدارة الاختبار
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => setActiveTest(test)}
                                                        className="neon-button"
                                                        style={{ flex: 1, height: '36px', fontSize: '0.9rem' }}
                                                    >
                                                        <PlayCircle size={16} />
                                                        ابدأ الاختبار
                                                    </button>
                                                )}

                                                {isAdmin && (
                                                    <button
                                                        onClick={(e) => handleDeleteTest(test.id, e)}
                                                        style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer' }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px' }}>
                                    <div style={{
                                        maxWidth: '500px',
                                        margin: '0 auto',
                                        padding: '30px',
                                        background: 'rgba(255,255,255,0.03)',
                                        borderRadius: '16px',
                                        border: '1px solid var(--glass-border)'
                                    }}>
                                        <FileQuestion size={48} color="var(--color-text-muted)" style={{ margin: '0 auto 20px' }} />
                                        <h3 style={{ fontSize: '1.2rem', marginBottom: '12px', color: '#fff' }}>
                                            {isAdmin ? 'لا توجد اختبارات' : 'لا توجد اختبارات متاحة'}
                                        </h3>
                                        <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.6', fontSize: '0.9rem' }}>
                                            {isAdmin
                                                ? 'لم يتم إنشاء أي اختبارات بعد. اضغط على "إنشاء اختبار جديد" للبدء.'
                                                : `لا توجد اختبارات منشورة ومخصصة لعربة ${selectedEquipmentObj?.vehicle_type || 'المختارة'} حالياً. يرجى التواصل مع المشرف أو اختيار عربة أخرى.`
                                            }
                                        </p>
                                        {!isAdmin && (
                                            <div style={{
                                                marginTop: '20px',
                                                padding: '15px',
                                                background: 'rgba(59, 130, 246, 0.1)',
                                                borderRadius: '8px',
                                                border: '1px solid rgba(59, 130, 246, 0.2)'
                                            }}>
                                                <p style={{ fontSize: '0.85rem', color: '#3b82f6', marginBottom: '8px', fontWeight: 600 }}>
                                                    💡 نصيحة
                                                </p>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
                                                    تأكد من اختيار العربة الصحيحة من القائمة العلوية. الاختبارات تظهر فقط للعربات المخصصة لها.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* --- Modals Render Area --- */}
                <AnimatePresence>
                    {selectedProgram && (
                        <ProgramDetailsModal
                            program={selectedProgram}
                            onClose={() => setSelectedProgram(null)}
                            onMaterialClick={(material) => setViewingMaterial(material)}
                        />
                    )}

                    {showAddProgramModal && (
                        <Modal
                            title={editingProgram ? "تعديل البرنامج التدريبي" : "إضافة برنامج تدريبي جديد"}
                            isOpen={showAddProgramModal}
                            onClose={() => {
                                setShowAddProgramModal(false);
                                setEditingProgram(null);
                            }}
                            maxWidth="800px"
                        >
                            <ProgramBuilder
                                onClose={() => {
                                    setShowAddProgramModal(false);
                                    setEditingProgram(null);
                                }}
                                onSave={handleSaveNewProgram}
                                initialData={editingProgram}
                                availableVehicles={availableVehicles}
                            />
                        </Modal>
                    )}

                    {showAddTestModal && (
                        <Modal title={editingTest ? "تعديل الاختبار" : "إنشاء اختبار جديد"} isOpen={showAddTestModal} onClose={() => setShowAddTestModal(false)} maxWidth="900px">
                            <TestBuilder onClose={() => setShowAddTestModal(false)} onSave={handleSaveNewTest} initialData={editingTest} availableVehicles={availableVehicles} />
                        </Modal>
                    )}

                    {viewingMaterial && (
                        <MaterialViewerModal
                            material={viewingMaterial}
                            onClose={() => setViewingMaterial(null)}
                        />
                    )}

                    {activeTest && (
                        <ActiveTestModal
                            test={activeTest}
                            onClose={() => setActiveTest(null)}
                        />
                    )}
                </AnimatePresence>

            </div>
        </DashboardLayout>
    );
};

// Material Viewer Component
const MaterialViewerModal = ({ material, onClose }: { material: TrainingMaterial | null; onClose: () => void }) => {
    if (!material) return null;

    // Debug logging
    console.log('Material being viewed:', material);
    console.log('Material URL:', material.url);
    console.log('Material type:', material.type);

    return (
        <Modal isOpen={!!material} onClose={onClose} title={material.title} maxWidth="900px">
            <div style={{ padding: '20px' }}>
                {material.type === 'video' && material.url && (
                    <div>
                        <video
                            controls
                            style={{ width: '100%', maxHeight: '500px', borderRadius: '12px', background: '#000' }}
                            src={material.url}
                            onError={(e) => {
                                console.error('Video loading error:', e);
                                console.error('Failed URL:', material.url);
                            }}
                            onLoadedData={() => {
                                console.log('Video loaded successfully');
                            }}
                        >
                            المتصفح لا يدعم تشغيل الفيديو
                        </video>
                        <p style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                            رابط الفيديو: {material.url}
                        </p>
                    </div>
                )}

                {material.type === 'document' && material.url && (
                    <iframe
                        src={material.url}
                        style={{ width: '100%', height: '600px', border: 'none', borderRadius: '12px' }}
                        title={material.title}
                    />
                )}

                {material.type === 'presentation' && material.url && (
                    <iframe
                        src={material.url}
                        style={{ width: '100%', height: '600px', border: 'none', borderRadius: '12px' }}
                        title={material.title}
                    />
                )}

                {!material.url && (
                    <div style={{
                        padding: '40px',
                        textAlign: 'center',
                        color: 'var(--color-text-muted)',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '12px'
                    }}>
                        <FileText size={48} style={{ margin: '0 auto 16px' }} />
                        <p>لا يوجد محتوى متاح لهذه المادة</p>
                    </div>
                )}
            </div>
        </Modal>
    );
};

// Active Test Modal Component
const ActiveTestModal = ({ test, onClose }: { test: TestItem | null; onClose: () => void }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [showResults, setShowResults] = useState(false);
    const [score, setScore] = useState(0);

    if (!test) return null;

    const questions = test.questions || [];
    const totalQuestions = questions.length;

    // Check if questions exist
    if (totalQuestions === 0) {
        return (
            <Modal isOpen={!!test} onClose={onClose} title={test.title}>
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    <p>عذراً، هذا الاختبار لا يحتوي على أسئلة حالياً.</p>
                    <button
                        onClick={onClose}
                        className="neon-button"
                        style={{ marginTop: '20px' }}
                    >
                        إغلاق
                    </button>
                </div>
            </Modal>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];

    const handleAnswerSelect = (optionId: string) => {
        setAnswers(prev => ({
            ...prev,
            [currentQuestion.id]: optionId
        }));
    };

    const handleNext = () => {
        if (currentQuestionIndex < totalQuestions - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            calculateResults();
        }
    };

    const calculateResults = () => {
        let correctCount = 0;
        questions.forEach(q => {
            if (answers[q.id] === q.correct_option_id) {
                correctCount++;
            }
        });
        const finalScore = (correctCount / totalQuestions) * 100;
        setScore(finalScore);
        setShowResults(true);
    };

    if (showResults) {
        const passed = score >= (test.passing_score || 70);
        return (
            <Modal isOpen={!!test} onClose={onClose} title={`نتيجة: ${test.title}`}>
                <div style={{ padding: '30px', textAlign: 'center' }}>
                    <div style={{
                        fontSize: '4rem',
                        marginBottom: '20px',
                        color: passed ? '#10b981' : '#ef4444'
                    }}>
                        {Math.round(score)}%
                    </div>

                    <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>
                        {passed ? '🎉 مبروك! اجتزت الاختبار' : '❌ لم تجتز الاختبار'}
                    </h3>

                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '30px' }}>
                        درجة النجاح المطلوبة: {test.passing_score || 70}%
                    </p>

                    <button
                        onClick={onClose}
                        className="neon-button"
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: passed ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)'
                        }}
                    >
                        إنهاء
                    </button>
                </div>
            </Modal>
        );
    }

    return (
        <Modal isOpen={!!test} onClose={onClose} title={test.title} maxWidth="700px">
            <div style={{ padding: '20px' }}>
                {/* Progress Bar */}
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                        <span>السؤال {currentQuestionIndex + 1} من {totalQuestions}</span>
                        <span>{Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`,
                            background: 'var(--color-primary)',
                            transition: 'width 0.3s ease'
                        }} />
                    </div>
                </div>

                {/* Question */}
                <div style={{ marginBottom: '30px' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', lineHeight: '1.6' }}>
                        {currentQuestion.text}
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {currentQuestion.options.map(option => (
                            <div
                                key={option.id}
                                onClick={() => handleAnswerSelect(option.id)}
                                style={{
                                    padding: '15px',
                                    borderRadius: '10px',
                                    border: `1px solid ${answers[currentQuestion.id] === option.id ? 'var(--color-primary)' : 'var(--glass-border)'}`,
                                    background: answers[currentQuestion.id] === option.id ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.02)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px'
                                }}
                            >
                                <div style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    border: `2px solid ${answers[currentQuestion.id] === option.id ? 'var(--color-primary)' : 'var(--color-text-muted)'}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {answers[currentQuestion.id] === option.id && (
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-primary)' }} />
                                    )}
                                </div>
                                <span style={{ fontSize: '1rem' }}>{option.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Navigation */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        onClick={handleNext}
                        disabled={!answers[currentQuestion.id]}
                        className="neon-button"
                        style={{
                            padding: '10px 30px',
                            opacity: !answers[currentQuestion.id] ? 0.5 : 1,
                            cursor: !answers[currentQuestion.id] ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {currentQuestionIndex === totalQuestions - 1 ? 'إنهاء الاختبار' : 'التالي'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default OJTPage;
