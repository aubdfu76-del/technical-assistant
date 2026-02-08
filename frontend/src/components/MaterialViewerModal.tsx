import React from 'react';
import { Modal } from './Modal';
import { FileText } from 'lucide-react';

interface TrainingMaterial {
    id: number;
    title: string;
    type: 'video' | 'pdf' | 'image' | 'text';
    url?: string;
    content?: string;
}

// Material Viewer Component
const MaterialViewerModal = ({ material, onClose }: { material: TrainingMaterial | null; onClose: () => void }) => {
    if (!material) return null;

    return (
        <Modal isOpen={!!material} onClose={onClose} title={material.title} maxWidth="900px">
            <div style={{ padding: '20px' }}>
                {material.type === 'video' && material.url && (
                    <video
                        controls
                        style={{ width: '100%', maxHeight: '500px', borderRadius: '12px' }}
                        src={material.url}
                    >
                        المتصفح لا يدعم تشغيل الفيديو
                    </video>
                )}

                {material.type === 'pdf' && material.url && (
                    <iframe
                        src={material.url}
                        style={{ width: '100%', height: '600px', border: 'none', borderRadius: '12px' }}
                        title={material.title}
                    />
                )}

                {material.type === 'image' && material.url && (
                    <img
                        src={material.url}
                        alt={material.title}
                        style={{ width: '100%', maxHeight: '600px', objectFit: 'contain', borderRadius: '12px' }}
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

export default MaterialViewerModal;
