import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { formatRupiah } from '@shared/utils/format';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../lib/supabaseClient';

const PETTY_CATEGORIES = [
  'OPERASIONAL',
  'KEMBALIAN',
  'BELANJA_DARURAT',
  'SETOR_BANK',
  'LAINNYA',
] as const;

export default function ShiftScreen() {
  const { dict, palette, profile, activeShift, refreshSession } = useApp();
  const [openingCash, setOpeningCash] = useState('200000');
  const [pettyType, setPettyType] = useState<'IN' | 'OUT'>('OUT');
  const [pettyAmount, setPettyAmount] = useState('');
  const [pettyCategory, setPettyCategory] = useState<(typeof PETTY_CATEGORIES)[number]>('OPERASIONAL');
  const [pettyNote, setPettyNote] = useState('');
  const [actualCash, setActualCash] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const expectedCash = Number(activeShift?.expected_cash ?? activeShift?.opening_cash ?? 0);
  const discrepancy = (Number(actualCash) || 0) - expectedCash;

  async function handleOpenShift() {
    if (!profile) return;
    const amount = Number(openingCash) || 0;
    const { error } = await supabase.from('shifts').insert({
      cashier_id: profile.id,
      opening_cash: amount,
      status: 'OPEN',
    });
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage(dict.shift.msgShiftOpened);
    await refreshSession();
  }

  async function handleLogPettyCash() {
    if (!profile || !activeShift) return;
    const amount = Number(pettyAmount) || 0;
    if (amount <= 0) return;
    const { error } = await supabase.from('petty_cash_logs').insert({
      shift_id: activeShift.id,
      cashier_id: profile.id,
      type: pettyType,
      amount,
      category: pettyCategory,
      description: pettyNote.trim() || pettyCategory,
    });
    if (error) {
      setMessage(error.message);
      return;
    }
    setPettyAmount('');
    setPettyNote('');
    setMessage(dict.shift.msgPettySaved);
  }

  async function handleCloseShift() {
    if (!activeShift) return;
    if (discrepancy !== 0 && !closeNotes.trim()) {
      setMessage('Catatan wajib diisi bila ada selisih (discrepancy notes required)');
      return;
    }
    const { data, error } = await supabase.rpc('close_shift', {
      p_shift_id: activeShift.id,
      p_actual_cash: Number(actualCash) || 0,
      p_notes: closeNotes.trim() || 'Mobile close shift',
    });
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage(`${dict.shift.msgShiftClosed} (${formatRupiah(Number(data?.expected_cash ?? 0))})`);
    await refreshSession();
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: palette.bg }]}>
      {message && (
        <View style={[styles.banner, { backgroundColor: palette.surfaceElevated, borderColor: palette.border }]}>
          <Text style={{ color: palette.text }}>{message}</Text>
        </View>
      )}

      {!activeShift ? (
        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text style={[styles.title, { color: palette.text }]}>{dict.shift.openTitle}</Text>
          <TextInput
            value={openingCash}
            onChangeText={setOpeningCash}
            keyboardType="numeric"
            style={[styles.input, { color: palette.text, borderColor: palette.border }]}
          />
          <TouchableOpacity onPress={handleOpenShift} style={[styles.btn, { backgroundColor: palette.primary }]}>
            <Text style={{ color: palette.primaryText, fontWeight: '700' }}>{dict.shift.openBtn}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text style={[styles.title, { color: palette.text }]}>{dict.shift.pettyTitle}</Text>
            <View style={styles.row}>
              {(['IN', 'OUT'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setPettyType(t)}
                  style={[
                    styles.chip,
                    { borderColor: palette.border, backgroundColor: pettyType === t ? palette.primary : palette.surfaceElevated },
                  ]}
                >
                  <Text style={{ color: pettyType === t ? palette.primaryText : palette.text, fontWeight: '700' }}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.rowWrap}>
              {PETTY_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setPettyCategory(cat)}
                  style={[
                    styles.chip,
                    { borderColor: palette.border, backgroundColor: pettyCategory === cat ? palette.primary : palette.surfaceElevated },
                  ]}
                >
                  <Text style={{ color: pettyCategory === cat ? palette.primaryText : palette.text, fontSize: 11 }}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              value={pettyAmount}
              onChangeText={setPettyAmount}
              placeholder="Rp"
              placeholderTextColor={palette.muted}
              keyboardType="numeric"
              style={[styles.input, { color: palette.text, borderColor: palette.border }]}
            />
            <TextInput
              value={pettyNote}
              onChangeText={setPettyNote}
              placeholder={dict.shift.descriptionPlaceholder}
              placeholderTextColor={palette.muted}
              style={[styles.input, { color: palette.text, borderColor: palette.border }]}
            />
            <TouchableOpacity onPress={handleLogPettyCash} style={[styles.btn, { backgroundColor: palette.primary }]}>
              <Text style={{ color: palette.primaryText, fontWeight: '700' }}>{dict.shift.savePettyBtn}</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text style={[styles.title, { color: palette.text }]}>{dict.shift.closeTitle}</Text>
            <TextInput
              value={actualCash}
              onChangeText={setActualCash}
              placeholder={dict.shift.actualCashLabel}
              placeholderTextColor={palette.muted}
              keyboardType="numeric"
              style={[styles.input, { color: palette.text, borderColor: palette.border }]}
            />
            {discrepancy !== 0 && (
              <TextInput
                value={closeNotes}
                onChangeText={setCloseNotes}
                placeholder="Catatan selisih kas (discrepancy notes)..."
                placeholderTextColor={palette.muted}
                style={[styles.input, { color: palette.text, borderColor: palette.border }]}
              />
            )}
            <TouchableOpacity onPress={handleCloseShift} style={[styles.btn, { backgroundColor: palette.danger }]}>
              <Text style={{ color: '#ffffff', fontWeight: '700' }}>{dict.shift.closeBtn}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  banner: { padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 12 },
  card: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, borderWidth: 1 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 10 },
  btn: { padding: 13, borderRadius: 10, alignItems: 'center' },
});
