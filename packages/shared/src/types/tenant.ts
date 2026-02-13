export interface Tenant {
  id: number;
  name: string;
  slug: string;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  tenantId: number;
  email: string;
  fullName: string;
  role: 'admin' | 'manager' | 'analyst';
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: number;
  tenantId: number;
  name: string;
  industry: string | null;
  logoUrl: string | null;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
