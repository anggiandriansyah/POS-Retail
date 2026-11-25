import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { APP_VERSION } from '@shared/utils/format';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../lib/supabaseClient';
import AlphosLogo from '../components/AlphosLogo';

export default function LoginScreen() {
  const { dict, lang, toggleLang, theme, toggleTheme, palette, refreshSession } = useApp();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (!identifier.trim() || !password) {
      setError(dict.login.authFailed);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: email, error: rpcErr } = await supabase.rpc('resolve_login_email', {
        p_identifier: identifier.trim(),
      });
      if (rpcErr || !email) throw new Error(dict.login.authFailed);

      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: String(email),
        password,
      });
      if (signErr) throw signErr;
      await refreshSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : dict.login.authFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      <View style={styles.topActions}>
        <TouchableOpacity
          onPress={toggleLang}
          style={[styles.chip, { borderColor: palette.border, backgroundColor: palette.surfaceElevated }]}
        >
          <Text style={[styles.chipText, { color: palette.text }]}>{lang.toUpperCase()}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={toggleTheme}
          style={[styles.chip, { borderColor: palette.border, backgroundColor: palette.surfaceElevated }]}
        >
          <Text style={[styles.chipText, { color: palette.text }]}>
            {theme === 'dark' ? 'Dark' : 'Light'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <View style={styles.logoWrap}>
          <AlphosLogo variant={theme === 'light' ? 'light' : 'horizontal'} width={220} height={50} />
          <Text style={[styles.versionText, { color: palette.muted }]}>
            DEV • v{APP_VERSION}
          </Text>
        </View>

        {error && (
          <View style={[styles.errorBox, { backgroundColor: palette.dangerSoft }]}>
            <Text style={{ color: palette.danger, fontWeight: '600' }}>{error}</Text>
          </View>
        )}

        <Text style={[styles.label, { color: palette.textSecondary }]}>
          {dict.login.identifierLabel}
        </Text>
        <TextInput
          value={identifier}
          onChangeText={setIdentifier}
          placeholder={dict.login.identifierPlaceholder}
          placeholderTextColor={palette.muted}
          autoCapitalize="none"
          style={[styles.input, { color: palette.text, borderColor: palette.border, backgroundColor: palette.surfaceElevated }]}
        />

        <Text style={[styles.label, { color: palette.textSecondary }]}>
          {dict.login.passwordLabel}
        </Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="••••••"
          placeholderTextColor={palette.muted}
          secureTextEntry
          style={[styles.input, { color: palette.text, borderColor: palette.border, backgroundColor: palette.surfaceElevated }]}
        />

        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          style={[styles.submitBtn, { backgroundColor: palette.primary }]}
        >
          {loading ? (
            <ActivityIndicator color={palette.primaryText} />
          ) : (
            <Text style={[styles.submitText, { color: palette.primaryText }]}>
              {dict.login.signInBtn}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  topActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: '700' },
  card: { padding: 24, borderRadius: 16, borderWidth: 1 },
  logoWrap: { alignItems: 'center', marginBottom: 20 },
  versionText: { marginTop: 6, fontSize: 12, fontWeight: '600' },
  errorBox: { padding: 12, borderRadius: 10, marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14, fontSize: 15 },
  submitBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  submitText: { fontSize: 15, fontWeight: '700' },
});
