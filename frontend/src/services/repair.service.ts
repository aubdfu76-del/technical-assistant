import api from './auth.service';

export interface RepairTask {
    id: number;
    title: string;
    description: string;
    category: string;
    difficulty: 'easy' | 'medium' | 'hard';
    estimated_time: string;
    safety_procedures?: string;
    workshop_requirements?: string;
    technicians_count?: number;
    required_tools?: string;
}

export interface RepairStep {
    id: number;
    task_id: number;
    step_number: number;
    instruction: string;
    tool_required: string;
    media?: any[];
}

export interface RepairTaskDetails extends RepairTask {
    steps: RepairStep[];
    taskMedia?: any[];
}

export const repairService = {
    getTasks: async (search?: string, type?: string, vehicle_id?: any) => {
        const response = await api.get('/repair/tasks', { params: { search, type, vehicle_id } });
        return response.data;
    },

    getTaskDetails: async (id: number) => {
        const response = await api.get(`/repair/tasks/${id}`);
        return response.data;
    },

    createTask: async (data: any) => {
        const response = await api.post('/repair/tasks', data);
        return response.data;
    },

    updateTask: async (id: number, data: any) => {
        const response = await api.put(`/repair/tasks/${id}`, data);
        return response.data;
    },

    addMedia: async (taskId: number, data: { url: string, type: 'image' | 'video', step_id?: number }) => {
        const response = await api.post(`/repair/tasks/${taskId}/media`, data);
        return response.data;
    },

    deleteMedia: async (mediaId: number) => {
        const response = await api.delete(`/repair/media/${mediaId}`);
        return response.data;
    },

    reorderMedia: async (mediaId: number, newIndex: number) => {
        const response = await api.put(`/repair/media/${mediaId}/order`, { newIndex });
        return response.data;
    },

    deleteTask: async (id: number) => {
        const response = await api.delete(`/repair/tasks/${id}`);
        return response.data;
    },

    reorderMediaBatch: async (updates: { id: number, order_index: number }[]) => {
        const response = await api.post(`/repair/media/reorder-batch`, { updates });
        return response.data;
    },

    // Sections
    getSections: async (vehicle_id?: string) => {
        const response = await api.get('/repair/sections', { params: { vehicle_id } });
        return response.data;
    },

    createSection: async (data: any) => {
        const response = await api.post('/repair/sections', data);
        return response.data;
    },

    deleteSection: async (id: number) => {
        const response = await api.delete(`/repair/sections/${id}`);
        return response.data;
    }
};
