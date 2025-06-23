const shell = require('shelljs');
const ora = require('ora');
const { pushfun } = require('../utils');

module.exports = function(program) {
  program
    .command('cpush <commit> [build]')
    .description('自动打包，打包后自动提交')
    .action(async function(commit, build) {
      let flag = false;
      if(build == 'true') {
        console.log('打包当前项目');
        if(shell.exec("npm run build:test").code == 0) {
          console.log('打包成功，提交项目，表明意见描述：' + commit);
          flag = true;
        }
      }
      
      console.log('获取当前分支');
      let stdout = shell.exec("git rev-parse --abbrev-ref HEAD");
      console.log('当前分支为：' + stdout);
      stdout = stdout.substring(stdout.length-1, -1);
      console.log(stdout);
      
      let add = shell.exec(`git add -A .`);
      let status = shell.exec('git status');
      if(status.indexOf('vue.config.js') > -1) {
        shell.exec(`git restore --staged vue.config.js`);
        console.log('vue.config.js 取消上传此文件，如果想要上传此文件请手动上传');
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
