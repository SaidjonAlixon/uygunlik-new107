import api from '@/lib/api';

export const adminApi = {
  getDashboardStats: () => api.get<{
    usersCount: number;
    activeTariffsCount: number;
    pendingPayments: number;
    todayRevenue: number;
    usersWithTariff: number;
  }>('/admin/dashboard/stats'),

  getUsers: (params: { page?: number; limit?: number; search?: string }) =>
    api.get<{ data: any[]; total: number; page: number; limit: number; totalPages: number }>('/admin/users', { params }),

  createUser: (data: { first_name: string; last_name: string; email: string; password: string; role?: string; status?: boolean }) =>
    api.post<{ user: any }>('/admin/users', data),

  getUser: (id: string) => api.get<{ user: any }>(`/admin/users/${id}`),

  updateUser: (id: string, data: Record<string, unknown>) =>
    api.put<{ user: any }>(`/admin/users/${id}`, data),

  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),

  grantTariff: (userId: string, tariffId: number | null) =>
    api.post<{ user: any }>(`/admin/users/${userId}/grant-tariff`, { tariffId }),

  getTariffs: () => api.get<any[]>('/admin/tariffs'),

  createTariff: (data: { name: string; description?: string; price: number }) =>
    api.post('/admin/tariffs', data),

  updateTariff: (id: number, data: { name?: string; description?: string; price?: number }) =>
    api.patch<{ id: number; name: string; description?: string; price: number }>(`/admin/tariffs/${id}`, data),

  deleteTariff: (id: number) => api.delete(`/admin/tariffs/${id}`),
};
