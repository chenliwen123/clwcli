# clw-cli

一个强大的前端开发命令行工具，提供项目初始化、文件生成、代码提交等功能。

## 安装

```bash
npm install -g clw-cli
```

## 功能概览

clw-cli 提供了以下7个主要功能：

- 🚀 **项目初始化** - 快速创建项目模板
- 📄 **Vue文件生成** - 自动生成Vue组件文件
- ⚛️ **React组件生成** - 自动生成React JSX组件
- 📦 **自动打包提交** - 打包并提交代码
- 🔄 **代码量检查提交** - 应对代码量检查的自动提交
- 🚫 **排除文件提交** - 自动排除特定文件的提交
- 🌿 **自动分支合并** - 自动合并分支到dev、sit环境

## 命令详解

### 1. 项目初始化

```bash
clwcli init <project>
```

**功能说明：** 从模板仓库下载并初始化一个新项目

**参数：**
- `<project>` - 项目名称（必填）

**示例：**
```bash
clwcli init my-project
```

### 2. Vue组件生成

```bash
clwcli vues <filename>
```

**功能说明：** 创建Vue组件文件，包含.vue文件和导出文件

**参数：**
- `<filename>` - 组件名称（必填）

**生成文件：**
- `文件夹名/组件名.vue` - Vue组件文件
- `文件夹名/index.js` - 导出文件

**示例：**
```bash
clwcli vues UserCard
# 会提示输入文件夹名称和文件名称，默认使用UserCard
```

### 3. React组件生成

```bash
clwcli jsx <filename>
```

**功能说明：** 创建React JSX组件文件，包含组件文件和样式文件

**参数：**
- `<filename>` - 组件名称（必填）

**生成文件：**
- `文件夹名/index.jsx` - React组件文件
- `文件夹名/index.module.less` - 样式文件

**示例：**
```bash
clwcli jsx UserCard
# 会提示输入文件夹名称和文件名称，默认使用UserCard
```

### 4. 自动打包提交

```bash
clwcli cpush <commit> [build]
```

**功能说明：** 自动打包项目并提交代码，可选择是否执行打包

**参数：**
- `<commit>` - 提交信息（必填）
- `[build]` - 是否打包，传入"true"时执行打包（可选）

**特性：**
- 自动排除 `vue.config.js` 文件的提交
- 支持可选的打包流程（执行 `npm run build:test`）
- 自动获取当前分支并推送

**示例：**
```bash
clwcli cpush "修复用户登录bug"
clwcli cpush "新增用户管理功能" true
```

### 5. 代码量检查提交

```bash
clwcli copyfile [commits] [sourceFilePath]
```

**功能说明：** 通过复制文件并多次提交来应对代码量检查，支持批量提交

**参数：**
- `[commits]` - 提交信息，多个用逗号分隔（可选，默认："优化代码对比，增加新页面"）
- `[sourceFilePath]` - 源文件路径（可选，默认：当前目录下的index.jsx）

**特性：**
- 自动过滤commit信息中的 `/**/` 注释内容
- 支持多个commit信息，用逗号分隔
- 自动生成递增的文件名避免冲突
- 自动推送到当前分支

**示例：**
```bash
clwcli copyfile
clwcli copyfile "优化性能,修复bug,增加功能"
clwcli copyfile "提交代码" "./src/components/Button.jsx"
```

### 6. 排除文件提交

```bash
clwcli qmgit <commit>
```

**功能说明：** 提交代码时自动排除 `api/server.js` 文件

**参数：**
- `<commit>` - 提交信息（必填）

**特性：**
- 自动排除 `api/server.js` 文件的提交
- 适用于需要保留本地服务器配置的场景

**示例：**
```bash
clwcli qmgit "更新前端页面"
```

### 7. 自动分支合并

```bash
clwcli autoMerge [branch]
```

**功能说明：** 自动将指定分支合并到dev和sit环境分支

**参数：**
- `[branch]` - 要合并的分支名（可选，默认为当前分支）

**合并流程：**
1. 切换到指定分支并拉取最新代码
2. 切换到dev分支，合并指定分支并推送
3. 切换到sit分支，合并dev分支并推送
4. 切换回原始分支

**示例：**
```bash
clwcli autoMerge
clwcli autoMerge feature/user-login
```

## 使用场景

### 开发场景
- **快速项目搭建：** 使用 `init` 命令快速创建项目模板
- **组件开发：** 使用 `vues` 或 `jsx` 命令快速生成组件模板
- **日常提交：** 使用 `cpush` 进行常规的代码提交和打包

### 特殊场景
- **代码量检查：** 使用 `copyfile` 应对需要达到一定代码量的检查
- **配置文件管理：** 使用 `qmgit` 避免提交本地配置文件
- **多环境部署：** 使用 `autoMerge` 自动化分支合并流程

## 注意事项

⚠️ **重要提醒：**

1. **Git仓库要求：** 所有git相关命令需要在git仓库中执行
2. **分支命名：** `autoMerge` 命令假设存在dev和sit分支
3. **打包命令：** `cpush` 的打包功能依赖项目中的 `npm run build:test` 脚本
4. **文件路径：** 确保指定的源文件路径存在且可访问
5. **权限要求：** 确保有对应git仓库的推送权限

## 版本信息

当前版本：**1.1.10**

查看版本：
```bash
clwcli --version
```

查看帮助：
```bash
clwcli --help
clwcli <command> --help
```

## 依赖说明

本工具依赖以下npm包：
- `commander` - 命令行参数解析
- `shelljs` - Shell命令执行
- `ora` - 命令行加载动画
- `chalk` - 命令行颜色输出
- `handlebars` - 模板引擎
- `download-git-repo` - Git仓库下载

## 开发者

如需贡献代码或报告问题，请访问项目仓库。

---

**Happy Coding! 🎉**