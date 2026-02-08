import api from './auth.service';

export interface Vehicle {
    id: number;
    plate_number: string;
    equipment_name: string | null;
    vehicle_type: string;
    model: string | null;
    manufacturer: string | null;
    year: number | null;
    vin: string | null;
    current_km: number;
    engine_type: string | null;
    fuel_type: string | null;
    status: 'active' | 'inactive' | 'maintenance' | 'retired';
    last_maintenance_date: string | null;
    next_maintenance_km: number | null;
    image_url: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export const vehiclesService = {
    getAll: async (params?: { page?: number, limit?: number, status?: string, search?: string }) => {
        const response = await api.get('/vehicles', { params });
        return response.data;
    },

    getById: async (id: number) => {
        const response = await api.get(`/vehicles/${id}`);
        return response.data;
    },

    create: async (data: any) => {
        const response = await api.post('/vehicles', data);
        return response.data;
    },

    update: async (id: number, data: any) => {
        const response = await api.put(`/vehicles/${id}`, data);
        return response.data;
    },

    updateStatus: async (id: number, status: string) => {
        const response = await api.patch(`/vehicles/${id}/status`, { status });
        return response.data;
    },

    updateKm: async (id: number, current_km: number) => {
        const response = await api.patch(`/vehicles/${id}/km`, { current_km });
        return response.data;
    },

    getStats: async (id: number) => {
        const response = await api.get(`/vehicles/${id}/stats`);
        return response.data;
    },

    delete: async (id: number) => {
        const response = await api.delete(`/vehicles/${id}`);
        return response.data;
    },

    getSpecs: async (id: number) => {
        const response = await api.get(`/vehicles/${id}/specs`);
        return response.data;
    },

    saveSpecs: async (id: number, data: VehicleSpecs) => {
        const response = await api.post(`/vehicles/${id}/specs`, data);
        return response.data;
    }
};

export interface VehicleSpecs {
    id?: number;
    vehicle_id?: number;
    length?: number;
    width?: number;
    height?: number;
    gross_weight?: number;
    payload_capacity?: number;
    power_hp?: number;
    torque_nm?: number;
    engine_displacement?: number;
    transmission_type?: string;
    fuel_tank_capacity?: number;
    oil_capacity?: number;
    tire_size?: string;
    tire_pressure_psi?: string;
    battery_voltage?: string;
    custom_specs?: Array<{ key: string; value: string }>;
    updated_at?: string;
}
