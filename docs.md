## 提示总览 (Prompt Overview)

| 序号 (No.) | 时间 (Time) | 提示类型 (Type) | 关键操作 (Action) | 涉及文件 (Files) | 状态 (Status) |
| --- | --- | --- | --- | --- | --- |
| #1 | 09:30 | 代码编写 (Code Writing) | 编写 `scrapeMemberGroupPage` 函数 | `main.js` | ✅ 已完成 |
| #2 | 09:50 | 版本控制 (Version Control) | Git commit `b208dba` | `main.js`, `services.js` | ✅ 已完成 |
| #3 | 10:15 | 文档编写 (Documentation) | 创建/扩展本文件 | `docs.md` | ✅ 进行中 |

## 示详细记录 (Detailed Prompt Records)

### 🟦 提示 #1 — 编写用户信息收集脚本

#### 基本信息 (Basic Info)

| 字段 (Field) | 值 (Value) |
| --- | --- |
| 序号 (No.) | 1 |
| 时间 (Time) | 09:30 |
| 类型 (Type) | 代码编写 (Code Writing) |
| 输入 (Input) | HTML 代码片段 + 字段需求 |
| 输出 (Output) | `scrapeMemberGroupPage()` 函数实现 |
| 复杂度 (Complexity) | 中等 (Medium) |

#### 需求字段 (Required Fields)

| 字段名 (Field Name) | 数据类型 (Type) | 来源 (Source) | 示例 (Example) |
| --- | --- | --- | --- |
| `idAccount` | String | URL 路径 `/user/{id}` | `100001766128086` |
| `account` | String | 用户名链接文本 | 用户显示名称 |
| `urlImage` | String | SVG `<image>` / `<img>` / background-image | Facebook CDN 头像 URL |
| `urlFacebook` | String | 拼接 `https://www.facebook.com/{idAccount}` | `https://www.facebook.com/100001766128086` |

#### 实现策略 (Implementation Strategy)

| 步骤 (Step) | 操作 (Action) | 选择器 / 方法 (Selector / Method) |
| --- | --- | --- |
| 1 | 定位列表容器 | `[role="list"]` |
| 2 | 遍历每个成员 | `[role="listitem"]` |
| 3 | 获取头像链接 | `.xt0psk2 .xjp7ctv > a` |
| 4 | 提取 `idAccount` | `href.split('/user/')[1].split('/')[0]` |
| 5 | 获取用户名 | `.xjp7ctv > a`(非头像)→ `.html-h3` → `[data-ad-rendering-role="profile_name"]` |
| 6 | 获取头像 URL | `g > image` → `img` → CSS `background-image` |
| 7 | 去重 | `Set<idAccount>` |
| 8 | 懒加载 | 每轮重新查询 `[role="listitem"]` |

#### 关键代码片段 (Key Code Snippet)

```javascript
const avatarLink = item?.querySelector('.xt0psk2 .xjp7ctv > a')
const profileLink = avatarLink?.href || ''
const parts = profileLink.split('/user/')
const idAccount = (parts[1] || '').split('/')[0].trim()
const urlFacebook = 'https://www.facebook.com/' + idAccount
```

---

### 🟩 提示 #2 — 提交代码到 Git

#### 基本信息 (Basic Info)

| 字段 (Field) | 值 (Value) |
| --- | --- |
| 序号 (No.) | 2 |
| 时间 (Time) | 09:50 |
| 类型 (Type) | 版本控制 (Version Control) |
| 输入 (Input) | 工作区已修改文件 |
| 输出 (Output) | Git commit `b208dba` |
| 分支 (Branch) | `main` |

#### Git 操作详情 (Git Operation Details)

| 项目 (Item) | 值 (Value) |
| --- | --- |
| 命令 (Command) | `git add main.js services.js && git commit -m "..."` |
| 提交哈希 (Commit Hash) | `b208dba` |
| 远程分支 (Remote Branch) | `tienvm/main` |
| 工作分支 (Working Branch) | `main` |
| 同步状态 (Sync Status) | ✅ 与远程一致 (Up to date) |

#### 提交信息 (Commit Message)

```
implement scrapeMemberGroupPage to collect user info

- Extract idAccount, account, urlImage, urlFacebook from group members list
- Handle SVG masked avatars, img tags, and CSS background-image fallbacks
- Add lazy-load re-query loop and dedup by idAccount
- Wire up saveMemberToVn2 service import
```

#### 变更文件明细 (Changed Files Detail)

| 文件 (File) | 状态 (Status) | 增加 (++) | 删除 (--) | 用途 (Purpose) |
| --- | --- | --- | --- | --- |
| `main.js` | 修改 (M) | 103 | 18 | 实现 `scrapeMemberGroupPage` |
| `services.js` | 修改 (M) | 15 | 0 | 新增 `saveMemberToVn2` 服务导入 |
| **合计 (Total)** | — | **118** | **18** | — |

---

### 🟨 提示 #3 — 创建并扩展本文档(当前提示)

#### 基本信息 (Basic Info)

| 字段 (Field) | 值 (Value) |
| --- | --- |
| 序号 (No.) | 3 |
| 时间 (Time) | 10:15 |
| 类型 (Type) | 文档编写 (Documentation) |
| 输入 (Input) | 前两个提示的历史记录 |
| 输出 (Output) | `docs.md`(本文件) |
| 版本 (Version) | 1.0(初版) → 2.0(扩展版) |

#### 子任务进度 (Sub-task Progress)

| 子任务 (Sub-task) | 完成 (Done) | 备注 (Notes) |
| --- | --- | --- |
| 创建文档骨架 | ✅ | 已完成 |
| 按时间线记录 3 个提示 | ✅ | 已完成 |
| 表格形式统计 | ✅ | 本次扩展 |
| 详细信息展开 | ✅ | 本次扩展 |

#### 文档结构 (Document Structure)

| 章节 (Section) | 内容 (Content) | 形式 (Format) |
| --- | --- | --- |
| 综合统计表 | 总览/数量/文件/关键字 | 4 张表格 |
| 提示详细记录 | #1 #2 #3 详细说明 | 多级表格 + 代码 |
| 时间线汇总 | 三个提示流程图 | 文本流程图 |

---