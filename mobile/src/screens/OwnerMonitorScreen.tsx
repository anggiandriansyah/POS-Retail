import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import type { Product, StockRequest, Transaction } from '@shared/types/pos';
import { formatRupiah } from '@shared/utils/format';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../lib/supabaseClient';

export default function OwnerMonitorScreen() {
  const { dict, palette, profile } = useApp();
  const [requests, setRequests] = useState<StockRequest[]>([]);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [recentSales, setRecentSales] = useState<Transaction[]>([]);

  const loadData = useCallback(async () => {
    const [{ data: reqs }, { data: prods }, { data: txs }] = await Promise.all([
      supabase.from('stock_requests').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('products').select('*').eq('is_active', true).order('stock', { ascending: true }).limit(20),
      supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(10),
    ]);
    if (reqs) setRequests(reqs as StockRequest[]);
    if (prods) {
      setLowStock((prods as Product[]).filter((p) => p.stock <= p.min_stock));
    }
    if (txs) setRecentSales(txs as Transaction[]);
  }, []);

  useEffect(() => {
    void loadData();
    const channel = supabase
      .channel('mobile-owner-monitor')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_requests' }, () => void loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => void loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => void loadData())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadData]);

  async function updateRequestStatus(id: string, status: 'APPROVED' | 'REJECTED' | 'RESTOCKED') {
    if (!profile) return;
    await supabase
      .from('stock_requests')
      .update({ status, resolved_by: profile.id, resolved_at: new Date().toISOString() })
      .eq('id', id);
    await loadData();
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: palette.bg }]}>
      <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <Text style={[styles.title, { color: palette.text }]}>{dict.tabs.stockRequests}</Text>
        {requests.map((req) => (
          <View key={req.id} style={[styles.rowItem, { borderColor: palette.border }]}>
            <Text style={{ color: palette.text, fontWeight: '700' }}>
              {req.product_name} ({req.requested_qty}) — {req.status}
            </Text>
            {req.status === 'PENDING' && (
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => updateRequestStatus(req.id, 'APPROVED')} style={[styles.chip, { backgroundColor: palette.primary }]}>
                  <Text style={{ color: palette.primaryText, fontSize: 12 }}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => updateRequestStatus(req.id, 'REJECTED')} style={[styles.chip, { backgroundColor: palette.danger }]}>
                  <Text style={{ color: '#fff', fontSize: 12 }}>Reject</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </View>

      <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <Text style={[styles.title, { color: palette.text }]}>
          {dict.tabs.inventory} ({lowStock.length})
        </Text>
        {lowStock.map((p) => (
          <Text key={p.id} style={{ color: palette.textSecondary, marginBottom: 4 }}>
            • {p.name}: {p.stock} / min {p.min_stock}
          </Text>
        ))}
      </View>

      <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <Text style={[styles.title, { color: palette.text }]}>{dict.tabs.reports}</Text>
        {recentSales.map((tx) => (
          <Text key={tx.id} style={{ color: palette.textSecondary, marginBottom: 4 }}>
            {tx.invoice_number} — {formatRupiah(tx.total_amount)}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 14 },
  title: { fontSize: 16, fontWeight: '800', marginBottom: 10 },
  rowItem: { paddingVertical: 8, borderBottomWidth: 1 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
});
