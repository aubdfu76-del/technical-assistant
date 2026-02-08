import api from './auth.service';

export const dashboardService = {
    getStats: async () => {
        const response = await api.get('/dashboard/stats');
        return response.data;
    },
    getRecentActivity: async () => {
        const response = await api.get('/dashboard/recent-activity');
        return response.data;
    }
};
