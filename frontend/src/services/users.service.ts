import api from './auth.service';

export const usersService = {
    getUsers: async (params?: any) => {
        const response = await api.get('/users', { params });
        return response.data;
    },
    getUserById: async (id: number) => {
        const response = await api.get(`/users/${id}`);
        return response.data;
    },
    createUser: async (userData: any) => {
        const response = await api.post('/users', userData);
        return response.data;
    },
    updateUser: async (id: number, userData: any) => {
        const response = await api.put(`/users/${id}`, userData);
        return response.data;
    },
    deleteUser: async (id: number) => {
        const response = await api.delete(`/users/${id}`);
        return response.data;
    },
    updateStatus: async (id: number, is_active: boolean) => {
        const response = await api.patch(`/users/${id}/status`, { is_active });
        return response.data;
    },
    getUserVehicles: async (id: number) => {
        const response = await api.get(`/users/${id}/vehicles`);
        return response.data;
    },
    updateUserVehicles: async (id: number, vehicle_ids: number[]) => {
        const response = await api.put(`/users/${id}/vehicles`, { vehicle_ids });
        return response.data;
    }
};
