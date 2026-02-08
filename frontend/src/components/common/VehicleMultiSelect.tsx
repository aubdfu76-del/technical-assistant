import { useEffect, useState } from 'react';
import { vehiclesService } from '../../services/vehicles.service';

interface VehicleMultiSelectProps {
    selectedIds: number[];
    onChange: (ids: number[]) => void;
    label?: string;
    helperText?: string;
}

const VehicleMultiSelect = ({ selectedIds, onChange, label = "تخصيص لعربات (اختياري)", helperText = "* اتركها فارغة لتكون عامة، أو اختر عربات محددة." }: VehicleMultiSelectProps) => {
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadVehicles = async () => {
            try {
                const res = await vehiclesService.getAll({ limit: 100 });
                console.log('VehicleMultiSelect loaded:', res);
                if (res && res.data) {
                    setVehicles(res.data);
                } else {
                    console.warn('VehicleMultiSelect: No data in response', res);
                }
            } catch (e) {
                console.error('Failed to load vehicles', e);
            } finally {
                setLoading(false);
            }
        };
        loadVehicles();
    }, []);

    const toggleVehicle = (id: number) => {
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter(v => v !== id));
        } else {
            onChange([...selectedIds, id]);
        }
    };

    if (loading) return <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>جاري تحميل القائمة...</div>;

    return (
        <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{label}</label>
            <div style={{
                maxHeight: '150px',
                overflowY: 'auto',
                background: 'rgba(255,255,255,0.05)', // Slightly lighter background
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid var(--glass-border)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '8px'
            }}>
                {vehicles.length === 0 && !loading && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '10px', color: '#9ca3af', fontSize: '0.8rem' }}>
                        لا توجد عربات متاحة
                    </div>
                )}
                {vehicles.map(v => (
                    <label key={v.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px',
                        cursor: 'pointer',
                        color: selectedIds.includes(v.id) ? '#fff' : '#9ca3af', // Explicit colors
                        fontSize: '0.8rem',
                        background: selectedIds.includes(v.id) ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.02)',
                        borderRadius: '6px',
                        border: selectedIds.includes(v.id) ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
                        transition: 'all 0.2s'
                    }}>
                        <input
                            type="checkbox"
                            checked={selectedIds.includes(v.id)}
                            onChange={() => toggleVehicle(v.id)}
                            style={{ accentColor: '#3b82f6', width: '16px', height: '16px' }}
                        />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {v.plate_number} - {v.manufacturer} {v.model}
                        </span>
                    </label>
                ))}
            </div>
            {helperText && (
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    {helperText}
                </p>
            )}
        </div>
    );
};

export default VehicleMultiSelect;
