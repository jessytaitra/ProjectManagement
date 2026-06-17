# 外貿協會 專案管理平台

Vue 3 + Vite + Pinia + Supabase 多模組專案管理系統。

## 模組
| 路徑 | 功能 |
|------|------|
| `/` | 總覽儀表板 |
| `/mgt` | 表單專案追蹤（MGT） |
| `/sr30` | SR 3.0 甘特圖 & WBS |
| `/admin` | 成員權限管理（Admin 專屬） |

## 快速啟動

### 1. 安裝套件
```bash
cd taitra-pm
npm install
```

### 2. 設定 Supabase
複製 `.env.example` 為 `.env`，填入你的 Supabase 設定：
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON=your-anon-public-key
```

### 3. 建立 Supabase 資料表
登入 Supabase → SQL Editor，執行 AdminView 頁面內的完整 SQL（或手動執行下方）：
- `user_permissions` — 成員權限
- `app_config` — Admin 密碼等設定
- `projects` — MGT 表單專案（含 Realtime）
- `history` — MGT 修改歷史
- `wbs_tasks` — SR3.0 WBS 工項

### 4. 設定 Admin 密碼
在 Supabase SQL Editor 執行：
```sql
insert into app_config (key, value)
  values ('admin_password', '你的密碼')
  on conflict (key) do update set value = excluded.value;
```

### 5. 啟動開發伺服器
```bash
npm run dev
```

### 6. 建置正式版
```bash
npm run build
# 產出在 dist/ 資料夾，可部署至 GitHub Pages / Nginx / 任何靜態主機
```

## 權限系統

| 角色 | 登入方式 | 權限 |
|------|----------|------|
| 一般成員 | 輸入姓名 | 只看 Admin 指派的模組與專案 |
| Admin | 輸入姓名 + 密碼 | 看全部、管理成員、修改密碼 |

- 未連線 Supabase 時自動進入 **Demo 模式**（所有功能可用，資料存 localStorage）
- Supabase 連線後自動開啟 **Realtime 即時同步**（MGT 模組）

## 專案結構
```
src/
├── composables/
│   ├── useSupabase.js   # Supabase client 單例
│   └── useToast.js      # 全域 Toast 通知
├── stores/
│   └── app.js           # Pinia：user、theme、permissions
├── router/index.js      # Vue Router + Navigation Guard
├── views/
│   ├── LoginView.vue
│   ├── DashboardView.vue
│   ├── MGTView.vue
│   ├── SR30View.vue
│   └── AdminView.vue
├── components/
│   ├── AppHeader.vue
│   └── AppSidebar.vue
├── App.vue
├── main.js
└── style.css
```
