<template>
  <div class="dashboard fade-in">
    <div class="dash-title">👋 歡迎回來，{{ store.currentUser }}</div>
    <div class="dash-sub">外貿協會 專案管理平台 · {{ today }}</div>

    <div class="dash-modules">
      <RouterLink
        v-if="store.canAccessModule('mgt')"
        to="/mgt"
        class="dash-card"
      >
        <div class="dash-card-icon">📋</div>
        <div class="dash-card-title">表單專案追蹤</div>
        <div class="dash-card-desc">MGT · 追蹤所有數位表單開發進度、SIT/UAT 測試狀況</div>
        <div class="dash-card-arrow">→</div>
      </RouterLink>

      <RouterLink
        v-if="store.canAccessModule('sr30')"
        to="/sr30"
        class="dash-card"
      >
        <div class="dash-card-icon">📊</div>
        <div class="dash-card-title">SR 3.0 甘特圖 & WBS</div>
        <div class="dash-card-desc">SR · SR 3.0 系統操作障礙系統開發時程與工作分解</div>
        <div class="dash-card-arrow">→</div>
      </RouterLink>

      <RouterLink
        v-if="store.isAdmin"
        to="/admin"
        class="dash-card admin-card"
      >
        <div class="dash-card-icon">🔑</div>
        <div class="dash-card-title">成員權限管理</div>
        <div class="dash-card-desc">Admin · 管理成員可見模組與專案、修改 Admin 密碼</div>
        <div class="dash-card-arrow">→</div>
      </RouterLink>
    </div>

    <div v-if="!store.canAccessModule('mgt') && !store.canAccessModule('sr30') && !store.isAdmin" class="no-access">
      <div style="font-size:48px;margin-bottom:12px">🔒</div>
      <div style="font-size:18px;font-weight:700;margin-bottom:8px">尚無存取權限</div>
      <div style="font-size:14px;color:var(--text-muted)">請聯繫 Admin 指派你的模組權限。</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAppStore } from '../stores/app'

const store = useAppStore()
const today = computed(() => new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }))
</script>

<style scoped>
.dashboard { max-width: 800px; }
.dash-title { font-size: 26px; font-weight: 900; letter-spacing: -.5px; margin-bottom: 4px; }
.dash-sub { font-size: 14px; color: var(--text-muted); margin-bottom: 32px; }
.dash-modules { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
.dash-card {
  background: var(--surface); border: 1px solid var(--border); border-radius: 14px;
  padding: 22px 24px; text-decoration: none; color: var(--text);
  transition: all .2s; position: relative; display: flex; flex-direction: column; gap: 8px;
}
.dash-card:hover { border-color: var(--border-accent); background: var(--surface2); transform: translateY(-2px); box-shadow: 0 4px 20px rgba(0,0,0,.2); }
.admin-card:hover { border-color: rgba(159,122,234,.4); }
.dash-card-icon { font-size: 28px; }
.dash-card-title { font-size: 17px; font-weight: 700; }
.dash-card-desc { font-size: 13px; color: var(--text-muted); line-height: 1.6; }
.dash-card-arrow { position: absolute; top: 22px; right: 22px; font-size: 18px; color: var(--text-muted); transition: transform .2s; }
.dash-card:hover .dash-card-arrow { transform: translateX(4px); color: var(--accent); }
.no-access { text-align: center; padding: 60px; color: var(--text-muted); }
</style>
