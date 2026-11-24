export type UserRole = 'owner' | 'kasir';

export type ShiftStatus = 'OPEN' | 'CLOSED';

export type PettyCashType = 'IN' | 'OUT';

export type StockRequestStatus = 'PENDING' | 'APPROVED' | 'RESTOCKED' | 'REJECTED';

export type PaymentMethod = 'cash' | 'qris' | 'transfer';

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
  role: UserRole | string;
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
}

export interface Transaction {
  id: string;
  invoice_number: string;
  cashier_id?: string;
  cashier_name?: string | null;
  shift_id?: string | null;
  payment_method: string;
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
  total_amount: number;
  cash_received: number;
  change_amount: number;
  items?: TransactionItem[];
}

export interface CartItem extends Product {
  qty: number;
}

export interface ReceiptModalData {
  transaction: Transaction | PublicReceipt;
  items: TransactionItem[];
}
