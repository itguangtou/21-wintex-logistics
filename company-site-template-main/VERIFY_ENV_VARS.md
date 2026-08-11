# 如何验证 Vercel 环境变量是否已自动配置

## 方法 1：在 Vercel 控制台检查（推荐）

### 步骤：

1. **登录 Vercel 控制台**
   - 访问 [https://vercel.com](https://vercel.com)
   - 使用你的账号登录

2. **进入项目设置**
   - 在 Dashboard 中找到你的项目
   - 点击项目名称进入项目详情页

3. **查看环境变量**
   - 点击顶部导航栏的 **"Settings"**（设置）
   - 在左侧菜单中找到 **"Environment Variables"**（环境变量）
   - 点击进入环境变量页面

4. **检查以下变量是否存在**：
   - ✅ `UPSTASH_REDIS_REST_URL` - 应该显示为类似 `https://xxx.upstash.io` 的 URL
   - ✅ `UPSTASH_REDIS_REST_TOKEN` - 应该显示为一段加密的 token（通常显示为 `••••••••`）

### 如果变量存在：
- ✅ 环境变量已自动配置
- 可以继续部署和测试

### 如果变量不存在：
- ❌ 需要重新完成 Upstash 集成
- 或手动添加环境变量（见下方）

## 方法 2：通过 Vercel CLI 检查（本地）

### 安装 Vercel CLI（如果还没有）

```bash
npm install -g vercel
```

### 登录并检查

```bash
# 登录 Vercel
vercel login

# 链接到项目（如果还没有）
vercel link

# 查看环境变量
vercel env ls
```

这会列出所有环境变量，你应该能看到：
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## 方法 3：在代码中临时检查（仅用于调试）

可以在 API 路由中临时添加日志来检查：

```typescript
// 在 app/api/careers/route.ts 的 initKV 函数中添加
console.log('UPSTASH_REDIS_REST_URL exists:', !!process.env.UPSTASH_REDIS_REST_URL);
console.log('UPSTASH_REDIS_REST_TOKEN exists:', !!process.env.UPSTASH_REDIS_REST_TOKEN);
```

然后在 Vercel 的部署日志中查看输出。

## 方法 4：检查 Upstash 集成状态

1. 在 Vercel 项目中，进入 **"Storage"** 标签
2. 查看是否显示你的 Upstash 数据库 `upstash-kv-sky-car`
3. 如果显示，说明集成成功，环境变量应该已自动配置

## 如果环境变量不存在，如何手动添加

### 从 Upstash 控制台获取：

1. 访问 [Upstash 控制台](https://console.upstash.com)
2. 登录你的账号
3. 找到数据库 `upstash-kv-sky-car`
4. 点击进入数据库详情
5. 在 "REST API" 部分，你会看到：
   - **UPSTASH_REDIS_REST_URL**: `https://xxx.upstash.io`
   - **UPSTASH_REDIS_REST_TOKEN**: `xxx...`

### 在 Vercel 中添加：

1. 进入项目设置 → **"Environment Variables"**
2. 点击 **"Add New"**
3. 添加第一个变量：
   - **Key**: `UPSTASH_REDIS_REST_URL`
   - **Value**: 从 Upstash 控制台复制的 URL
   - **Environment**: 选择所有环境（Production, Preview, Development）
4. 点击 **"Save"**
5. 添加第二个变量：
   - **Key**: `UPSTASH_REDIS_REST_TOKEN`
   - **Value**: 从 Upstash 控制台复制的 Token
   - **Environment**: 选择所有环境
6. 点击 **"Save"**

## 验证环境变量是否生效

添加环境变量后，需要重新部署：

1. 在 Vercel 项目中，进入 **"Deployments"** 标签
2. 点击最新的部署右侧的 **"..."** 菜单
3. 选择 **"Redeploy"**
4. 或者推送新的代码更改，触发自动部署

部署完成后，测试编辑功能，应该可以正常发布了。

