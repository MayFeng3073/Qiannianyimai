const fs = require('fs');
const src = 'd:/SHUMEI/GraduationProject/scripts/import-zhanguo.js';
const dst = 'd:/SHUMEI/GraduationProject/scripts/import-qin.js';
let s = fs.readFileSync(src, 'utf-8');
s = s.split('203').join('106').split('战国').join('秦');
fs.writeFileSync(dst, s, 'utf-8');
console.log('import-qin.js 生成');