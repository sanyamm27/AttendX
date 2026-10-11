import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (supabaseUrl && !serviceRoleKey) {
  console.error(
    'CRITICAL ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is missing. ' +
    'Silent degradation to NEXT_PUBLIC_SUPABASE_ANON_KEY has been disabled to prevent silent RLS failures.'
  );
  throw new Error(
    'SUPABASE_SERVICE_ROLE_KEY environment variable is required for server-side Supabase operations.'
  );
}

export const supabase = supabaseUrl && serviceRoleKey 
  ? createClient(supabaseUrl, serviceRoleKey)
  : null;
