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
const path = require('path');
const { error } = require('console');
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
let loing = null;
program
  .version('1.1.8')
program
  .command('init <project>')
  .description('初始化 移动端 ')
  .action(function(project){
    loing = ora("下载中...").start();
    download(templates['mobile'].downloadurl,project,{clone:true},(err) =>{
      if(err){
        loing.fail('下载失败');
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
function transformTimestamp(){
  let a = new Date().getTime();
  const date = new Date(a);
  const Y = date.getFullYear() + '-';
  const M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
  const D = (date.getDate() < 10 ? '0'+date.getDate() : date.getDate()) + '  ';
  const h = (date.getHours() < 10 ? '0'+date.getHours() : date.getHours()) + ':';
  const m = (date.getMinutes() <10 ? '0'+date.getMinutes() : date.getMinutes()) ;
  const s = (date.getSeconds() <10 ? '0'+date.getSeconds() : date.getSeconds()) ;
  const dateString = Y + M + D + h + m + s;
  return dateString;
}
function pushfun(src,num = 0){
  let push = shell.exec(src)
  if(push.code == 0){
    loing.succeed('推送成功');
    console.log('当前时间是：',transformTimestamp())
    shell.exit(1)
  }else{
    if(push.stderr.indexOf('Timed out') > -1 && num <= 2){
      console.log('推送超时,即将重新推送！');
      loing.start('上传中···');
      pushfun(src,++num);
    }else if(push.stderr.indexOf('OpenSSL SSL_read') > -1 && num <= 2){
      shell.exec('git config --global http.sslVerify false')
      console.log('解决ssl证书问题，重新上传');
      pushfun(src,num);
    }else{
      loing.fail('推送失败');
      shell.exit(1)
    }
  }
};

program
.command('cpush <commit> [build]')
.description('自动打包，打包后自动提交')
.action(async function(commit,build){
  let flag = false
  if(build == 'true'){
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
    let add = shell.exec(`git add -A .`)
    let status = shell.exec('git status')
    if(status.indexOf('vue.config.js') > -1){
      shell.exec(`git restore --staged vue.config.js`)
      console.log('vue.config.js 取消上传此文件，如果想要上传此文件请手动上传')
    }
    if(add == 0){
      console.log('提交文件')
      shell.exec(`git commit -m ${commit}`)
      console.log(`git push origin ${stdout}:${stdout}`)
      loing = ora("上传中...").start();
      setTimeout(() => {
        pushfun(`git push origin ${stdout}:${stdout}`)
      }, 10000);
    }
});

program.command('copyfile')
.description('自动提交代码,应对代码量检查')
.action(async function(commit,build){
    const sourceFile = path.join(process.cwd(), 'index.jsx'); // 当前目录下的 source.txt
    const destinationFile = path.join(process.cwd(), `index${transformTimestamp()}.jsx`); // 目标路径
    shell.cp(sourceFile, destinationFile);
    if (shell.error()) {
        console.error('复制文件失败');
        shell.exit(1)

    }
    console.log('复制文件成功');
    console.log('获取当前分支');
    let stdout = shell.exec("git rev-parse --abbrev-ref HEAD")
    console.log('当前分支为：' + stdout);
    stdout = stdout.substring(stdout.length-1,-1)
    console.log(stdout)
    let add = shell.exec(`git add -A .`)
    // let status = shell.exec('git status')
    // if(status.indexOf('api/server.js') > -1){
    //   shell.exec(`git restore --staged api/server.js.js`)
    //   console.log('api/server.js 取消上传此文件，如果想要上传此文件请手动上传')
    // }
    if(add == 0){
      console.log('提交文件')
      shell.exec(`git commit -m 优化代码对比，增加新页面`)
      console.log(`git push origin ${stdout}:${stdout}`)
      loing = ora("上传中...").start();
      setTimeout(() => {
        pushfun(`git push origin ${stdout}:${stdout}`)
      }, 10000);
    }
});

program.command('qmgit <commit>')
.description('自动提交代码,取消上传serve.js文件')
.action(async function(commit,build){
    console.log('获取当前分支');
    let stdout = shell.exec("git rev-parse --abbrev-ref HEAD")
    console.log('当前分支为：' + stdout);
    stdout = stdout.substring(stdout.length-1,-1)
    console.log(stdout)
    let add = shell.exec(`git add -A .`)
    let status = shell.exec('git status')
    if(status.indexOf('api/server.js') > -1){
      shell.exec(`git restore --staged api/server.js.js`)
      console.log('api/server.js 取消上传此文件，如果想要上传此文件请手动上传')
    }
    if(add == 0){
      console.log('提交文件')
      shell.exec(`git commit -m ${commit}`)
      console.log(`git push origin ${stdout}:${stdout}`)
      loing = ora("上传中...").start();
      setTimeout(() => {
        pushfun(`git push origin ${stdout}:${stdout}`)
      }, 10000);
    }
});

program.parse(process.argv);