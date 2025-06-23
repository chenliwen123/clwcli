const shell = require('shelljs');
const ora = require('ora');
const chalk = require('chalk');
const logsymbols = require('log-symbols');
const { transformTimestamp, wait } = require('../utils');

let loing;

module.exports = function(program) {
  program
    .command('autoMerge [branch]')
    .description('自动合并分支到dev、sit')
    .action(async function(branch) {
      console.log('获取当前分支');
      let stdout = shell.exec("git rev-parse --abbrev-ref HEAD");
      stdout = stdout.substring(stdout.length-1, -1);
      await wait(1000);
      
      const handerBarch = branch || stdout;
      console.log('当前分支为：' + handerBarch);
      
      if(branch && branch != stdout) { // 如果当前分支不是要合并的分支
        console.log('分支不一致，正在切换至' + branch + '分支');
        shell.exec(`git checkout ${branch}`);
        await wait(1000);
        shell.exec(`git pull origin ${branch}`);
        await wait(1000);
        console.log('切换至' + branch + '分支成功');
      }
      
      console.log('切换dev分支');
      shell.exec(`git checkout dev`);
      await wait(1000);
      console.log('拉取dev分支');
      shell.exec(`git pull origin dev`);
      await wait(1000);
      console.log('合并' + handerBarch + '分支');
      shell.exec(`git merge ${handerBarch}`);
      await wait(1000);
      console.log('推送dev分支');
      shell.exec(`git push origin dev:dev`);
      await wait(1000);
      console.log('切换sit分支');
      shell.exec(`git checkout sit`);
      await wait(1000);
      console.log('拉取sit分支');
      shell.exec(`git pull origin sit`);
      await wait(1000);
      console.log('合并dev分支');
      shell.exec(`git merge dev`);
      await wait(1000);
      console.log('推送sit分支');
      shell.exec(`git push origin sit:sit`);
      await wait(1000);
      console.log('合并完成');
      console.log('完成时间：' + transformTimestamp());
      loing = ora("合并完成").succeed();
      console.log(logsymbols.success, chalk.yellow("合并分支成功"));
      shell.exec(`git checkout ${stdout}`); // 切换回原来的分支
      console.log('切换回原来的分支：' + stdout);
      
      shell.exit(1);
    });
};