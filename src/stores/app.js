import { defineStore } from 'pinia'
import { useSupabase } from '../composables/useSupabase'

export const useAppStore = defineStore('app', {
  state: () => ({
    currentUser: '',
    isAdmin: false,
    theme: localStorage.getItem('pt_theme') || 'dark',
    // permissions: { modules: ['mgt','sr30'], projects: { mgt: [], sr30: [] }, canEdit: { mgt: true, sr30: false } }
    permissions: null,
    permissionsLoaded: false,
  }),

  getters: {
    isLoggedIn: (s) => !!s.currentUser,
    canAccessModule: (s) => (mod) => {
      if (s.isAdmin) return true
      if (!s.permissions) return false
      return s.permissions.modules.includes(mod)
    },
    canEdit: (s) => (mod) => {
      if (s.isAdmin) return true
      if (!s.permissions) return false
      return !!s.permissions.canEdit?.[mod]
    },
    allowedProjects: (s) => (mod) => {
      if (s.isAdmin) return [] // empty = all
      if (!s.permissions) return null
      return s.permissions.projects?.[mod] ?? []
    },
  },

  actions: {
    applyTheme(theme) {
      this.theme = theme
      localStorage.setItem('pt_theme', theme)
      document.documentElement.setAttribute('data-theme', theme)
    },

    toggleTheme() {
      this.applyTheme(this.theme === 'dark' ? 'light' : 'dark')
    },

    async login(username, password = '') {
      const { sb } = useSupabase()
      this.currentUser = username

      try {
        if (sb) {
          // 1. 先查 admin 密碼
          const { data: cfg } = await sb
            .from('app_config').select('value').eq('key', 'admin_password').single()
          const adminPw = cfg?.value ?? null

          if (adminPw && password === adminPw) {
            // ── Admin 登入 ──
            this.isAdmin = true
            this.permissions = { modules: ['mgt', 'sr30', 'admin'], projects: {}, canEdit: {} }
            this.permissionsLoaded = true
            localStorage.setItem('pt_user', username)
            localStorage.setItem('pt_is_admin', '1')
            return { ok: true }
          }

          // 2. 一般成員：查該成員密碼
          const { data: rows } = await sb
            .from('user_permissions').select('password').eq('username', username).limit(1)
          const requiredPw = rows?.[0]?.password ?? null
          if (requiredPw && password !== requiredPw) {
            this.currentUser = ''
            return { ok: false, msg: '密碼錯誤，請再試一次' }
          }

          // 3. 通過 → 載入權限
          await this.loadPermissions()
          localStorage.setItem('pt_user', username)
          localStorage.removeItem('pt_is_admin')
          return { ok: true }

        } else {
          // Demo 模式（無 Supabase）
          const demoPw = localStorage.getItem('pt_demo_admin_pw') || 'admin'
          if (password && password === demoPw) {
            this.isAdmin = true
            this.permissions = { modules: ['mgt', 'sr30', 'admin'], projects: {}, canEdit: {} }
            this.permissionsLoaded = true
            localStorage.setItem('pt_user', username)
            localStorage.setItem('pt_is_admin', '1')
            return { ok: true }
          }
          await this.loadPermissions()
          localStorage.setItem('pt_user', username)
          localStorage.removeItem('pt_is_admin')
          return { ok: true }
        }
      } catch (e) {
        this.currentUser = ''
        return { ok: false, msg: '登入失敗：' + e.message }
      }
    },

    async loadPermissions() {
      const { sb } = useSupabase()
      if (!sb) {
        // Demo fallback: give access to everything
        this.permissions = { modules: ['mgt', 'sr30'], projects: {}, canEdit: { mgt: true, sr30: true } }
        this.permissionsLoaded = true
        return
      }

      const { data, error } = await sb
        .from('user_permissions')
        .select('*')
        .eq('username', this.currentUser)

      if (error || !data?.length) {
        // No permissions configured → show empty state
        this.permissions = { modules: [], projects: {}, canEdit: {} }
        this.permissionsLoaded = true
        return
      }

      const modules = [...new Set(data.map(r => r.module))]
      const projects = {}
      const canEdit = {}
      for (const row of data) {
        projects[row.module] = row.project_ids ?? []
        canEdit[row.module] = row.can_edit ?? false
      }
      this.permissions = { modules, projects, canEdit }
      this.permissionsLoaded = true
    },

    logout() {
      this.currentUser = ''
      this.isAdmin = false
      this.permissions = null
      this.permissionsLoaded = false
      localStorage.removeItem('pt_user')
      localStorage.removeItem('pt_is_admin')
    },

    async restoreSession() {
      const saved = localStorage.getItem('pt_user')
      const wasAdmin = localStorage.getItem('pt_is_admin') === '1'
      if (!saved) return

      this.currentUser = saved
      if (wasAdmin) {
        this.isAdmin = true
        this.permissions = { modules: ['mgt', 'sr30', 'admin'], projects: {}, canEdit: {} }
        this.permissionsLoaded = true
      } else {
        await this.loadPermissions()
      }
    },
  },
})
