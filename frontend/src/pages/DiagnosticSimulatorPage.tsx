import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    Gauge,
    Thermometer,
    Zap,
    Wind,
    AlertTriangle,
    CheckCircle,
    Play,
    RotateCcw,
    Cpu,
    Battery,
    Radio,
    Plus,
    X,
    Trash2,
    Edit
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import TestDataPanel from '../components/TestDataPanel';
import toast from 'react-hot-toast';
import { authService } from '../services/auth.service';


// أنواع أجهزة الفحص
const diagnosticDevices = [
    {
        id: 'obd2',
        name: 'جهاز فحص OBD-II',
        icon: Cpu,
        color: '#3b82f6',
        description: 'فحص أكواد الأعطال والبيانات الحية من كمبيوتر المركبة'
    },
    {
        id: 'multimeter',
        name: 'الملتيميتر الرقمي',
        icon: Zap,
        color: '#f59e0b',
        description: 'قياس الجهد، التيار، والمقاومة الكهربائية'
    },
    {
        id: 'pressure',
        name: 'جهاز قياس الضغط',
        icon: Gauge,
        color: '#10b981',
        description: 'قياس ضغط الزيت، الوقود، والهواء'
    },
    {
        id: 'temperature',
        name: 'مقياس الحرارة',
        icon: Thermometer,
        color: '#ef4444',
        description: 'قياس درجة حرارة المحرك والسوائل'
    },
    {
        id: 'battery',
        name: 'فاحص البطارية',
        icon: Battery,
        color: '#8b5cf6',
        description: 'فحص حالة البطارية وقدرة الشحن'
    },
    {
        id: 'compression',
        name: 'جهاز قياس الانضغاط',
        icon: Wind,
        color: '#06b6d4',
        description: 'قياس ضغط الانضغاط في الأسطوانات'
    }
];

// محاكي OBD-II
const OBD2Simulator = () => {
    const [isScanning, setIsScanning] = useState(false);
    const [faultCodes, setFaultCodes] = useState<any[]>([]);
    const [liveData] = useState({
        rpm: 850,
        speed: 0,
        coolantTemp: 85,
        engineLoad: 12,
        fuelPressure: 3.5,
        voltage: 14.2
    });

    const simulateScan = () => {
        setIsScanning(true);
        setFaultCodes([]);

        setTimeout(() => {
            const codes = [
                { code: 'P0420', description: 'كفاءة المحول الحفاز أقل من الحد المطلوب', severity: 'warning' },
                { code: 'P0171', description: 'خليط الوقود فقير جداً (Bank 1)', severity: 'error' },
                { code: 'P0300', description: 'اكتشاف اختلال في الاحتراق عشوائي', severity: 'critical' }
            ];
            setFaultCodes(codes);
            setIsScanning(false);
        }, 2500);
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return '#ef4444';
            case 'error': return '#f59e0b';
            case 'warning': return '#eab308';
            default: return '#10b981';
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* أكواد الأعطال */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card"
                style={{ padding: '30px', borderRadius: '20px' }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <AlertTriangle size={24} color="#f59e0b" />
                        أكواد الأعطال (DTCs)
                    </h3>
                    <button
                        onClick={simulateScan}
                        disabled={isScanning}
                        className="neon-button"
                        style={{
                            padding: '10px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            opacity: isScanning ? 0.6 : 1
                        }}
                    >
                        <Play size={16} />
                        {isScanning ? 'جاري الفحص...' : 'بدء الفحص'}
                    </button>
                </div>

                {isScanning && (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            style={{ display: 'inline-block' }}
                        >
                            <Radio size={48} color="#3b82f6" />
                        </motion.div>
                        <p style={{ marginTop: '20px', color: 'var(--color-text-muted)' }}>
                            جاري الاتصال بكمبيوتر المركبة...
                        </p>
                    </div>
                )}

                {!isScanning && faultCodes.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <CheckCircle size={48} color="#10b981" style={{ margin: '0 auto' }} />
                        <p style={{ marginTop: '20px', color: 'var(--color-text-muted)' }}>
                            لا توجد أكواد أعطال مسجلة
                        </p>
                    </div>
                )}

                <AnimatePresence>
                    {faultCodes.map((fault, index) => (
                        <motion.div
                            key={fault.code}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            style={{
                                padding: '15px',
                                borderRadius: '12px',
                                background: 'rgba(255,255,255,0.03)',
                                border: `1px solid ${getSeverityColor(fault.severity)}`,
                                marginBottom: '12px'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <div>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 700, color: getSeverityColor(fault.severity) }}>
                                        {fault.code}
                                    </p>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '5px' }}>
                                        {fault.description}
                                    </p>
                                </div>
                                <span style={{
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    fontSize: '0.75rem',
                                    background: `${getSeverityColor(fault.severity)}20`,
                                    color: getSeverityColor(fault.severity),
                                    fontWeight: 600
                                }}>
                                    {fault.severity === 'critical' ? 'حرج' : fault.severity === 'error' ? 'خطأ' : 'تحذير'}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>

            {/* البيانات الحية */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card"
                style={{ padding: '30px', borderRadius: '20px' }}
            >
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Activity size={24} color="#10b981" />
                    البيانات الحية
                </h3>

                <div style={{ display: 'grid', gap: '15px' }}>
                    <DataGauge label="سرعة المحرك" value={liveData.rpm} unit="RPM" max={6000} color="#3b82f6" />
                    <DataGauge label="السرعة" value={liveData.speed} unit="km/h" max={200} color="#10b981" />
                    <DataGauge label="حرارة المحرك" value={liveData.coolantTemp} unit="°C" max={120} color="#ef4444" />
                    <DataGauge label="حمل المحرك" value={liveData.engineLoad} unit="%" max={100} color="#f59e0b" />
                    <DataGauge label="ضغط الوقود" value={liveData.fuelPressure} unit="Bar" max={10} color="#8b5cf6" />
                    <DataGauge label="جهد البطارية" value={liveData.voltage} unit="V" max={16} color="#06b6d4" />
                </div>
            </motion.div>
        </div>
    );
};

// عنصر قياس البيانات
const DataGauge = ({ label, value, unit, max, color }: any) => {
    const percentage = (value / max) * 100;

    return (
        <div style={{ padding: '15px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{label}</span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color }}>
                    {value} {unit}
                </span>
            </div>
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    style={{ height: '100%', background: color, borderRadius: '4px' }}
                />
            </div>
        </div>
    );
};

// محاكي الملتيميتر
const MultimeterSimulator = () => {
    const [mode, setMode] = useState<'voltage' | 'current' | 'resistance'>('voltage');
    const [reading, setReading] = useState(0);
    const [isMeasuring, setIsMeasuring] = useState(false);
    const [selectorAngle, setSelectorAngle] = useState(0);

    // بيانات القطعة المراد فحصها
    const [componentName, setComponentName] = useState('');
    const [normalMin, setNormalMin] = useState('');
    const [normalMax, setNormalMax] = useState('');
    const [testResults, setTestResults] = useState<Array<{
        component: string;
        mode: string;
        reading: number;
        normalRange: string;
        status: 'normal' | 'abnormal';
        timestamp: string;
    }>>([]);

    const modes = [
        { id: 'voltage', label: 'V~', color: '#f59e0b', unit: 'V', range: [0, 24], angle: -45 },
        { id: 'current', label: 'A', color: '#3b82f6', unit: 'A', range: [0, 10], angle: 0 },
        { id: 'resistance', label: 'Ω', color: '#10b981', unit: 'Ω', range: [0, 1000], angle: 45 }
    ];

    const currentMode = modes.find(m => m.id === mode)!;

    const startMeasurement = () => {
        setIsMeasuring(true);
        const [min, max] = currentMode.range;
        const randomValue = (Math.random() * (max - min) + min).toFixed(2);
        setTimeout(() => {
            const newReading = parseFloat(randomValue);
            setReading(newReading);
            setIsMeasuring(false);

            // حفظ النتيجة إذا كانت هناك قطعة محددة
            if (componentName && normalMin && normalMax) {
                const minVal = parseFloat(normalMin);
                const maxVal = parseFloat(normalMax);
                const isNormal = newReading >= minVal && newReading <= maxVal;

                setTestResults(prev => [{
                    component: componentName,
                    mode: currentMode.label,
                    reading: newReading,
                    normalRange: `${normalMin} - ${normalMax} ${currentMode.unit}`,
                    status: (isNormal ? 'normal' : 'abnormal') as 'normal' | 'abnormal',
                    timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
                }, ...prev].slice(0, 5));
            }
        }, 1500);
    };

    const handleModeChange = (newMode: 'voltage' | 'current' | 'resistance') => {
        setMode(newMode);
        const modeData = modes.find(m => m.id === newMode)!;
        setSelectorAngle(modeData.angle);
        setReading(0);
    };

    const clearForm = () => {
        setComponentName('');
        setNormalMin('');
        setNormalMax('');
        setReading(0);
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '25px', maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
            {/* المحاكي */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                    background: 'linear-gradient(145deg, #c73e3e, #a82828)',
                    borderRadius: '30px',
                    padding: '40px 30px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
                    border: '3px solid #8b1e1e',
                    position: 'relative'
                }}
            >
                {/* شريط العلامة التجارية */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: '20px',
                    padding: '8px',
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '8px'
                }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', letterSpacing: '2px' }}>
                        ASTRON
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#ddd', marginTop: '2px' }}>
                        AM330
                    </div>
                </div>

                {/* شاشة LCD */}
                <motion.div
                    style={{
                        background: 'linear-gradient(180deg, #2a4a3a, #1a2a1a)',
                        borderRadius: '12px',
                        padding: '25px 20px',
                        marginBottom: '25px',
                        border: '4px solid #1a1a1a',
                        boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.3)',
                        position: 'relative'
                    }}
                >
                    {/* مؤشر الوضع */}
                    <div style={{
                        position: 'absolute',
                        top: '8px',
                        left: '15px',
                        fontSize: '0.7rem',
                        color: '#4a9d6a',
                        fontWeight: 700,
                        letterSpacing: '1px'
                    }}>
                        {currentMode.label}
                    </div>

                    {/* القراءة الرئيسية */}
                    <div style={{
                        fontSize: '4.5rem',
                        fontWeight: 700,
                        fontFamily: '"Courier New", monospace',
                        color: isMeasuring ? '#2d5d3d' : '#4ade80',
                        textAlign: 'center',
                        textShadow: '0 0 20px rgba(74, 222, 128, 0.5)',
                        letterSpacing: '5px',
                        lineHeight: 1
                    }}>
                        {isMeasuring ? '---' : reading.toFixed(2)}
                    </div>

                    {/* الوحدة */}
                    <div style={{
                        fontSize: '1.8rem',
                        color: '#4ade80',
                        textAlign: 'center',
                        marginTop: '5px',
                        fontWeight: 600
                    }}>
                        {currentMode.unit}
                    </div>
                </motion.div>

                {/* لوحة التحكم */}
                <div style={{
                    background: 'linear-gradient(145deg, #2d3748, #1a202c)',
                    borderRadius: '20px',
                    padding: '30px 25px',
                    border: '2px solid #1a1a1a',
                    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)'
                }}>
                    {/* المفتاح الدوار */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: '30px',
                        position: 'relative'
                    }}>
                        {/* دائرة الخلفية */}
                        <div style={{
                            width: '180px',
                            height: '180px',
                            borderRadius: '50%',
                            background: 'linear-gradient(145deg, #374151, #1f2937)',
                            border: '3px solid #111',
                            position: 'relative',
                            boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.3)'
                        }}>
                            {/* علامات الأوضاع */}
                            {modes.map((m) => {
                                const angle = m.angle * (Math.PI / 180);
                                const radius = 70;
                                const x = Math.sin(angle) * radius;
                                const y = -Math.cos(angle) * radius;

                                return (
                                    <div
                                        key={m.id}
                                        style={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                                            fontSize: '0.9rem',
                                            fontWeight: 700,
                                            color: mode === m.id ? m.color : '#6b7280',
                                            textShadow: mode === m.id ? `0 0 10px ${m.color}` : 'none',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        {m.label}
                                    </div>
                                );
                            })}

                            {/* المفتاح الدوار */}
                            <motion.div
                                animate={{ rotate: selectorAngle }}
                                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                                style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(145deg, #fbbf24, #f59e0b)',
                                    border: '4px solid #d97706',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                {/* مؤشر المفتاح */}
                                <div style={{
                                    position: 'absolute',
                                    top: '8px',
                                    width: '4px',
                                    height: '25px',
                                    background: '#7c2d12',
                                    borderRadius: '2px'
                                }} />
                            </motion.div>
                        </div>
                    </div>

                    {/* أزرار اختيار الوضع */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '12px',
                        marginBottom: '20px'
                    }}>
                        {modes.map((m) => (
                            <motion.button
                                key={m.id}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleModeChange(m.id as any)}
                                style={{
                                    padding: '12px',
                                    borderRadius: '10px',
                                    background: mode === m.id
                                        ? `linear-gradient(145deg, ${m.color}, ${m.color}dd)`
                                        : 'linear-gradient(145deg, #4b5563, #374151)',
                                    border: `2px solid ${mode === m.id ? m.color : '#1f2937'}`,
                                    color: '#fff',
                                    fontWeight: 700,
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    boxShadow: mode === m.id
                                        ? `0 0 20px ${m.color}50, inset 0 1px 2px rgba(255,255,255,0.2)`
                                        : '0 2px 4px rgba(0,0,0,0.3)',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {m.label}
                            </motion.button>
                        ))}
                    </div>

                    {/* زر القياس */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={startMeasurement}
                        disabled={isMeasuring}
                        style={{
                            width: '100%',
                            padding: '16px',
                            borderRadius: '12px',
                            background: isMeasuring
                                ? 'linear-gradient(145deg, #6b7280, #4b5563)'
                                : 'linear-gradient(145deg, #10b981, #059669)',
                            border: '2px solid #047857',
                            color: '#fff',
                            fontSize: '1.1rem',
                            fontWeight: 700,
                            cursor: isMeasuring ? 'not-allowed' : 'pointer',
                            boxShadow: isMeasuring
                                ? 'inset 0 2px 8px rgba(0,0,0,0.3)'
                                : '0 4px 12px rgba(16, 185, 129, 0.4), inset 0 1px 2px rgba(255,255,255,0.2)',
                            transition: 'all 0.3s ease',
                            opacity: isMeasuring ? 0.6 : 1
                        }}
                    >
                        {isMeasuring ? '⏳ جاري القياس...' : '▶ بدء القياس'}
                    </motion.button>
                </div>

                {/* منافذ التوصيل */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '40px',
                    marginTop: '25px'
                }}>
                    {/* منفذ COM */}
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, #1a1a1a, #000)',
                            border: '3px solid #333',
                            margin: '0 auto 8px',
                            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.8)'
                        }} />
                        <div style={{ fontSize: '0.7rem', color: '#fff', fontWeight: 700 }}>COM</div>
                    </div>

                    {/* منفذ VΩmA */}
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, #7c2d12, #991b1b)',
                            border: '3px solid #dc2626',
                            margin: '0 auto 8px',
                            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6), 0 0 10px rgba(220, 38, 38, 0.3)'
                        }} />
                        <div style={{ fontSize: '0.7rem', color: '#fff', fontWeight: 700 }}>VΩmA</div>
                    </div>

                    {/* منفذ 10A */}
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, #1a1a1a, #000)',
                            border: '3px solid #333',
                            margin: '0 auto 8px',
                            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.8)'
                        }} />
                        <div style={{ fontSize: '0.7rem', color: '#fff', fontWeight: 700 }}>10A</div>
                    </div>
                </div>
            </motion.div>

            <TestDataPanel
                componentName={componentName}
                setComponentName={setComponentName}
                normalMin={normalMin}
                setNormalMin={setNormalMin}
                normalMax={normalMax}
                setNormalMax={setNormalMax}
                currentUnit={currentMode.unit}
                testResults={testResults}
                onClear={clearForm}
            />
        </div>
    );
};

// محاكي قياس الضغط
const PressureGaugeSimulator = () => {
    const [selectedSystem, setSelectedSystem] = useState('oil');
    const [pressure, setPressure] = useState(0);
    const [isReading, setIsReading] = useState(false);

    const systems = [
        { id: 'oil', label: 'ضغط الزيت', color: '#f59e0b', unit: 'Bar', normalRange: [3, 5] },
        { id: 'fuel', label: 'ضغط الوقود', color: '#3b82f6', unit: 'Bar', normalRange: [3.5, 4.5] },
        { id: 'air', label: 'ضغط الهواء', color: '#10b981', unit: 'PSI', normalRange: [30, 35] },
        { id: 'coolant', label: 'ضغط التبريد', color: '#06b6d4', unit: 'Bar', normalRange: [1.2, 1.5] }
    ];

    const currentSystem = systems.find(s => s.id === selectedSystem)!;

    const takeReading = () => {
        setIsReading(true);
        const [min, max] = currentSystem.normalRange;
        const randomPressure = (Math.random() * (max - min) + min).toFixed(2);
        setTimeout(() => {
            setPressure(parseFloat(randomPressure));
            setIsReading(false);
        }, 2000);
    };

    const isNormal = pressure >= currentSystem.normalRange[0] && pressure <= currentSystem.normalRange[1];

    return (
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card"
                style={{ padding: '40px', borderRadius: '24px' }}
            >
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '30px', textAlign: 'center' }}>
                    <Gauge size={28} style={{ verticalAlign: 'middle', marginLeft: '10px' }} />
                    جهاز قياس الضغط
                </h3>

                {/* اختيار النظام */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginBottom: '30px' }}>
                    {systems.map((system) => (
                        <button
                            key={system.id}
                            onClick={() => setSelectedSystem(system.id)}
                            className="neon-button"
                            style={{
                                padding: '20px',
                                background: selectedSystem === system.id ? `${system.color}20` : 'rgba(255,255,255,0.03)',
                                border: `2px solid ${selectedSystem === system.id ? system.color : 'rgba(255,255,255,0.1)'}`,
                                color: selectedSystem === system.id ? system.color : 'var(--color-text)',
                                fontSize: '1rem',
                                fontWeight: 600
                            }}
                        >
                            {system.label}
                        </button>
                    ))}
                </div>

                {/* عرض القراءة */}
                <div style={{
                    background: 'linear-gradient(135deg, #1a1a1a, #2d2d2d)',
                    padding: '50px',
                    borderRadius: '20px',
                    textAlign: 'center',
                    marginBottom: '25px',
                    border: `3px solid ${currentSystem.color}40`
                }}>
                    <div style={{ fontSize: '1rem', color: '#888', marginBottom: '15px' }}>
                        {currentSystem.label}
                    </div>
                    <div style={{
                        fontSize: '5rem',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        color: isReading ? '#666' : (pressure === 0 ? '#666' : isNormal ? '#10b981' : '#ef4444'),
                        textShadow: isReading ? 'none' : `0 0 30px ${isNormal ? '#10b981' : '#ef4444'}50`,
                        marginBottom: '10px'
                    }}>
                        {isReading ? '...' : pressure === 0 ? '0.00' : pressure.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '1.5rem', color: '#888' }}>
                        {currentSystem.unit}
                    </div>
                    {pressure > 0 && !isReading && (
                        <div style={{
                            marginTop: '20px',
                            padding: '10px 20px',
                            borderRadius: '20px',
                            background: isNormal ? '#10b98120' : '#ef444420',
                            border: `1px solid ${isNormal ? '#10b981' : '#ef4444'}`,
                            color: isNormal ? '#10b981' : '#ef4444',
                            display: 'inline-block',
                            fontWeight: 600
                        }}>
                            {isNormal ? '✓ ضمن المعدل الطبيعي' : '⚠ خارج المعدل الطبيعي'}
                        </div>
                    )}
                </div>

                <button
                    onClick={takeReading}
                    disabled={isReading}
                    className="neon-button"
                    style={{
                        width: '100%',
                        padding: '18px',
                        fontSize: '1.1rem',
                        background: `${currentSystem.color}20`,
                        border: `2px solid ${currentSystem.color}`,
                        color: currentSystem.color,
                        opacity: isReading ? 0.6 : 1
                    }}
                >
                    {isReading ? 'جاري القراءة...' : 'قراءة الضغط'}
                </button>

                <div style={{
                    marginTop: '20px',
                    padding: '15px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    color: 'var(--color-text-muted)',
                    textAlign: 'center'
                }}>
                    المعدل الطبيعي: {currentSystem.normalRange[0]} - {currentSystem.normalRange[1]} {currentSystem.unit}
                </div>
            </motion.div>
        </div>
    );
};

// الصفحة الرئيسية
const DiagnosticSimulatorPage = () => {
    const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

    // الحصول على معلومات المستخدم الحالي
    const user = authService.getCurrentUser();
    const canEditDevices = user?.role === 'admin' || user?.role === 'trainer';

    // تعريف الأيقونات المتاحة أولاً
    const availableIcons = [
        { name: 'Cpu', component: Cpu, label: 'معالج' },
        { name: 'Zap', component: Zap, label: 'كهرباء' },
        { name: 'Gauge', component: Gauge, label: 'مقياس' },
        { name: 'Thermometer', component: Thermometer, label: 'حرارة' },
        { name: 'Battery', component: Battery, label: 'بطارية' },
        { name: 'Wind', component: Wind, label: 'هواء' },
        { name: 'Activity', component: Activity, label: 'نشاط' },
        { name: 'Radio', component: Radio, label: 'راديو' }
    ];

    // تحميل الأجهزة من localStorage أو استخدام الافتراضية
    const [devices, setDevices] = useState(() => {
        const saved = localStorage.getItem('diagnosticDevices');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // تحويل أسماء الأيقونات إلى components
                return parsed.map((device: any) => {
                    const iconComponent = availableIcons.find(i => i.name === device.iconName)?.component || Cpu;
                    return { ...device, icon: iconComponent };
                });
            } catch {
                return diagnosticDevices;
            }
        }
        return diagnosticDevices;
    });

    const [showAddModal, setShowAddModal] = useState(false);
    const [editingDevice, setEditingDevice] = useState<any>(null);
    const [newDevice, setNewDevice] = useState({
        name: '',
        description: '',
        icon: 'Cpu',
        color: '#3b82f6'
    });

    const availableColors = [
        { value: '#3b82f6', label: 'أزرق' },
        { value: '#f59e0b', label: 'برتقالي' },
        { value: '#10b981', label: 'أخضر' },
        { value: '#ef4444', label: 'أحمر' },
        { value: '#8b5cf6', label: 'بنفسجي' },
        { value: '#06b6d4', label: 'سماوي' },
        { value: '#eab308', label: 'أصفر' },
        { value: '#ec4899', label: 'وردي' }
    ];

    // حفظ الأجهزة في localStorage عند التغيير
    const updateDevices = (newDevices: any[]) => {
        setDevices(newDevices);
        // حفظ مع اسم الأيقونة بدلاً من الـ component
        const toSave = newDevices.map(device => {
            const iconName = availableIcons.find(i => i.component === device.icon)?.name || 'Cpu';
            return { ...device, iconName, icon: undefined };
        });
        localStorage.setItem('diagnosticDevices', JSON.stringify(toSave));
    };

    const handleAddDevice = () => {
        if (!newDevice.name || !newDevice.description) {
            toast.error('الرجاء ملء جميع الحقول');
            return;
        }

        const iconComponent = availableIcons.find(i => i.name === newDevice.icon)?.component || Cpu;

        if (editingDevice) {
            // تعديل جهاز موجود
            const updatedDevices = devices.map((d: any) =>
                d.id === editingDevice.id
                    ? { ...d, name: newDevice.name, description: newDevice.description, icon: iconComponent, color: newDevice.color }
                    : d
            );
            updateDevices(updatedDevices);
            toast.success('تم تعديل الجهاز بنجاح!');
        } else {
            // إضافة جهاز جديد
            const device = {
                id: `custom_${Date.now()}`,
                name: newDevice.name,
                icon: iconComponent,
                color: newDevice.color,
                description: newDevice.description
            };
            updateDevices([...devices, device]);
            toast.success('تم إضافة الجهاز بنجاح!');
        }

        setShowAddModal(false);
        setEditingDevice(null);
        setNewDevice({ name: '', description: '', icon: 'Cpu', color: '#3b82f6' });
    };

    const handleEditDevice = (device: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingDevice(device);
        const iconName = availableIcons.find(i => i.component === device.icon)?.name || 'Cpu';
        setNewDevice({
            name: device.name,
            description: device.description,
            icon: iconName,
            color: device.color
        });
        setShowAddModal(true);
    };

    const handleDeleteDevice = (deviceId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('هل أنت متأكد من حذف هذا الجهاز؟')) {
            const newDevices = devices.filter((d: any) => d.id !== deviceId);
            updateDevices(newDevices);
            toast.success('تم حذف الجهاز بنجاح!');
        }
    };

    const renderSimulator = () => {
        switch (selectedDevice) {
            case 'obd2':
                return <OBD2Simulator />;
            case 'multimeter':
                return <MultimeterSimulator />;
            case 'pressure':
                return <PressureGaugeSimulator />;
            default:
                return (
                    <div style={{ textAlign: 'center', padding: '60px' }}>
                        <AlertTriangle size={64} color="#f59e0b" style={{ margin: '0 auto 20px' }} />
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>هذا الجهاز قيد التطوير</h3>
                        <p style={{ color: 'var(--color-text-muted)' }}>سيتم إضافة المحاكي قريباً</p>
                    </div>
                );
        }
    };

    return (
        <DashboardLayout>
            <div
                className="diagnostic-simulator-container"
                style={{
                    padding: '40px 60px',
                    maxWidth: '1600px',
                    margin: '0 auto',
                    width: '100%'
                }}
            >
                {/* العنوان */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        marginBottom: '30px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '20px'
                    }}
                >
                    <div>
                        <h1 className="diagnostic-simulator-title" style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '10px' }}>
                            🔧 محاكي أجهزة الفحص
                        </h1>
                        <p style={{ fontSize: '1.1rem', color: 'var(--color-text-muted)' }}>
                            تدرب على استخدام أجهزة الفحص المختلفة بشكل افتراضي
                        </p>
                    </div>
                    {!selectedDevice && canEditDevices && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="neon-button diagnostic-add-button"
                            style={{
                                padding: '12px 24px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                border: '1px solid #10b981',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <Plus size={20} />
                            إضافة جهاز جديد
                        </button>
                    )}
                </motion.div>

                {!selectedDevice ? (
                    /* عرض الأجهزة المتاحة */
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                        {devices.map((device: any, index: number) => (
                            <motion.div
                                key={device.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -5, scale: 1.02 }}
                                onClick={() => setSelectedDevice(device.id)}
                                className="glass-card"
                                style={{
                                    padding: '30px',
                                    borderRadius: '20px',
                                    cursor: 'pointer',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    transition: 'all 0.3s ease',
                                    position: 'relative'
                                }}
                            >
                                {/* أزرار التعديل والحذف - فقط للمدير والمدرب */}
                                {canEditDevices && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '15px',
                                        right: '15px',
                                        display: 'flex',
                                        gap: '8px',
                                        zIndex: 10
                                    }}>
                                        <button
                                            onClick={(e) => handleEditDevice(device, e)}
                                            style={{
                                                background: 'rgba(59, 130, 246, 0.1)',
                                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                                borderRadius: '8px',
                                                padding: '6px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.2s'
                                            }}
                                            title="تعديل"
                                        >
                                            <Edit size={16} color="#3b82f6" />
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteDevice(device.id, e)}
                                            style={{
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                                borderRadius: '8px',
                                                padding: '6px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.2s'
                                            }}
                                            title="حذف"
                                        >
                                            <Trash2 size={16} color="#ef4444" />
                                        </button>
                                    </div>
                                )}

                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '16px',
                                    background: `${device.color}20`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '20px'
                                }}>
                                    <device.icon size={32} color={device.color} />
                                </div>
                                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '10px' }}>
                                    {device.name}
                                </h3>
                                <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                                    {device.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    /* عرض المحاكي المحدد */
                    <div>
                        <button
                            onClick={() => setSelectedDevice(null)}
                            className="neon-button"
                            style={{
                                marginBottom: '20px',
                                padding: '10px 20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <RotateCcw size={16} />
                            العودة للأجهزة
                        </button>
                        {renderSimulator()}
                    </div>
                )}

                {/* Modal إضافة جهاز جديد */}
                <AnimatePresence>
                    {showAddModal && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowAddModal(false)}
                                style={{
                                    position: 'fixed',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: 'rgba(0,0,0,0.7)',
                                    zIndex: 1000,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            />

                            {/* Modal */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="glass-card"
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    position: 'fixed',
                                    top: '50%',
                                    left: 'calc(50% + 45px)',
                                    transform: 'translate(-50%, -50%)',
                                    zIndex: 1001,
                                    width: '90%',
                                    maxWidth: '550px',
                                    borderRadius: '20px',
                                    maxHeight: '85vh',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    padding: 0
                                }}
                            >
                                {/* Header - ثابت */}
                                <div style={{
                                    padding: '20px 25px 15px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                                        {editingDevice ? 'تعديل الجهاز' : 'إضافة جهاز جديد'}
                                    </h2>
                                    <button
                                        onClick={() => setShowAddModal(false)}
                                        style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '10px',
                                            width: '40px',
                                            height: '40px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Form - قابل للتمرير */}
                                <div style={{
                                    flex: 1,
                                    overflowY: 'auto',
                                    padding: '20px 25px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '20px'
                                }}>
                                    {/* اسم الجهاز */}
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 600 }}>
                                            اسم الجهاز
                                        </label>
                                        <input
                                            type="text"
                                            value={newDevice.name}
                                            onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                                            placeholder="مثال: جهاز فحص الانبعاثات"
                                            className="neon-input"
                                            style={{ width: '100%', padding: '12px 16px' }}
                                        />
                                    </div>

                                    {/* الوصف */}
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 600 }}>
                                            الوصف
                                        </label>
                                        <textarea
                                            value={newDevice.description}
                                            onChange={(e) => setNewDevice({ ...newDevice, description: e.target.value })}
                                            placeholder="وصف مختصر عن وظيفة الجهاز..."
                                            className="neon-input"
                                            style={{ width: '100%', padding: '12px 16px', minHeight: '100px', resize: 'vertical' }}
                                        />
                                    </div>

                                    {/* اختيار الأيقونة */}
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 600 }}>
                                            الأيقونة
                                        </label>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                                            {availableIcons.map((icon) => (
                                                <button
                                                    key={icon.name}
                                                    onClick={() => setNewDevice({ ...newDevice, icon: icon.name })}
                                                    className="neon-button"
                                                    style={{
                                                        padding: '12px',
                                                        background: newDevice.icon === icon.name ? `${newDevice.color}20` : 'rgba(255,255,255,0.03)',
                                                        border: `2px solid ${newDevice.icon === icon.name ? newDevice.color : 'rgba(255,255,255,0.1)'}`,
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        gap: '6px'
                                                    }}
                                                >
                                                    <icon.component size={20} color={newDevice.icon === icon.name ? newDevice.color : 'var(--color-text-muted)'} />
                                                    <span style={{ fontSize: '0.7rem' }}>{icon.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* اختيار اللون */}
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 600 }}>
                                            اللون
                                        </label>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                                            {availableColors.map((color) => (
                                                <button
                                                    key={color.value}
                                                    onClick={() => setNewDevice({ ...newDevice, color: color.value })}
                                                    className="neon-button"
                                                    style={{
                                                        padding: '12px',
                                                        background: newDevice.color === color.value ? `${color.value}20` : 'rgba(255,255,255,0.03)',
                                                        border: `2px solid ${newDevice.color === color.value ? color.value : 'rgba(255,255,255,0.1)'}`,
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        gap: '6px'
                                                    }}
                                                >
                                                    <div style={{
                                                        width: '24px',
                                                        height: '24px',
                                                        borderRadius: '6px',
                                                        background: color.value
                                                    }} />
                                                    <span style={{ fontSize: '0.7rem' }}>{color.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* أزرار الإجراءات - ثابتة في الأسفل */}
                                <div style={{
                                    padding: '15px 25px 20px',
                                    borderTop: '1px solid rgba(255,255,255,0.1)',
                                    display: 'flex',
                                    gap: '12px'
                                }}>
                                    <button
                                        onClick={handleAddDevice}
                                        className="neon-button"
                                        style={{
                                            flex: 1,
                                            padding: '12px',
                                            background: 'linear-gradient(135deg, #10b981, #059669)',
                                            border: '1px solid #10b981',
                                            fontSize: '1rem',
                                            fontWeight: 600
                                        }}
                                    >
                                        {editingDevice ? 'حفظ التعديلات' : 'إضافة الجهاز'}
                                    </button>
                                    <button
                                        onClick={() => setShowAddModal(false)}
                                        className="neon-button"
                                        style={{
                                            flex: 1,
                                            padding: '12px',
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            fontSize: '1rem'
                                        }}
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </DashboardLayout>
    );
};

export default DiagnosticSimulatorPage;
