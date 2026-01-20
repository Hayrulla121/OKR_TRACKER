export enum Role {
  EMPLOYEE = 'EMPLOYEE',
  DEPARTMENT_LEADER = 'DEPARTMENT_LEADER',
  HR = 'HR',
  DIRECTOR = 'DIRECTOR',
  BUSINESS_BLOCK = 'BUSINESS_BLOCK',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: Role;
  departmentId?: string;
  departmentName?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  type: string;
  user: User;
}
