# 提示统计文档 (提示记录)
**日期 (Date)**: 2026年7月29日 (2026-07-29)
**项目 (Project)**: electron-scrape-fb

---
## 📊 一、综合统计表 (Overall Statistics)


| 序号 (No.) | 时间 (Time) | Prompt | 涉及文件 (Files) |
| --- | --- | --- | --- |
| #1 | 09:30 | 编写 `scrapeMemberGroupPage` 函数 | `main.js` | ✅ 已完成 |
| #2 | 09:50 | Git commit `b208dba` | `main.js`, `services.js` | ✅ 已完成 |
| #3 | 10:15 | 创建 `docs.md` 初版 | `docs.md` | ✅ 已完成 |
| #4 | 10:35 | 表格化 + 详细信息 | `docs.md` | ✅ 已完成 |
| #5 | 10:50 | 添加时间列 | `docs.md` | ✅ 已完成 |
| #6 | 11:10 | 检查 `getInfoMember` 函数 | `main.js` | ✅ 已完成 |
| #7 | 11:35 | 重写 `getInfoMember` 函数 | `main.js` | ✅ 已完成 |
| #8 | 11:50 | 完整时间线统计 | `docs.md` | 🔄 进行中 |

## 📅 二、提示详细记录 (Detailed Prompt Records)

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

---

### 🟩 提示 #2 — 提交代码到 Git

#### 基本信息 (Basic Info)

| 字段 (Field) | 值 (Value) |
| --- | --- |
| 序号 (No.) | 2 |
| 时间 (Time) | 09:50 |
| 类型 (Type) | 版本控制 (Version Control) |
| 提交哈希 (Commit Hash) | `b208dba` |
| 分支 (Branch) | `main` |

#### 提交信息 (Commit Message)

```
implement scrapeMemberGroupPage to collect user info
```

#### 变更文件明细 (Changed Files Detail)

| 文件 (File) | 增加 (++) | 删除 (--) |
| --- | --- | --- |
| `main.js` | 103 | 18 |
| `services.js` | 15 | 0 |

---

### 🟨 提示 #3 — 创建 `docs.md` 初版

#### 基本信息 (Basic Info)

| 字段 (Field) | 值 (Value) |
| --- | --- |
| 序号 (No.) | 3 |
| 时间 (Time) | 10:15 |
| 类型 (Type) | 文档编写 (Documentation) |
| 输出 (Output) | `docs.md` 初版(简单时间线) |

---

### 🟧 提示 #4 — 扩展 `docs.md` v2.0

#### 基本信息 (Basic Info)

| 字段 (Field) | 值 (Value) |
| --- | --- |
| 序号 (No.) | 4 |
| 时间 (Time) | 10:35 |
| 类型 (Type) | 文档扩展 (Doc Expansion) |
| 要求 (Requirements) | (1) 表格化统计,(2) 详细 prompt 内容 |
| 输出 (Output) | `docs.md` v2.0(4 张表格 + 3 个 prompt 详情) |

#### 新增结构 (Added Structure)

| 章节 (Section) | 表格数 (Tables) |
| --- | --- |
| 综合统计表 | 4 |
| 提示详细记录 | 9 |
| 时间线汇总 | 1 |
| 当日成果 | 1 |

---

### 🟪 提示 #5 — 添加时间列

#### 基本信息 (Basic Info)

| 字段 (Field) | 值 (Value) |
| --- | --- |
| 序号 (No.) | 5 |
| 时间 (Time) | 10:50 |
| 类型 (Type) | 文档扩展 (Doc Expansion) |
| 修改范围 (Scope) | 4 张表格(总览 / #1 / #2 / #3 / timeline) |
| 新增列 (New Column) | `时间 (Time)` |

---

### 🟥 提示 #6 — 检查 `getInfoMember` 函数

#### 基本信息 (Basic Info)

| 字段 (Field) | 值 (Value) |
| --- | --- |
| 序号 (No.) | 6 |
| 时间 (Time) | 11:10 |
| 类型 (Type) | 代码审查 (Code Review) |
| 目标函数 (Target Function) | `getInfoMember(wd1)` |
| 文件位置 (File Location) | `main.js:380-429` |

#### 发现的问题 (Issues Found)

| 级别 (Severity) | 数量 (Count) | 代表性问题 (Sample Issue) |
| --- | --- | --- |
| ❌ 严重 (Critical) | 3 | `ReferenceError: data is not defined`、thiếu `axios` import、click nhầm nút |
| ⚠️ 逻辑 (Logic) | 6 | Regex không word-boundary, chỉ lấy 1 post, không dedupe, không chuẩn hóa |
| 🐛 设计 (Design) | 4 | Selector Facebook obfuscated dễ vỡ, thời gian chờ cứng |

---

### 🟫 提示 #7 — 重写 `getInfoMember` 函数

#### 基本信息 (Basic Info)

| 字段 (Field) | 值 (Value) |
| --- | --- |
| 序号 (No.) | 7 |
| 时间 (Time) | 11:35 |
| 类型 (Type) | 代码重构 (Code Refactor) |
| 输出 (Output) | 重写后的 `getInfoMember(wd1)` + `axios` import |

#### 主要修复 (Key Fixes Applied)

| 修复项 (Fix) | 详情 (Details) |
| --- | --- |
| ✅ 修复 `ReferenceError` | Đổi `data` → `results`, khai báo ngoài vòng for |
| ✅ Thêm `axios` import | `const axios = require('axios');` |
| ✅ Regex có word-boundary | `\b...\b` ở đầu/cuối |
| ✅ Lấy TẤT CẢ posts | `querySelectorAll('[data-ad-rendering-role="story_message"]')` |
| ✅ Click đúng nút "See more" | Lọc bằng `textContent` |
| ✅ Chuẩn hóa SĐT | Hàm `normalize()`: bỏ separators, `+84xxx` → `0xxx` |
| ✅ Dedupe tự động | Dùng `Set<phone>` |
| ✅ Tách `contactUs` và `zalo` | `contactUs` = phones joined, `zalo` = phones bắt đầu bằng `0` |
| ✅ Selector ổn định | `[role="main"]`, `[role="feed"]` thay vì class obfuscated |
| ✅ Validate SĐT VN | Chỉ nhận 10-11 chữ số |
| ✅ Catch return `[]` | Tránh trả về `undefined` |

---

### 🟩 提示 #8 — 完整时间线统计(当前提示)

#### 基本信息 (Basic Info)

| 字段 (Field) | 值 (Value) |
| --- | --- |
| 序号 (No.) | 8 |
| 时间 (Time) | 11:50 |
| 类型 (Type) | 文档更新 (Doc Update) |
| 输出 (Output) | `docs.md` v3.0(8 个 prompts 完整记录) |
| 版本演进 (Version History) | v1.0 → v2.0(4 tables)→ v2.1(+time)→ v3.0(8 prompts) |

#### 与之前版本差异 (Diff vs Previous Versions)

| 项目 (Item) | v1.0 | v2.0 | v2.1 | v3.0(当前) |
| --- | --- | --- | --- | --- |
| Prompt 数量 | 3 | 3 | 3 | **8** |
| 表格数量 | 1 | 15+ | 15+ | **20+** |
| 时间列 | ❌ | ❌ | ✅ | ✅ |
| 详细章节 | ❌ | ✅ | ✅ | ✅(扩展) |

---

