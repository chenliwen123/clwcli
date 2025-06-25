const shell = require('shelljs');
const fs = require('fs');
const path = require('path');
const ora = require('ora');
const { pushfun, wait } = require('../utils');

module.exports = function(program) {
  program
    .command('copyfile [commits] [sourceFilePath]')
    .description('自动提交代码,应对代码量检查 (可用逗号分隔多个commit, 可指定源文件路径)')
    .action(async function(commits, sourceFilePath) {
      // 允许指定源文件，默认为当前目录下的index.jsx
      const sourceFile = sourceFilePath 
        ? path.resolve(process.cwd(), sourceFilePath) 
        : path.join(process.cwd(), 'index.jsx');
      
      console.log('使用源文件:', sourceFile);
      
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
      stdout = stdout.substring(stdout.length-1, -1);
      
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
        if(add.code === 0) {
          console.log(`提交文件，commit: ${commit.trim()}`);
          shell.exec(`git commit -m "${commit.trim()}"`);
        }
      }
      shell.exec(`git pull origin ${stdout}`);

      await wait(1500);
      
      // 最后一次性推送所有提交
      console.log(`git push origin ${stdout}:${stdout}`);
      const loing = ora("上传中...").start();
      setTimeout(() => {
        pushfun(`git push origin ${stdout}:${stdout}`, 0, loing);
      }, 10000);
    });
};

