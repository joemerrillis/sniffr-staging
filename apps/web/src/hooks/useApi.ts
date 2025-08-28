'use client';

import { useState, useCallback } from 'react';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T = any>(initialData: T | null = null) {
  const [state, setState] = useState<ApiState<T>>({
    data: initialData,
    loading: false,
    error: null,
  });

  const request = useCallback(async (url: string, options: ApiOptions = {}) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const config: RequestInit = {
        method: options.method || 'GET',
        headers,
      };

      if (options.body && (options.method === 'POST' || options.method === 'PATCH' || options.method === 'PUT')) {
        config.body = JSON.stringify(options.body);
      }

      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }

      const data = await response.json();
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const get = useCallback((url: string, headers?: Record<string, string>) => 
    request(url, { method: 'GET', headers }), [request]);

  const post = useCallback((url: string, body?: any, headers?: Record<string, string>) => 
    request(url, { method: 'POST', body, headers }), [request]);

  const patch = useCallback((url: string, body?: any, headers?: Record<string, string>) => 
    request(url, { method: 'PATCH', body, headers }), [request]);

  const put = useCallback((url: string, body?: any, headers?: Record<string, string>) => 
    request(url, { method: 'PUT', body, headers }), [request]);

  const del = useCallback((url: string, headers?: Record<string, string>) => 
    request(url, { method: 'DELETE', headers }), [request]);

  const reset = useCallback(() => {
    setState({ data: initialData, loading: false, error: null });
  }, [initialData]);

  return {
    ...state,
    request,
    get,
    post,
    patch,
    put,
    delete: del,
    reset,
  };
}