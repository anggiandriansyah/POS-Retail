import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';

const envProd = fs.readFileSync('.env.production', 'utf8');
const urlMatch = envProd.match(/NEXT_PUBLIC_SUPABASE_URL=([^\r\n]+)/);
const keyMatch = envProd.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=([^\r\n]+)/);

const supabaseUrl = urlMatch[1].trim();
const supabaseKey = keyMatch[1].trim();

console.log('PROD Supabase URL:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('Checking resolve_login_email for adminprod on PROD:');
  const { data: d1, error: e1 } = await supabase.rpc('resolve_login_email', { p_identifier: 'adminprod' });
  console.log('Result adminprod on PROD:', { d1, e1 });

  console.log('Attempting login with adminprod on PROD...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: d1 || 'adminprod@alphagen.id',
    password: 'Jakarta123',
  });
  console.log('Auth result on PROD:', { user: authData?.user?.id, email: authData?.user?.email, error: authError });
}

check();
