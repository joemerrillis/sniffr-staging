const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Core API Types based on OpenAPI spec
export interface ApiEnvelope<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'staff' | 'customer';
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface Dog {
  id: string;
  name: string;
  breed?: string;
  age?: number;
  weight?: number;
  color?: string;
  gender?: 'male' | 'female';
  fixed?: boolean;
  medications?: string[];
  allergies?: string[];
  notes?: string;
  household_id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface Walk {
  id: string;
  dog_ids: string[];
  walker_id: string;
  scheduled_start: string;
  scheduled_end: string;
  actual_start?: string;
  actual_end?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  route?: Record<string, unknown>;
  notes?: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface Household {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  notes?: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface Chat {
  id: string;
  participants: string[];
  name?: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  user_id: string;
  content: string;
  message_type: 'text' | 'image' | 'system';
  metadata?: Record<string, unknown>;
  tenant_id: string;
  created_at: string;
}

export interface WalkReport {
  id: string;
  walk_id: string;
  report_data: Record<string, unknown>;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface BoardingReport {
  id: string;
  boarding_session_id: string;
  report_data: Record<string, unknown>;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiEnvelope<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const tenant = typeof window !== 'undefined' ? localStorage.getItem('tenant_id') : null;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(tenant && { 'X-Tenant-ID': tenant }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || data.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  async get<T>(endpoint: string, params?: Record<string, string | number>): Promise<ApiEnvelope<T>> {
    const url = params ? `${endpoint}?${new URLSearchParams(params as Record<string, string>)}` : endpoint;
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<ApiEnvelope<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<ApiEnvelope<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<ApiEnvelope<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiEnvelope<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.post<{ user: User; token: string }>('/auth/login', {
      email,
      password,
    });
  }

  async register(data: { email: string; password: string; name: string; tenant_id?: string }) {
    return this.post<{ user: User; token: string }>('/auth/register', data);
  }

  async logout() {
    return this.post<{ success: boolean }>('/auth/logout');
  }

  async refreshToken() {
    return this.post<{ token: string }>('/auth/refresh');
  }

  async getCurrentUser() {
    return this.get<User>('/auth/me');
  }

  async updateProfile(data: Partial<Pick<User, 'name' | 'email'>>) {
    return this.patch<User>('/auth/profile', data);
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.patch<{ success: boolean }>('/auth/password', {
      currentPassword,
      newPassword,
    });
  }

  // Dogs endpoints
  async getDogs(params?: { household_id?: string; limit?: number; offset?: number }) {
    return this.get<Dog[]>('/dogs', params);
  }

  async getDog(id: string) {
    return this.get<Dog>(`/dogs/${id}`);
  }

  async createDog(data: Omit<Dog, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) {
    return this.post<Dog>('/dogs', data);
  }

  async updateDog(id: string, data: Partial<Omit<Dog, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>) {
    return this.patch<Dog>(`/dogs/${id}`, data);
  }

  async deleteDog(id: string) {
    return this.delete<{ success: boolean }>(`/dogs/${id}`);
  }

  // Walks endpoints
  async getWalks(params?: {
    walker_id?: string;
    dog_id?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  }) {
    return this.get<Walk[]>('/walks', params);
  }

  async getWalk(id: string) {
    return this.get<Walk>(`/walks/${id}`);
  }

  async createWalk(data: Omit<Walk, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) {
    return this.post<Walk>('/walks', data);
  }

  async updateWalk(id: string, data: Partial<Omit<Walk, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>) {
    return this.patch<Walk>(`/walks/${id}`, data);
  }

  async deleteWalk(id: string) {
    return this.delete<{ success: boolean }>(`/walks/${id}`);
  }

  async startWalk(id: string) {
    return this.patch<Walk>(`/walks/${id}/start`);
  }

  async endWalk(id: string) {
    return this.patch<Walk>(`/walks/${id}/end`);
  }

  async cancelWalk(id: string, reason?: string) {
    return this.patch<Walk>(`/walks/${id}/cancel`, { reason });
  }

  // Households endpoints
  async getHouseholds(params?: { limit?: number; offset?: number }) {
    return this.get<Household[]>('/households', params);
  }

  async getHousehold(id: string) {
    return this.get<Household>(`/households/${id}`);
  }

  async createHousehold(data: Omit<Household, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) {
    return this.post<Household>('/households', data);
  }

  async updateHousehold(id: string, data: Partial<Omit<Household, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>) {
    return this.patch<Household>(`/households/${id}`, data);
  }

  async deleteHousehold(id: string) {
    return this.delete<{ success: boolean }>(`/households/${id}`);
  }

  // Chat endpoints
  async getChats(params?: { user_id?: string; limit?: number; offset?: number }) {
    return this.get<Chat[]>('/chats', params);
  }

  async getChat(id: string) {
    return this.get<Chat>(`/chats/${id}`);
  }

  async createChat(data: { participants: string[]; name?: string }) {
    return this.post<Chat>('/chats', data);
  }

  async getMessages(chatId: string, params?: { limit?: number; offset?: number; before?: string }) {
    return this.get<Message[]>(`/chats/${chatId}/messages`, params);
  }

  async sendMessage(chatId: string, data: {
    content: string;
    message_type?: 'text' | 'image' | 'system';
    metadata?: Record<string, unknown>;
  }) {
    return this.post<Message>(`/chats/${chatId}/messages`, data);
  }

  // Walk Reports endpoints
  async getWalkReports(params?: { walk_id?: string; limit?: number; offset?: number }) {
    return this.get<WalkReport[]>('/walk-reports', params);
  }

  async getWalkReport(id: string) {
    return this.get<WalkReport>(`/walk-reports/${id}`);
  }

  async createWalkReport(data: Omit<WalkReport, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) {
    return this.post<WalkReport>('/walk-reports', data);
  }

  async updateWalkReport(id: string, data: Partial<Omit<WalkReport, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>) {
    return this.patch<WalkReport>(`/walk-reports/${id}`, data);
  }

  // Boarding Reports endpoints
  async getBoardingReports(params?: { boarding_session_id?: string; limit?: number; offset?: number }) {
    return this.get<BoardingReport[]>('/boarding-reports', params);
  }

  async getBoardingReport(id: string) {
    return this.get<BoardingReport>(`/boarding-reports/${id}`);
  }

  async createBoardingReport(data: Omit<BoardingReport, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) {
    return this.post<BoardingReport>('/boarding-reports', data);
  }

  async updateBoardingReport(id: string, data: Partial<Omit<BoardingReport, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>) {
    return this.patch<BoardingReport>(`/boarding-reports/${id}`, data);
  }

  // Health check
  async healthCheck() {
    return this.get<{ ok: boolean; timestamp: string }>('/health');
  }
}

export const apiClient = new ApiClient();
export default apiClient;