<template>
  <div class="login-page">
    <div class="login-box">
      <div class="login-logo">PM</div>
      <div class="login-title">外貿協會 專案管理平台</div>
      <div class="login-sub">請輸入姓名以進入系統</div>

      <input
        class="login-input"
        v-model="username"
        placeholder="例：Lily、Jess…"
        maxlength="20"
        @keydown.enter="() => pwInput?.focus()"
        ref="nameInput"
      />

      <input
        class="login-input"
        v-model="adminPw"
        type="password"
        placeholder="密碼（無密碼請留空）"
        @keydown.enter="doLogin"
        ref="pwInput"
      />

      <div v-if="errMsg" class="err-msg">{{ errMsg }}</div>

      <button class="login-btn" @click="doLogin" :disabled="loading">
        {{ loading ? '驗證中…' : '進入系統' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'

const store = useAppStore()
const router = useRouter()

const username = ref('')
const adminPw = ref('')
const errMsg = ref('')
const loading = ref(false)
const nameInput = ref(null)
const pwInput = ref(null)

async function doLogin() {
  errMsg.value = ''
  const name = username.value.trim()
  if (!name) { errMsg.value = '請輸入姓名'; return }

  loading.value = true
  const result = await store.login(name, adminPw.value.trim())
  loading.value = false

  if (!result.ok) {
    errMsg.value = result.msg || '登入失敗'
    return
  }

  // Redirect: admin → /admin, has module → first module, else → /
  if (store.isAdmin) {
    router.push('/admin')
  } else if (store.canAccessModule('mgt')) {
    router.push('/mgt')
  } else if (store.canAccessModule('sr30')) {
    router.push('/sr30')
  } else {
    router.push('/')
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background: var(--bg); position: relative; z-index: 1;
}
.login-box {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 16px; padding: 36px 40px;
  width: 100%; max-width: 400px; text-align: center;
}
.login-logo {
  width: 56px; height: 56px;
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  border-radius: 12px; display: flex; align-items: center; justify-content: center;
  font-size: 20px; font-weight: 900; color: #fff;
  font-family: 'JetBrains Mono', monospace; margin: 0 auto 16px;
}
.login-title { font-size: 22px; font-weight: 700; margin-bottom: 6px; }
.login-sub { font-size: 14px; color: var(--text-muted); margin-bottom: 24px; }
.login-input {
  width: 100%; background: var(--surface2); border: 1px solid var(--border);
  border-radius: 10px; padding: 13px 16px; color: var(--text);
  font-size: 16px; font-family: inherit; outline: none;
  margin-bottom: 12px; text-align: center; transition: border-color .2s;
}
.login-input:focus { border-color: var(--border-accent); }
.admin-toggle {
  font-size: 13px; color: var(--text-muted); cursor: pointer;
  margin-bottom: 10px; user-select: none;
}
.admin-toggle:hover { color: var(--accent2); }
.admin-pw-wrap { margin-bottom: 4px; }
.err-msg { color: var(--red); font-size: 14px; margin-bottom: 10px; }
.login-btn {
  width: 100%; padding: 13px;
  background: linear-gradient(135deg, var(--accent), var(--teal));
  border: none; border-radius: 10px; color: #fff;
  font-size: 16px; font-weight: 700; cursor: pointer; font-family: inherit;
  transition: opacity .2s;
}
.login-btn:hover:not(:disabled) { opacity: .85; }
.login-btn:disabled { opacity: .5; cursor: not-allowed; }
</style>
