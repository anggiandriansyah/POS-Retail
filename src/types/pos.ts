export type UserRole = 'owner' | 'kasir' | 'admin' | 'user' | 'superadmin';

export function isAdminRole(role?: string | null): boolean {
  return role === 'owner' || role === 'admin' || role === 'superadmin';
}

export function isSuperAdminRole(role?: string | null): boolean {
  return role === 'superadmin';
}

export type DiscountType = 'nominal' | 'percent';

export type ShiftStatus = 'OPEN' | 'CLOSED';

export type PettyCashType = 'IN' | 'OUT';

export type StockRequestStatus = 'PENDING' | 'APPROVED' | 'RESTOCKED' | 'REJECTED';

export type PaymentMethod = 'cash' | 'qris' | 'transfer';

export interface StoreSettings {
  id?: number;
  store_name: string;
  address: string;
  phone: string;
  footer_note: string;
  tax_enabled: boolean;
  tax_rate: number;
  updated_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface FeedbackMessage {
  type: 'error' | 'success';
  text: string;
}

export interface Product {
  id: string;
  barcode: string;
  name: string;
  category: string | null;
  buy_price: number;
  sell_price: number;
  stock: number;
  min_stock: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Profile {
  id: string;
  full_name: string;
  username?: string | null;
  email?: string | null;
  role: UserRole;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Shift {
  id: string;
  cashier_id: string;
  status: ShiftStatus | string;
  opening_cash: number;
  expected_cash?: number | null;
  actual_cash?: number | null;
  discrepancy?: number | null;
  notes?: string | null;
  opened_at: string;
  closed_at?: string | null;
  cashier?: {
    full_name: string;
  } | null;
}

export interface PettyCashLog {
  id: string;
  shift_id: string;
  cashier_id: string;
  type: PettyCashType | string;
  amount: number;
  category: string;
  description?: string | null;
  created_at: string;
}

export interface TransactionItem {
  id?: string;
  transaction_id?: string;
  product_id?: string;
  product_name: string;
  price: number;
  cost_price?: number | null;
  qty: number;
  subtotal: number;
  discount_type?: DiscountType | string;
  discount_value?: number;
  discount_amount?: number;
}

export interface Transaction {
  id: string;
  invoice_number: string;
  cashier_id?: string;
  cashier_name?: string | null;
  shift_id?: string | null;
  payment_method: string;
  subtotal_amount?: number;
  discount_type?: DiscountType | string;
  discount_value?: number;
  discount_amount?: number;
  tax_rate?: number;
  tax_amount?: number;
  total_amount: number;
  cash_received: number;
  change_amount: number;
  created_at: string;
  transaction_items?: TransactionItem[];
  cashier?: {
    full_name: string;
  } | null;
}

export interface StockRequest {
  id: string;
  requested_by: string;
  product_id?: string | null;
  product_name: string;
  requested_qty: number;
  note?: string | null;
  status: StockRequestStatus | string;
  created_at: string;
  resolved_at?: string | null;
}

export interface StockLog {
  id: string;
  product_id: string;
  type: 'in' | 'out' | string;
  qty: number;
  note?: string | null;
  created_at: string;
  products?: {
    name: string;
    barcode: string;
  } | null;
}

export interface PublicReceipt {
  id?: string;
  invoice_number: string;
  created_at: string;
  cashier_name?: string | null;
  payment_method: string;
  subtotal_amount?: number;
  discount_type?: DiscountType | string;
  discount_value?: number;
  discount_amount?: number;
  tax_rate?: number;
  tax_amount?: number;
  total_amount: number;
  cash_received: number;
  change_amount: number;
  items?: TransactionItem[];
  store_settings?: StoreSettings | null;
}

export interface CartItem extends Product {
  qty: number;
  discount_type?: DiscountType;
  discount_value?: number;
}

export interface ReceiptModalData {
  transaction: Transaction | PublicReceipt;
  items: TransactionItem[];
}
