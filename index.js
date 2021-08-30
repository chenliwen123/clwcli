#!/usr/bin/env node

// console.log(process.argv)
const { program } = require('commander');
const download = require('download-git-repo');
const handlebars = require('handlebars');
const fs = require('fs')
const ora = require('ora');
const chalk = require('chalk');
const logsymbols = require('log-symbols')
const readline = require('readline');
var shell = require("shelljs");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
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
  .action(async function(filename){
    const vueurl = `${__dirname}/index.vue`;
    const exportjs = `${__dirname}/export.js`;
    const vuecontent = fs.readFileSync(vueurl,'utf8');
    const exportjscontent = fs.readFileSync(exportjs,'utf8');
    await rl.question(`文件夹名称(${filename})? `, (name) => {
      rl.question(`文件名称(${filename})? `, (country) => {
        if(name == ''){
          name = filename;
        }
        if(country == ''){
          country = filename;
        }
        const newvuecontent = handlebars.compile(vuecontent)({name:country})
        const newexportjscontent = handlebars.compile(exportjscontent)({name:country})
        fs.mkdirSync(`./${name}`)
        fs.writeFileSync(`./${name}/${country}.vue`,newvuecontent)
        fs.writeFileSync(`./${name}/index.js`,newexportjscontent)
        rl.close();
      });
  
  });    
});

program
.command('cpush <commit> [build]')
.description('自动打包，打包后自动提交')
.action(async function(commit,build){
  let flag = false
  if(build == true){
    console.log('打包当前项目');
    if( shell.exec("npm run build:test").code == 0){
      console.log('打包成功，提交项目，表明意见描述：' + commit);
      flag = true
    }
  }
    console.log('获取当前分支');
    let stdout = shell.exec("git rev-parse --abbrev-ref HEAD")
    console.log('当前分支为：' + stdout);
    stdout = stdout.substring(stdout.length-1,-1)
    console.log(stdout)
    if(shell.exec(`git add -A .`) == 0){
      console.log('提交全部')
      if(shell.exec(`git commit -m ${commit}`).code == 0){
        console.log(`git push origin ${stdout}:${stdout}`)
        setTimeout(() => {
          if(shell.exec(`git push origin ${commit}:${stdout}`) == 0){
            console.log('推送成功')
          }
        }, 5000);
      }
      
    }
});

program.parse(process.argv);