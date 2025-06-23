const shell = require('shelljs');
const ora = require('ora');
const { pushfun } = require('../utils');

module.exports = function(program) {
  program
    .command('qmgit <commit>')
    .description('自动提交代码,取消上传serve.js文件')
    .action(async function(commit, build) {
      console.log('获取当前分支');
      let stdout = shell.exec("git rev-parse --abbrev-ref HEAD");
      console.log('当前分支为：' + stdout);
      stdout = stdout.substring(stdout.length-1, -1);
      console.log(stdout);
      
      let add = shell.exec(`git add -A .`);
      let status = shell.exec('git status');
      if(status.indexOf('api/server.js') > -1) {
        shell.exec(`git restore --staged api/server.js`);
        console.log('api/server.js 取消上传此文件，如果想要上传此文件请手动上传');
      }
      
      if(add == 0) {
        console.log('提交文件');
        shell.exec(`git commit -m "${commit}"`);
        console.log(`git push origin ${stdout}:${stdout}`);
        const loing = ora("上传中...").start();
        setTimeout(() => {
          pushfun(`git push origin ${stdout}:${stdout}`, 0, loing);
        }, 10000);
      }
    });
};
