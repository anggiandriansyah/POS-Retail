import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';

const envDev = fs.readFileSync('.env.development', 'utf8');
const urlMatch = envDev.match(/NEXT_PUBLIC_SUPABASE_URL=([^\r\n]+)/);
const keyMatch = envDev.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=([^\r\n]+)/);

const supabaseUrl = urlMatch[1].trim();
const supabaseKey = keyMatch[1].trim();

console.log('DEV Supabase URL:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('Checking resolve_login_email for admindev:');
  const { data: d1, error: e1 } = await supabase.rpc('resolve_login_email', { p_identifier: 'admindev' });
  console.log('Result admindev:', { d1, e1 });

  console.log('Checking resolve_login_email for admindev@alphagen.id:');
  const { data: d2, error: e2 } = await supabase.rpc('resolve_login_email', { p_identifier: 'admindev@alphagen.id' });
  console.log('Result admindev@alphagen.id:', { d2, e2 });

  console.log('Attempting login with admindev and Jakarta123...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: d1 || 'admindev@alphagen.id',
    password: 'Jakarta123',
  });
  console.log('Auth result:', { user: authData?.user?.id, email: authData?.user?.email, error: authError });

  if (authData?.user) {
    const { data: prof, error: profErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    console.log('Profile result:', { prof, profErr });
  }
}

check();
