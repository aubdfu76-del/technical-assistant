import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Activity } from 'lucide-react';

interface TestResult {
    component: string;
    mode: string;
    reading: number;
    normalRange: string;
    status: 'normal' | 'abnormal';
    timestamp: string;
}

interface TestDataPanelProps {
    componentName: string;
    setComponentName: (value: string) => void;
    normalMin: string;
    setNormalMin: (value: string) => void;
    normalMax: string;
    setNormalMax: (value: string) => void;
    currentUnit: string;
    testResults: TestResult[];
    onClear: () => void;
}

const TestDataPanel: React.FC<TestDataPanelProps> = ({
    componentName,
    setComponentName,
    normalMin,
    setNormalMin,
    normalMax,
    setNormalMax,
    currentUnit,
    testResults,
    onClear
}) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* نموذج إدخال البيانات */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card"
                style={{
                    padding: '25px',
                    borderRadius: '20px',
                    background: 'linear-gradient(145deg, #2d3748, #1a202c)',
                    border: '2px solid rgba(255,255,255,0.1)'
                }}
            >
                <h3 style={{
                    fontSize: '1.3rem',
                    fontWeight: 700,
                    marginBottom: '20px',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <Cpu size={24} color="#10b981" />
                    بيانات القطعة
                </h3>

                {/* اسم القطعة */}
                <div style={{ marginBottom: '15px' }}>
                    <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: '#c2b280'
                    }}>
                        اسم القطعة
                    </label>
                    <input
                        type="text"
                        value={componentName}
                        onChange={(e) => setComponentName(e.target.value)}
                        placeholder="مثال: حساس الأكسجين"
                        className="neon-input"
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: '#fff'
                        }}
                    />
                </div>

                {/* القياسات الطبيعية */}
                <div style={{ marginBottom: '15px' }}>
                    <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: '#c2b280'
                    }}>
                        القياسات الطبيعية
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                            <input
                                type="number"
                                value={normalMin}
                                onChange={(e) => setNormalMin(e.target.value)}
                                placeholder="الحد الأدنى"
                                className="neon-input"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: '#fff'
                                }}
                            />
                        </div>
                        <div>
                            <input
                                type="number"
                                value={normalMax}
                                onChange={(e) => setNormalMax(e.target.value)}
                                placeholder="الحد الأقصى"
                                className="neon-input"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: '#fff'
                                }}
                            />
                        </div>
                    </div>
                    <div style={{
                        fontSize: '0.75rem',
                        color: '#9ca3af',
                        marginTop: '5px',
                        textAlign: 'center'
                    }}>
                        {currentUnit}
                    </div>
                </div>

                {/* زر مسح */}
                <button
                    onClick={onClear}
                    style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#ef4444',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                    }}
                >
                    مسح البيانات
                </button>
            </motion.div>

            {/* جدول النتائج */}
            {testResults.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card"
                    style={{
                        padding: '25px',
                        borderRadius: '20px',
                        background: 'linear-gradient(145deg, #2d3748, #1a202c)',
                        border: '2px solid rgba(255,255,255,0.1)'
                    }}
                >
                    <h3 style={{
                        fontSize: '1.3rem',
                        fontWeight: 700,
                        marginBottom: '15px',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <Activity size={24} color="#3b82f6" />
                        نتائج الفحص
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {testResults.map((result, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                style={{
                                    padding: '15px',
                                    borderRadius: '12px',
                                    background: 'rgba(0,0,0,0.3)',
                                    border: `2px solid ${result.status === 'normal' ? '#10b981' : '#ef4444'}`,
                                    position: 'relative'
                                }}
                            >
                                {/* حالة الفحص */}
                                <div style={{
                                    position: 'absolute',
                                    top: '10px',
                                    left: '10px',
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '50%',
                                    background: result.status === 'normal' ? '#10b981' : '#ef4444',
                                    boxShadow: `0 0 10px ${result.status === 'normal' ? '#10b981' : '#ef4444'}`
                                }} />

                                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '5px', textAlign: 'left' }}>
                                    {result.timestamp}
                                </div>

                                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '5px' }}>
                                    {result.component}
                                </div>

                                <div style={{ fontSize: '0.85rem', color: '#c2b280', marginBottom: '8px' }}>
                                    الوضع: {result.mode}
                                </div>

                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '10px',
                                    fontSize: '0.8rem'
                                }}>
                                    <div>
                                        <div style={{ color: '#9ca3af' }}>القراءة:</div>
                                        <div style={{
                                            fontWeight: 700,
                                            fontSize: '1.1rem',
                                            color: result.status === 'normal' ? '#10b981' : '#ef4444'
                                        }}>
                                            {result.reading.toFixed(2)}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ color: '#9ca3af' }}>المدى الطبيعي:</div>
                                        <div style={{ fontWeight: 600, color: '#c2b280', fontSize: '0.85rem' }}>
                                            {result.normalRange}
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    marginTop: '10px',
                                    padding: '8px',
                                    borderRadius: '6px',
                                    background: result.status === 'normal' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    textAlign: 'center',
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    color: result.status === 'normal' ? '#10b981' : '#ef4444'
                                }}>
                                    {result.status === 'normal' ? '✓ ضمن المعدل الطبيعي' : '⚠ خارج المعدل الطبيعي'}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default TestDataPanel;
