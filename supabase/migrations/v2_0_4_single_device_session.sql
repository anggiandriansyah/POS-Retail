-- Migration v2.0.4: Single Device Session Policy & Inactivity Tracking (Sprint 8)
-- PT AlphaGen Ecosystem • ALPHOS Smart Retail OS

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS active_device_id TEXT,
ADD COLUMN IF NOT EXISTS active_device_name TEXT,
ADD COLUMN IF NOT EXISTS active_session_token TEXT,
ADD COLUMN IF NOT EXISTS last_heartbeat_at TIMESTAMPTZ DEFAULT NOW();

-- Indeks performa untuk pengecekan cepat saat proses login
CREATE INDEX IF NOT EXISTS idx_profiles_active_session 
ON public.profiles (id, active_device_id);

COMMENT ON COLUMN public.profiles.active_device_id IS 'ID unik perangkat yang saat ini memiliki sesi aktif.';
COMMENT ON COLUMN public.profiles.active_device_name IS 'Nama User-Agent/Perangkat klien (contoh: Chrome on Windows 11).';
COMMENT ON COLUMN public.profiles.active_session_token IS 'Token sesi JWT/UUID unik untuk validasi single-device realtime.';
COMMENT ON COLUMN public.profiles.last_heartbeat_at IS 'Timestamp terakhir kali klien mengirimkan ping heartbeat (timeout 30 menit).';
