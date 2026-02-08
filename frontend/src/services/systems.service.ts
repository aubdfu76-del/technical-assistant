import api from './auth.service';

export interface DiagnosisSystem {
    id: number;
    name: string;
    icon_name: string;
    description: string;
    items_count: number;
}

export interface DiagnosisItem {
    id: number;
    system_id: number;
    title: string;
    description: string;
    estimated_time: string;
    work_package_content: string;
    required_tools?: string;
    safety_procedures?: string;
    workshop_requirements?: string;
    technicians_count?: number;
    media?: DiagnosisMedia[];
}

export interface DiagnosisMedia {
    id: number;
    item_id: number;
    type: 'image' | 'video';
    url: string;
    thumbnail_url?: string;
}

export const systemsService = {
    getSystems: async () => {
        const response = await api.get('/diagnosis/systems');
        return response.data;
    },

    deleteSystem: async (id: number) => {
        const response = await api.delete(`/diagnosis/systems/${id}`);
        return response.data;
    },

    getSystemItems: async (systemId: number) => {
        const response = await api.get(`/diagnosis/systems/${systemId}/items`);
        return response.data;
    },

    getItemDetails: async (itemId: number) => {
        const response = await api.get(`/diagnosis/systems/items/${itemId}`);
        return response.data;
    },

    createItem: async (data: any) => {
        const response = await api.post('/diagnosis/systems/items', data);
        return response.data;
    },

    updateItem: async (id: number, data: any) => {
        const response = await api.put(`/diagnosis/systems/items/${id}`, data);
        return response.data;
    },

    addMedia: async (id: number, data: any) => {
        const response = await api.post(`/diagnosis/systems/items/${id}/media`, data);
        return response.data;
    },

    updateMedia: async (mediaId: number, data: any) => {
        const response = await api.put(`/diagnosis/systems/media/${mediaId}`, data);
        return response.data;
    },

    deleteMedia: async (mediaId: number) => {
        const response = await api.delete(`/diagnosis/systems/media/${mediaId}`);
        return response.data;
    },

    deleteItem: async (id: number) => {
        const response = await api.delete(`/diagnosis/systems/items/${id}`);
        return response.data;
    }
};
