# 虎虎半仙 - 易经占卜小程序

一个基于易经六爻占卜法的微信小程序，让用户通过摇铜钱的方式进行占卜。

## 功能特点

- 🎲 **摇铜钱占卜**：模拟传统的摇三个铜钱占卜方法
- 📖 **64卦解读**：完整的易经64卦数据和解释
- 🎨 **精美UI**：现代化的渐变设计和流畅动画
- 📱 **双Tab结构**：首页占卜 + 我的页面

## 技术栈

- **框架**：Taro 4.1.7 (多端开发框架)
- **UI库**：NutUI React Taro
- **语言**：TypeScript
- **样式**：Sass

## 项目结构

```
src/
├── app.config.ts           # 小程序全局配置
├── app.scss               # 全局样式
├── app.ts                 # 入口文件
├── assets/                # 静态资源
│   └── icons/            # TabBar图标
├── data/
│   └── hexagrams.ts      # 易经64卦数据
├── pages/
│   ├── index/            # 首页（占卜页面）
│   │   ├── index.tsx
│   │   ├── index.scss
│   │   └── index.config.ts
│   └── mine/             # 我的页面
│       ├── index.tsx
│       ├── index.scss
│       └── index.config.ts
└── utils/
    └── divination.ts     # 占卜逻辑工具函数
```

## 占卜逻辑

### 六爻占卜法

1. 用户摇三个铜钱，共摇6次
2. 每次根据正反面组合判断爻象：
   - 3个正面 → 老阳（9）变爻
   - 2个正面 → 少阳（7）不变
   - 1个正面 → 少阴（8）不变
   - 0个正面 → 老阴（6）变爻

3. 六次结果从下往上形成六爻，得到一个卦象
4. 查找对应的64卦之一，显示卦名、卦辞、象辞等信息

## 开发运行

### 安装依赖

```bash
yarn install
# 或
npm install
```

### 微信小程序

```bash
# 开发模式
yarn dev:weapp

# 构建生产版本
yarn build:weapp
```

### H5

```bash
# 开发模式
yarn dev:h5

# 构建生产版本
yarn build:h5
```

### 其他平台

```bash
# 支付宝小程序
yarn dev:alipay

# 抖音小程序
yarn dev:tt

# 百度小程序
yarn dev:swan
```

## TabBar 图标配置

在 `src/assets/icons/` 目录下放置以下图标（建议尺寸：81x81px）：

- `home.png` - 首页图标
- `home-active.png` - 首页选中图标
- `mine.png` - 我的图标
- `mine-active.png` - 我的选中图标

如果暂时没有图标，可以在 `src/app.config.ts` 中注释掉 `iconPath` 和 `selectedIconPath` 字段。

## 后续开发建议

### 我的页面可以添加：

- 📜 占卜历史记录
- ⭐ 收藏的卦象
- 👤 用户个人信息
- ⚙️ 设置选项
- 📚 易经学习资料

### 功能扩展：

- 💾 本地存储占卜记录
- 🔄 变卦解读（当有变爻时）
- 📊 占卜统计分析
- 🎯 每日一卦推送
- 💬 社交分享功能

## 许可证

MIT License

