#!/usr/bin/env node

const { program } = require('commander');
const readline = require('readline');
const commands = require('./commands/index.js');
const utils = require('./utils');

// 全局变量
global.loing = null;
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 设置版本号
program.version('1.1.10');

// 共享的上下文对象
const context = {
  loing: global.loing,
  rl,
  ...utils
};

// 注册所有命令
Object.values(commands).forEach(command => command(program, context));

// 解析命令行参数
program.parse(process.argv);
