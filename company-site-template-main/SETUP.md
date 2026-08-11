# Wintex Logistics 网站 - 运行指南

## 项目概述

这是一个基于 Next.js 14 和 React 的多语言企业网站，使用 Tailwind CSS 进行样式设计，完全按照 Figma 设计规范实现。

## 技术栈

- **框架**: Next.js 14.2.5
- **React**: 18.3.1
- **样式**: Tailwind CSS 3.4.9
- **国际化**: next-intl 3.26.5
- **字体**: Inter (Google Fonts)
- **语言**: TypeScript

## 完整运行步骤

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

开发服务器将在 `http://localhost:3000` 启动。

### 3. 访问网站

- **中文版本**: http://localhost:3000/zh
- **英文版本**: http://localhost:3000/en

### 4. 构建生产版本

```bash
npm run build
```

### 5. 启动生产服务器

```bash
npm start
```

## 项目结构

```
company-site-template/
├── app/
│   ├── [locale]/          # 多语言路由
│   │   ├── page.tsx       # 首页组件
│   │   └── layout.tsx     # 布局组件
│   ├── globals.css        # 全局样式
│   └── components/        # 组件
├── public/
│   ├── images/            # 所有图片资源
│   │   ├── hero.png
│   │   ├── introduction.png
│   │   ├── image_1.png
│   │   ├── news_1.png
│   │   ├── news_2.png
│   │   ├── news_3.png
│   │   ├── strength.png
│   │   ├── equipment_1.png
│   │   ├── equipment_2.png
│   │   ├── equipment_3.png
│   │   ├── equipment_4.png
│   │   └── wintex-logo.png
│   └── icons/              # 所有图标资源
│       ├── Anchor.svg
│       ├── Box.svg
│       ├── Feather.svg
│       ├── Mail.svg
│       ├── Map pin.svg
│       └── Phone.svg
├── messages/               # 翻译文件
│   ├── zh.json            # 中文翻译
│   └── en.json            # 英文翻译
├── tailwind.config.ts      # Tailwind 配置
└── DESIGN_TOKENS.md        # 设计规范文档
```

## 设计规范

所有设计规范已整理在 `DESIGN_TOKENS.md` 文件中，包括：

- **颜色系统**: 品牌色 #0E2745（深蓝）、#F7B959（橙色）
- **字体系统**: Inter 字体，多种字号和字重
- **间距系统**: 统一的 Padding 和 Gap 值
- **组件样式**: 按钮、卡片等组件的完整样式规范

## 页面结构

1. **Hero Section**: 全屏大图 + 标题
2. **统计区域**: 深蓝色背景，25年经验 + 三个图标
3. **世界地图**: 深蓝色背景
4. **介绍区域**: 白色背景，文字 + 图片
5. **新闻区域**: 三张新闻卡片
6. **实力见证**: 图片 + 文字介绍
7. **设备清单**: 橙色背景，四张设备卡片
8. **Footer**: 联系信息和版权信息

## 常见问题

### 图片不显示？

确保所有图片都在 `/public/images/` 目录下，图标都在 `/public/icons/` 目录下。

### 样式不正确？

1. 确保 Tailwind CSS 已正确配置
2. 检查 `tailwind.config.ts` 中的自定义配置
3. 确保 Inter 字体已正确加载（通过 Google Fonts）

### 翻译不显示？

检查 `messages/zh.json` 和 `messages/en.json` 文件是否存在且格式正确。

## 开发命令

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint
```

## 注意事项

1. 所有图片路径使用 `/images/` 前缀
2. 所有图标路径使用 `/icons/` 前缀
3. 页面宽度最大为 1440px（设计稿宽度）
4. 使用 Inter 字体，通过 Google Fonts 加载
5. 支持中英文双语切换

## 浏览器支持

- Chrome (最新版)
- Firefox (最新版)
- Safari (最新版)
- Edge (最新版)

