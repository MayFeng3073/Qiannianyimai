/**
 * 元朝(dynasty_114)内容精修脚本（对齐 fix_113_content.js 流程）：
 *   #1 修复历史影响力描述断句问题
 *   #2 works description 精简为约40字完整句子
 *   #3 后人评价统一裁剪为 2 条
 * 用法: node scripts/fix_114_content.js
 */
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'frontend', 'public', 'data', 'dynasty_114.json');

function load() { return JSON.parse(fs.readFileSync(FILE, 'utf-8')); }
function save(o) { fs.writeFileSync(FILE, JSON.stringify(o, null, 2), 'utf-8'); }

function mergeFragments(items) {
  const out = [];
  for (let s of items) {
    s = (s || '').trim();
    if (!s) continue;
    if (s.length <= 6 && out.length > 0) {
      const prev = out[out.length - 1];
      out[out.length - 1] = prev.endsWith('、') || prev.endsWith('。') ? prev + s : prev + '、' + s;
      continue;
    }
    out.push(s);
  }
  return out;
}

function cleanDesc(desc, n = 30) {
  let s = String(desc || '')
    // 去掉年份（1333年 / 1342年 / 13世纪等）
    .replace(/\d{3,4}年[，,]?/g, '')
    .replace(/[一二三四五六七八九十]{1,4}世纪[，,]?/g, '')
    // 去掉换行与多余空白，保证单行
    .replace(/[\n\r\t]+/g, '')
    .replace(/\s+/g, '')
    .replace(/…….*$/, '').trim();
  if (s.length <= n + 8) return s.endsWith('。') ? s : s.replace(/[，。、；,；]+$/, '') + '。';
  const cut = s.slice(0, n);
  const idx = Math.max(cut.lastIndexOf('，'), cut.lastIndexOf('、'), cut.lastIndexOf(' '));
  s = (idx >= 8 ? cut.slice(0, idx) : cut).replace(/[，。、；,；]+$/, '') + '。';
  return s;
}

const IMPACT_OVERRIDE = {
  '脱脱': ['试图通过政治、财政、教育和史学改革挽救元朝统治危机，主持修撰辽金宋三史，是元末最具改革能力的政治家与史学家。'],
  '爱育黎拔力八达': ['仁宗延祐年间恢复科举，整顿吏治、减免赋税，开创延祐之治，为元朝中期较为开明的君主。'],
  '硕德八剌': ['英宗即位后锐意改革，任用拜住、裁减冗官、减轻徭役，推动元代法制建设与政治清明。'],
  '郭守敬': ['精研天文历法、水利工程与数学，编制《授时历》精度领先世界数百年，为元代最杰出的科学家之一。'],
  '倪瓒': ['元代书画大家，元四家之一。以简淡高逸的水墨山水开一代新风，其洁癖与隐逸亦为后世传为佳话。'],
  '吴镇': ['元代著名书画家，元四家之一。以水墨山水见长，师法董源巨然，墨气沉郁、格高意远。'],
  '萨都剌': ['元代诗人，以诗歌连接蒙古与汉地文化，多作边塞诗与咏史诗，风格雄浑清丽，才情过人。']
};

function main() {
  const d = load();
  const persons = (d.persons || []);

  console.log('===== #1 历史影响力断句修复 =====');
  let total = 0;
  persons.forEach(p => {
    if (!Array.isArray(p.impact_list)) return;
    if (IMPACT_OVERRIDE[p.name]) { p.impact_list = IMPACT_OVERRIDE[p.name]; total++; return; }
    const merged = mergeFragments(p.impact_list);
    // 兜底：若仍有 <8 字碎片，合并入前项
    const refined = mergeFragments(merged);
    if (refined.join('') !== (p.impact_list || []).join('')) total++;
    p.impact_list = refined;
  });
  console.log('  修复影响描述段落的人物:', total);

  console.log('\n===== #2 主要奉献 description 统一清洗 =====');
  let fixed = 0;
  persons.filter(p => p.level === 1).forEach(p => {
    (p.works || []).forEach(w => {
      if (!w) return;
      const cleaned = cleanDesc(w.description, 30);
      if (cleaned !== String(w.description || '').replace(/[\n\r\t\s]+/g, '')) {
        w.description = cleaned;
        fixed++;
      }
    });
  });
  console.log('  清洗的贡献项:', fixed);

  console.log('\n===== #3 后人评价统一裁剪为 2 条 =====');
  let trimmed = 0;
  persons.filter(p => p.level === 1).forEach(p => {
    if (Array.isArray(p.later_quotes) && p.later_quotes.length > 2) { p.later_quotes = p.later_quotes.slice(0, 2); trimmed++; }
  });
  console.log('  裁剪后人评价的人物:', trimmed);

  save(d);
  console.log('\n完成。');
}
main();
module.exports = { main };
