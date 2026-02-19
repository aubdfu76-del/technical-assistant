import api from './auth.service';

export interface ChatResponse {
    answer: string;
    citations: Citation[];
    confidence: number;
    session_id?: string;
}

export interface Citation {
    doc_title: string;
    doc_id: string;
    page?: number;
    pages?: number[];
    snippet: string;
    link?: string;
    type?: 'manual' | 'fault' | 'vehicle';
}

export interface TechnicalManual {
    id: string;
    title: string;
    description: string;
    file_path: string;
    vehicle_type: string;
    file_size: string;
    created_at: string;
}

class AIService {
    async sendMessage(message: string, sessionId?: string, vehicleId?: string): Promise<ChatResponse> {
        const response = await api.post('/ai/chat', {
            message,
            session_id: sessionId,
            vehicle_id: vehicleId
        });
        return response.data;
    }

    async uploadManual(file: File, title: string, description: string, vehicleType: string): Promise<TechnicalManual> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);
        formData.append('description', description);
        formData.append('vehicle_type', vehicleType);

        const response = await api.post('/ai/manuals/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data.data;
    }

    async getManuals(): Promise<TechnicalManual[]> {
        const response = await api.get('/ai/manuals');
        return response.data.data || [];
    }

    async deleteManual(id: string): Promise<void> {
        await api.delete(`/ai/manuals/${id}`);
    }

    async reprocessManual(id: string): Promise<any> {
        const response = await api.post(`/ai/manuals/${id}/reprocess`);
        return response.data;
    }
}

export const aiService = new AIService();
