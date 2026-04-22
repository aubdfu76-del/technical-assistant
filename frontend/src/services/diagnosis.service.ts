import api from './auth.service';

export interface CommonFault {
    id: number;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    recommended_system: string;
    symptoms_count: number;
    causes_count: number;
}

export interface CommonFaultDetails extends CommonFault {
    symptoms: string[];
    causes: string[];
}

export const diagnosisService = {
    getCommonFaults: async () => {
        const response = await api.get('/diagnosis/common');
        return response.data;
    },

    getCommonFaultDetails: async (id: number) => {
        const response = await api.get(`/diagnosis/common/${id}`);
        return response.data;
    },

    deleteCommonFault: async (id: number) => {
        const response = await api.delete(`/diagnosis/common/${id}`);
        return response.data;
    },

    createCommonFault: async (data: any) => {
        const response = await api.post('/diagnosis/common', data);
        return response.data;
    },

    updateCommonFault: async (id: number, data: any) => {
        const response = await api.put(`/diagnosis/common/${id}`, data);
        return response.data;
    }
};
