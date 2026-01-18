import axios from 'axios';
import { Department, Objective, KeyResult, ScoreLevel } from '../types/okr';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Department APIs
export const departmentApi = {
    getAll: () => api.get<Department[]>('/departments'),
    getById: (id: string) => api.get<Department>(`/departments/${id}`),
    create: (data: Partial<Department>) => api.post<Department>('/departments', data),
    update: (id: string, data: Partial<Department>) => api.put<Department>(`/departments/${id}`, data),
    delete: (id: string) => api.delete(`/departments/${id}`),
};

// Objective APIs
export const objectiveApi = {
    create: (departmentId: string, data: Partial<Objective>) =>
        api.post<Objective>(`/departments/${departmentId}/objectives`, data),
    update: (id: string, data: Partial<Objective>) =>
        api.put<Objective>(`/objectives/${id}`, data),
    delete: (id: string) => api.delete(`/objectives/${id}`),
};

// Key Result APIs
export const keyResultApi = {
    create: (objectiveId: string, data: Partial<KeyResult>) =>
        api.post<KeyResult>(`/objectives/${objectiveId}/key-results`, data),
    update: (id: string, data: Partial<KeyResult>) =>
        api.put<KeyResult>(`/key-results/${id}`, data),
    updateActualValue: (id: string, value: string) =>
        api.put<KeyResult>(`/key-results/${id}/actual-value`, { actualValue: value }),
    delete: (id: string) => api.delete(`/key-results/${id}`),
};

// Score Level APIs
export const scoreLevelApi = {
    getAll: () => api.get<ScoreLevel[]>('/score-levels'),
    updateAll: (levels: ScoreLevel[]) => api.put<ScoreLevel[]>('/score-levels', levels),
    resetToDefaults: () => api.post('/score-levels/reset'),
};

// Demo Data APIs
export const demoApi = {
    loadDemoData: () => api.post<Department[]>('/demo/load'),
};