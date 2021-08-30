# clw-cli

# 安装 clw-cli
> npm install clw-cli
## 目前cli 支持的功能
> 1. 一个是初始化 ['http://github.com:chenliwen123/mobile#master'](https://github.com/chenliwen123/mobile) 项目
```
clwcli init <project>
```
> 2. 第二个功能是创建vue文件
```
clwcli vues <file>
```
> 3. 第三个功能是自动打包提交
```
clwcli cpush <commit> [build]
//commit git推送说明
//build  是否打包（打包命令为 npm run build:test）
```