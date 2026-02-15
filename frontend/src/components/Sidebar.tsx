import React from 'react';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Car,
    Wrench,
    SearchCode,
    Users,
    Settings,
    LogOut,
    PlayCircle,
    Bot,
    Cpu,
    GraduationCap,
    Library
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/auth.service';

const SidebarItem = ({ icon: Icon, label, path, active, onClick, isExpanded }: any) => (
    <motion.div
        whileHover={{ x: 5, backgroundColor: 'rgba(6, 182, 212, 0.1)' }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onClick(path)}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            borderRadius: '12px',
            cursor: 'pointer',
            color: active ? 'var(--color-highlight)' : 'var(--color-white)',
            background: active ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            marginBottom: '8px',
            border: active ? '1px solid var(--color-primary)' : '1px solid transparent',
            justifyContent: isExpanded ? 'flex-start' : 'center',
            minHeight: '48px',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            boxShadow: active ? '0 0 10px rgba(6, 182, 212, 0.1)' : 'none'
        }}
    >
        <div style={{ minWidth: '24px', display: 'flex', justifyContent: 'center' }}>
            <Icon size={20} />
        </div>
        {isExpanded && (
            <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                style={{ fontWeight: 600, fontSize: '0.95rem' }}
            >
                {label}
            </motion.span>
        )}
        {active && isExpanded && (
            <motion.div
                layoutId="activeIndicator"
                style={{ marginRight: 'auto', width: '4px', height: '18px', background: 'var(--color-highlight)', borderRadius: '2px', boxShadow: '0 0 8px var(--color-highlight)' }}
            />
        )}
    </motion.div>
);

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = authService.getCurrentUser();
    const [isExpanded, setIsExpanded] = React.useState(false);

    const menuItems = [
        { icon: (props: any) => <LayoutDashboard {...props} fill="currentColor" strokeWidth={0} />, label: 'لوحة التحكم', path: '/dashboard' },
        { icon: (props: any) => <Car {...props} fill="currentColor" strokeWidth={0} />, label: 'المعدات', path: '/vehicles' },
        { icon: SearchCode, label: 'تحري الأعطال', path: '/diagnosis' },
        { icon: PlayCircle, label: 'تنفيذ الإصلاح', path: '/repair' },
        { icon: (props: any) => <Wrench {...props} fill="currentColor" strokeWidth={0} />, label: 'الصيانة', path: '/maintenance' },
        { icon: GraduationCap, label: 'التدريب على رأس العمل', path: '/ojt' },
        { icon: Cpu, label: 'محاكي الأجهزة', path: '/simulator' },
        { icon: Bot, label: 'المساعد الذكي', path: '/assistant' },
        { icon: Library, label: 'الكراسات الفنية والمراجع', path: '/manuals' },
    ];

    if (user?.role === 'admin' || user?.role === 'supervisor') {
        menuItems.push({ icon: Users, label: 'المستخدمين', path: '/users' });
    }

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
        <motion.div
            initial={{ x: 100 }}
            animate={{
                x: 0,
                width: isExpanded ? '280px' : '90px'
            }}
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
            className="glass-card"
            style={{
                height: 'calc(100vh - 40px)',
                margin: '20px',
                marginLeft: '10px',
                padding: '30px 15px',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '24px',
                zIndex: 100,
                transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                background: 'rgba(15, 23, 42, 0.9)', // Darker background for sidebar
                border: '1px solid rgba(6, 182, 212, 0.2)'
            }}
        >
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '50px',
                justifyContent: isExpanded ? 'flex-start' : 'center',
                paddingLeft: isExpanded ? '10px' : '0'
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    minWidth: '40px',
                    background: 'rgba(6, 182, 212, 0.1)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(6, 182, 212, 0.3)'
                }}>
                    <img src="/logo.svg" alt="Logo" style={{ width: '28px', height: '28px' }} />
                </div>
                {isExpanded && (
                    <motion.h2
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                            fontSize: '1.2rem',
                            fontWeight: 800,
                            letterSpacing: '0.5px',
                            background: 'linear-gradient(to right, #22d3ee, #10b981)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}
                    >
                        TECH ASSIST
                    </motion.h2>
                )}
            </div>

            <div style={{ flex: 1 }}>
                {isExpanded && (
                    <p style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--color-text-muted)',
                        textTransform: 'uppercase',
                        marginBottom: '20px',
                        paddingRight: '10px',
                        letterSpacing: '1px'
                    }}>
                        القائمة الرئيسية
                    </p>
                )}
                {menuItems.map((item) => (
                    <SidebarItem
                        key={item.path}
                        {...item}
                        active={location.pathname.startsWith(item.path)}
                        onClick={navigate}
                        isExpanded={isExpanded}
                    />
                ))}
            </div>

            <div style={{ marginTop: 'auto' }}>
                <SidebarItem
                    icon={Settings}
                    label="الإعدادات"
                    path="/settings"
                    active={location.pathname === '/settings'}
                    onClick={navigate}
                    isExpanded={isExpanded}
                />
                <motion.div
                    whileHover={{ x: isExpanded ? -5 : 0 }}
                    onClick={handleLogout}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        color: '#ef4444',
                        marginTop: '8px',
                        justifyContent: isExpanded ? 'flex-start' : 'center'
                    }}
                >
                    <div style={{ minWidth: '24px', display: 'flex', justifyContent: 'center' }}>
                        <LogOut size={20} />
                    </div>
                    {isExpanded && <span style={{ fontWeight: 600 }}>تسجيل الخروج</span>}
                </motion.div>
            </div>
        </motion.div>
    );
};

export default Sidebar;
