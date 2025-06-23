const shell = require('shelljs');

// 时间戳转换函数
function transformTimestamp() {
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

// 推送函数
function pushfun(src, num = 0, loingInstance) {
  // 使用传入的loingInstance或尝试使用全局loing
  const loing = loingInstance || global.loing;
  
  let push = shell.exec(src);
  if(push.code == 0) {
    if (loing && typeof loing.succeed === 'function') {
      loing.succeed('推送成功');
    } else {
      console.log('推送成功');
    }
    console.log('当前时间是：', transformTimestamp());
    shell.exit(1);
  } else {
    if(push.stderr.indexOf('Timed out') > -1 && num <= 2) {
      console.log('推送超时,即将重新推送！');
      if (loing && typeof loing.start === 'function') {
        loing.start('上传中···');
      } else {
        console.log('上传中···');
      }
      pushfun(src, ++num, loing);
    } else if(push.stderr.indexOf('OpenSSL SSL_read') > -1 && num <= 2) {
      shell.exec('git config --global http.sslVerify false');
      console.log('解决ssl证书问题，重新上传');
      pushfun(src, num, loing);
    } else {
      if (loing && typeof loing.fail === 'function') {
        loing.fail('推送失败');
      } else {
        console.log('推送失败');
      }
      shell.exit(1);
    }
  }
}

// 等待函数
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  transformTimestamp,
  pushfun,
  wait
};
