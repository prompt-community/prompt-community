# 💧 Prompt 饮水机 (The Water Cooler)

> **停下脚步，接一杯灵感。**  
> 这是一个面向中科大（USTC）及理工科大学生的极客专属 AI 提示词（Prompt）开源社区。无论你是想要**加速代码开发**、**辅助学术研究**，还是**优化日常工作流**，这里汇聚了最硬核、最实用的 Prompt，帮你彻底释放大模型的潜力，激发下一次灵感沸点。

## 🌟 核心理念

[cite_start]本项目严格贯彻 **“重前端，轻后端，免运维”** 的极客理念 [cite: 306, 322][cite_start]。基于现代 JAMstack（Serverless）架构 [cite: 306]，最大化开发效率，聚焦于核心业务逻辑与社区生态构建。

## ✨ 功能亮点 (Feature Highlights)

这里不仅仅是一个文本收集箱，我们为您打造了沉浸式的 Prompt 交流体验：

* **🧩 灵感瀑布流**：首页采用直观的网格/瀑布流布局，最新、最热的科大专属 Prompt 尽收眼底。
* **🏷️ 极客风标签系统**：
  * **六大场景预设**：内置了贴合学生与极客需求的分类 (`开发`、`学术`、`写作`、`设计`、`效率`、`娱乐`)，帮你迅速定位所需场景。
  * **丝滑的多级筛选**：首页支持点击多个预设标签进行组合检索，并独创了 `AND(且) / OR(或)` 的双模式切换，精准“沙里淘金”。
  * **沉浸式过滤**：引入 React 并发渲染技术，在拉取筛选结果时，底层列表优雅地进行毛玻璃模糊过渡，而您的控制面板依然秒级响应。
  * **自由定制**：发布时不仅提供一键快捷标签，更支持完全自由输入自定义标签（最高支持5个高频标签绑定）。
* **⏳ 魔法版本时光机 (Diff Control)**：Prompt 并不是一成不变的。我们支持对单个 Prompt 提交历史版本，为您展现代码级的增删高亮 (Diff)！轻松回溯大神们的调优心路历程。
* **❤️ 乐观秒赞体验**：点赞不再有网络延迟感！点下红心的瞬间即时反馈，即便多人同时刷赞，底层的并发队列也能保证计数绝对精确。
* **🪪 水世界通行证 (SSO)**：一次登录，畅游主站与众多正在孵化的子应用，体验原生且无刷新的统一鉴权机制。

## 🚀 核心特性与架构

* [cite_start]**企业级 SSO 单点登录（水世界通行证）**：前端解耦，采用独立的 Astro + React Islands 认证子域名 (`auth.wsw.wiki`) 处理高颜值、无刷新的跨域登录，通过设置 `domain: '.wsw.wiki'` 共享 Cookie，实现主站与子站的无缝状态同步 [cite: 468, 480]。
* [cite_start]**双表版本控制与 Diff 高亮**：摒弃传统 Git CLI 操作可能带来的并发性能灾难 [cite: 311][cite_start]，独创 `prompts` 主表与 `prompt_versions` 历史表的双表机制 [cite: 311, 323][cite_start]。结合现成的 JavaScript 差异对比库，实现新旧版本的秒级回退与代码级增删高亮 [cite: 311, 324]。
* [cite_start]**坚如磐石的数据库防御（RLS）**：采用物理同库、逻辑隔离的设计原则 [cite: 311][cite_start]。无需在后端编写繁琐的校验代码，直接利用 Supabase PostgreSQL 底层的 RLS（行级安全策略）控制数据边界，彻底防范越权操作 [cite: 323, 412]。
* [cite_start]**乐观更新的点赞系统**：前端秒级响应红心状态，底层利用 PostgreSQL 触发器（Trigger）防并发刷赞，带来如原生 App 般丝滑的交互体验 [cite: 349, 393]。
* **基于并发渲染的无缝多级标签筛选**：结合 React 18 `useTransition` 与 Next.js `searchParams`，打造了“乐观更新 (Optimistic UI) + 毛玻璃过渡”的无阻断交互体验。支持用户一键切换 `AND/OR` 的高级多选逻辑，底层查询下推至 PostgreSQL 强悍的 `.overlaps()` 与 `.contains()` 数组操作符，性能极速。

## 🛠️ 技术栈选型

| 技术领域 | 选型 | 核心优势 |
| :--- | :--- | :--- |
| **前端主站** | **Next.js (App Router)** | [cite_start]提供 SSR 服务端渲染，带来极速的首屏加载与极致的 SEO，利于自然流量抓取 [cite: 308, 324]。 |
| **认证子站** | **Astro + React** | [cite_start]极致轻量的孤岛架构，配合 Tailwind v4 构建跨域通行证 [cite: 480]。 |
| **后端与数据库** | **Supabase (BaaS)** | [cite_start]基于强悍的 PostgreSQL，提供开箱即用的 API、Auth 和 Storage，省去编写传统后端 API 的繁杂 [cite: 309, 322]。 |
| **部署与托管** | **Vercel** | [cite_start]Serverless 边缘网络托管，全自动流水线部署（CI/CD），完美兼容 Next.js 并自带 CDN 加速 [cite: 310, 322]。 |
| **邮件服务** | **Resend** | [cite_start]突破免费版速率限制，提供专业的高触达率验证邮件分发 [cite: 421]。 |

## 🌊 “水分子”社区等级体系

在 Prompt 饮水机，用户被称为“水分子”。我们通过社区贡献度，设立了硬核的进阶阶梯：

* **Lv. [cite_start]1 白开水**：潜水者/新注册用户。通过通行证成功注册，处于阅读模式 [cite: 517]。
* **Lv. [cite_start]2 纯净水**：初级创作者。成功上传第一条 UGC 内容，并签署开源协议 [cite: 518]。
* **Lv. [cite_start]3 矿泉水**：高价值分享者。发布的 Prompt 真正为他人提供了“营养”，获得点赞与复制 [cite: 519]。
* **Lv. [cite_start]4 蒸馏水**：核心迭代者。精益求精，深度参与双表机制，进行多次 V2/V3 版本的 Diff 优化 [cite: 520]。
* **Lv. [cite_start]5 重水 (Heavy Water)**：社区大神/布道者/管理员。拥有“上帝视角”权限，负责维护社区秩序 [cite: 395, 521]。

## 💻 本地开发指南

### 1. 环境准备
确保已安装 Node.js 与包管理器 (`pnpm` 推荐)。

### 2. 克隆与依赖安装
```bash
git clone [https://github.com/yourusername/prompt-community.git](https://github.com/yourusername/prompt-community.git)
cd prompt-community
pnpm install