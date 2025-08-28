'use client';

import { useState, useEffect } from 'react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  theme?: {
    primaryColor: string;
    secondaryColor: string;
  };
  settings?: {
    features: string[];
    timezone: string;
    currency: string;
  };
}

export function useTenant() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        // Get tenant info from hostname or headers
        const response = await fetch('/api/tenant/current');
        
        if (!response.ok) {
          throw new Error('Failed to fetch tenant information');
        }

        const data = await response.json();
        setTenant(data.tenant);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Failed to fetch tenant:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenant();
  }, []);

  const updateTenant = async (updates: Partial<Tenant>) => {
    if (!tenant) return;

    try {
      const response = await fetch(`/api/tenants/${tenant.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update tenant');
      }

      const updatedTenant = await response.json();
      setTenant(updatedTenant.tenant);
      
      return updatedTenant.tenant;
    } catch (err) {
      console.error('Failed to update tenant:', err);
      throw err;
    }
  };

  return {
    tenant,
    isLoading,
    error,
    updateTenant,
  };
}