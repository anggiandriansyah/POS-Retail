-- ============================================================================
-- ALPHOS: LINK AUTH.IDENTITIES FOR SUPERADMIN USERS (DEV & PROD)
-- ============================================================================

-- DEV
insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) values (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  jsonb_build_object('sub', '00000000-0000-0000-0000-000000000001', 'email', 'admindev@alphagen.co.id'),
  'email',
  '00000000-0000-0000-0000-000000000001',
  now(),
  now(),
  now()
)
on conflict (provider, provider_id) do nothing;

-- PROD
insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) values (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000002',
  jsonb_build_object('sub', '00000000-0000-0000-0000-000000000002', 'email', 'adminprod@alphagen.co.id'),
  'email',
  '00000000-0000-0000-0000-000000000002',
  now(),
  now(),
  now()
)
on conflict (provider, provider_id) do nothing;
