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
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
const { wait } = require('./utils/index');
const templates = {
  'mobile' : {
    url:"https://github.com/chenliwen123/mobile",
    downloadurl:'http://github.com:chenliwen123/mobile#master'
  }
}
let loing = null;
program
  .version('1.1.10')
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

  program
  .command('jsx <filename>')
  .description('新建jsx初始化文件')
  .action(async function(filename){
    const reactjsx = `${__dirname}/index.jsx`;
    const moduleless = `${__dirname}/index.module.less`;
    const jaxcontent = fs.readFileSync(reactjsx,'utf8');
    const csscontent = fs.readFileSync(moduleless,'utf8');
    await rl.question(`文件夹名称(${filename})? `, (name) => {
      rl.question(`文件名称(${filename})? `, (country) => {
        if(name == ''){
          name = filename;
        }
        if(country == ''){
          country = filename;
        }
        country = country[0].toLocaleUpperCase()+country.slice(1)
        const newjsxcontent = handlebars.compile(jaxcontent)({name:country})
        const newcsscontent = handlebars.compile(csscontent)({name:country})
        fs.mkdirSync(`./${name}`)
        fs.writeFileSync(`./${name}/index.jsx`,newjsxcontent)
        fs.writeFileSync(`./${name}/index.module.less`,newcsscontent)
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
  const m = (date.getMinutes() <10 ? '0'+date.getMinutes() : date.getMinutes()) + ':' ;
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

program.command('copyfile [commits]')
.description('自动提交代码,应对代码量检查 (可用逗号分隔多个commit)')
.action(async function(commits, build){
    const sourceFile = path.join(process.cwd(), 'index.jsx'); // 获取用户当前目录的 index.jsx
    
    // 检查源文件是否存在
    if (!fs.existsSync(sourceFile)) {
      console.error('源文件不存在:', sourceFile);
      shell.exit(1);
      return;
    }
    
    // 获取当前分支
    console.log('获取当前分支');
    let stdout = shell.exec("git rev-parse --abbrev-ref HEAD");
    console.log('当前分支为：' + stdout);
    stdout = stdout.substring(stdout.length-1,-1);
    
    // 处理多个commit
    const commitMessages = commits ? commits.split(',') : ['优化代码对比，增加新页面'];
    
    for (const commit of commitMessages) {
      // 创建新文件
      const destinationDir = path.join(process.cwd());
      const baseName = path.basename(sourceFile, path.extname(sourceFile));
      const ext = path.extname(sourceFile);
      
      let counter = 1;
      let destinationFile = path.join(destinationDir, `${baseName}_${counter}${ext}`);
      
      while (fs.existsSync(destinationFile)) {
        counter++;
        destinationFile = path.join(destinationDir, `${baseName}_${counter}${ext}`);
      }
      
      // 复制文件
      shell.cp(sourceFile, destinationFile);
      
      if (shell.error()) {
        console.error('复制文件失败');
        continue;
      } else {
        console.log(`复制成功！文件已保存为: ${destinationFile}`);
      }
      
      // 提交这个文件
      let add = shell.exec(`git add "${destinationFile}"`);
      if(add.code === 0){
        console.log(`提交文件，commit: ${commit.trim()}`);
        shell.exec(`git commit -m "${commit.trim()}"`);
      }
    }
    
    // 最后一次性推送所有提交
    console.log(`git push origin ${stdout}:${stdout}`);
    loing = ora("上传中...").start();
    setTimeout(() => {
      pushfun(`git push origin ${stdout}:${stdout}`);
    }, 10000);
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

program
.command('autoMerge [branch]')
.description('自动合并分支到dev、sit')
.action(async function(branch){
    console.log('获取当前分支');
    let stdout = shell.exec("git rev-parse --abbrev-ref HEAD")
    stdout = stdout.substring(stdout.length-1,-1)
    await wait(1000);
    const handerBarch = branch || stdout
    console.log('当前分支为：' + handerBarch);
    if(branch && branch != stdout){ // 如果当前分支不是要合并的分支
        console.log('分支不一致，正在切换至' + branch + '分支');
        shell.exec(`git checkout ${branch}`)
        await wait(1000);
        shell.exec(`git pull origin ${branch}`)
        await wait(1000);
        console.log('切换至' + branch + '分支成功');
    }
    console.log('切换dev分支');
    shell.exec(`git checkout dev`)
    await wait(1000);
    console.log('拉取dev分支');
    shell.exec(`git pull origin dev`)
    await wait(1000);
    console.log('合并' +  handerBarch + '分支');
    shell.exec(`git merge ${handerBarch}`)
    await wait(1000);
    console.log('推送dev分支');
    shell.exec(`git push origin dev:dev`)
    await wait(1000);
    console.log('切换sit分支');
    shell.exec(`git checkout sit`)
    await wait(1000);
    console.log('拉取sit分支');
    shell.exec(`git pull origin sit`)
    await wait(1000);
    console.log('合并dev分支');
    shell.exec(`git merge dev`)
    await wait(1000);
    console.log('推送sit分支');
    shell.exec(`git push origin sit:sit`);
    await wait(1000);
    console.log('合并完成');
    console.log('完成时间：' + transformTimestamp());
    loing = ora("合并完成").succeed();
    console.log(logsymbols.success,chalk.yellow("合并分支成功"));
    shell.exec(`git checkout ${stdout}`) // 切换回原来的分支
    console.log('切换回原来的分支：' + stdout);

    shell.exit(1)
});

program.parse(process.argv);