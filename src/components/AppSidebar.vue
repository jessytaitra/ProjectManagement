<template>
  <nav class="app-sidebar">
    <div class="sidebar-section-label">模組</div>

    <RouterLink to="/" class="sidebar-item" :class="{ active: route.path === '/' }">
      <span class="sidebar-dot" style="background:var(--accent)"></span>
      <span>總覽</span>
    </RouterLink>

    <template v-if="store.canAccessModule('mgt')">
      <RouterLink to="/mgt" class="sidebar-item" :class="{ active: route.path === '/mgt' }">
        <span class="sidebar-dot" style="background:var(--pink)"></span>
        <span>表單專案追蹤</span>
        <span class="sidebar-tag">MGT</span>
      </RouterLink>
    </template>

    <template v-if="store.canAccessModule('sr30')">
      <RouterLink to="/sr30" class="sidebar-item" :class="{ active: route.path === '/sr30' }">
        <span class="sidebar-dot" style="background:var(--teal)"></span>
        <span>SR 3.0 甘特 / WBS</span>
        <span class="sidebar-tag">SR</span>
      </RouterLink>
    </template>

    <template v-if="store.isAdmin">
      <div class="sidebar-section-label" style="margin-top:16px">管理</div>
      <RouterLink to="/admin" class="sidebar-item" :class="{ active: route.path === '/admin' }">
        <span class="sidebar-dot" style="background:var(--accent2)"></span>
        <span>成員權限管理</span>
        <span class="sidebar-tag admin">Admin</span>
      </RouterLink>
    </template>

    <div class="sidebar-bottom">
      <button class="sidebar-logout" @click="logout">⏏ 登出</button>
    </div>
  </nav>
</template>

<script setup>
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'

const store = useAppStore()
const route = useRoute()
const router = useRouter()

function logout() {
  store.logout()
  router.push('/login')
}
</script>

<style scoped>
.app-sidebar {
  grid-area: sidebar;
  background: var(--surface);
  border-right: 1px solid var(--border);
  padding: 16px 0;
  display: flex; flex-direction: column;
  position: sticky; top: 56px;
  height: calc(100vh - 56px); overflow-y: auto;
}
.sidebar-section-label {
  font-size: 11px; text-transform: uppercase; letter-spacing: 1px;
  color: var(--text-muted); font-family: 'JetBrains Mono', monospace;
  padding: 0 16px 5px; margin-top: 8px;
}
.sidebar-item {
  display: flex; align-items: center; gap: 9px;
  padding: 9px 16px; cursor: pointer; transition: all .15s;
  border-left: 2px solid transparent; font-size: 14px;
  color: var(--text-dim); text-decoration: none;
}
.sidebar-item:hover { background: var(--surface2); color: var(--text); }
.sidebar-item.active { background: rgba(99,179,237,.07); border-left-color: var(--accent); color: var(--accent); }
.sidebar-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.sidebar-tag {
  margin-left: auto; font-family: 'JetBrains Mono', monospace; font-size: 11px;
  background: var(--surface3); border-radius: 4px; padding: 1px 6px;
  color: var(--text-muted);
}
.sidebar-tag.admin { background: rgba(159,122,234,.15); color: var(--accent2); }
.sidebar-bottom { margin-top: auto; padding: 16px; }
.sidebar-logout {
  width: 100%; padding: 8px; background: transparent;
  border: 1px solid var(--border); border-radius: 8px;
  color: var(--text-muted); font-size: 13px; cursor: pointer;
  font-family: inherit; transition: all .15s;
}
.sidebar-logout:hover { background: var(--surface2); color: var(--red); border-color: rgba(252,129,129,.3); }
</style>
