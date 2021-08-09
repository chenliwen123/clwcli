#!/usr/bin/env node

// console.log(process.argv)
const { program } = require('commander');
const download = require('download-git-repo');
const handlebars = require('handlebars');
const inquirer = require('inquirer')
const fs = require('fs')
const ora = require('ora');
const chalk = require('chalk');
const logsymbols = require('log-symbols')
const templates = {
  'mobile' : {
    url:"https://github.com/chenliwen123/mobile",
    downloadurl:'http://github.com:chenliwen123/mobile#master'
  }
}
program
  .version('1.1.1')
program
  .command('init <project>')
  .description('初始化 移动端 ')
  .option("-s, --setup_mode [mode]", "Which setup mode to use")
  .action(function(project){
    const loing = ora("下载中...").start();
    download(templates['mobile'].downloadurl,project,{clone:true},(err) =>{
      if(err){
        loing.fail();
        console.log(logsymbols.error,chalk.red(err));
        return
      }
      const answers = {
        name:project,
        description:"描述",
        author:"作者"
      }
      const jsonpath = `${project}/package.json`;
      const constetn = fs.readFileSync(jsonpath,'utf8');
      const packageresult = handlebars.compile(constetn)(answers)
      fs.writeFileSync(jsonpath,packageresult);
      loing.succeed();
      console.log(logsymbols.success,chalk.yellow("初始化项目成功"));
    })
  });
  program
  .command('vues <filename>')
  .description('新建vue 初始化文件')
  .option("-s, --setup_mode [mode]", "Which setup mode to use")
  .action(function(filename){
    const vueurl = `${__dirname}/index.vue`;
    const exportjs = `${__dirname}/export.js`;
    const vuecontent = fs.readFileSync(vueurl,'utf8');
    const exportjscontent = fs.readFileSync(exportjs,'utf8');
    const newvuecontent = handlebars.compile(vuecontent)({name:filename})
    const newexportjscontent = handlebars.compile(exportjscontent)({name:filename})
    fs.mkdirSync(`./${filename}`)
    fs.writeFileSync(`./${filename}/${filename}.vue`,newvuecontent)
    fs.writeFileSync(`./${filename}/index.js`,newexportjscontent)
  });

program.parse(process.argv);