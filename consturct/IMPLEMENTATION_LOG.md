# my_website 实施日志

## 一、环境与工具

### 原则
- 所有新工具存放在项目内 `tools/` 目录，保持自包含
- 零 npm 构建依赖（CSS 走 Hugo Pipes，JS 原生）

### Hugo 安装
- 版本：Hugo extended v0.161.1
- 安装方式：`winget install Hugo.Hugo.Extended --location tools/hugo/`
- 下载路径：`tools/hugo/hugo.exe`
- 选 extended 版原因：内置 SCSS/SASS 编译，无需额外工具链
- **注意**：GitHub Releases 在国内直连可能超时，winget 走 CDN 更稳

### 关键命令
```bash
# 新建站点（在已有目录中）
tools/hugo/hugo.exe new site . --force

# 本地预览
cd consturct/code && ../../tools/hugo/hugo.exe server -D --noHTTPCache

# 构建
cd consturct/code && ../../tools/hugo/hugo.exe
```

---

## 二、项目目录结构

```
my_website/
├── tools/hugo/hugo.exe          # Hugo 便携版
├── consturct/
│   ├── PROJECT_BRIEF.md         # 需求概要
│   ├── IMPLEMENTATION_LOG.md    # 本文件
│   ├── context/                 # 原始需求背景
│   ├── agents/ skills/ templates/ tools/   # 预留
│   └── code/                    # Hugo 项目根
│       ├── hugo.toml
│       ├── content/             # 6 种内容类型
│       ├── layouts/             # 从零主题
│       ├── assets/css/          # 样式（合并为单文件）
│       ├── assets/js/           # 极简脚本
│       ├── i18n/                # 中英文翻译
│       ├── data/social.yaml     # 社交媒体链接
│       └── public/              # 构建输出
└── output/                      # 预留
```

**关键决策**：所有网站代码集中在 `consturct/code/`，Hugo 构建产物在 `consturct/code/public/`。Cloudflare Pages 的 Build output directory 指向此处。

---

## 三、Hugo 配置要点

### hugo.toml 结构
```toml
baseURL = 'https://tamak.xyz/'
defaultContentLanguage = 'zh'
defaultContentLanguageInSubdir = false   # 默认语言不显示前缀

[languages.zh]   # 中文配置 + 菜单
[languages.en]   # 英文配置 + 菜单，URL 前缀 /en/

[params.giscus]  # 评论系统参数（待填）
```

### 踩坑
1. Hugo v0.158+ 废弃了 `languageCode` 和 `languageName`，改用 `locale` 和 `label`
2. 模板中 `.Language.LanguageName` → `.Language.Label`
3. `.Site.Data` → `hugo.Data`

---

## 四、内容类型

### 6 种类型及其页面结构

| 类型 | content 路径 | 列表页 | 详情页 | 备注 |
|------|-------------|--------|--------|------|
| 文章 | `posts/` | ✅ | ✅ | 标准博客 |
| Podcast | `podcast/` | ✅ | ❌ | 列表直接嵌入播放器 + 可展开描述，不跳转 |
| Album | `album/` | ✅ | ✅ | 网格布局，详情大图 |
| 零碎想法 | `notes/` | ✅ | ✅ | 时间线风格 |
| 好物分享 | `shares/` | ✅ | ✅ | 卡片式推荐 |
| 社交媒体链接 | `social/` | ✅单页 | ❌ | 数据驱动 `data/social.yaml`，点击跳转外站 |

### Schema (archetypes)
每种内容类型有专属 archetype，定义 front matter 字段。在 `archetypes/` 目录下。

---

## 五、主题模板架构

### 模板查找链
Hugo 查找优先级：专有模板 → `_default/` 模板 → 内置默认

### 目录
```
layouts/
├── _default/
│   ├── baseof.html    # 全局骨架
│   ├── home.html      # 首页（混合各类型最新内容）
│   ├── list.html      # 通用列表
│   ├── single.html    # 通用详情（含 Giscus）
│   └── summary.html   # 列表卡片组件
├── partials/
│   ├── head.html      # <head> + CSS/JS 加载
│   ├── header.html    # 导航 + 语言切换
│   ├── footer.html
│   ├── giscus.html    # 评论
│   └── audio-player.html
├── podcast/list.html      # 单页列表 + 内嵌播放器 + 展开
├── notes/{list,single}.html
├── album/{list,single}.html
├── shares/{list,single}.html
├── social/list.html       # 数据驱动页面
└── shortcodes/
    ├── audio.html
    └── gallery.html
```

### 关键实现
- **语言切换**：检测 `.IsTranslated`，列出 `.Translations`，回退到 `$.Site.Home.Translations`
- **SCSS → CSS**：最初用 Hugo Pipes 编译 SCSS，后因 Cloudflare 只有 Hugo 标准版，改为单文件 CSS
- **Giscus**：作为 partial 注入 `single.html` 底部，配置集中在 `hugo.toml` 的 `[params.giscus]`

---

## 六、SCSS → CSS 转换（关键变更）

### 原方案
```
assets/scss/main.scss → Hugo Pipes (css.Sass) → 压缩 CSS
```
依赖 Hugo extended 的 libsass 支持。

### 问题
Cloudflare Pages 内置 Hugo 只装了**标准版**，不包含 SCSS 编译器。即使设置 `HUGO_EXTENDED=true` 环境变量也无效（Cloudflare 未提供该扩展版镜像）。

### 解决方案
将所有 SCSS partial 合并为单个 CSS 文件：
```bash
cat assets/scss/_variables.scss \
    assets/scss/_reset.scss \
    ... \
    assets/scss/_dark.scss > assets/css/main.css
```
然后在 `head.html` 中直接引用：
```go
{{ $style := resources.Get "css/main.css" | resources.Minify | resources.Fingerprint }}
```

### 教训
- 在 Cloudflare Pages 上部署 Hugo 项目时，不要使用 SCSS/SASS
- 原生 CSS + CSS 自定义属性（variables）完全够用
- 如果一定需要 SCSS，可以在本地用 Hugo extended 预处理后提交 CSS 产物

---

## 七、Git 与 GitHub

### 初始化
```bash
git init
# 创建 .gitignore（排除 tools/、public/、.vscode/ 等）
git add -A
git commit
```

### .gitignore 要点
- `consturct/code/public/` — 构建产物，由 Cloudflare 生成
- `tools/` — 二进制工具，不纳入版本控制
- OS/IDE 文件

### GitHub 推送
- 仓库：`tamako23333/tamak`
- 认证方式：Personal Access Token (fine-grained)，用 `GIT_ASKPASS` 传递
  ```bash
  GIT_ASKPASS="echo <token>" git push -u origin master
  ```
- **注意**：URL 中直接嵌入 token (`https://token@github.com/...`) 可能 403，`GIT_ASKPASS` 方案更可靠

### Token 权限要求
- 创建仓库：`Administration` — Read and write
- 推送代码：`Contents` — Read and write
- Repository access：`Public Repositories`

---

## 八、Cloudflare Pages 部署

### API 创建项目
```bash
curl -X POST "https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/pages/projects" \
  -H "Authorization: Bearer {API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "tamak",
    "production_branch": "master",
    "build_config": {
      "build_command": "cd consturct/code && hugo",
      "destination_dir": "consturct/code/public"
    }
  }'
```

### 直接上传（无 Git 集成时）
```bash
CLOUDFLARE_API_TOKEN=xxx CLOUDFLARE_ACCOUNT_ID=xxx \
  npx wrangler pages deploy consturct/code/public --project-name=tamak
```

### 最终面板配置

| 字段 | 值 |
|------|-----|
| Build command | `cd consturct/code && hugo` |
| Build output directory | `consturct/code/public` |
| Deploy command | `exit 0` |
| Root directory | （空） |
| HUGO_VERSION | `0.161.1` |

### 踩坑记录
1. `tools/hugo/hugo.exe` 是 Windows 二进制，Cloudflare Linux 环境无法执行
2. Cloudflare 内置 Hugo 安装通过 `HUGO_VERSION` 变量触发，无需手动下载
3. Deploy command 留空会默认执行 `npx wrangler deploy`，需显式设为 `exit 0`
4. Build output directory 必须是相对于 repo 根目录的完整路径
5. API 创建的 Pages 项目默认是「直接上传」模式，无 Git 集成。需在网页端删除重建才能绑定 GitHub

---

## 九、DNS 与自定义域名

### 流程
1. Cloudflare Pages → 项目设置 → Custom domains → 添加 `tamak.xyz`
2. Cloudflare 分配 2 个 nameserver（如 `arnold.ns.cloudflare.com` / `teagan.ns.cloudflare.com`）
3. 阿里云域名控制台 → DNS 修改 → 填入 Cloudflare nameserver
4. 等待 DNS 传播（最多 48 小时）

### API Token 权限
- Pages 操作的 Token 无法添加域（需要 Zone 权限）
- 自定义域名建议在 Cloudflare 网页端手动完成

---

## 十、待完成事项

- [ ] Giscus 评论系统接入（GitHub 开启 Discussions → 填入 `hugo.toml` 参数）
- [ ] 替换示例内容为真实内容
- [ ] UI 样式打磨（暗色模式、响应式优化）
- [ ] 内容图片/音频资源准备
- [ ] 可选：创建 Claude Code skills 自动化常用操作
