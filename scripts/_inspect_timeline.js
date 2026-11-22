// 核查战国一级人物的「人生时间轴」列能否正常读取/解析
const XLSX = require('xlsx');
const path = require('path');
const dir = 'd:/SHUMEI/GraduationProject';
function read(fn){const wb=XLSX.readFile(path.join(dir,fn));return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);}
function col(r,...ks){for(const k of ks){const fk=Object.keys(r).find(kk=>String(kk).includes(k));if(fk&&r[fk]!=null&&String(r[fk]).trim()!=='')return r[fk];}return null;}

const l1 = read('1级人物数据.xlsx').filter(r=>String(col(r,'朝代')).includes('战国'));

let ok=0, empty=0, bad=0, notJson=0;
console.log('== 每人 人生时间轴 状态 ==');
for(const r of l1){
  const n=col(r,'姓名');
  const raw=col(r,'人生时间轴');
  const s=raw==null?'':String(raw).trim();
  let status;
  if(!s){ status='[空]'; empty++; }
  else{
    try{ const a=JSON.parse(s); if(Array.isArray(a)){ status=`OK ${a.length}节点`; ok++; } else { status='[非数组]'; notJson++; } }
    catch(e){ status='[JSON解析失败]'; bad++; }
  }
  if(n==='商鞅'||n==='白起'||n==='屈原'||n==='荆轲'||n==='扁鹊') console.log(`  ${n}: ${status} raw=${s.slice(0,80)}`);
}
console.log(`\n统计: 可解析 ${ok} 人 | 空 ${empty} 人 | 非数组 ${notJson} 人 | 解析失败 ${bad} 人`);

// 商鞅完整值
const shang = l1.find(r=>col(r,'姓名')==='商鞅');
if(shang){ const raw=col(shang,'人生时间轴'); console.log('\n商鞅原始值长度:', raw?String(raw).length:0); console.log(String(raw).slice(0,200)); }
