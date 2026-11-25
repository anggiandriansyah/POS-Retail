import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
} from 'react-native';
import { CameraView } from 'expo-camera';
import { calculateOrderPricing } from '@shared/utils/pricing';
import { formatRupiah, generateInvoiceNumber } from '@shared/utils/format';
import type { DiscountType, Product } from '@shared/types/pos';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../lib/supabaseClient';
import { buildWhatsAppReceiptUrl } from '../utils/whatsapp';
import { printEscPosReceipt } from '../services/thermalPrinter';

interface CartEntry {
  product: Product;
  qty: number;
  discountType: DiscountType;
  discountValue: number;
}

export default function CashierScreen() {
  const { dict, palette, activeShift, storeSettings } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [orderDiscountType, setOrderDiscountType] = useState<DiscountType>('nominal');
  const [orderDiscountValue, setOrderDiscountValue] = useState('0');
  const [applyTax, setApplyTax] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris' | 'transfer'>('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [lastInvoice, setLastInvoice] = useState<{ invoice: string; total: number; cash: number; change: number } | null>(null);
  const [thermalPreview, setThermalPreview] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        if (data) setProducts(data as Product[]);
      });
  }, []);

  const pricing = useMemo(
    () =>
      calculateOrderPricing({
        items: cart.map((c) => ({
          sell_price: Number(c.product.sell_price),
          qty: c.qty,
          discount_type: c.discountType,
          discount_value: c.discountValue,
        })),
        discountType: orderDiscountType,
        discountValue: Number(orderDiscountValue) || 0,
        taxEnabled: Boolean(storeSettings.tax_enabled),
        taxRate: Number(storeSettings.tax_rate) || 0,
        applyTax,
      }),
    [cart, orderDiscountType, orderDiscountValue, storeSettings.tax_enabled, storeSettings.tax_rate, applyTax]
  );

  function addByBarcode(code: string) {
    const clean = code.trim().toLowerCase();
    const found = products.find((p) => p.barcode.toLowerCase() === clean);
    if (!found) {
      setStatusMsg(`${dict.pos.barcodeNotFoundMsg} "${code}"`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === found.id);
      if (existing) {
        return prev.map((c) => (c.product.id === found.id ? { ...c, qty: c.qty + 1 } : c));
      }
      return [...prev, { product: found, qty: 1, discountType: 'nominal', discountValue: 0 }];
    });
    setBarcodeInput('');
    setScannerOpen(false);
    setStatusMsg(null);
  }

  async function handleCheckout() {
    if (!activeShift) {
      setStatusMsg(dict.pos.shiftWarningTitle);
      return;
    }
    if (cart.length === 0) return;

    const invoice = generateInvoiceNumber();
    const cash = paymentMethod === 'cash' ? Number(cashReceived) || pricing.totalAmount : pricing.totalAmount;
    const { data, error } = await supabase.rpc('process_sale', {
      p_invoice_number: invoice,
      p_payment_method: paymentMethod,
      p_cash_received: cash,
      p_items: cart.map((c) => ({
        product_id: c.product.id,
        qty: c.qty,
        discount_type: c.discountType,
        discount_value: c.discountValue,
      })),
      p_discount_type: orderDiscountType,
      p_discount_value: Number(orderDiscountValue) || 0,
      p_apply_tax: applyTax,
    });
    if (error) {
      setStatusMsg(error.message);
      return;
    }

    const total = Number(data?.transaction?.total_amount ?? pricing.totalAmount);
    const change = Number(data?.transaction?.change_amount ?? Math.max(0, cash - total));
    setLastInvoice({ invoice, total, cash, change });
    setCart([]);
    setCashReceived('');
    setStatusMsg(`${dict.pos.txSuccessPrefix} (${invoice})`);
  }

  async function handlePrintThermal() {
    if (!lastInvoice) return;
    const res = await printEscPosReceipt({
      paperWidth: '58mm',
      storeName: storeSettings.store_name,
      invoiceNumber: lastInvoice.invoice,
      items: [],
      totalAmount: lastInvoice.total,
      cashReceived: lastInvoice.cash,
      changeAmount: lastInvoice.change,
      paymentMethod,
      footerNote: storeSettings.footer_note,
    });
    setThermalPreview(res.previewText);
  }

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: palette.bg }]}>
      {statusMsg && (
        <View style={[styles.card, { backgroundColor: palette.surfaceElevated, borderColor: palette.border }]}>
          <Text style={{ color: palette.text }}>{statusMsg}</Text>
        </View>
      )}

      <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <TextInput
          value={barcodeInput}
          onChangeText={setBarcodeInput}
          placeholder="Barcode..."
          placeholderTextColor={palette.muted}
          onSubmitEditing={() => addByBarcode(barcodeInput)}
          style={[styles.input, { color: palette.text, borderColor: palette.border }]}
        />
        <View style={styles.row}>
          <TouchableOpacity onPress={() => addByBarcode(barcodeInput)} style={[styles.btn, { backgroundColor: palette.primary, flex: 1 }]}>
            <Text style={{ color: palette.primaryText, fontWeight: '700' }}>{dict.pos.addBtn}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setScannerOpen((v) => !v)} style={[styles.btn, { backgroundColor: palette.surfaceElevated, borderWidth: 1, borderColor: palette.border, flex: 1 }]}>
            <Text style={{ color: palette.text, fontWeight: '700' }}>{dict.scanner.openCameraBtn}</Text>
          </TouchableOpacity>
        </View>
        {scannerOpen && (
          <CameraView
            style={{ height: 180, marginTop: 10, borderRadius: 10 }}
            onBarcodeScanned={(ev) => addByBarcode(ev.data)}
          />
        )}
      </View>

      <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={dict.pos.searchPlaceholder}
          placeholderTextColor={palette.muted}
          style={[styles.input, { color: palette.text, borderColor: palette.border }]}
        />
        {filtered.map((p) => (
          <TouchableOpacity
            key={p.id}
            onPress={() => addByBarcode(p.barcode)}
            style={[styles.productRow, { borderColor: palette.border }]}
          >
            <Text style={{ color: palette.text, fontWeight: '600' }}>{p.name}</Text>
            <Text style={{ color: palette.accent, fontWeight: '700' }}>{formatRupiah(p.sell_price)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <Text style={[styles.title, { color: palette.text }]}>
          {dict.pos.grandTotalLabel}: {formatRupiah(pricing.totalAmount)}
        </Text>
        <View style={styles.row}>
          {(['nominal', 'percent'] as const).map((dt) => (
            <TouchableOpacity
              key={dt}
              onPress={() => setOrderDiscountType(dt)}
              style={[styles.chip, { borderColor: palette.border, backgroundColor: orderDiscountType === dt ? palette.primary : palette.surfaceElevated }]}
            >
              <Text style={{ color: orderDiscountType === dt ? palette.primaryText : palette.text }}>{dt === 'nominal' ? 'Rp' : '%'}</Text>
            </TouchableOpacity>
          ))}
          <TextInput
            value={orderDiscountValue}
            onChangeText={setOrderDiscountValue}
            keyboardType="numeric"
            style={[styles.input, { flex: 1, marginBottom: 0, color: palette.text, borderColor: palette.border }]}
          />
        </View>
        <TouchableOpacity
          onPress={() => setApplyTax((v) => !v)}
          style={[styles.chip, { alignSelf: 'flex-start', marginVertical: 8, borderColor: palette.border, backgroundColor: applyTax ? palette.primary : palette.surfaceElevated }]}
        >
          <Text style={{ color: applyTax ? palette.primaryText : palette.text }}>
            PPN ({storeSettings.tax_rate}%): {applyTax ? 'ON' : 'OFF'}
          </Text>
        </TouchableOpacity>
        <View style={styles.row}>
          {(['cash', 'qris', 'transfer'] as const).map((pm) => (
            <TouchableOpacity
              key={pm}
              onPress={() => setPaymentMethod(pm)}
              style={[styles.chip, { borderColor: palette.border, backgroundColor: paymentMethod === pm ? palette.primary : palette.surfaceElevated }]}
            >
              <Text style={{ color: paymentMethod === pm ? palette.primaryText : palette.text }}>{pm.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {paymentMethod === 'cash' && (
          <TextInput
            value={cashReceived}
            onChangeText={setCashReceived}
            placeholder={dict.pos.cashReceivedLabel}
            placeholderTextColor={palette.muted}
            keyboardType="numeric"
            style={[styles.input, { color: palette.text, borderColor: palette.border, marginTop: 8 }]}
          />
        )}
        <TouchableOpacity onPress={handleCheckout} style={[styles.btn, { backgroundColor: palette.primary, marginTop: 8 }]}>
          <Text style={{ color: palette.primaryText, fontWeight: '700' }}>{dict.pos.checkoutBtn}</Text>
        </TouchableOpacity>

        {lastInvoice && (
          <View style={[styles.row, { marginTop: 10 }]}>
            <TouchableOpacity
              onPress={() =>
                Linking.openURL(
                  buildWhatsAppReceiptUrl({
                    storeName: storeSettings.store_name,
                    invoiceNumber: lastInvoice.invoice,
                    totalAmount: lastInvoice.total,
                    footerNote: storeSettings.footer_note,
                  })
                )
              }
              style={[styles.btn, { backgroundColor: palette.surfaceElevated, borderWidth: 1, borderColor: palette.border, flex: 1 }]}
            >
              <Text style={{ color: palette.text, fontWeight: '700' }}>{dict.receipt.sendWhatsapp}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handlePrintThermal}
              style={[styles.btn, { backgroundColor: palette.surfaceElevated, borderWidth: 1, borderColor: palette.border, flex: 1 }]}
            >
              <Text style={{ color: palette.text, fontWeight: '700' }}>Thermal</Text>
            </TouchableOpacity>
          </View>
        )}
        {thermalPreview && (
          <Text style={{ marginTop: 10, fontFamily: 'monospace', color: palette.textSecondary, fontSize: 11 }}>
            {thermalPreview}
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 14 },
  title: { fontSize: 16, fontWeight: '800', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, borderWidth: 1 },
  input: { borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 8 },
  btn: { padding: 12, borderRadius: 10, alignItems: 'center' },
  productRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1 },
});
