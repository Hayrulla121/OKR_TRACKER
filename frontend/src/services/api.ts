import axios from 'axios';
import { Department, Objective, KeyResult, ScoreLevel } from '../types/okr';
import { LoginRequest, LoginResponse, User } from '../types/auth';
import { Evaluation, EvaluationCreateRequest, DepartmentScoreResult } from '../types/evaluation';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add JWT token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Handle authentication errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

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

// Authentication APIs
export const authApi = {
    login: (data: LoginRequest) => api.post<LoginResponse>('/auth/login', data),
    register: (data: any) => api.post<User>('/auth/register', data),
    getCurrentUser: () => api.get<User>('/auth/me'),
};

// Evaluation APIs
export const evaluationApi = {
    create: (data: EvaluationCreateRequest) => api.post<Evaluation>('/evaluations', data),
    submit: (id: string) => api.post<Evaluation>(`/evaluations/${id}/submit`),
    getForTarget: (type: string, id: string) => api.get<Evaluation[]>(`/evaluations/target/${type}/${id}`),
    getMy: () => api.get<Evaluation[]>('/evaluations/my'),
    delete: (id: string) => api.delete(`/evaluations/${id}`),
};

// Department Scores API
export const departmentScoresApi = {
    getScores: (id: string) => api.get<DepartmentScoreResult>(`/departments/${id}/scores`),
};