// 隋朝事件「经过」逐节点编年：写入 narratives[].year_text
// 规则：单一确年写「589年」；跨两个确年写「605-610年」；
//       事发前的背景/事后的影响若超出事件区间，用「581年前」「618年后」表达
// 用法：node scripts/fix_111_chronology.js
const fs = require('fs');
const file = 'd:/SHUMEI/GraduationProject/frontend/public/data/dynasty_111.json';

// 事件区间修正（仅修正与节点编年明显矛盾的条目）
const YEAR_OVERRIDES = {
  开皇改革: { start_year: 581, end_year: 600 },
  开皇之治: { start_year: 581, end_year: 600 },
  平陈之战: { start_year: 588, end_year: 589 },
  废郡置州: { start_year: 583, end_year: 589 },
  大兴城营建: { start_year: 582, end_year: 583 },
  隋击突厥: { start_year: 599, end_year: 600 },
  营建东都: { start_year: 605, end_year: 606 },
  大运河开凿: { start_year: 605, end_year: 610 },
  山东大起义: { start_year: 611, end_year: 618 },
  瓦岗军兴起: { start_year: 616, end_year: 618 },
  窦建德起兵: { start_year: 611, end_year: 618 },
  薛举起兵: { start_year: 617, end_year: 618 },
  萧铣起兵: { start_year: 617, end_year: 618 }
};

// 事件名 → { 节点标题: 年份文字 }
const MAP = {
  隋朝建立: {
    北周衰微相权坐大: '580年',
    受禅代周建立隋朝: '581年',
    锐意革新开启统一: '581年'
  },
  开皇改革: {
    拨乱反正革除旧弊: '581年',
    定制度行均田兴科举: '581-587年',
    废郡置州厘正官制: '583年',
    开皇之治天下晏然: '600年'
  },
  平陈之战: {
    南北对峙文帝图混一: '588年',
    五十一万大军南下: '588年',
    韩擒虎贺若弼夹击: '589年',
    陈亡天下一统: '589年'
  },
  开皇之治: {
    文帝励精务行宽简: '581年',
    轻徭薄赋劝课农桑: '581-600年',
    仓廪充实户口殷阜: '600年'
  },
  开皇律颁行: {
    革除酷法务从宽简: '581年',
    颁行开皇律: '581年',
    以法治国刑罚清简: '583年'
  },
  三省六部制: {
    确立三省六部: '600年',
    分工制约明确: '600年',
    奠定隋唐官制: '600年后'
  },
  科举制兴起: {
    以考试选官: '600年',
    科举泽被后世: '600年后'
  },
  废郡置州: {
    废郡以州治县: '583年',
    精简地方层级: '583-589年'
  },
  均田制实施: {
    承袭北朝均田: '581年',
    户籍赋役相合: '583年',
    稳定农桑赋税: '581-600年'
  },
  大兴城营建: {
    旧都狭小重建新都: '582年',
    宇文恺主持规划设计: '582年',
    一代帝都规制严谨: '583年'
  },
  隋击突厥: {
    突厥犯边文帝忧北患: '599年前',
    长孙晟离间兵威并举: '599年',
    突厥请和北疆晏然: '600年'
  },
  杨广即位: {
    废勇立广为储: '600年',
    杨广承祚即位: '604年',
    大兴土木用兵: '604-605年'
  },
  营建东都: {
    炀帝下诏营洛: '605年',
    宇文恺主规划: '605年',
    宫城布局齐备: '606年',
    控御中原要地: '605-606年'
  },
  大运河开凿: {
    南北绾辏国都需运: '605年前',
    开凿通济渠永济渠等: '605-608年',
    役夫百万民力大耗: '605-610年',
    南北水路一以贯之: '610年'
  },
  隋灭吐谷浑: {
    炀帝西巡志拓疆土: '609年',
    发兵四道大破浑国: '609年',
    张掖会盟丝路重开: '609年'
  },
  张掖会盟: {
    西巡张掖会盟: '609年',
    河西商路要冲: '609年',
    重启西域邦交: '609年后'
  },
  第一次征高句丽: {
    炀帝求功志在辽东: '611-612年',
    百万大军水陆并进: '612年',
    萨水一败全军溃退: '612年',
    死者山积国本动摇: '612年'
  },
  萨水之战: {
    隋军深入高丽: '612年',
    萨水受挫败走: '612年',
    首征失利之役: '612年'
  },
  杨玄感起兵: {
    征辽疲弊怨声载道: '613年',
    黎阳起兵直趋洛阳: '613年',
    炀帝回师腹背受敌: '613年',
    关陇离心反隋蜂起: '613年后'
  },
  第二次征高句丽: {
    再伐辽东围城: '613年',
    玄感后方起兵: '613年',
    无功回师虚耗: '613年'
  },
  山东大起义: {
    王薄长白首义: '611年',
    官军屡次征讨: '611-613年',
    隋末反隋巨澜: '611-618年'
  },
  第三次征高句丽: {
    三伐高丽远征: '614年',
    高丽请降罢兵: '614年',
    和解未实力竭: '614年后'
  },
  瓦岗军兴起: {
    官兵叛隋投奔瓦岗: '616年',
    李密入主号令群雄: '617年',
    踞有中原雄踞东都: '617-618年'
  },
  兴洛仓之战: {
    瓦岗袭取兴洛: '617年',
    开仓鸣粮募众: '617年',
    瓦岗由此坐大: '617年'
  },
  窦建德起兵: {
    建德起兵河北: '611年',
    整合流民武装: '611-616年',
    据有河北建夏: '618年'
  },
  薛举起兵: {
    薛举金城起兵: '617年',
    西窥关中奋武: '617-618年',
    割据陇右一方: '618年'
  },
  刘武周起兵: {
    武周马邑起事: '617年',
    南下雁太犯晋: '618年后',
    雄据河东一隅: '618年后'
  },
  萧铣起兵: {
    萧铣巴陵举义: '617年',
    据江建立萧梁: '618年',
    江表雄长之强: '618年后'
  },
  李渊晋阳起兵: {
    天下大乱太原举事: '617年',
    晋阳起兵西取长安: '617年',
    立隋恭帝肇建大唐: '617年'
  },
  王世充据洛阳: {
    洛阳政乱擅权: '618年',
    世充执柄洛阳: '618年',
    僭号郑政争雄: '618年后'
  },
  李密败亡: {
    瓦岗中原称雄: '618年前',
    内讧外患交加: '618年',
    洛阳败北投唐: '618年',
    瓦岗势颓瓦解: '618年后'
  },
  窦建德建国: {
    建夏定鼎河北: '618年',
    抚民兴治理基: '618年',
    与唐争衡兵锋: '618年后'
  },
  江都兵变: {
    炀帝困守江都众叛亲离: '618年',
    宇文化及煽乱弑杀炀帝: '618年',
    隋朝灭亡天下更主: '618年'
  },
  隋朝灭亡: {
    三征高丽天下大乱: '612-614年',
    群雄并起隋室失据: '617-618年',
    江都变起隋祚终焉: '618年'
  }
};

const data = JSON.parse(fs.readFileSync(file, 'utf8'));
let eventsTouched = 0, nodesTouched = 0, eventsWithNewYear = 0;
const missingNodes = [], missingEvents = [], overridesApplied = [];

for (const e of data.events || []) {
  const name = String(e.name || '').trim();
  const map = MAP[name];
  if (!map) { missingEvents.push(name); continue; }
  if (YEAR_OVERRIDES[name]) {
    const before = { start_year: e.start_year, end_year: e.end_year };
    Object.assign(e, YEAR_OVERRIDES[name]);
    overridesApplied.push(
      name + '：' + before.start_year + '-' + before.end_year +
      ' → ' + e.start_year + '-' + e.end_year
    );
  }
  let eventChanged = false;
  for (const n of e.narratives || []) {
    const title = String(n.title || '').trim();
    const yt = map[title];
    if (!yt) { missingNodes.push(name + '/' + title); continue; }
    if (n.year_text !== yt) {
      n.year_text = yt;
      nodesTouched++;
      eventChanged = true;
    }
  }
  if (eventChanged) eventsWithNewYear++;
  eventsTouched++;
}

fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log('已编年事件', eventsTouched, '个，写入节点年份', nodesTouched, '条');
console.log('节点年份有更新的事件', eventsWithNewYear, '个');
console.log('修正事件区间', overridesApplied.length, '条：');
overridesApplied.forEach(x => console.log('  - ' + x));
if (missingEvents.length) console.log('未覆盖事件:', missingEvents.join('、'));
if (missingNodes.length) console.log('未覆盖节点:', missingNodes.join('、'));
const pass = missingEvents.length === 0 && missingNodes.length === 0;
console.log(pass ? 'PASS' : 'FAIL');
