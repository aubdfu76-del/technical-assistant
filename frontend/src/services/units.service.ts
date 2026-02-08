import api from './auth.service';

export interface Unit {
    id: number;
    name: string;
    created_at?: string;
}

export const unitsService = {
    getUnits: async () => {
        const response = await api.get('/units');
        return response.data;
    },

    createUnit: async (data: { name: string }) => {
        const response = await api.post('/units', data);
        return response.data;
    },

    deleteUnit: async (id: number) => {
        const response = await api.delete(`/units/${id}`);
        return response.data;
    }
};

export default unitsService;
