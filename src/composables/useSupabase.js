import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  || ''
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON || ''

let _client = null

export function useSupabase() {
  if (!_client) {
    if (!SUPABASE_URL || !SUPABASE_ANON) {
      console.warn('[useSupabase] 未設定環境變數，請建立 .env')
      return { sb: null }
    }
    _client = createClient(SUPABASE_URL, SUPABASE_ANON)
  }
  return { sb: _client }
}
