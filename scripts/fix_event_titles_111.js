/**
 * 补全王朝111(隋) 事件详情页「事件经过」叙事节点的小标题
 * 规则：
 *   - title 为简短无标点短语（4-10字），禁止逗号/顿号/句号等标点
 *   - 风格参考「安禄山范阳起兵」「统一天下」
 * 用法: node scripts/fix_event_titles_111.js
 */
const fs = require('fs')
const path = require('path')
const FILE = path.join(__dirname, '..', 'frontend', 'public', 'data', 'dynasty_111.json')

// eventId -> narratives 各节点的 title（按叙事顺序）
const TITLES = {
  111306: ['确立三省六部', '分工制约明确', '奠定隋唐官制'],
  111307: ['以考试选官', '科举泽被后世'],
  111308: ['废郡以州治县', '精简地方层级'],
  111309: ['承袭北朝均田', '户籍赋役相合', '稳定农桑赋税'],
  111312: ['废勇立广为储', '杨广承祚即位', '大兴土木用兵'],
  111313: ['炀帝下诏营洛', '宇文恺主规划', '宫城布局齐备', '控御中原要地'],
  111316: ['西巡张掖会盟', '河西商路要冲', '重启西域邦交'],
  111318: ['隋军深入高丽', '萨水受挫败走', '首征失利之役'],
  111320: ['再伐辽东围城', '玄感后方起兵', '无功回师虚耗'],
  111321: ['王薄长白首义', '官军屡次征讨', '隋末反隋巨澜'],
  111322: ['三伐高丽远征', '高丽请降罢兵', '和解未实力竭'],
  111324: ['瓦岗袭取兴洛', '开仓鸣粮募众', '瓦岗由此坐大'],
  111325: ['建德起兵河北', '整合流民武装', '据有河北建夏'],
  111326: ['薛举金城起兵', '西窥关中奋武', '割据陇右一方'],
  111327: ['武周马邑起事', '南下雁太犯晋', '雄据河东一隅'],
  111328: ['萧铣巴陵举义', '据江建立萧梁', '江表雄长之强'],
  111330: ['洛阳政乱擅权', '世充执柄洛阳', '僭号郑政争雄'],
  111331: ['瓦岗中原称雄', '内讧外患交加', '洛阳败北投唐', '瓦岗势颓瓦解'],
  111332: ['建夏定鼎河北', '抚民兴治理基', '与唐争衡兵锋'],
}

const strip = s => String(s).replace(/[，。、；：！？（）\s]/g, '')

let changed = 0
const data = JSON.parse(fs.readFileSync(FILE, 'utf-8'))
for (const e of data.events || []) {
  const titles = TITLES[e.id]
  if (!titles) continue
  const narr = e.narratives || []
  titles.forEach((t, i) => {
    if (narr[i] && !(narr[i].title || '').trim()) {
      narr[i].title = strip(t)
      changed++
    }
  })
}
fs.writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf-8')
console.log('[fix_event_titles_111] filled', changed, 'titles')