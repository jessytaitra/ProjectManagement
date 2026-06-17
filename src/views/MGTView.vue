<template>
  <div class="mgt-page fade-in">
    <!-- Stats Row -->
    <div class="stats-row">
      <div
        v-for="(s, i) in statDefs"
        :key="s.label"
        class="stat-card"
        :class="{ active: currentFilter === s.filter || (i === 0 && currentFilter === 'all') }"
        :style="s.filter ? 'cursor:pointer' : 'cursor:default'"
        @click="s.filter && filterBy(s.filter)"
      >
        <div class="stat-label">{{ s.label }}</div>
        <div class="stat-num" :style="{ color: s.color }">{{ s.num }}</div>
        <div class="stat-sub">{{ s.sub }}</div>
      </div>
    </div>

    <!-- Content Area -->
    <div class="mgt-body">
      <!-- Sidebar Filters -->
      <nav class="filter-sidebar">
        <div class="sidebar-section-label">全部</div>
        <div class="filter-item" :class="{ active: currentFilter === 'all' }" @click="filterBy('all')">
          <span class="sidebar-dot" style="background:#6b7280"></span>所有表單
          <span class="sidebar-count">{{ projects.length }}</span>
        </div>

        <div class="sidebar-section-label">依進度階段</div>
        <div v-for="s in STAGES" :key="s.key" class="filter-item" :class="{ active: currentFilter === 'stage-'+s.key }" @click="filterBy('stage-'+s.key)">
          <span class="sidebar-dot" :style="{ background: s.color }"></span>
          {{ s.label }} {{ s.full }}
          <span class="sidebar-count">{{ projects.filter(p => p.stage === s.key).length }}</span>
        </div>

        <div class="sidebar-section-label">依 PM</div>
        <div v-for="pm in pmList" :key="pm" class="filter-item" :class="{ active: currentFilter === 'pm-'+pm }" @click="filterBy('pm-'+pm)">
          <span class="sidebar-dot" :style="{ background: pm === 'Lily' ? 'var(--accent)' : 'var(--pink)' }"></span>
          PM — {{ pm }}
          <span class="sidebar-count">{{ projects.filter(p => p.pm === pm).length }}</span>
        </div>

        <div class="sidebar-section-label">依部門</div>
        <div v-for="dept in deptList" :key="dept" class="filter-item" :class="{ active: currentFilter === 'dept-'+dept }" @click="filterBy('dept-'+dept)">
          <span class="sidebar-dot" style="background:var(--teal)"></span>
          {{ dept }}
          <span class="sidebar-count">{{ projects.filter(p => p.deptKey === dept).length }}</span>
        </div>
      </nav>

      <!-- Main Content -->
      <div class="mgt-content">
        <!-- Toolbar -->
        <div class="toolbar">
          <input class="search-box" v-model="searchQ" placeholder="搜尋表單名稱、代號、單位、工程師…" />
          <div class="view-toggle">
            <button class="view-btn" :class="{ active: currentView === 'table' }" @click="currentView = 'table'">☰</button>
            <button class="view-btn" :class="{ active: currentView === 'kanban' }" @click="currentView = 'kanban'">⊞</button>
          </div>
          <button v-if="store.canEdit('mgt')" class="btn btn-primary" @click="openAddModal">＋ 新增專案</button>
          <button class="btn" @click="showHistory = true">📋 修改紀錄</button>
          <button class="btn btn-exec" @click="showExec = true">📊 長官儀表板</button>
        </div>

        <!-- Section header -->
        <div class="section-header">
          <div class="section-title">{{ filterLabel }}</div>
          <div class="section-count">{{ filtered.length }} 筆</div>
          <div class="sync-badge" :class="syncState">● {{ syncText }}</div>
        </div>

        <!-- Table View -->
        <div v-if="currentView === 'table'" class="table-wrap">
          <table>
            <thead>
              <tr>
                <th @click="sortBy('no')">#</th>
                <th @click="sortBy('code')">代號</th>
                <th @click="sortBy('name')">表單名稱</th>
                <th @click="sortBy('unit')">所屬單位</th>
                <th @click="sortBy('eng')">AP工程師</th>
                <th @click="sortBy('pm')">PM</th>
                <th>進度流程</th>
                <th @click="sortBy('stage')">當前階段</th>
                <th @click="sortBy('deploy')">上線時間</th>
                <th>Figma</th>
                <th>優化項目</th>
                <th>備註</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!filtered.length">
                <td colspan="11" class="empty-state">無符合條件的項目</td>
              </tr>
              <tr
                v-for="p in filtered"
                :key="p.id"
                class="fade-in"
                @click="openDetail(p)"
              >
                <td class="mono muted">{{ p.no }}</td>
                <td><span class="code-badge">{{ p.code }}</span></td>
                <td><div class="task-name">{{ p.name }}</div></td>
                <td><div class="task-unit">{{ p.unit }}</div></td>
                <td><span class="person-tag">{{ p.eng }}</span></td>
                <td><span class="person-tag" :style="{ color: p.pm === 'Lily' ? 'var(--accent)' : 'var(--pink)' }">{{ p.pm }}</span></td>
                <td style="min-width:190px">
                  <div class="stage-pipeline">
                    <div
                      v-for="(s, i) in STAGES" :key="s.key"
                      class="stage-step"
                      :class="i < p.stageIdx ? 'done' : i === p.stageIdx ? 'active' : 'pending'"
                      :style="stageStepStyle(s, i, p.stageIdx)"
                      :title="s.full"
                    >{{ s.label }}</div>
                  </div>
                </td>
                <td>
                  <span class="status-badge" :class="'status-'+p.stage">
                    <span class="status-dot" :style="{ background: stageColor(p.stage) }"></span>
                    {{ stageIcon(p.stage) }} {{ stageLabel(p.stage) }}
                  </span>
                </td>
                <td class="c"><span v-if="p.deploy" class="golive-badge">{{ p.deploy }}</span></td>
                <td @click.stop>
                  <a v-if="p.figma" class="link-btn" :href="p.figma" target="_blank">🎨 Figma</a>
                  <span v-else class="link-empty" @click="openFigmaEdit(p)">＋ 連結</span>
                </td>
                <td @click.stop>
                  <div class="memo-cell" @click="openMemoEdit(p)">
                    <span v-if="p.memo" class="memo-text">{{ p.memo }}</span>
                    <span v-else class="memo-empty">＋ 新增</span>
                  </div>
                </td>
                <td @click.stop>
                  <div class="issue-cell" @click="openIssueEdit(p)">
                    <span v-if="p.issue" class="issue-badge">⚠ {{ p.issue }}</span>
                    <span v-else class="memo-empty">＋ 填寫</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Kanban View -->
        <div v-if="currentView === 'kanban'" class="kanban-board">
          <div v-for="s in STAGES" :key="s.key" class="kanban-col">
            <div class="kanban-col-header">
              <span>{{ s.icon }}</span>
              <span class="kanban-col-title" :style="{ color: s.color }">{{ s.label }}</span>
              <span class="kanban-col-count">{{ filtered.filter(p => p.stage === s.key).length }}</span>
            </div>
            <div class="kanban-cards">
              <div
                v-for="p in filtered.filter(p => p.stage === s.key)"
                :key="p.id"
                class="kanban-card"
                @click="openDetail(p)"
              >
                <div class="kanban-card-code">{{ p.code }} · {{ p.deptKey }}</div>
                <div class="kanban-card-title">{{ p.name }}</div>
                <div class="kanban-card-footer">
                  <span :style="{ color: p.pm === 'Lily' ? 'var(--accent)' : 'var(--pink)' }">{{ p.pm }}</span>
                  <span class="kanban-card-eng">{{ p.eng }}</span>
                </div>
              </div>
              <div v-if="!filtered.filter(p => p.stage === s.key).length" class="kanban-empty">—</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Detail Modal ── -->
    <div v-if="detailProject" class="modal-overlay" @click.self="detailProject = null">
      <div class="modal">
        <div class="modal-header">
          <div style="flex:1">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap">
              <span class="code-badge">{{ detailProject.code }}</span>
              <span class="status-badge" :class="'status-'+detailProject.stage">
                <span class="status-dot" :style="{ background: stageColor(detailProject.stage) }"></span>
                {{ stageIcon(detailProject.stage) }} {{ stageLabel(detailProject.stage) }}
              </span>
            </div>
            <div style="font-size:17px;font-weight:700;margin-bottom:4px">{{ detailProject.name }}</div>
            <div style="font-size:12px;color:var(--text-muted)">{{ detailProject.unit }}</div>
            <div class="progress-bar-wrap" style="max-width:360px;margin-top:10px">
              <div class="progress-bar-fill" :style="{ width: detailPct + '%' }"></div>
            </div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:3px;font-family:'JetBrains Mono',monospace">
              整體進度 {{ detailPct }}% ({{ detailProject.stageIdx + 1 }}/{{ STAGES.length }} 階段)
            </div>
          </div>
          <button class="modal-close" @click="detailProject = null">✕</button>
        </div>
        <div class="modal-body">
          <div class="info-grid">
            <div class="info-item"><div class="info-item-label">AP 工程師</div><div class="info-item-value">{{ detailProject.eng || '—' }}</div></div>
            <div class="info-item"><div class="info-item-label">PM</div><div class="info-item-value" :style="{ color: detailProject.pm === 'Lily' ? 'var(--accent)' : 'var(--pink)' }">{{ detailProject.pm || '—' }}</div></div>
            <div class="info-item"><div class="info-item-label">所屬單位</div><div class="info-item-value">{{ detailProject.unit || '—' }}</div></div>
            <div class="info-item"><div class="info-item-label">🚀 上線時間</div><div class="info-item-value" style="color:var(--teal);font-weight:600">{{ detailProject.deploy || '—' }}</div></div>
            <div class="info-item"><div class="info-item-label">進度備註</div><div class="info-item-value" style="font-size:12px;color:var(--text-dim)">{{ detailProject.statusRaw || '—' }}</div></div>
            <div v-if="detailProject.issue" class="info-item" style="grid-column:1/-1">
              <div class="info-item-label">備註</div>
              <div class="info-item-value" style="color:var(--red);font-size:12px">⚠ {{ detailProject.issue }}</div>
            </div>
            <div v-if="detailProject.figma" class="info-item" style="grid-column:1/-1">
              <div class="info-item-label">Figma</div>
              <div class="info-item-value"><a class="link-btn" :href="detailProject.figma" target="_blank">🎨 開啟 Figma</a></div>
            </div>
          </div>

          <div style="margin-top:20px">
            <div class="modal-section-title">開發流程</div>
            <div class="stage-detail-list">
              <div
                v-for="(st, i) in STAGES" :key="st.key"
                class="stage-detail-item"
                :class="i < detailProject.stageIdx ? 'done' : i === detailProject.stageIdx ? 'active' : 'pending'"
              >
                <span style="font-size:16px">{{ st.icon }}</span>
                <div>
                  <div style="font-weight:600" :style="{ color: st.color }">{{ st.label }}</div>
                  <div style="font-size:13px;color:var(--text-muted)">
                    {{ st.key === 'sit' ? '系統整合測試 — 已完成 ' + (detailProject.sit||0) + ' 輪次' : st.key === 'uat' ? '驗收測試 — 已完成 ' + (detailProject.uat||0) + ' 輪次' : st.full }}
                  </div>
                </div>
                <div style="margin-left:auto">
                  <span v-if="i < detailProject.stageIdx" class="status-badge status-uat" style="font-size:11px">✓ 完成</span>
                  <span v-else-if="i === detailProject.stageIdx" class="status-badge status-sit" style="font-size:11px">⚡ 進行中</span>
                  <span v-else style="font-size:11px;color:var(--text-muted)">待開始</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="store.canEdit('mgt')" style="display:flex;gap:8px;margin-top:20px">
            <button class="btn btn-primary" @click="openEditModal(detailProject); detailProject = null">✏️ 編輯</button>
            <button class="btn btn-danger" @click="deleteProject(detailProject)">🗑 刪除</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Form Modal ── -->
    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <div class="modal">
        <div class="modal-header">
          <div style="font-size:16px;font-weight:700">{{ editingId ? '編輯：' + form.name : '新增專案' }}</div>
          <button class="modal-close" @click="showForm = false">✕ 關閉</button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-row"><label class="form-label">代號</label><input class="form-input" v-model="form.code" placeholder="A1" /></div>
            <div class="form-row"><label class="form-label">AP 工程師</label><input class="form-input" v-model="form.eng" placeholder="姓名" /></div>
          </div>
          <div class="form-row"><label class="form-label">表單名稱</label><input class="form-input" v-model="form.name" placeholder="完整表單名稱" /></div>
          <div class="form-row"><label class="form-label">所屬單位</label><input class="form-input" v-model="form.unit" placeholder="例：行政處(玉茹)" /></div>
          <div class="form-grid">
            <div class="form-row">
              <label class="form-label">PM</label>
              <select class="form-select" v-model="form.pm">
                <option value="Lily">Lily</option><option value="Jess">Jess</option><option value="其他">其他</option>
              </select>
            </div>
            <div class="form-row">
              <label class="form-label">當前階段</label>
              <select class="form-select" v-model="form.stage">
                <option v-for="s in STAGES" :key="s.key" :value="s.key">{{ s.icon }} {{ s.label }} {{ s.full }}</option>
              </select>
            </div>
          </div>
          <div class="form-grid">
            <div class="form-row"><label class="form-label">SIT 完成輪次</label><input class="form-input" type="number" v-model.number="form.sit" min="0" /></div>
            <div class="form-row"><label class="form-label">UAT 完成輪次</label><input class="form-input" type="number" v-model.number="form.uat" min="0" /></div>
          </div>
          <div class="form-row"><label class="form-label">進度備註</label><textarea class="form-textarea" v-model="form.statusRaw" placeholder="例：已SIT，與企財重新確認需求"></textarea></div>
          <div class="form-row"><label class="form-label">優化項目</label><textarea class="form-textarea" v-model="form.memo" placeholder="需調整審核流程…"></textarea></div>
          <div class="form-row"><label class="form-label">備註</label><textarea class="form-textarea" v-model="form.issue" placeholder="待確認需求…"></textarea></div>
          <div class="form-row"><label class="form-label">上線時間</label><input class="form-input" v-model="form.deploy" placeholder="例：5/11" /></div>
          <div class="form-row"><label class="form-label">Figma 連結</label><input class="form-input" v-model="form.figma" placeholder="https://figma.com/..." /></div>
          <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:6px">
            <button class="btn" @click="showForm = false">取消</button>
            <button class="btn btn-primary" @click="saveProject">💾 儲存</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── History Modal ── -->
    <div v-if="showHistory" class="modal-overlay" @click.self="showHistory = false">
      <div class="modal" style="max-width:600px">
        <div class="modal-header">
          <div style="font-size:16px;font-weight:700">修改歷史紀錄</div>
          <button class="modal-close" @click="showHistory = false">✕</button>
        </div>
        <div class="modal-body">
          <div v-if="!historyItems.length" class="empty-state">尚無修改紀錄</div>
          <div v-else class="history-list">
            <div v-for="h in historyItems" :key="h.id" class="history-item">
              <div class="history-avatar">{{ (h.user||'?').charAt(0).toUpperCase() }}</div>
              <div class="history-content">
                <div class="history-who">{{ h.user }} · <span style="color:var(--text-muted);font-weight:400">{{ h.projectName }}</span></div>
                <div class="history-what" v-html="formatHistory(h)"></div>
                <div class="history-when">{{ new Date(h.ts).toLocaleString('zh-TW') }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Exec Modal ── -->
    <div v-if="showExec" class="modal-overlay" @click.self="showExec = false">
      <div class="modal" style="max-width:900px">
        <div class="modal-header">
          <div style="font-size:18px;font-weight:700">📊 長官儀表板</div>
          <button class="modal-close" @click="showExec = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="exec-kpi-row">
            <div class="exec-kpi"><div class="exec-kpi-label">總專案數</div><div class="exec-kpi-num" style="color:var(--accent)">{{ projects.length }}</div></div>
            <div class="exec-kpi"><div class="exec-kpi-label">完成/上線</div><div class="exec-kpi-num" style="color:var(--teal)">{{ projects.filter(p => ['dep','maint'].includes(p.stage)).length }}</div></div>
            <div class="exec-kpi"><div class="exec-kpi-label">測試中</div><div class="exec-kpi-num" style="color:var(--yellow)">{{ projects.filter(p => ['sit','uat'].includes(p.stage)).length }}</div></div>
            <div class="exec-kpi"><div class="exec-kpi-label">開發中</div><div class="exec-kpi-num" style="color:var(--orange)">{{ projects.filter(p => p.stage === 'dev').length }}</div></div>
          </div>
          <div v-for="s in STAGES" :key="s.key" class="exec-stage-row">
            <div class="exec-stage-label">{{ s.icon }} {{ s.label }}</div>
            <div class="exec-stage-bar-wrap">
              <div class="exec-stage-bar-fill" :style="{ width: projects.length ? Math.round(projects.filter(p=>p.stage===s.key).length/projects.length*100)+'%' : '0', background: s.color }"></div>
            </div>
            <div class="exec-stage-count">{{ projects.filter(p => p.stage === s.key).length }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Inline Popup (memo/figma/issue) ── -->
    <div v-if="popup.show" class="memo-popup" :style="{ top: popup.y + 'px', left: popup.x + 'px' }">
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px;font-family:'JetBrains Mono',monospace">{{ popup.label }}</div>
      <textarea v-model="popup.value" :placeholder="popup.placeholder" style="width:100%;background:var(--surface3);border:1px solid var(--border);border-radius:8px;padding:10px;color:var(--text);font-size:15px;font-family:inherit;resize:none;outline:none;min-height:80px"></textarea>
      <div style="display:flex;gap:6px;margin-top:8px;justify-content:flex-end">
        <button class="btn" @click="popup.show = false">取消</button>
        <button class="btn btn-primary" @click="savePopup">💾 儲存</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAppStore } from '../stores/app'
import { useSupabase } from '../composables/useSupabase'
import { useToast } from '../composables/useToast'

const store = useAppStore()
const { sb } = useSupabase()
const { success, error, info } = useToast()

// ── STAGES ──
const STAGES = [
  { key: 'ra',    label: 'RA',    full: '需求分析',     color: '#9f7aea', icon: '📋' },
  { key: 'sd',    label: 'SD',    full: '系統設計',     color: '#63b3ed', icon: '📐' },
  { key: 'dev',   label: 'DEV',   full: '開發實作',     color: '#ed8936', icon: '⚙️' },
  { key: 'sit',   label: 'SIT',   full: '系統整合測試', color: '#f6e05e', icon: '🔬' },
  { key: 'uat',   label: 'UAT',   full: '驗收測試',     color: '#68d391', icon: '✅' },
  { key: 'dep',   label: 'DEP',   full: '部署上線',     color: '#4fd1c5', icon: '🚀' },
  { key: 'maint', label: 'MAINT', full: '維護',         color: '#f687b3', icon: '🔧' },
]
const ORDER = STAGES.map(s => s.key)

// ── STATE ──
const projects = ref([])
const currentFilter = ref('all')
const currentView = ref('table')
const searchQ = ref('')
const sortKey = ref('no')
const sortDir = ref(1)
const syncState = ref('syncing')
const syncText = ref('連線中…')

// Modal state
const detailProject = ref(null)
const showForm = ref(false)
const showHistory = ref(false)
const showExec = ref(false)
const editingId = ref(null)
const historyItems = ref([])
const form = ref(emptyForm())
const popup = ref({ show: false, x: 0, y: 0, label: '', value: '', placeholder: '', field: '', projectId: null })

// ── SEED DATA ──
const SEED = [
  { no:1,  code:'A1', name:'財務系統帳號暨權限變更申請單',  unit:'企財處(欣荷)',   eng:'何美慧', pm:'Lily', statusRaw:'已SIT，與企財重新確認需求', sit:1,uat:0,stage:'sit', figma:'https://www.figma.com/design/fXq5Z8lyNT7cJtW0HwYcOA/', deploy:'7/6' },
  { no:2,  code:'A2', name:'外貿協會M365服務帳號申請/異動表',unit:'數科中心(佳嘉)',eng:'林艾臻', pm:'Lily', statusRaw:'已UAT，待上線',            sit:1,uat:1,stage:'dep', figma:'', deploy:'5/11' },
  { no:3,  code:'A3', name:'EBS 帳號申請表',                unit:'數科中心(佳嘉)',eng:'林艾臻', pm:'Lily', statusRaw:'已UAT，待上線',            sit:1,uat:1,stage:'dep', figma:'', deploy:'5/11' },
  { no:4,  code:'A4', name:'員工會外訓練申請表',             unit:'行政處(玉茹)',   eng:'林艾臻', pm:'Jess', statusRaw:'已開發，待SIT',            sit:0,uat:0,stage:'dev', figma:'', deploy:'6/8' },
  { no:5,  code:'B1', name:'貿協育嬰留職停薪申請表',         unit:'行政處(冠穎)',   eng:'林艾臻', pm:'Lily', statusRaw:'已UAT，待提供人事組自由測試',sit:1,uat:1,stage:'uat', figma:'', deploy:'5/25' },
  { no:6,  code:'B2', name:'員工國內在職進修申請表',          unit:'行政處(玉茹)',   eng:'林艾臻', pm:'Jess', statusRaw:'已開發，待SIT',            sit:0,uat:0,stage:'dev', figma:'', deploy:'6/8' },
  { no:7,  code:'B3', name:'員工特殊語言訓練申請表',          unit:'行政處(玉茹)',   eng:'鄭丞祐', pm:'Jess', statusRaw:'已開發，待SIT',            sit:0,uat:0,stage:'dev', figma:'', deploy:'6/8' },
  { no:8,  code:'B4', name:'本會電腦相關設備汰換申請',        unit:'數科中心(永坤)', eng:'鄭丞祐', pm:'Lily', statusRaw:'已SIT，修改中',            sit:1,uat:0,stage:'sit', figma:'', deploy:'6/22' },
  { no:9,  code:'C1', name:'外貿協會GA及GTM代碼申請表',       unit:'數科中心(Robert)',eng:'陳雅梅', pm:'Jess', statusRaw:'已開發，待SIT',           sit:0,uat:0,stage:'dev', figma:'', deploy:'6/22' },
  { no:10, code:'C2', name:'銀行往來文件及納稅證明申請單',    unit:'行政處(出納)',   eng:'陳雅梅', pm:'Lily', statusRaw:'已SIT，修改中',            sit:1,uat:0,stage:'sit', figma:'', deploy:'7/6' },
  { no:11, code:'C3', name:'世貿育嬰留職停薪申請表',          unit:'行政處(曉薇)',   eng:'林艾臻', pm:'Lily', statusRaw:'已UAT，待提供人事組自由測試',sit:1,uat:1,stage:'uat', figma:'', deploy:'5/25' },
  { no:12, code:'C4', name:'單位自辦專業訓練聘請講師申請表',  unit:'行政處(玉茹)',   eng:'何美慧', pm:'Lily', statusRaw:'開發中',                   sit:0,uat:0,stage:'dev', figma:'', deploy:'7/20' },
]

// ── COMPUTED ──
const pmList = computed(() => [...new Set(projects.value.map(p => p.pm).filter(Boolean))])
const deptList = computed(() => ['企財處', '數科中心', '行政處'])

const filtered = computed(() => {
  let data = [...projects.value]
  const q = searchQ.value.toLowerCase()
  if (q) data = data.filter(p => [p.name, p.code, p.unit, p.eng, p.pm].some(v => (v||'').toLowerCase().includes(q)))
  if (currentFilter.value !== 'all') {
    const f = currentFilter.value
    if (f.startsWith('stage-')) data = data.filter(p => p.stage === f.slice(6))
    else if (f.startsWith('pm-'))    data = data.filter(p => p.pm === f.slice(3))
    else if (f.startsWith('dept-'))  data = data.filter(p => p.deptKey === f.slice(5))
  }
  // Apply allowed project filter
  const allowed = store.allowedProjects('mgt')
  if (allowed && allowed.length > 0) data = data.filter(p => allowed.includes(p.id))

  data.sort((a, b) => {
    let va = a[sortKey.value] ?? '', vb = b[sortKey.value] ?? ''
    if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase() }
    return va < vb ? -sortDir.value : va > vb ? sortDir.value : 0
  })
  return data
})

const filterLabel = computed(() => {
  const map = { all:'所有表單','stage-ra':'RA 需求分析','stage-sd':'SD 系統設計','stage-dev':'DEV 開發','stage-sit':'SIT 測試','stage-uat':'UAT 驗收','stage-dep':'DEP 部署','stage-maint':'MAINT 維護' }
  return map[currentFilter.value] || '搜尋結果'
})

const statDefs = computed(() => [
  { label: '總表單',  filter: 'all',        num: projects.value.length,                                    color: 'var(--accent)',  sub: '全部項目' },
  { label: '開發中',  filter: 'stage-dev',  num: projects.value.filter(p => p.stage==='dev').length,       color: 'var(--orange)',  sub: 'DEV' },
  { label: 'SIT測試', filter: 'stage-sit',  num: projects.value.filter(p => p.stage==='sit').length,       color: 'var(--yellow)',  sub: '測試中' },
  { label: 'UAT驗收', filter: 'stage-uat',  num: projects.value.filter(p => p.stage==='uat').length,       color: 'var(--green)',   sub: '驗收中' },
  { label: '待上線',  filter: 'stage-dep',  num: projects.value.filter(p => p.stage==='dep').length,       color: 'var(--teal)',    sub: 'DEP' },
])

const detailPct = computed(() =>
  detailProject.value ? Math.round(((detailProject.value.stageIdx + 1) / STAGES.length) * 100) : 0
)

// ── HELPERS ──
function enrich(d) {
  const stage = d.stage || 'ra'
  return { ...d, stage, stageIdx: ORDER.indexOf(stage), deptKey: (d.unit || '').replace(/\(.*\)/, '').trim() }
}
function emptyForm() {
  return { code: '', name: '', unit: '', eng: '', pm: 'Lily', stage: 'ra', sit: 0, uat: 0, statusRaw: '', memo: '', issue: '', figma: '', deploy: '' }
}
function stageColor(key) { return STAGES.find(s => s.key === key)?.color || '#6b7280' }
function stageIcon(key)  { return STAGES.find(s => s.key === key)?.icon  || '' }
function stageLabel(key) { return STAGES.find(s => s.key === key)?.label || key }
function stageStepStyle(s, i, idx) {
  const cls = i < idx ? 'done' : i === idx ? 'active' : 'pending'
  return {
    background: cls === 'done' ? s.color + '33' : cls === 'active' ? s.color + '55' : '',
    color: cls === 'pending' ? '#374151' : s.color,
    opacity: cls === 'pending' ? '.25' : '1'
  }
}
function formatHistory(h) {
  if (h.type === 'create') return `<span class="htag create">新增</span> 建立了此專案`
  if (h.type === 'delete') return `<span class="htag del">刪除</span> 刪除了此專案`
  if (h.changes?.length) return h.changes.map(c => `修改 <span class="htag field">${c.field}</span> <span class="htag old">${c.old||'—'}</span> → <span class="htag new">${c.new||'—'}</span>`).join('<br>')
  return '更新了專案資料'
}

// ── FILTER / SORT ──
function filterBy(f) { currentFilter.value = f }
function sortBy(k) { sortKey.value === k ? (sortDir.value *= -1) : ((sortKey.value = k), (sortDir.value = 1)) }

// ── LOAD + REALTIME ──
let subscription = null

async function load() {
  if (!sb) { startDemo(); return }
  const { data, err } = await sb.from('projects').select('*').order('no')
  if (err) { setSyncStatus('error', '連線失敗'); startDemo(); return }
  if (!data.length) {
    await sb.from('projects').insert(SEED.map(d => ({ ...d, updatedBy: store.currentUser, updatedAt: new Date().toISOString() })))
    const { data: d2 } = await sb.from('projects').select('*').order('no')
    projects.value = (d2 || []).map(enrich)
  } else {
    projects.value = data.map(enrich)
  }
  setSyncStatus('ok', '即時同步中')
  subscribe()
}

function subscribe() {
  if (!sb) return
  subscription = sb.channel('mgt-projects')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, ({ eventType, new: n, old: o }) => {
      if (eventType === 'INSERT') { projects.value = [...projects.value.filter(p => p.id !== n.id), enrich(n)].sort((a,b)=>a.no-b.no); info('新專案已同步：' + n.name) }
      else if (eventType === 'UPDATE') { projects.value = projects.value.map(p => p.id === n.id ? enrich(n) : p); info((n.updatedBy||'有人') + '更新了：' + n.name) }
      else if (eventType === 'DELETE') { projects.value = projects.value.filter(p => p.id !== o.id) }
    })
    .subscribe(s => { if (s === 'SUBSCRIBED') setSyncStatus('ok', '即時同步中'); else if (s === 'CHANNEL_ERROR') setSyncStatus('error', '同步中斷') })
}

function startDemo() {
  const stored = localStorage.getItem('pt_demo_mgt')
  projects.value = stored ? JSON.parse(stored).map(enrich) : SEED.map(enrich)
  setSyncStatus('ok', 'Demo 模式')
}
function saveDemo() { localStorage.setItem('pt_demo_mgt', JSON.stringify(projects.value)) }
function setSyncStatus(state, text) { syncState.value = state; syncText.value = text }

const isDemoMode = computed(() => !sb)

// ── CRUD ──
function openAddModal() {
  editingId.value = null
  form.value = emptyForm()
  showForm.value = true
}
function openEditModal(p) {
  editingId.value = p.id
  form.value = { code: p.code||'', name: p.name||'', unit: p.unit||'', eng: p.eng||'', pm: p.pm||'Lily', stage: p.stage||'ra', sit: p.sit||0, uat: p.uat||0, statusRaw: p.statusRaw||'', memo: p.memo||'', issue: p.issue||'', figma: p.figma||'', deploy: p.deploy||'' }
  showForm.value = true
}
function openDetail(p) { detailProject.value = p }

async function saveProject() {
  if (!form.value.code || !form.value.name) { error('請填入代號和名稱'); return }
  const data = { ...form.value, updatedBy: store.currentUser, updatedAt: new Date().toISOString() }

  if (editingId.value) {
    const old = projects.value.find(p => p.id === editingId.value)
    const changes = []
    const fields = { stage:'階段', statusRaw:'進度備註', sit:'SIT輪次', uat:'UAT輪次', pm:'PM', eng:'AP工程師', unit:'所屬單位' }
    if (old) Object.entries(fields).forEach(([k, label]) => { if (String(old[k]) !== String(data[k])) changes.push({ field: label, old: old[k], new: data[k] }) })
    await upsert(editingId.value, data)
    if (changes.length) await addHistory(editingId.value, data.name, changes, 'edit')
    success('已更新：' + data.name)
  } else {
    const maxNo = projects.value.reduce((m, p) => Math.max(m, p.no||0), 0)
    data.no = maxNo + 1
    const id = await insert(data)
    await addHistory(id, data.name, [], 'create')
    success('已新增：' + data.name)
  }
  showForm.value = false
}

async function upsert(id, data) {
  if (isDemoMode.value) { projects.value = projects.value.map(p => p.id === id ? enrich({ ...p, ...data }) : p); saveDemo() }
  else await sb.from('projects').update(data).eq('id', id)
}
async function insert(data) {
  if (isDemoMode.value) { const id = Date.now(); projects.value.push(enrich({ id, ...data })); saveDemo(); return id }
  const { data: rows } = await sb.from('projects').insert(data).select()
  return rows?.[0]?.id
}
async function deleteProject(p) {
  if (!confirm(`確認刪除「${p.name}」？`)) return
  if (isDemoMode.value) { projects.value = projects.value.filter(x => x.id !== p.id); saveDemo() }
  else await sb.from('projects').delete().eq('id', p.id)
  await addHistory(p.id, p.name, [], 'delete')
  detailProject.value = null
  info('已刪除：' + p.name)
}
async function addHistory(docId, projectName, changes, type) {
  const entry = { docId: String(docId), projectName, changes, type, user: store.currentUser, ts: new Date().toISOString() }
  if (isDemoMode.value) { const h = JSON.parse(localStorage.getItem('pt_history_mgt')||'[]'); h.unshift(entry); localStorage.setItem('pt_history_mgt', JSON.stringify(h.slice(0,200))) }
  else await sb.from('history').insert(entry)
}

// ── INLINE POPUP ──
function openMemoEdit(p) { openPopup(p, 'memo', '優化項目', p.memo||'', '輸入優化或待辦事項…') }
function openFigmaEdit(p) { openPopup(p, 'figma', '🎨 Figma 連結', p.figma||'', 'https://figma.com/...') }
function openIssueEdit(p) { openPopup(p, 'issue', '⚠ 填寫問題', p.issue||'', '欄位不清楚、審核流程卡關…') }

function openPopup(p, field, label, value, placeholder) {
  popup.value = { show: true, x: Math.min(window.innerWidth - 280, 200), y: 200, label, value, placeholder, field, projectId: p.id }
}
async function savePopup() {
  const { field, value, projectId } = popup.value
  const p = projects.value.find(x => x.id === projectId)
  if (!p) return
  await upsert(projectId, { [field]: value, updatedBy: store.currentUser, updatedAt: new Date().toISOString() })
  await addHistory(projectId, p.name, [{ field, old: p[field]||'', new: value }], 'edit')
  success('已儲存')
  popup.value.show = false
}

// ── HISTORY ──
watch(showHistory, async (v) => {
  if (!v) return
  if (isDemoMode.value) { historyItems.value = JSON.parse(localStorage.getItem('pt_history_mgt')||'[]'); return }
  const { data } = await sb.from('history').select('*').order('ts', { ascending: false }).limit(50)
  historyItems.value = data || []
})

onMounted(load)
onUnmounted(() => { if (subscription) sb?.removeChannel(subscription) })
</script>

<style scoped>
.mgt-page { display: flex; flex-direction: column; gap: 0; }
.stats-row { display: grid; grid-template-columns: repeat(5,1fr); border-bottom: 1px solid var(--border); }
.stat-card { background: var(--surface); padding: 14px 16px; display: flex; flex-direction: column; gap: 3px; transition: background .2s; border-right: 1px solid var(--border); }
.stat-card:last-child { border-right: none; }
.stat-card:hover { background: var(--surface2); }
.stat-card.active { background: var(--surface2); border-bottom: 2px solid var(--accent); }
.stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: .7px; color: var(--text-muted); font-family: 'JetBrains Mono', monospace; }
.stat-num { font-size: 26px; font-weight: 900; letter-spacing: -1px; line-height: 1; }
.stat-sub { font-size: 11px; color: var(--text-muted); }

.mgt-body { display: grid; grid-template-columns: 200px 1fr; min-height: calc(100vh - 200px); }
.filter-sidebar { border-right: 1px solid var(--border); padding: 12px 0; }
.sidebar-section-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); font-family: 'JetBrains Mono', monospace; padding: 0 14px 4px; margin-top: 10px; }
.filter-item { display: flex; align-items: center; gap: 7px; padding: 7px 14px; cursor: pointer; font-size: 13px; color: var(--text-dim); border-left: 2px solid transparent; transition: all .15s; }
.filter-item:hover { background: var(--surface2); color: var(--text); }
.filter-item.active { background: rgba(99,179,237,.07); border-left-color: var(--accent); color: var(--accent); }
.sidebar-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.sidebar-count { margin-left: auto; font-family: 'JetBrains Mono', monospace; font-size: 12px; background: var(--surface3); border-radius: 4px; padding: 0 5px; color: var(--text-muted); }

.mgt-content { padding: 16px 20px; overflow-y: auto; }
.toolbar { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
.search-box { flex: 1; min-width: 200px; background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; padding: 9px 14px; color: var(--text); font-size: 14px; font-family: inherit; outline: none; }
.search-box:focus { border-color: var(--border-accent); }
.view-toggle { display: flex; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
.view-btn { padding: 7px 12px; background: transparent; border: none; color: var(--text-muted); cursor: pointer; font-size: 16px; }
.view-btn.active { background: rgba(99,179,237,.15); color: var(--accent); }
.section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }
.section-title { font-size: 17px; font-weight: 700; }
.section-count { font-family: 'JetBrains Mono', monospace; font-size: 13px; color: var(--text-muted); background: var(--surface2); padding: 2px 8px; border-radius: 4px; }
.sync-badge { font-size: 12px; border-radius: 12px; padding: 2px 8px; display: flex; align-items: center; gap: 4px; margin-left: auto; }
.sync-badge.ok    { color: var(--green);  background: rgba(104,211,145,.1); border: 1px solid rgba(104,211,145,.2); }
.sync-badge.syncing { color: var(--yellow); background: rgba(246,224,94,.1); border: 1px solid rgba(246,224,94,.2); }
.sync-badge.error { color: var(--red);    background: rgba(252,129,129,.1); border: 1px solid rgba(252,129,129,.2); }

/* Table */
.table-wrap { overflow-x: auto; border-radius: 10px; border: 1px solid var(--border); }
table { width: 100%; border-collapse: collapse; font-size: 14px; }
thead { background: var(--surface2); }
th { padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .6px; color: var(--text-muted); font-family: 'JetBrains Mono', monospace; font-weight: 400; white-space: nowrap; border-bottom: 1px solid var(--border); cursor: pointer; }
th:hover { color: var(--text); }
tbody tr { border-bottom: 1px solid var(--border); transition: background .15s; cursor: pointer; }
tbody tr:hover { background: var(--surface2); }
tbody tr:last-child { border-bottom: none; }
td { padding: 11px 12px; vertical-align: middle; }
.mono { font-family: 'JetBrains Mono', monospace; font-size: 11px; }
.muted { color: var(--text-muted); }
.task-name { font-weight: 500; line-height: 1.4; }
.task-unit { font-size: 12px; color: var(--text-muted); }
.person-tag { font-size: 13px; color: var(--text-dim); background: var(--surface3); padding: 2px 7px; border-radius: 10px; white-space: nowrap; }
.stage-pipeline { display: flex; align-items: center; gap: 2px; }
.stage-step { flex: 1; height: 18px; border-radius: 4px; background: var(--surface3); display: flex; align-items: center; justify-content: center; font-size: 9px; font-family: 'JetBrains Mono', monospace; font-weight: 700; min-width: 26px; }
.golive-badge { display: inline-block; padding: 1px 8px; border-radius: 5px; background: rgba(79,209,197,.12); border: 1px solid rgba(79,209,197,.25); color: var(--teal); font-size: 12px; font-family: 'JetBrains Mono', monospace; font-weight: 600; white-space: nowrap; }
.link-btn { display: inline-flex; align-items: center; gap: 4px; padding: 2px 9px; border-radius: 6px; background: rgba(99,179,237,.1); border: 1px solid rgba(99,179,237,.2); color: var(--accent); font-size: 12px; text-decoration: none; }
.link-btn:hover { background: rgba(99,179,237,.2); }
.link-empty { color: var(--text-muted); font-size: 12px; cursor: pointer; }
.link-empty:hover { color: var(--accent); }
.memo-cell { font-size: 13px; color: var(--text-dim); cursor: pointer; }
.memo-text { white-space: pre-wrap; word-break: break-all; line-height: 1.4; }
.memo-empty { color: var(--text-muted); font-size: 12px; }
.memo-empty:hover { color: var(--accent); }
.issue-cell { font-size: 13px; cursor: pointer; }
.issue-badge { display: inline-flex; align-items: center; gap: 3px; padding: 1px 7px; border-radius: 8px; font-size: 11px; background: rgba(252,129,129,.1); color: var(--red); border: 1px solid rgba(252,129,129,.2); }

/* Kanban */
.kanban-board { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px,1fr)); gap: 10px; margin-top: 4px; }
.kanban-col { background: var(--surface); border-radius: 10px; border: 1px solid var(--border); overflow: hidden; }
.kanban-col-header { padding: 9px 12px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 5px; }
.kanban-col-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; }
.kanban-col-count { margin-left: auto; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--text-muted); }
.kanban-cards { padding: 8px; display: flex; flex-direction: column; gap: 5px; }
.kanban-card { background: var(--surface2); border: 1px solid var(--border); border-radius: 7px; padding: 9px; cursor: pointer; transition: all .2s; }
.kanban-card:hover { border-color: var(--border-accent); transform: translateY(-1px); }
.kanban-card-code { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--text-muted); margin-bottom: 3px; }
.kanban-card-title { font-size: 13px; font-weight: 500; line-height: 1.4; margin-bottom: 5px; }
.kanban-card-footer { display: flex; align-items: center; justify-content: space-between; }
.kanban-card-eng { font-size: 12px; background: var(--surface3); padding: 1px 6px; border-radius: 8px; color: var(--text-dim); }
.kanban-empty { color: var(--text-muted); font-size: 11px; text-align: center; padding: 10px 0; }

/* Info Grid (modal) */
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.info-item { background: var(--surface2); border-radius: 8px; padding: 10px 12px; }
.info-item-label { font-size: 11px; color: var(--text-muted); margin-bottom: 3px; text-transform: uppercase; letter-spacing: .5px; }
.info-item-value { font-size: 14px; font-weight: 500; }
.progress-bar-wrap { background: var(--surface3); border-radius: 4px; height: 5px; overflow: hidden; }
.progress-bar-fill { height: 100%; border-radius: 4px; background: linear-gradient(90deg, var(--accent), var(--teal)); transition: width .5s; }
.modal-section-title { font-size: 11px; text-transform: uppercase; letter-spacing: .8px; color: var(--text-muted); font-family: 'JetBrains Mono', monospace; margin-bottom: 8px; }
.stage-detail-list { display: flex; flex-direction: column; gap: 5px; }
.stage-detail-item { display: flex; align-items: center; gap: 10px; padding: 9px 11px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface2); }
.stage-detail-item.done   { border-color: rgba(104,211,145,.18); }
.stage-detail-item.active { border-color: rgba(246,224,94,.28); background: rgba(246,224,94,.03); }
.stage-detail-item.pending { opacity: .45; }

/* History */
.history-list { display: flex; flex-direction: column; }
.history-item { padding: 10px 0; border-bottom: 1px solid var(--border); display: flex; gap: 10px; }
.history-item:last-child { border-bottom: none; }
.history-avatar { width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), var(--accent2)); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; color: #fff; }
.history-content { flex: 1; }
.history-who { font-size: 13px; font-weight: 600; }
.history-what { font-size: 13px; color: var(--text-muted); margin-top: 2px; line-height: 1.6; }
.history-when { font-size: 11px; color: var(--text-muted); font-family: 'JetBrains Mono', monospace; margin-top: 2px; }

/* Exec */
.exec-kpi-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-bottom: 20px; }
.exec-kpi { background: var(--surface2); border-radius: 10px; padding: 16px; }
.exec-kpi-label { font-size: 12px; text-transform: uppercase; letter-spacing: .7px; color: var(--text-muted); font-family: 'JetBrains Mono', monospace; margin-bottom: 6px; }
.exec-kpi-num { font-size: 36px; font-weight: 900; letter-spacing: -1.5px; }
.exec-stage-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.exec-stage-label { font-size: 13px; width: 100px; flex-shrink: 0; }
.exec-stage-bar-wrap { flex: 1; height: 7px; background: var(--surface3); border-radius: 4px; overflow: hidden; }
.exec-stage-bar-fill { height: 100%; border-radius: 4px; transition: width .8s; }
.exec-stage-count { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--text-muted); width: 20px; text-align: right; }

/* Inline popup */
.memo-popup { position: fixed; z-index: 400; background: var(--surface2); border: 1px solid var(--border-accent); border-radius: 10px; padding: 10px; box-shadow: 0 8px 32px rgba(0,0,0,.5); min-width: 260px; max-width: 340px; }
</style>
