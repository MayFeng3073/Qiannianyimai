// 探查春秋数据：列出每个 Excel 的表头与 "春秋" 相关行数
const XLSX = require('xlsx');
const path = require('path');
const dir = 'd:/SHUMEI/GraduationProject';

const FILES = {
  level1: '1级人物数据.xlsx',
  level2: '2级人物数据.xlsx',
  events: '事件数据.xlsx',
  relations: '人物关系表.xlsx',
  personEvent: '人事关系表.xlsx',
  keywords: '朝代热力图.xlsx'
};

for (const [key, fn] of Object.entries(FILES)) {
  try {
    const wb = XLSX.readFile(path.join(dir, fn));
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws);
    console.log(`\n===== ${fn} (${rows.length} rows) =====`);
    if (rows.length) {
      console.log('Columns:', Object.keys(rows[0]).join(' | '));
      // 统计朝代字段
      const dynastyCol = Object.keys(rows[0]).find(k => /朝代|王朝/.test(k));
      if (dynastyCol) {
        const counts = {};
        rows.forEach(r => { const v = r[dynastyCol]; counts[v == null ? '(空)' : String(v)] = (counts[v == null ? '(空)' : String(v)] || 0) + 1; });
        console.log('朝代分布:', JSON.stringify(counts, null, 1));
      }
      // 打印前2行原始(去掉长文本)
      rows.slice(0, 2).forEach((r, i) => {
        const brief = {};
        for (const [k, v] of Object.entries(r)) {
          brief[k] = typeof v === 'string' && v.length > 40 ? v.slice(0, 40) + '…' : v;
        }
        console.log(`Row${i}:`, JSON.stringify(brief));
      });
    }
  } catch (e) {
    console.log(`\n===== ${fn} : 读取失败 ${e.message}`);
  }
}