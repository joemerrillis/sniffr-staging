const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Tenant-specific endpoints
  async getCurrentTenant() {
    return this.get<{ tenant: any }>('/tenant/current');
  }

  async updateTenant(tenantId: string, data: any) {
    return this.patch<{ tenant: any }>(`/tenants/${tenantId}`, data);
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.post<{ user: any; token: string }>('/auth/login', {
      email,
      password,
    });
  }

  async signup(email: string, password: string, name: string) {
    return this.post<{ user: any; token: string }>('/auth/signup', {
      email,
      password,
      name,
    });
  }

  async logout() {
    return this.post<void>('/auth/logout');
  }

  async getCurrentUser() {
    return this.get<{ user: any }>('/auth/me');
  }

  // Dogs endpoints
  async getDogs() {
    return this.get<{ dogs: any[] }>('/dogs');
  }

  async getDog(id: string) {
    return this.get<{ dog: any }>(`/dogs/${id}`);
  }

  async createDog(data: any) {
    return this.post<{ dog: any }>('/dogs', data);
  }

  async updateDog(id: string, data: any) {
    return this.patch<{ dog: any }>(`/dogs/${id}`, data);
  }

  async deleteDog(id: string) {
    return this.delete<void>(`/dogs/${id}`);
  }

  // Walks endpoints
  async getWalks() {
    return this.get<{ walks: any[] }>('/walks');
  }

  async getWalk(id: string) {
    return this.get<{ walk: any }>(`/walks/${id}`);
  }

  async createWalk(data: any) {
    return this.post<{ walk: any }>('/walks', data);
  }

  async updateWalk(id: string, data: any) {
    return this.patch<{ walk: any }>(`/walks/${id}`, data);
  }

  async deleteWalk(id: string) {
    return this.delete<void>(`/walks/${id}`);
  }

  // Boarding endpoints
  async getBoardings() {
    return this.get<{ boardings: any[] }>('/boardings');
  }

  async createBoarding(data: any) {
    return this.post<{ boarding: any }>('/boardings', data);
  }

  // Chat endpoints
  async getChats() {
    return this.get<{ chats: any[] }>('/chats');
  }

  async getMessages(chatId: string) {
    return this.get<{ messages: any[] }>(`/chats/${chatId}/messages`);
  }

  async sendMessage(chatId: string, content: string) {
    return this.post<{ message: any }>(`/chats/${chatId}/messages`, {
      content,
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient;