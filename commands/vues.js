const fs = require('fs');
const handlebars = require('handlebars');
const readline = require('readline');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

module.exports = function(program) {
  program
    .command('vues <filename>')
    .description('新建vue 初始化文件')
    .action(async function(filename) {
      const vueurl = `${__dirname}/../templates/index.vue`;
      const exportjs = `${__dirname}/../templates/export.js`;
      const vuecontent = fs.readFileSync(vueurl, 'utf8');
      const exportjscontent = fs.readFileSync(exportjs, 'utf8');
      
      await rl.question(`文件夹名称(${filename})? `, (name) => {
        rl.question(`文件名称(${filename})? `, (country) => {
          if(name == '') {
            name = filename;
          }
          if(country == '') {
            country = filename;
          }
          const newvuecontent = handlebars.compile(vuecontent)({name: country});
          const newexportjscontent = handlebars.compile(exportjscontent)({name: country});
          fs.mkdirSync(`./${name}`);
          fs.writeFileSync(`./${name}/${country}.vue`, newvuecontent);
          fs.writeFileSync(`./${name}/index.js`, newexportjscontent);
          rl.close();
        });
      });
    });
};