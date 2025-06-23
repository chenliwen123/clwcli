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
    .command('jsx <filename>')
    .description('新建jsx初始化文件')
    .action(async function(filename) {
      const reactjsx = `${__dirname}/../templates/index.jsx`;
      const moduleless = `${__dirname}/../templates/index.module.less`;
      const jaxcontent = fs.readFileSync(reactjsx, 'utf8');
      const csscontent = fs.readFileSync(moduleless, 'utf8');
      
      await rl.question(`文件夹名称(${filename})? `, (name) => {
        rl.question(`文件名称(${filename})? `, (country) => {
          if(name == '') {
            name = filename;
          }
          if(country == '') {
            country = filename;
          }
          country = country[0].toLocaleUpperCase() + country.slice(1);
          const newjsxcontent = handlebars.compile(jaxcontent)({name: country});
          const newcsscontent = handlebars.compile(csscontent)({name: country});
          fs.mkdirSync(`./${name}`);
          fs.writeFileSync(`./${name}/index.jsx`, newjsxcontent);
          fs.writeFileSync(`./${name}/index.module.less`, newcsscontent);
          rl.close();
        });
      });
    });
};