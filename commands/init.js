const ora = require('ora');
const download = require('download-git-repo');
const fs = require('fs');
const handlebars = require('handlebars');
const chalk = require('chalk');
const logsymbols = require('log-symbols');
const templates = require('../templates.js');

let loing;

module.exports = function(program) {
  program
    .command('init <project>')
    .description('初始化项目')
    .action(function(project) {
      loing = ora("下载中...").start();
      download(templates['mobile'].downloadurl, project, {clone: true}, (err) => {
        if(err) {
          loing.fail('下载失败');
          console.log(logsymbols.error, chalk.red(err));
          return;
        }
        const answers = {
          name: project,
          description: "描述",
          author: "作者"
        };
        const jsonpath = `${project}/package.json`;
        const constetn = fs.readFileSync(jsonpath, 'utf8');
        const packageresult = handlebars.compile(constetn)(answers);
        fs.writeFileSync(jsonpath, packageresult);
        loing.succeed();
        console.log(logsymbols.success, chalk.yellow("初始化项目成功"));
      });
    });
};