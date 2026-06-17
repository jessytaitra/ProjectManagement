<template>
  <div class="sr30-page fade-in">
    <!-- Tabs -->
    <div class="sr30-tabs">
      <button class="sr-tab" :class="{ active: tab === 'gantt' }" @click="tab = 'gantt'">📊 甘特圖</button>
      <button class="sr-tab" :class="{ active: tab === 'wbs' }" @click="tab = 'wbs'">📋 WBS 工作分解</button>
      <div class="sr-mode-tag">{{ syncText }}</div>
    </div>

    <!-- ══ GANTT TAB ══ -->
    <div v-show="tab === 'gantt'" class="gantt-wrap">
      <div class="gantt-sub">
        開發 6/15–7/15（★系統完成 7/15）　｜　UAT &amp; Bugfix 7/16–7/30　｜　Docker 容器化開發　｜　AAD 僅身分驗證（無簽核）　｜　2026.06
      </div>

      <div class="legend">
        <div class="legend-item"><span class="lsw hw"></span>硬體（基礎設施／Docker）</div>
        <div class="legend-item"><span class="lsw dev1"></span>DEV1 前端</div>
        <div class="legend-item"><span class="lsw dev2"></span>DEV2 後端／整合</div>
        <div class="legend-item"><span class="lsw all-color"></span>全員（測試／UAT）</div>
      </div>

      <!-- Gantt Header -->
      <div class="ghead">
        <div class="glabel"></div>
        <div class="gplot">
          <div class="weeks">
            <div class="wk" style="flex:5"><b>W1</b><span>6/15–19</span></div>
            <div class="wk" style="flex:5"><b>W2</b><span>6/22–26</span></div>
            <div class="wk" style="flex:5"><b>W3</b><span>6/29–7/3</span></div>
            <div class="wk" style="flex:5"><b>W4</b><span>7/6–10</span></div>
            <div class="wk star" style="flex:3"><b>W5★</b><span>7/13–15</span></div>
            <div class="wk" style="flex:11"><b>UAT &amp; Bugfix</b><span>7/16–7/30</span></div>
          </div>
        </div>
      </div>

      <!-- Gantt Rows -->
      <div class="grows">
        <div class="ghead" style="border:none">
          <div class="glabel"></div>
          <div class="gplot">
            <div class="grid-lines">
              <i style="left:14.71%"></i><i style="left:29.41%"></i>
              <i style="left:44.12%"></i><i style="left:58.82%"></i>
              <i class="star" style="left:67.65%"></i>
              <!-- Today marker -->
              <div v-if="todayPct >= 0 && todayPct <= 100" class="today-line" :style="{ left: todayPct + '%' }">
                <div class="today-label">今天 {{ todayLabel }}</div>
              </div>
            </div>
          </div>
        </div>

        <div v-for="row in ganttRows" :key="row.label" class="grow">
          <div class="glabel">
            <span class="dot" :class="row.type"></span>
            {{ row.label }}
          </div>
          <div class="track">
            <div
              v-for="bar in row.bars" :key="bar.label + bar.left"
              :class="['bar', bar.tail ? 'tail' : '', bar.type]"
              :style="{ left: bar.left, width: bar.width }"
            >{{ bar.label }}</div>
          </div>
        </div>
      </div>

      <!-- Milestones -->
      <div class="mile">
        <div class="glabel">里程碑</div>
        <div class="mrow">
          <div class="m" style="left:14.71%">基礎設施<br>Docker／schema</div>
          <div class="m" style="left:29.41%">工單生命週期<br>可跑</div>
          <div class="m" style="left:44.12%">管理功能<br>通知可發</div>
          <div class="m star" style="left:67.65%">系統完成<br>7/15</div>
          <div class="m" style="left:100%">UAT 完成<br>7/30→上線</div>
        </div>
      </div>

      <div class="gantt-note">
        採 <b>Docker 容器化</b>開發與部署；<b>AAD 僅身分驗證（已移除簽核）</b>；工單流程＝提交→IT 受理→處理→結案（問卷必填鎖定），另有取消（申請人）／拒絕（IT）。基礎設施集中於 W1；其就緒前前端先以本地資料轉接層（localStorage）於容器中開發。系統 <b>7/15 完成</b>，<b>UAT &amp; Bugfix 7/16–7/30</b>，上線於 7/30 後。
      </div>
    </div>

    <!-- ══ WBS TAB ══ -->
    <div v-show="tab === 'wbs'" class="wbs-wrap">
      <div class="wbs-toolbar">
        <button v-if="store.canEdit('sr30')" class="btn btn-primary" @click="startAdd('')">＋ 新增工項</button>
        <button class="btn" @click="load">重新整理</button>
        <button v-if="store.canEdit('sr30') && store.isAdmin" class="btn" @click="doSeed">初始化範例資料</button>
        <div class="wbs-total">預估人天合計：<b>{{ totalMandays }}</b></div>
      </div>

      <div v-if="statusMsg" class="wbs-status" :class="statusType">{{ statusMsg }}</div>

      <div class="wbs-scroll">
        <table class="wbs-table">
          <thead>
            <tr>
              <th style="width:32px"></th>
              <th style="width:58px">WBS</th>
              <th style="width:220px">工作項目</th>
              <th style="width:74px">主責</th>
              <th style="width:64px">協作</th>
              <th style="width:108px;white-space:nowrap">期程</th>
              <th style="width:48px">人天</th>
              <th style="width:70px">相依</th>
              <th>產出 / 備註</th>
              <th v-if="store.canEdit('sr30')" style="width:110px">操作</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(group, sec) in groupedTasks" :key="sec">
              <tr class="sec-row">
                <td :colspan="store.canEdit('sr30') ? 10 : 9">
                  {{ sec }}
                  <button v-if="store.canEdit('sr30')" class="btn" style="margin-left:10px;padding:3px 9px;font-size:12px" @click="startAdd(sec)">＋ 新增此區段</button>
                </td>
              </tr>
              <tr
                v-for="t in group"
                :key="t.id"
                :class="{ editing: editingId === t.id, done: t.done }"
              >
                <template v-if="editingId === t.id">
                  <td></td>
                  <td><input class="cell" v-model="editForm.wbs_no" /></td>
                  <td>
                    <input class="cell" v-model="editForm.task" />
                    <input class="cell" style="margin-top:4px;font-size:11px" v-model="editForm.section" placeholder="區段名稱" />
                  </td>
                  <td><input class="cell" v-model="editForm.owner" /></td>
                  <td><input class="cell" v-model="editForm.collaborators" /></td>
                  <td><input class="cell" v-model="editForm.period" /></td>
                  <td><input class="cell" style="text-align:right" type="number" v-model.number="editForm.mandays" /></td>
                  <td><input class="cell" v-model="editForm.deps" /></td>
                  <td><input class="cell" v-model="editForm.deliverable" /></td>
                  <td v-if="store.canEdit('sr30')">
                    <div style="display:flex;gap:5px">
                      <button class="btn btn-primary" style="padding:3px 9px;font-size:12px" @click="saveRow(t.id)">儲存</button>
                      <button class="btn" style="padding:3px 9px;font-size:12px" @click="cancelEdit">取消</button>
                    </div>
                  </td>
                </template>
                <template v-else>
                  <td class="c">
                    <button class="done-btn" :class="{ checked: t.done }" @click="toggleDone(t)" :title="t.done ? '標為未完成' : '標為完成'">
                      {{ t.done ? '✓' : '' }}
                    </button>
                  </td>
                  <td class="c mono">{{ t.wbs_no }}</td>
                  <td>{{ t.task }}</td>
                  <td class="c">{{ t.owner }}</td>
                  <td class="c">{{ t.collaborators }}</td>
                  <td class="c" style="white-space:nowrap">{{ t.period }}</td>
                  <td class="r">{{ t.mandays }}</td>
                  <td class="c">{{ t.deps }}</td>
                  <td>{{ t.deliverable }}</td>
                  <td v-if="store.canEdit('sr30')">
                    <div style="display:flex;gap:5px">
                      <button class="btn" style="padding:3px 9px;font-size:12px" @click="startEdit(t)">編輯</button>
                      <button class="btn btn-danger" style="padding:3px 9px;font-size:12px" @click="deleteRow(t.id)">刪除</button>
                    </div>
                  </td>
                </template>
              </tr>
            </template>
            <!-- New row -->
            <template v-if="isAdding">
              <tr class="editing">
                <td></td>
                <td><input class="cell" v-model="editForm.wbs_no" placeholder="1.1" /></td>
                <td>
                  <input class="cell" v-model="editForm.task" placeholder="工作項目名稱" />
                  <input class="cell" style="margin-top:4px;font-size:11px" v-model="editForm.section" placeholder="區段（例：1. 專案管理）" />
                </td>
                <td><input class="cell" v-model="editForm.owner" placeholder="DEV1" /></td>
                <td><input class="cell" v-model="editForm.collaborators" placeholder="—" /></td>
                <td><input class="cell" v-model="editForm.period" placeholder="W1 6/15–19" /></td>
                <td><input class="cell" style="text-align:right" type="number" v-model.number="editForm.mandays" /></td>
                <td><input class="cell" v-model="editForm.deps" placeholder="—" /></td>
                <td><input class="cell" v-model="editForm.deliverable" /></td>
                <td v-if="store.canEdit('sr30')">
                  <div style="display:flex;gap:5px">
                    <button class="btn btn-primary" style="padding:3px 9px;font-size:12px" @click="saveNewRow">儲存</button>
                    <button class="btn" style="padding:3px 9px;font-size:12px" @click="cancelEdit">取消</button>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '../stores/app'
import { useSupabase } from '../composables/useSupabase'
import { useToast } from '../composables/useToast'

const store = useAppStore()
const { sb } = useSupabase()
const { success, error } = useToast()

const TABLE = 'wbs_tasks'
const tab = ref('gantt')
const tasks = ref([])
const syncText = ref('載入中…')
const statusMsg = ref('')
const statusType = ref('warn')
const editingId = ref(null)
const isAdding = ref(false)
const editForm = ref(emptyForm())

// ── GANTT DATA ──
const ganttRows = [
  { label: '基礎設施／跨組申請',       type: 'hw',   bars: [{ type:'hw',   left:'0',       width:'14.71%', label:'建置' }, { type:'hw',   left:'14.71%', width:'4.41%',  label:'收尾', tail:true }] },
  { label: 'Docker 開發／部署環境',     type: 'hw',   bars: [{ type:'hw',   left:'0',       width:'11.76%', label:'建置' }, { type:'hw',   left:'11.76%', width:'47.06%', label:'容器化部署', tail:true }] },
  { label: '後端 API／SR_DB',           type: 'dev2', bars: [{ type:'dev2', left:'1.47%',   width:'51.47%', label:'開發' }, { type:'dev2', left:'52.94%', width:'14.71%', label:'測試', tail:true }] },
  { label: 'AAD 身分驗證（無簽核）',    type: 'dev2', bars: [{ type:'dev2', left:'5.88%',   width:'29.41%', label:'串接' }, { type:'dev2', left:'35.29%', width:'23.53%', label:'驗證', tail:true }] },
  { label: '變更⑤ Dark／Light',         type: 'dev1', bars: [{ type:'dev1', left:'0',       width:'14.71%', label:'主題切換' }] },
  { label: '前端串接 API',              type: 'dev1', bars: [{ type:'dev1', left:'14.71%',  width:'29.41%', label:'開發' }, { type:'dev1', left:'67.65%', width:'8.82%', label:'修正', tail:true }] },
  { label: '變更① 急件／移除 SLA',     type: 'dev1', bars: [{ type:'dev1', left:'44.12%',  width:'5.88%',  label:'急件' }] },
  { label: '變更③ 狀態機 取消／拒絕',  type: 'dev1', bars: [{ type:'dev1', left:'50.00%',  width:'8.82%',  label:'狀態機' }] },
  { label: '變更② 問卷必填＋鎖定',     type: 'dev1', bars: [{ type:'dev1', left:'58.82%',  width:'4.41%',  label:'問卷' }] },
  { label: '變更④ 分類公開／隱藏',     type: 'dev1', bars: [{ type:'dev1', left:'63.24%',  width:'4.41%',  label:'分類' }] },
  { label: 'Email／Teams 通知',         type: 'dev2', bars: [{ type:'dev2', left:'23.53%',  width:'29.41%', label:'整合' }, { type:'dev2', left:'52.94%', width:'14.71%', label:'驗證', tail:true }] },
  { label: '前後端整合／內部測試',      type: 'all',  bars: [{ type:'all',  left:'52.94%',  width:'14.71%', label:'整合·測試' }] },
  { label: 'UAT & Bugfix',             type: 'all',  bars: [{ type:'all',  left:'67.65%',  width:'32.35%', label:'UAT · 缺失修正 · 回歸' }] },
]

// ── SEED ──
const SEED_DATA = [
  ["1. 專案管理（PM）","1.1","專案啟動與範疇確認","PM","全員","W1 6/15–6/19",1,"—","決策確認紀錄"],
  ["1. 專案管理（PM）","1.2","跨組資源申請協調","PM","HW","W1 6/15–6/19",2,"—","各組需求單送出"],
  ["1. 專案管理（PM）","1.3","進度追蹤、每日站會與週報","PM","全員","全程",6,"—","週報／燃盡圖"],
  ["1. 專案管理（PM）","1.4","風險與待確認事項管理","PM","—","全程",2,"—","風險清單"],
  ["1. 專案管理（PM）","1.5","UAT 規劃與協調","PM","全員","7/16–7/30",3,"6.4","UAT 計畫"],
  ["1. 專案管理（PM）","1.6","教育訓練與上線溝通","PM","DEV1","UAT 期",2,"—","訓練素材／公告"],
  ["2. 基礎設施與容器化環境（HW）","2.1","VM 申請與建置","HW","PM","W1 6/15–6/19",2,"1.2","VM 可登入"],
  ["2. 基礎設施與容器化環境（HW）","2.2","SR_DB 連線開通","HW","DEV2","W1 6/15–6/19",2,"1.2","連線測通"],
  ["2. 基礎設施與容器化環境（HW）","2.3","內部 DNS 設定","HW","—","W1 6/15–6/19",1,"1.2","解析正常"],
  ["2. 基礎設施與容器化環境（HW）","2.4","SSL 憑證與 HTTPS","HW","—","W1–W2",2,"2.3","HTTPS 綁定"],
  ["2. 基礎設施與容器化環境（HW）","2.5","DMZ／防火牆規則","HW","—","W1–W2",2,"1.2","規則開通"],
  ["2. 基礎設施與容器化環境（HW）","2.6","Docker 開發環境建置","HW","DEV2","W1 6/15–6/19",2,"—","本地容器可跑"],
  ["2. 基礎設施與容器化環境（HW）","2.7","Exchange SMTP Relay 開通","HW","DEV2","W2 6/22–6/26",1,"1.2","VM 可寄信"],
  ["2. 基礎設施與容器化環境（HW）","2.8","M365 Teams 通知管道建置","HW","DEV2","W2–W3",2,"1.2","通知管道可用"],
  ["2. 基礎設施與容器化環境（HW）","2.9","容器化部署／反向代理","HW","DEV2","W2–W4",3,"2.6","可一鍵部署"],
  ["3. 資料庫與後端 API（DEV2）","3.1","SR_DB 資料表設計","DEV2","DEV1","W1 6/15–6/19",2,"2.2","schema 定版"],
  ["3. 資料庫與後端 API（DEV2）","3.2","後端骨架與 MSSQL 存取層","DEV2","—","W1 6/15–6/19",2,"3.1,2.6","API 可連 DB"],
  ["3. 資料庫與後端 API（DEV2）","3.3","工單 CRUD API","DEV2","DEV1","W2 6/22–6/26",3,"3.2","API 完成"],
  ["3. 資料庫與後端 API（DEV2）","3.4","狀態機（取消／拒絕）","DEV2","DEV1","W2 6/22–6/26",2,"3.3","狀態流轉正確"],
  ["3. 資料庫與後端 API（DEV2）","3.5","急件欄位與驗證","DEV2","DEV1","W2 6/22–6/26",1,"3.3","急件邏輯"],
  ["4. 身分整合 AAD","4.1","AAD App Registration","HW","DEV2","W1 6/15–6/19",1,"1.2","App 已註冊"],
  ["4. 身分整合 AAD","4.2","MSAL OAuth2 登入串接","DEV2","DEV1","W1–W2",3,"4.1","可 AAD 登入"],
  ["4. 身分整合 AAD","4.3","員工資料／群組取得","DEV2","—","W2 6/22–6/26",1,"4.2","員工資料對應"],
  ["4. 身分整合 AAD","4.4","角色權限（申請人／IT／管理者）","DEV2","DEV1","W2 6/22–6/26",2,"4.2","權限控管"],
  ["5. 前端開發（DEV1）","5.1","資料層抽象：localStorage → API","DEV1","DEV2","W1 6/15–6/19",2,"3.2","前端接 API"],
  ["5. 前端開發（DEV1）","5.2","AAD 登入整合（前端）","DEV1","DEV2","W2 6/22–6/26",2,"4.2","登入流程"],
  ["5. 前端開發（DEV1）","5.3","申請單改造：急件勾選","DEV1","—","W2 6/22–6/26",1,"5.1","表單完成"],
  ["5. 前端開發（DEV1）","5.8","Dark／Light 主題切換","DEV1","—","W1 6/15–6/19",2,"—","主題切換"],
  ["6. 整合與系統完成（★7/15）","6.1","前後端整合（容器環境）","DEV1,DEV2","—","W4–W5",3,"3.x,5.x","整合完成"],
  ["6. 整合與系統完成（★7/15）","6.2","內部整合測試","DEV1,DEV2","—","W4–W5",3,"6.1","測試報告"],
  ["6. 整合與系統完成（★7/15）","6.4","★ 系統完成（Dev Complete）","全員","—","7/15",0,"6.2","系統完成里程碑"],
  ["7. UAT & Bugfix（7/16–7/30）","7.1","UAT 環境部署（容器）","HW","DEV2","7/16",1,"6.4","UAT 環境就緒"],
  ["7. UAT & Bugfix（7/16–7/30）","7.2","UAT 執行（使用者測試）","全員","PM","7/16–7/24",4,"7.1","UAT 回饋"],
  ["7. UAT & Bugfix（7/16–7/30）","7.3","缺失修正（Bugfix）","DEV1,DEV2","—","7/16–7/30",6,"7.2","問題修正"],
  ["7. UAT & Bugfix（7/16–7/30）","7.4","回歸測試","DEV1,DEV2","—","7/28–7/30",2,"7.3","回歸通過"],
  ["7. UAT & Bugfix（7/16–7/30）","7.5","上線準備與 Go-live checklist","PM","HW","7/30",1,"7.4","上線就緒"],
]
const COLS = ["section","wbs_no","task","owner","collaborators","period","mandays","deps","deliverable"]

function seedObjects() {
  return SEED_DATA.map((r, i) => {
    const o = { sort_order: i + 1 }
    COLS.forEach((c, j) => { o[c] = r[j] })
    return o
  })
}

// ── COMPUTED ──
// ── TODAY MARKER ──
const CHART_START = new Date('2026-06-15')
const CHART_END   = new Date('2026-07-30')
const todayPct = computed(() => {
  const now = new Date()
  const total = CHART_END - CHART_START
  const elapsed = now - CHART_START
  return Math.round((elapsed / total) * 10000) / 100
})
const todayLabel = computed(() => {
  const now = new Date()
  return `${now.getMonth()+1}/${now.getDate()}`
})

const groupedTasks = computed(() => {
  const sorted = [...tasks.value].sort((a, b) =>
    (a.section||'').localeCompare(b.section||'') || ((a.sort_order||0) - (b.sort_order||0))
  )
  const groups = {}
  sorted.forEach(t => {
    const sec = t.section || '（未分類）'
    if (!groups[sec]) groups[sec] = []
    groups[sec].push(t)
  })
  return groups
})

const totalMandays = computed(() => tasks.value.reduce((s, t) => s + (Number(t.mandays)||0), 0))

// ── HELPERS ──
function emptyForm() {
  return { wbs_no:'', task:'', section:'', owner:'', collaborators:'—', period:'', mandays:0, deps:'—', deliverable:'' }
}
function setStatus(msg, type = 'warn') { statusMsg.value = msg; statusType.value = type }
const isDemoMode = computed(() => !sb)

// ── LOAD ──
async function load() {
  if (!sb) {
    tasks.value = seedObjects().map((o, i) => ({ ...o, id: 'L' + i }))
    syncText.value = '● Demo 模式'
    setStatus('未設定 Supabase，目前為本地預覽模式。', 'warn')
    return
  }
  try {
    const { data, error: err } = await sb.from(TABLE).select('*').order('section').order('sort_order').order('id')
    if (err) throw err
    tasks.value = data
    syncText.value = '● 已連線 Supabase'
    setStatus(data.length ? '' : '資料表為空，可點「初始化範例資料」匯入。', 'ok')
  } catch (e) {
    tasks.value = seedObjects().map((o, i) => ({ ...o, id: 'L' + i }))
    syncText.value = '● 本地預覽模式'
    setStatus('無法連線 Supabase：' + (e.message || e), 'warn')
  }
}

// ── EDIT ──
function startEdit(t) { editingId.value = t.id; isAdding.value = false; editForm.value = { ...t } }
function startAdd(section) {
  isAdding.value = true; editingId.value = null
  editForm.value = { ...emptyForm(), section }
}
function cancelEdit() { editingId.value = null; isAdding.value = false }

async function saveRow(id) {
  const rec = { ...editForm.value }
  try {
    if (isDemoMode.value) {
      tasks.value = tasks.value.map(t => t.id === id ? { ...t, ...rec } : t)
    } else {
      await sb.from(TABLE).update(rec).eq('id', id)
      tasks.value = tasks.value.map(t => t.id === id ? { ...t, ...rec } : t)
    }
    editingId.value = null
    success('已儲存')
    setStatus(isDemoMode.value ? '已修改（本地預覽）。' : '已儲存變更。', isDemoMode.value ? 'warn' : 'ok')
  } catch (e) { error('儲存失敗：' + e.message) }
}

async function saveNewRow() {
  const rec = { ...editForm.value, sort_order: tasks.value.length + 1 }
  try {
    if (isDemoMode.value) {
      tasks.value.push({ ...rec, id: 'L' + Date.now() })
    } else {
      const { data, error: err } = await sb.from(TABLE).insert(rec).select().single()
      if (err) throw err
      tasks.value.push(data)
    }
    isAdding.value = false
    success('已新增')
    setStatus(isDemoMode.value ? '已新增（本地預覽，未儲存）。' : '已新增並儲存。', isDemoMode.value ? 'warn' : 'ok')
  } catch (e) { error('新增失敗：' + e.message) }
}

async function deleteRow(id) {
  if (!confirm('確定刪除此工項？')) return
  try {
    if (isDemoMode.value) {
      tasks.value = tasks.value.filter(t => t.id !== id)
    } else {
      await sb.from(TABLE).delete().eq('id', id)
      tasks.value = tasks.value.filter(t => t.id !== id)
    }
    success('已刪除')
  } catch (e) { error('刪除失敗：' + e.message) }
}

async function toggleDone(t) {
  const newVal = !t.done
  t.done = newVal
  if (!isDemoMode.value) {
    await sb.from(TABLE).update({ done: newVal }).eq('id', t.id)
  }
}

async function doSeed() {
  if (isDemoMode.value) { setStatus('本地模式已含範例資料。', 'warn'); return }
  if (tasks.value.length && !confirm('資料表已有資料，仍要匯入範例嗎？')) return
  try {
    const { error: err } = await sb.from(TABLE).insert(seedObjects())
    if (err) throw err
    await load()
    success('已匯入範例 WBS')
  } catch (e) { error('匯入失敗：' + e.message) }
}

onMounted(load)
</script>

<style scoped>
.sr30-page { display: flex; flex-direction: column; gap: 16px; }
.sr30-tabs { display: flex; align-items: center; gap: 8px; border-bottom: 1px solid var(--border); padding-bottom: 12px; flex-wrap: wrap; }
.sr-tab { padding: 7px 18px; border: 1px solid var(--border); background: var(--surface2); color: var(--text-dim); border-radius: 8px; cursor: pointer; font-size: 14px; font-family: inherit; transition: all .15s; }
.sr-tab.active { background: rgba(99,179,237,.15); border-color: rgba(99,179,237,.35); color: var(--accent); }
.sr-mode-tag { margin-left: auto; font-size: 12px; color: var(--green); background: rgba(104,211,145,.1); border: 1px solid rgba(104,211,145,.2); border-radius: 10px; padding: 3px 10px; }

/* Gantt */
.gantt-wrap { display: flex; flex-direction: column; gap: 10px; }
.gantt-sub { font-size: 12.5px; color: var(--text-muted); line-height: 1.6; }
.legend { display: flex; gap: 14px; flex-wrap: wrap; font-size: 12px; }
.legend-item { display: flex; align-items: center; gap: 6px; }
.lsw { width: 14px; height: 14px; border-radius: 2px; flex-shrink: 0; }
.lsw.hw   { background: #3a7ca5; }
.lsw.dev1 { background: #4a7c59; }
.lsw.dev2 { background: #2f5597; }
.lsw.all-color { background: #b7791f; }


.ghead { display: flex; border-bottom: 1px solid var(--border); }
.glabel { width: 208px; flex: 0 0 208px; font-size: 11.7px; display: flex; align-items: center; gap: 7px; padding-right: 10px; color: var(--text-dim); }
.gplot { flex: 1; position: relative; }
.weeks { display: flex; }
.wk { padding: 6px 4px; text-align: center; border-left: 1px solid var(--border); font-size: 12px; }
.wk:first-child { border-left: none; }
.wk b { display: block; color: var(--accent); font-size: 13px; }
.wk.star b { color: var(--orange); }
.wk span { font-size: 10px; color: var(--text-muted); font-family: monospace; }
.grows { position: relative; }
.grid-lines { position: absolute; inset: 0; pointer-events: none; }
.grid-lines i { position: absolute; top: 0; bottom: 0; width: 1px; background: var(--border); }
.grid-lines i.star { background: var(--orange); width: 2px; }
.today-line { position: absolute; top: 0; bottom: -9999px; width: 2px; background: #e53e3e; pointer-events: none; z-index: 10; }
.today-label { position: absolute; top: 2px; left: 4px; font-size: 10px; color: #e53e3e; font-weight: 700; white-space: nowrap; font-family: 'JetBrains Mono', monospace; background: var(--surface); padding: 1px 4px; border-radius: 3px; border: 1px solid #e53e3e; }
.grow { display: flex; align-items: center; height: 31px; border-bottom: 1px solid var(--surface2); }
.grow .glabel { font-size: 11.7px; }
.dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dot.hw   { background: #3a7ca5; }
.dot.dev1 { background: #4a7c59; }
.dot.dev2 { background: #2f5597; }
.dot.all  { background: #b7791f; }
.track { position: relative; height: 31px; flex: 1; }
.bar { position: absolute; top: 6px; height: 19px; border-radius: 3px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 10px; white-space: nowrap; overflow: hidden; }
.bar.tail { opacity: .34; color: var(--text); }
.bar.hw   { background: #3a7ca5; }
.bar.dev1 { background: #4a7c59; }
.bar.dev2 { background: #2f5597; }
.bar.all  { background: #b7791f; }
.mile { display: flex; margin-top: 10px; }
.mile .glabel { flex: 0 0 208px; font-size: 11px; color: var(--text-muted); }
.mrow { flex: 1; position: relative; height: 40px; }
.m { position: absolute; transform: translateX(-50%); font-size: 9.5px; color: var(--accent); text-align: center; white-space: nowrap; }
.m::before { content: '◆'; display: block; font-size: 9px; }
.m.star { color: var(--orange); font-weight: 700; }
.m.star::before { content: '★'; font-size: 12px; }
.gantt-note { font-size: 11.3px; color: var(--text-muted); line-height: 1.7; border-top: 1px solid var(--border); padding-top: 12px; }

/* WBS */
.wbs-wrap { display: flex; flex-direction: column; gap: 12px; }
.wbs-toolbar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.wbs-total { margin-left: auto; font-size: 13px; color: var(--text-muted); }
.wbs-status { font-size: 13px; padding: 8px 12px; border-radius: 6px; }
.wbs-status.warn { background: rgba(246,224,94,.1); color: var(--yellow); border: 1px solid rgba(246,224,94,.2); }
.wbs-status.ok   { background: rgba(104,211,145,.1); color: var(--green); border: 1px solid rgba(104,211,145,.2); }
.wbs-scroll { overflow-x: auto; border-radius: 8px; border: 1px solid var(--border); }
.wbs-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.wbs-table th, .wbs-table td { border-bottom: 1px solid var(--border); padding: 8px 10px; text-align: left; vertical-align: middle; }
.wbs-table th { color: var(--accent); font-weight: 700; background: var(--surface2); position: sticky; top: 0; font-size: 13px; }
.sec-row td { background: var(--accent); color: #fff; font-weight: 700; font-size: 13px; padding: 7px 10px; }
.editing { background: var(--surface2); }
.cell { width: 100%; padding: 4px 6px; border: 1px solid var(--border); border-radius: 3px; background: var(--surface3); color: var(--text); font-size: 13px; font-family: inherit; outline: none; }
.cell:focus { border-color: var(--border-accent); }
.c { text-align: center; }
.r { text-align: right; }
.mono { font-family: 'JetBrains Mono', monospace; }
/* Done state */
.done td { text-decoration: line-through; opacity: 0.45; }
.done-btn {
  width: 22px; height: 22px; border-radius: 4px; border: 1.5px solid var(--border);
  background: transparent; color: var(--green); font-size: 13px; cursor: pointer;
  display: flex; align-items: center; justify-content: center; margin: auto;
  transition: all .15s;
}
.done-btn:hover { border-color: var(--green); background: rgba(104,211,145,.1); }
.done-btn.checked { background: var(--green); border-color: var(--green); color: #fff; }
</style>
