<template>
  <div class="admin-page fade-in">
    <div class="admin-header">
      <div style="font-size:22px;font-weight:900">🔑 成員權限管理</div>
      <div style="font-size:13px;color:var(--text-muted);margin-top:4px">新增成員、設定可見模組與專案</div>
    </div>

    <!-- Add Member -->
    <div class="admin-section">
      <div class="admin-section-title">新增 / 設定成員</div>
      <div class="form-grid" style="max-width:640px">
        <div class="form-row">
          <label class="form-label">姓名</label>
          <input class="form-input" v-model="newPerm.username" placeholder="例：Lily" />
        </div>
        <div class="form-row">
          <label class="form-label">登入密碼</label>
          <input class="form-input" type="password" v-model="newPerm.password" placeholder="留空則不需要密碼" />
        </div>
        <div class="form-row">
          <label class="form-label">可見模組</label>
          <div style="display:flex;gap:12px;padding-top:8px">
            <label class="check-label"><input type="checkbox" v-model="newPerm.modules" value="mgt" /> MGT 表單追蹤</label>
            <label class="check-label"><input type="checkbox" v-model="newPerm.modules" value="sr30" /> SR 3.0 甘特/WBS</label>
          </div>
        </div>
        <div class="form-row">
          <label class="form-label">可編輯</label>
          <div style="display:flex;gap:12px;padding-top:8px">
            <label class="check-label"><input type="checkbox" v-model="newPerm.canEditMgt" /> MGT</label>
            <label class="check-label"><input type="checkbox" v-model="newPerm.canEditSr30" /> SR 3.0</label>
          </div>
        </div>
      </div>
      <button class="btn btn-primary" style="margin-top:8px" @click="saveMember" :disabled="saving">
        {{ saving ? '儲存中…' : '💾 儲存成員設定' }}
      </button>
    </div>

    <!-- Member List -->
    <div class="admin-section">
      <div class="admin-section-title">現有成員權限</div>
      <div v-if="!members.length" class="empty-state">尚無成員設定</div>
      <div v-else class="member-list">
        <div v-for="m in members" :key="m.username" class="member-row">
          <div class="member-name">{{ m.username }}</div>
          <div class="member-tags">
            <span v-for="mod in m.modules" :key="mod" class="module-tag">{{ mod.toUpperCase() }}</span>
            <span v-if="m.canEdit?.mgt" class="edit-tag">可編 MGT</span>
            <span v-if="m.canEdit?.sr30" class="edit-tag">可編 SR</span>
            <span v-if="m.hasPassword" class="pw-tag">🔒 有密碼</span>
          </div>
          <button class="btn btn-danger" style="margin-left:auto;padding:4px 12px;font-size:12px" @click="deleteMember(m.username)">移除</button>
        </div>
      </div>
    </div>

    <!-- Admin Password -->
    <div class="admin-section">
      <div class="admin-section-title">修改 Admin 密碼</div>
      <div style="max-width:320px">
        <div class="form-row">
          <label class="form-label">新密碼</label>
          <input class="form-input" type="password" v-model="newAdminPw" placeholder="輸入新密碼" />
        </div>
        <button class="btn btn-exec" @click="saveAdminPw" :disabled="!newAdminPw">💾 更新密碼</button>
      </div>
    </div>

    <!-- Supabase SQL hint -->
    <div class="admin-section">
      <div class="admin-section-title">Supabase 資料表 SQL</div>
      <div style="font-size:13px;color:var(--text-muted);margin-bottom:8px">若尚未建立資料表，請至 Supabase SQL Editor 執行以下 SQL：</div>
      <pre class="sql-block">{{ SQL }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useSupabase } from '../composables/useSupabase'
import { useToast } from '../composables/useToast'

const { sb } = useSupabase()
const { success, error } = useToast()

const members = ref([])
const saving = ref(false)
const newAdminPw = ref('')
const newPerm = ref({ username: '', password: '', modules: [], canEditMgt: false, canEditSr30: false })

const SQL = `-- 成員權限表（含密碼欄位）
create table if not exists user_permissions (
  id bigint generated always as identity primary key,
  username text not null,
  module text not null,
  project_ids integer[] default '{}',
  can_edit boolean default false,
  password text default null,
  unique(username, module)
);
alter table user_permissions enable row level security;
create policy "perm anon all" on user_permissions
  for all to anon using (true) with check (true);

-- 若已有舊表，補加密碼欄位：
-- alter table user_permissions add column if not exists password text default null;

-- Admin 設定表
create table if not exists app_config (
  key text primary key,
  value text
);
alter table app_config enable row level security;
create policy "cfg anon all" on app_config
  for all to anon using (true) with check (true);

-- MGT 專案表
create table if not exists projects (
  id bigint generated always as identity primary key,
  no integer, code text, name text, unit text, eng text, pm text,
  stage text default 'ra', sit integer default 0, uat integer default 0,
  "statusRaw" text, memo text, issue text, figma text,
  "updatedBy" text, "updatedAt" timestamptz default now()
);
alter table projects enable row level security;
create policy "proj anon all" on projects
  for all to anon using (true) with check (true);

-- MGT 歷史記錄表
create table if not exists history (
  id bigint generated always as identity primary key,
  "docId" text, "projectName" text, changes jsonb,
  type text, "user" text, ts timestamptz default now()
);
alter table history enable row level security;
create policy "hist anon all" on history
  for all to anon using (true) with check (true);

-- SR3.0 WBS 表
create table if not exists wbs_tasks (
  id bigint generated always as identity primary key,
  sort_order int default 0, section text, wbs_no text, task text,
  owner text, collaborators text, period text,
  mandays numeric default 0, deps text, deliverable text,
  created_at timestamptz default now()
);
alter table wbs_tasks enable row level security;
create policy "wbs anon all" on wbs_tasks
  for all to anon using (true) with check (true);

-- 初始 Admin 密碼
insert into app_config (key, value)
  values ('admin_password', 'your-admin-password')
  on conflict (key) do nothing;`

// ── LOAD ──
async function loadMembers() {
  if (!sb) return
  const { data, error: err } = await sb.from('user_permissions').select('*').order('username')
  if (err) { error('讀取失敗：' + err.message); return }
  if (!data?.length) return
  // Aggregate by username
  const map = {}
  data.forEach(row => {
    if (!map[row.username]) map[row.username] = { username: row.username, modules: [], canEdit: {}, hasPassword: false }
    map[row.username].modules.push(row.module)
    map[row.username].canEdit[row.module] = row.can_edit
    if (row.password) map[row.username].hasPassword = true
  })
  members.value = Object.values(map)
}

// ── SAVE MEMBER ──
async function saveMember() {
  const name = newPerm.value.username.trim()
  if (!name) { error('請輸入姓名'); return }
  if (!newPerm.value.modules.length) { error('請至少選一個模組'); return }
  saving.value = true
  try {
    if (!sb) { error('未連線 Supabase'); return }
    const pw = newPerm.value.password.trim() || null
    for (const mod of newPerm.value.modules) {
      const canEdit = mod === 'mgt' ? newPerm.value.canEditMgt : newPerm.value.canEditSr30
      await sb.from('user_permissions').upsert(
        { username: name, module: mod, can_edit: canEdit, password: pw },
        { onConflict: 'username,module' }
      )
    }
    success('已儲存：' + name)
    newPerm.value = { username: '', password: '', modules: [], canEditMgt: false, canEditSr30: false }
    await loadMembers()
  } catch (e) { error('儲存失敗：' + e.message) }
  finally { saving.value = false }
}

async function deleteMember(username) {
  if (!confirm(`確認移除「${username}」的所有權限？`)) return
  await sb.from('user_permissions').delete().eq('username', username)
  success('已移除：' + username)
  await loadMembers()
}

async function saveAdminPw() {
  if (!sb) { error('未連線 Supabase'); return }
  await sb.from('app_config').upsert({ key: 'admin_password', value: newAdminPw.value }, { onConflict: 'key' })
  newAdminPw.value = ''
  success('Admin 密碼已更新')
}

onMounted(loadMembers)
</script>

<style scoped>
.admin-page { max-width: 760px; display: flex; flex-direction: column; gap: 28px; }
.admin-header { border-bottom: 1px solid var(--border); padding-bottom: 16px; }
.admin-section { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 20px 24px; }
.admin-section-title { font-size: 13px; text-transform: uppercase; letter-spacing: .8px; color: var(--text-muted); font-family: 'JetBrains Mono', monospace; margin-bottom: 16px; }
.check-label { display: flex; align-items: center; gap: 6px; font-size: 14px; cursor: pointer; }
.member-list { display: flex; flex-direction: column; gap: 8px; }
.member-row { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: var(--surface2); border-radius: 8px; border: 1px solid var(--border); }
.member-name { font-weight: 600; font-size: 15px; min-width: 80px; }
.member-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.module-tag { background: rgba(99,179,237,.12); color: var(--accent); border: 1px solid rgba(99,179,237,.2); border-radius: 4px; padding: 1px 8px; font-size: 12px; font-family: 'JetBrains Mono', monospace; }
.edit-tag { background: rgba(104,211,145,.1); color: var(--green); border: 1px solid rgba(104,211,145,.2); border-radius: 4px; padding: 1px 8px; font-size: 11px; }
.pw-tag { background: rgba(159,122,234,.1); color: var(--accent2); border: 1px solid rgba(159,122,234,.2); border-radius: 4px; padding: 1px 8px; font-size: 11px; }
.sql-block { background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 14px 16px; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--teal); line-height: 1.8; overflow-x: auto; white-space: pre; }
</style>
