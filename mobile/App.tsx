import React, { useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AppProvider, useApp } from './src/contexts/AppContext';
import AlphosLogo from './src/components/AlphosLogo';
import LoginScreen from './src/screens/LoginScreen';
import CashierScreen from './src/screens/CashierScreen';
import ShiftScreen from './src/screens/ShiftScreen';
import OwnerMonitorScreen from './src/screens/OwnerMonitorScreen';

function MainShell() {
  const { profile, isOwner, palette, theme, toggleTheme, lang, toggleLang, dict, signOut } = useApp();
  const [tab, setTab] = useState<'cashier' | 'shift' | 'monitor'>('cashier');

  if (!profile) {
    return <LoginScreen />;
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]}>
      <View style={[styles.header, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <AlphosLogo variant={theme === 'light' ? 'light' : 'horizontal'} width={150} height={36} />
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={toggleLang} style={[styles.pill, { borderColor: palette.border }]}>
            <Text style={{ color: palette.text, fontSize: 11, fontWeight: '700' }}>{lang.toUpperCase()}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleTheme} style={[styles.pill, { borderColor: palette.border }]}>
            <Text style={{ color: palette.text, fontSize: 11, fontWeight: '700' }}>{theme === 'dark' ? 'Dark' : 'Light'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={signOut} style={[styles.pill, { borderColor: palette.danger }]}>
            <Text style={{ color: palette.danger, fontSize: 11, fontWeight: '700' }}>{dict.logout}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.tabs, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <TouchableOpacity onPress={() => setTab('cashier')} style={[styles.tabBtn, tab === 'cashier' && { backgroundColor: palette.primary }]}>
          <Text style={{ color: tab === 'cashier' ? palette.primaryText : palette.text, fontWeight: '700' }}>{dict.tabs.pos}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('shift')} style={[styles.tabBtn, tab === 'shift' && { backgroundColor: palette.primary }]}>
          <Text style={{ color: tab === 'shift' ? palette.primaryText : palette.text, fontWeight: '700' }}>{dict.tabs.shift}</Text>
        </TouchableOpacity>
        {isOwner && (
          <TouchableOpacity onPress={() => setTab('monitor')} style={[styles.tabBtn, tab === 'monitor' && { backgroundColor: palette.primary }]}>
            <Text style={{ color: tab === 'monitor' ? palette.primaryText : palette.text, fontWeight: '700' }}>{dict.tabs.live}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ flex: 1 }}>
        {tab === 'cashier' && <CashierScreen />}
        {tab === 'shift' && <ShiftScreen />}
        {tab === 'monitor' && isOwner && <OwnerMonitorScreen />}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainShell />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1 },
  headerRight: { flexDirection: 'row', gap: 6 },
  pill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, borderWidth: 1 },
  tabs: { flexDirection: 'row', gap: 8, padding: 10, borderBottomWidth: 1 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
});
