import { Request, Response } from 'express';
import { getPool } from '../config/database';

/**
 * Get overall system statistics
 * @route GET /api/dashboard/stats
 */
export const getStats = async (req: Request, res: Response) => {
    try {
        const pool = getPool();

        const statsQuery = `
            SELECT 
                (SELECT COUNT(*) FROM vehicles) as total_vehicles,
                (SELECT COUNT(*) FROM vehicles WHERE status = 'active') as active_vehicles,
                (SELECT COUNT(*) FROM vehicles WHERE status = 'maintenance') as in_maintenance_vehicles,
                (SELECT COUNT(*) FROM faults WHERE status = 'open' OR status = 'in_progress') as active_faults,
                (SELECT COUNT(*) FROM maintenance_tasks WHERE status = 'pending' OR status = 'in_progress') as active_tasks,
                (SELECT COUNT(*) FROM users) as total_users
        `;

        const statsResult = await pool.query(statsQuery);

        res.json({
            success: true,
            data: statsResult.rows[0]
        });
    } catch (error) {
        console.error('❌ Get dashboard stats error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء جلب إحصائيات لوحة التحكم' });
    }
};

/**
 * Get recent activity
 * @route GET /api/dashboard/recent-activity
 */
export const getRecentActivity = async (req: Request, res: Response) => {
    try {
        const pool = getPool();

        // Combine recent faults and maintenance tasks
        const recentFaults = await pool.query(
            'SELECT id, title, severity as info, reported_at as date, \'fault\' as type FROM faults ORDER BY reported_at DESC LIMIT 5'
        );

        const recentTasks = await pool.query(
            'SELECT id, title, priority as info, created_at as date, \'maintenance\' as type FROM maintenance_tasks ORDER BY created_at DESC LIMIT 5'
        );

        const activity = [...recentFaults.rows, ...recentTasks.rows]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10);

        res.json({
            success: true,
            data: activity
        });
    } catch (error) {
        console.error('❌ Get recent activity error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء جلب النشاطات الأخيرة' });
    }
};
