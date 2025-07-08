import axios from 'axios';
import {
  AuthResponse,
  MenuItem,
  Order,
  Reservation,
  ReservationsResponse,
  Review,
  ReviewsResponse,
  UsersResponse,
  Branch,
  Cart,
  CartItem
} from '../types';

const API_URL = 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Authentication APIs
export const signup = async (username: string, email: string, password: string): Promise<AuthResponse> => {
  const response = await api.post('/auth/signup', { username, email, password });
  return response.data;
};

export const login = async (username: string, password: string): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', { username, password });
  return response.data;
};

// Menu APIs
export const getMenu = async (): Promise<MenuItem[]> => {
  const response = await api.get('/api/menu');
  return response.data;
};

export const getMenuByCategory = async (category: string): Promise<MenuItem[]> => {
  const response = await api.get(`/api/menu/category/${category}`);
  return response.data;
};

export const getFeaturedMenuItems = async (): Promise<MenuItem[]> => {
  const response = await api.get('/api/menu/featured');
  return response.data;
};

export const getMenuItem = async (id: number): Promise<MenuItem> => {
  const response = await api.get(`/api/menu/${id}`);
  return response.data;
};

// Order APIs
export const createOrder = async (
  items: { menuItemId: number; quantity: number }[],
  branchId?: number,
  total?: number,
  paymentMethod?: string,
  discount?: number,
  discountType?: 'AMOUNT' | 'PERCENTAGE'
): Promise<Order> => {
  const response = await api.post('/api/orders', { items, branchId, total, paymentMethod, discount, discountType });
  return response.data;
};

export const getUserOrders = async (userId: number): Promise<Order[]> => {
  const response = await api.get(`/api/orders/user/${userId}`);
  return response.data;
};

export const getAllOrders = async (): Promise<Order[]> => {
  const response = await api.get('/api/orders');
  return response.data;
};

export const getMyOrders = async (): Promise<Order[]> => {
  const response = await api.get('/api/orders/my');
  return response.data;
};

export const getOrdersByStatus = async (status: string): Promise<Order[]> => {
  const response = await api.get(`/api/orders/status/${status}`);
  return response.data;
};

export const updateOrderStatus = async (
  id: number,
  status: string
): Promise<Order> => {
  const response = await api.patch(`/api/orders/${id}/status`, { status });
  return response.data;
};

export const cancelOrder = async (id: number): Promise<Order> => {
  const response = await api.patch(`/api/orders/${id}/cancel`);
  return response.data;
};

// Generate receipt for an order
export const generateReceipt = async (orderId: number): Promise<{ receiptNumber: string; generatedAt: string; order: Order }> => {
  const response = await api.post(`/api/orders/${orderId}/receipt`);
  return response.data;
};

// Reservation APIs
export const createReservation = async (
  date: string,
  time: string,
  partySize: number,
  paymentMethod: string,
  depositAmount: number,
  branchId?: number,
  notes?: string
): Promise<Reservation> => {
  const response = await api.post('/api/reservations', { date, time, partySize, branchId, notes, paymentMethod, depositAmount });
  return response.data;
};

export const getUserReservations = async (): Promise<Reservation[]> => {
  const response = await api.get('/api/reservations/my');
  return response.data;
};

export const getAllReservations = async (
  branchId?: number,
  status?: string,
  page: number = 1,
  limit: number = 10
): Promise<ReservationsResponse> => {
  const response = await api.get('/api/reservations', { 
    params: { branchId, status, page, limit } 
  });
  return response.data;
};

export const getReservationById = async (id: number): Promise<Reservation> => {
  const response = await api.get(`/api/reservations/${id}`);
  return response.data;
};

export const updateReservationStatus = async (
  id: number,
  status: string
): Promise<Reservation> => {
  const response = await api.patch(`/api/reservations/${id}/status`, { status });
  return response.data;
};

export const cancelReservation = async (id: number): Promise<Reservation> => {
  const response = await api.patch(`/api/reservations/${id}/cancel`);
  return response.data;
};

// Review APIs
export const createReview = async (
  rating: number,
  comment?: string
): Promise<Review> => {
  const response = await api.post('/api/reviews', { rating, comment });
  return response.data;
};

export const getReviews = async (
  page: number = 1,
  limit: number = 10
): Promise<ReviewsResponse> => {
  const response = await api.get('/api/reviews', { params: { page, limit } });
  return response.data;
};

// Admin APIs
export const getAllUsers = async (
  page: number = 1,
  limit: number = 10
): Promise<UsersResponse> => {
  const response = await api.get('/api/users/users', { params: { page, limit } });
  return response.data;
};

export const createMenuItem = async (
  name: string,
  description: string,
  price: number,
  category: string,
  imageUrl?: string
): Promise<MenuItem> => {
  const response = await api.post('/api/menu', { name, description, price, category, imageUrl });
  return response.data;
};

export const updateMenuItem = async (
  id: number,
  updates: Partial<MenuItem>
): Promise<MenuItem> => {
  const response = await api.put(`/api/menu/${id}`, updates);
  return response.data;
};

export const deleteMenuItem = async (id: number): Promise<void> => {
  await api.delete(`/api/menu/${id}`);
};

// Branch APIs
export const getBranches = async (): Promise<Branch[]> => {
  const response = await api.get('/api/branches');
  return response.data;
};

export const getBranchById = async (id: number): Promise<Branch> => {
  const response = await api.get(`/api/branches/${id}`);
  return response.data;
};

// Cart APIs
export const getCart = async (): Promise<Cart> => {
  const response = await api.get('/api/cart');
  return response.data;
};

export const addToCart = async (menuItemId: number, quantity: number = 1): Promise<CartItem> => {
  const response = await api.post('/api/cart/add', { menuItemId, quantity });
  return response.data;
};

export const updateCartItem = async (cartItemId: number, quantity: number): Promise<CartItem> => {
  const response = await api.put(`/api/cart/items/${cartItemId}`, { quantity });
  return response.data;
};

export const removeFromCart = async (cartItemId: number): Promise<void> => {
  await api.delete(`/api/cart/items/${cartItemId}`);
};

export const clearCart = async (): Promise<void> => {
  await api.delete('/api/cart/clear');
};

export const checkoutCart = async (
  paymentMethod: string,
  branchId?: number,
  walkInCustomer?: { name?: string; phone?: string }
): Promise<Order> => {
  const response = await api.post('/api/cart/checkout', { branchId, paymentMethod, walkInCustomer });
  return response.data;
};

// Admin User Management APIs
export const createUser = async (
  username: string,
  password: string,
  role: string,
  branchId?: number
): Promise<any> => {
  const response = await api.post('/api/users', { username, password, role, branchId });
  return response.data;
};

export const updateUser = async (
  id: number,
  updates: { username?: string; password?: string; branchId?: number }
): Promise<any> => {
  const response = await api.put(`/api/users/${id}`, updates);
  return response.data;
};

export const updateUserRole = async (
  id: number,
  role: string
): Promise<any> => {
  const response = await api.patch(`/api/users/${id}/role`, { role });
  return response.data;
};

export const deleteUser = async (id: number): Promise<void> => {
  await api.delete(`/api/users/${id}`);
};

// Get current user profile
export const getMe = async () => {
  const response = await api.get('/api/users/me');
  return response.data;
};

// Combined Orders and Reservations API
export const getBranchOrdersAndReservations = async (branchId: number) => {
  const response = await api.get(`/api/branch/${branchId}/orders-and-reservations`);
  return response.data;
};

// Branch manager staff management APIs
export const branchManagerCreateStaff = async (username: string, password: string, role: string): Promise<any> => {
  const response = await api.post('/api/users/branch-staff', { username, password, role });
  return response.data;
};

export const branchManagerUpdateStaff = async (id: number, updates: { username?: string; password?: string; role?: string }): Promise<any> => {
  const response = await api.put(`/api/users/branch-staff/${id}`, updates);
  return response.data;
};

export const branchManagerDeleteStaff = async (id: number): Promise<void> => {
  await api.delete(`/api/users/branch-staff/${id}`);
};

export const branchManagerGetStaff = async (): Promise<any> => {
  const response = await api.get('/api/users/branch-staff');
  return response.data;
};

// Analytics APIs
export const getHqAnalytics = async () => {
  const response = await api.get('/api/analytics');
  return response.data;
};

// Set order payment status to COMPLETED (for cashier)
export const setOrderPaymentCompleted = async (orderId: number): Promise<Order> => {
  const response = await api.patch(`/api/orders/${orderId}/payment-completed`);
  return response.data;
};
