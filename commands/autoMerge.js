const shell = require('shelljs');
const ora = require('ora');
const chalk = require('chalk');
const logsymbols = require('log-symbols');
const { transformTimestamp, wait } = require('../utils');

let loing;

// 检查是否有合并冲突
function checkMergeConflict() {
  const status = shell.exec('git status --porcelain', { silent: true });
  return status.stdout.includes('UU') || status.stdout.includes('AA') || status.stdout.includes('DD');
}

// 检查命令执行结果
function checkCommandResult(result, operation, errorCallback) {
  if (result.code !== 0) {
    console.log(logsymbols.error, chalk.red(`${operation}失败！`));
    console.log(chalk.red('错误信息：'), result.stderr);
    if (errorCallback) errorCallback();
    shell.exit(1);
    return false;
  }
  return true;
}

// 处理合并冲突
function handleMergeConflict(branchName, targetBranch) {
  console.log(logsymbols.error, chalk.red(`❌ 合并 ${branchName} 到 ${targetBranch} 时发生冲突！`));
  console.log(chalk.yellow('🔧 请手动解决冲突后再重新运行命令'));
  console.log(chalk.cyan('💡 解决冲突的步骤：'));
  console.log(chalk.cyan('   1. 编辑冲突文件，解决冲突标记'));
  console.log(chalk.cyan('   2. git add <冲突文件>'));
  console.log(chalk.cyan('   3. git commit'));
  console.log(chalk.cyan('   4. 重新运行 clwcli autoMerge'));

  // 显示冲突文件列表
  const conflictFiles = shell.exec('git diff --name-only --diff-filter=U', { silent: true });
  if (conflictFiles.stdout.trim()) {
    console.log(chalk.red('📄 冲突文件列表：'));
    conflictFiles.stdout.trim().split('\n').forEach(file => {
      console.log(chalk.red(`   - ${file}`));
    });
  }
}

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
        const checkoutResult = shell.exec(`git checkout ${branch}`);
        if (!checkCommandResult(checkoutResult, `切换到${branch}分支`)) return;

        await wait(1000);
        const pullResult = shell.exec(`git pull origin ${branch}`);
        if (!checkCommandResult(pullResult, `拉取${branch}分支`)) return;

        await wait(1000);
        console.log('切换至' + branch + '分支成功');
      }

      console.log('切换dev分支');
      const checkoutDevResult = shell.exec(`git checkout dev`);
      if (!checkCommandResult(checkoutDevResult, '切换到dev分支')) return;

      await wait(1000);
      console.log('拉取dev分支');
      const pullDevResult = shell.exec(`git pull origin dev`);
      if (!checkCommandResult(pullDevResult, '拉取dev分支')) return;

      await wait(1000);
      console.log('合并' + handerBarch + '分支');
      const mergeToDevResult = shell.exec(`git merge ${handerBarch}`);

      // 检查合并是否有冲突
      if (mergeToDevResult.code !== 0 || checkMergeConflict()) {
        handleMergeConflict(handerBarch, 'dev');
        shell.exit(1);
        return;
      }

      await wait(1000);
      console.log('推送dev分支');
      const pushDevResult = shell.exec(`git push origin dev:dev`);
      if (!checkCommandResult(pushDevResult, '推送dev分支')) return;

      await wait(1000);
      console.log('切换sit分支');
      const checkoutSitResult = shell.exec(`git checkout sit`);
      if (!checkCommandResult(checkoutSitResult, '切换到sit分支')) return;

      await wait(1000);
      console.log('拉取sit分支');
      const pullSitResult = shell.exec(`git pull origin sit`);
      if (!checkCommandResult(pullSitResult, '拉取sit分支')) return;

      await wait(1000);
      console.log('合并dev分支');
      const mergeToSitResult = shell.exec(`git merge dev`);

      // 检查合并是否有冲突
      if (mergeToSitResult.code !== 0 || checkMergeConflict()) {
        handleMergeConflict('dev', 'sit');
        shell.exit(1);
        return;
      }

      await wait(1000);
      console.log('推送sit分支');
      const pushSitResult = shell.exec(`git push origin sit:sit`);
      if (!checkCommandResult(pushSitResult, '推送sit分支')) return;

      await wait(1000);
      console.log('合并完成');
      console.log('完成时间：' + transformTimestamp());
      loing = ora("合并完成").succeed();
      console.log(logsymbols.success, chalk.green("✅ 合并分支成功"));

      // 切换回原来的分支
      const checkoutOriginalResult = shell.exec(`git checkout ${stdout}`);
      if (checkCommandResult(checkoutOriginalResult, `切换回原分支${stdout}`)) {
        console.log('切换回原来的分支：' + stdout);
      }

      shell.exit(0);
    });
};