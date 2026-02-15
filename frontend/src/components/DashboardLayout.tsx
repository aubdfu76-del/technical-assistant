import React from 'react';
import Sidebar from './Sidebar';
import { motion } from 'framer-motion';
import { Bell, Search, User, Car, ArrowLeftRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const user = authService.getCurrentUser();
    const selectedEquipment = authService.getSelectedEquipment();
    const navigate = useNavigate();

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
            <Sidebar />

            <main style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Navbar */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="glass-card"
                    style={{
                        height: '80px',
                        borderRadius: '24px',
                        padding: '0 30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}
                >
                    <div style={{ position: 'relative', width: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input
                            className="neon-input"
                            placeholder="بحث سريع..."
                            style={{ height: '45px', paddingRight: '45px', background: 'rgba(255,255,255,0.03)' }}
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{
                            width: '45px',
                            height: '45px',
                            borderRadius: '12px',
                            background: 'rgba(255,255,255,0.03)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            border: '1px solid var(--glass-border)'
                        }}>
                            <Bell size={20} color="var(--color-text-muted)" />
                        </div>


                        {selectedEquipment && (
                            <div
                                onClick={() => navigate('/select-equipment')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '8px 16px',
                                    borderRadius: '14px',
                                    background: 'rgba(6, 182, 212, 0.05)',
                                    border: '1px solid rgba(6, 182, 212, 0.2)',
                                    cursor: 'pointer'
                                }}
                            >
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    background: 'rgba(6, 182, 212, 0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Car size={18} color="var(--color-primary)" />
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1 }}>المعدة النشطة</p>
                                    <p style={{ fontSize: '0.9rem', fontWeight: 700 }}>{selectedEquipment.plate_number}</p>
                                </div>
                                <ArrowLeftRight size={14} color="var(--color-text-muted)" style={{ marginRight: '5px' }} />
                            </div>
                        )}

                        <div style={{
                            padding: '6px 16px',
                            borderRadius: '14px',
                            background: 'rgba(6, 182, 212, 0.05)',
                            border: '1px solid rgba(6, 182, 212, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            cursor: 'pointer'
                        }}>
                            <div style={{ textAlign: 'left' }}>
                                <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>{user?.full_name}</p>
                                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textAlign: 'right' }}>{user?.role}</p>
                            </div>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '10px',
                                background: 'linear-gradient(45deg, var(--color-primary), var(--color-accent))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <User color="white" size={24} />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Content Area */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    style={{ flex: 1, overflowY: 'auto', paddingLeft: '5px' }}
                >
                    {children}
                </motion.div>
            </main>
        </div>
    );
};

export default DashboardLayout;
