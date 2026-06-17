<template>
  <div v-if="store.isLoggedIn" class="app-layout">
    <AppHeader />
    <AppSidebar />
    <main class="app-main">
      <RouterView />
    </main>
  </div>
  <RouterView v-else />
  <div class="toast-container">
    <div v-for="t in toasts" :key="t.id" class="toast" :class="t.type">
      <span>{{ t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️' }}</span>
      {{ t.msg }}
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useAppStore } from './stores/app'
import { useToast } from './composables/useToast'
import AppHeader from './components/AppHeader.vue'
import AppSidebar from './components/AppSidebar.vue'

const store = useAppStore()
const { toasts } = useToast()

onMounted(() => { store.applyTheme(store.theme) })
</script>
