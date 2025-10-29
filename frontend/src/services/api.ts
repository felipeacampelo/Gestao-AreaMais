import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

// Função para obter o CSRF token do cookie
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptor para adicionar token de autenticação e CSRF token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  
  // Adicionar CSRF token para métodos que modificam dados
  const csrfToken = getCookie('csrftoken');
  if (csrfToken && ['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
    config.headers['X-CSRFToken'] = csrfToken;
  }
  
  return config;
});

export interface Product {
  id: number;
  name: string;
  description: string;
  image: string | null;
  base_price: string;
  max_installments: number;
  is_active: boolean;
  event_date?: string;
  active_batch?: Batch;
}

export interface Batch {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  price: string;
  pix_discount_percentage: string;
  pix_price: number;
  max_enrollments: number;
  current_enrollments: number;
  is_full: boolean;
  status: string;
}

export interface Enrollment {
  id: number;
  user_email?: string;
  product?: Product;
  batch?: Batch;
  product_name?: string;
  batch_name?: string;
  form_data?: any;
  status: string;
  payment_method?: string | null;
  installments?: number;
  total_amount?: string;
  discount_amount?: string;
  final_amount: string;
  created_at: string;
  paid_at?: string | null;
  payments?: Payment[];
}

export interface Payment {
  id: number;
  enrollment: any;
  asaas_payment_id: string;
  installment_number: number;
  amount: string;
  status: string;
  due_date: string;
  paid_at: string | null;
  payment_url: string;
  pix_qr_code: string;
  pix_copy_paste: string;
  created_at: string;
}

// Auth (old - to be removed or migrated)
// export const login = (email: string, password: string) =>
//   api.post('/auth/login/', { email, password });
// export const logout = () => api.post('/auth/logout/');
// export const getMe = () => api.get('/auth/me/');

// Products
export const getProducts = () => api.get<{ results: Product[] }>('/products/products/');

export const getProduct = (id: number) =>
  api.get<Product>(`/products/products/${id}/`);

// Enrollments
export const createEnrollment = (data: {
  product_id: number;
  batch_id: number;
  form_data: any;
}) => api.post<Enrollment>('/enrollments/', data);

export const getEnrollments = () => api.get<Enrollment[]>('/enrollments/');

export const getEnrollment = (id: number) =>
  api.get<Enrollment>(`/enrollments/${id}/`);

// Payments
export const createPayment = (data: {
  enrollment_id: number;
  payment_method: string;
  installments: number;
  credit_card_token?: string;
  credit_card_data?: {
    number: string;
    holderName: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
}) => api.post<Payment>('/payments/', data);

export const calculatePayment = (data: {
  enrollment_id: number;
  payment_method: string;
  installments: number;
}) => api.post('/payments/calculate/', data);

// Authentication
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_superuser: boolean;
  profile?: {
    phone: string;
    cpf: string;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const register = (data: {
  email: string;
  password: string;
  password2: string;
  first_name: string;
  last_name: string;
  phone?: string;
  cpf?: string;
}) => api.post<AuthResponse>('/users/register/', data);

export const login = (email: string, password: string) =>
  api.post<AuthResponse>('/users/login/', { email, password });

export const logout = () => api.post('/users/logout/');

export const getCurrentUser = () => api.get<User>('/users/profile/');

export const changePassword = (data: {
  old_password: string;
  new_password: string;
  new_password2: string;
}) => api.post('/users/change-password/', data);

// Admin endpoints
export const getAdminDashboard = () => api.get('/users/admin/dashboard/');

export const getAdminEnrollments = (params?: {
  status?: string;
  product?: number;
  search?: string;
  payment_method?: string;
}) => api.get('/users/admin/enrollments/', { params });

export const updateAdminEnrollment = (id: number, data: { status: string }) =>
  api.patch(`/users/admin/enrollments/${id}/`, data);

export const getAdminProducts = () => api.get('/users/admin/products/');

export const createAdminProduct = (data: any) =>
  api.post('/users/admin/products/create/', data);

export const updateAdminProduct = (id: number, data: any) =>
  api.patch(`/users/admin/products/${id}/`, data);

export const deleteAdminProduct = (id: number) =>
  api.delete(`/users/admin/products/${id}/delete/`);

export const createAdminBatch = (data: any) =>
  api.post('/users/admin/batches/create/', data);

export const updateAdminBatch = (id: number, data: any) =>
  api.patch(`/users/admin/batches/${id}/`, data);

export const deleteAdminBatch = (id: number) =>
  api.delete(`/users/admin/batches/${id}/delete/`);

export default api;
