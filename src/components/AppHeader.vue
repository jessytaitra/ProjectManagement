<template>
  <header class="app-header">
    <div class="logo-mark">PM</div>
    <div class="header-title-wrap">
      <div class="header-title">外貿協會 專案管理平台</div>
      <div class="header-subtitle">TAITRA · {{ store.isAdmin ? '🔑 Admin' : store.currentUser }}</div>
    </div>

    <div class="header-right">
      <!-- Theme Toggle -->
      <div class="theme-toggle" @click="store.toggleTheme()" title="切換主題">
        <span>{{ store.theme === 'dark' ? '🌙' : '☀️' }}</span>
        <div class="theme-switch" :class="{ light: store.theme === 'light' }"></div>
      </div>

      <!-- User pill -->
      <div class="user-pill" @click="changeUser" title="點擊更換姓名">
        <div class="user-dot"></div>
        <span>{{ store.currentUser }}</span>
        <span v-if="store.isAdmin" class="admin-tag">Admin</span>
      </div>

      <!-- Live date -->
      <div class="date-badge">{{ dateStr }}</div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAppStore } from '../stores/app'
import { useToast } from '../composables/useToast'

const store = useAppStore()
const { info } = useToast()
const dateStr = ref('')

function tick() {
  const n = new Date()
  dateStr.value =
    n.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }) +
    ' ' +
    n.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
}

function changeUser() {
  const n = prompt('更換姓名：', store.currentUser)
  if (n && n.trim()) {
    store.currentUser = n.trim()
    localStorage.setItem('pt_user', store.currentUser)
    info('已更換為 ' + store.currentUser)
  }
}

let timer
onMounted(() => { tick(); timer = setInterval(tick, 30000) })
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.app-header {
  grid-area: header;
  display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
  padding: 0 20px; border-bottom: 1px solid var(--border);
  background: var(--bg); backdrop-filter: blur(12px);
  position: sticky; top: 0; z-index: 100;
}
.logo-mark {
  width: 36px; height: 36px;
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  border-radius: 8px; display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 900; color: #fff;
  font-family: 'JetBrains Mono', monospace; flex-shrink: 0;
}
.header-title { font-size: 17px; font-weight: 700; }
.header-subtitle { font-size: 11px; color: var(--text-muted); font-family: 'JetBrains Mono', monospace; }
.header-right { margin-left: auto; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.theme-toggle { display: flex; align-items: center; gap: 6px; cursor: pointer; }
.theme-switch {
  position: relative; width: 40px; height: 22px;
  background: var(--surface3); border: 1px solid var(--border);
  border-radius: 11px; transition: all .3s; flex-shrink: 0;
}
.theme-switch::after {
  content: ''; position: absolute; top: 2px; left: 2px;
  width: 16px; height: 16px; border-radius: 50%;
  background: var(--accent); transition: all .3s;
}
.theme-switch.light::after { left: 20px; }
.user-pill {
  display: flex; align-items: center; gap: 6px;
  padding: 5px 12px; border-radius: 20px;
  background: var(--surface3); border: 1px solid var(--border);
  font-size: 14px; cursor: pointer;
}
.user-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--green); animation: blink 2s infinite; }
@keyframes blink { 0%,100% { opacity:1; } 50% { opacity:.4; } }
.admin-tag { font-size: 11px; background: rgba(159,122,234,.2); color: var(--accent2); padding: 1px 6px; border-radius: 4px; }
.date-badge {
  font-family: 'JetBrains Mono', monospace; font-size: 12px;
  color: var(--accent); background: rgba(99,179,237,.1);
  border: 1px solid rgba(99,179,237,.2); border-radius: 6px; padding: 5px 10px;
}
</style>
