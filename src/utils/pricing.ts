import type { DiscountType } from '../types/pos';

export interface PricingItemInput {
  sell_price: number;
  qty: number;
  discount_type?: DiscountType;
  discount_value?: number;
}

export interface LinePricingResult {
  lineGross: number;
  discountType: DiscountType;
  discountValue: number;
  itemDiscountAmount: number;
  lineNet: number;
}

export interface OrderPricingInput {
  items: PricingItemInput[];
  discountType?: DiscountType;
  discountValue?: number;
  taxEnabled?: boolean;
  taxRate?: number;
  applyTax?: boolean | null;
}

export interface OrderPricingResult {
  items: LinePricingResult[];
  grossTotal: number;
  itemDiscountTotal: number;
  subtotalAmount: number;
  orderDiscountType: DiscountType;
  orderDiscountValue: number;
  orderDiscountAmount: number;
  totalDiscountAmount: number;
  afterDiscount: number;
  taxEnabled: boolean;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
}

function sanitizeNonNegative(value: number | null | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return value;
}

export function calculateDiscountAmount(
  baseAmount: number,
  discountType: DiscountType = 'nominal',
  discountValue = 0
): number {
  const base = Math.max(0, Math.round(sanitizeNonNegative(baseAmount)));
  const val = sanitizeNonNegative(discountValue);
  if (base === 0 || val === 0) {
    return 0;
  }

  if (discountType === 'percent') {
    const pct = Math.min(100, val);
    return Math.max(0, Math.min(base, Math.round((base * pct) / 100)));
  }

  return Math.max(0, Math.min(base, Math.round(val)));
}

export function calculateLinePricing(item: PricingItemInput): LinePricingResult {
  const price = sanitizeNonNegative(item.sell_price);
  const qty = sanitizeNonNegative(item.qty);
  const lineGross = Math.max(0, Math.round(price * qty));
  const discountType: DiscountType = item.discount_type === 'percent' ? 'percent' : 'nominal';
  const rawDiscountValue = sanitizeNonNegative(item.discount_value);
  const discountValue =
    discountType === 'percent' ? Math.min(100, rawDiscountValue) : rawDiscountValue;
  const itemDiscountAmount = calculateDiscountAmount(lineGross, discountType, discountValue);
  const lineNet = Math.max(0, lineGross - itemDiscountAmount);

  return {
    lineGross,
    discountType,
    discountValue,
    itemDiscountAmount,
    lineNet,
  };
}

export function calculateOrderPricing(input: OrderPricingInput): OrderPricingResult {
  const lines = input.items.map(calculateLinePricing);
  const grossTotal = lines.reduce((sum, line) => sum + line.lineGross, 0);
  const itemDiscountTotal = lines.reduce((sum, line) => sum + line.itemDiscountAmount, 0);
  const subtotalAmount = lines.reduce((sum, line) => sum + line.lineNet, 0);

  const orderDiscountType: DiscountType =
    input.discountType === 'percent' ? 'percent' : 'nominal';
  const rawOrderDiscountValue = sanitizeNonNegative(input.discountValue);
  const orderDiscountValue =
    orderDiscountType === 'percent'
      ? Math.min(100, rawOrderDiscountValue)
      : rawOrderDiscountValue;
  const orderDiscountAmount = calculateDiscountAmount(
    subtotalAmount,
    orderDiscountType,
    orderDiscountValue
  );
  const totalDiscountAmount = itemDiscountTotal + orderDiscountAmount;
  const afterDiscount = Math.max(0, subtotalAmount - orderDiscountAmount);

  const effectiveTaxEnabled = Boolean(input.taxEnabled) && (input.applyTax ?? true);
  const effectiveTaxRate = effectiveTaxEnabled
    ? Math.min(100, sanitizeNonNegative(input.taxRate))
    : 0;
  const taxAmount =
    effectiveTaxEnabled && effectiveTaxRate > 0
      ? Math.max(0, Math.round((afterDiscount * effectiveTaxRate) / 100))
      : 0;
  const totalAmount = Math.max(0, afterDiscount + taxAmount);

  return {
    items: lines,
    grossTotal,
    itemDiscountTotal,
    subtotalAmount,
    orderDiscountType,
    orderDiscountValue,
    orderDiscountAmount,
    totalDiscountAmount,
    afterDiscount,
    taxEnabled: effectiveTaxEnabled,
    taxRate: effectiveTaxRate,
    taxAmount,
    totalAmount,
  };
}

export function calculateChangeAmount(cashReceived: number, totalAmount: number): number {
  const cash = Math.round(sanitizeNonNegative(cashReceived));
  const total = Math.round(sanitizeNonNegative(totalAmount));
  return Math.max(0, cash - total);
}
