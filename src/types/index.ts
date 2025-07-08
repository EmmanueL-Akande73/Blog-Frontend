// Data models for Steakz Restaurant
export interface User {
  id: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'HEADQUARTER_MANAGER' | 'BRANCH_MANAGER' | 'CASHIER' | 'CHEF' | 'CUSTOMER';
  branchId?: number;
  branch?: {
    id: number;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: 'APPETIZER' | 'MAIN' | 'DESSERT' | 'BEVERAGE';
  imageUrl?: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Cart {
  id: number;
  userId: number;
  cartItems: CartItem[];
  total: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: number;
  cartId: number;
  menuItemId: number;
  menuItem: MenuItem;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: number;
  userId: number | null;
  user?: User;
  branchId?: number;
  branch?: Branch;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';
  total: number;
  paymentMethod: 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH' | 'DIGITAL_WALLET' | 'BANK_TRANSFER';
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED';
  orderItems: OrderItem[];
  discount?: number;
  discountType?: 'AMOUNT' | 'PERCENTAGE';
  walkInName?: string | null;
  walkInPhone?: string | null;
  createdAt: string;
  updatedAt: string;
  receiptNumber?: string;
  receiptGeneratedAt?: string;
}

export type PaymentMethodType = 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH' | 'DIGITAL_WALLET' | 'BANK_TRANSFER';
export type PaymentStatusType = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface PaymentInfo {
  method: PaymentMethodType;
  status: PaymentStatusType;
  cardNumber?: string; // Last 4 digits for display
  cardHolderName?: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  menuItemId: number;
  menuItem: MenuItem;
  quantity: number;
  price: number;
}

export interface Reservation {
  id: number;
  userId: number;
  user: User;
  branchId?: number;
  branch?: Branch;
  date: string;
  time: string;
  partySize: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  notes?: string;
  paymentMethod: 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH' | 'DIGITAL_WALLET' | 'BANK_TRANSFER';
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED';
  depositAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: number;
  userId: number;
  user: User;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface MenuResponse {
  items: MenuItem[];
  pagination: PaginationInfo;
}

export interface OrdersResponse {
  orders: Order[];
  pagination: PaginationInfo;
}

export interface ReservationsResponse {
  reservations: Reservation[];
  pagination: PaginationInfo;
}

export interface UsersResponse {
  users: User[];
  pagination: PaginationInfo;
}

export interface ReviewsResponse {
  reviews: Review[];
  pagination: PaginationInfo;
}

export interface Branch {
  id: number;
  name: string;
  address: string;
  city: string;
  district: string;
  phone: string;
  email: string;
  description?: string;
  features: string[];
  mondayHours?: string;
  tuesdayHours?: string;
  wednesdayHours?: string;
  thursdayHours?: string;
  fridayHours?: string;
  saturdayHours?: string;
  sundayHours?: string;
  isActive: boolean;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  updatedAt: string;
}
