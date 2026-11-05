// 秦朝事件「经过」逐节点编年：写入 narratives[].year_text
// 规则：单一确年写「前221年」；跨两个确年写「前230-前221年」；
//       事发前的背景/事后的影响若超出事件区间，用「前221年前」「前207年后」表达
// 用法：node scripts/fix_106_chronology.js
const fs = require('fs');
const file = 'd:/SHUMEI/GraduationProject/frontend/public/data/dynasty_106.json';

// 事件区间修正（仅修正与节点编年明显矛盾的条目）
const YEAR_OVERRIDES = {
  秦长城修筑: { start_year: -215, end_year: -214 },
  驰道修建: { start_year: -220, end_year: -212 },
  阿房宫营建: { start_year: -212, end_year: -207 },
  秦始皇陵营建: { start_year: -247, end_year: -208 },
  蒙恬北击匈奴: { start_year: -215, end_year: -214 },
  秦军征服百越: { start_year: -218, end_year: -214 },
  焚书坑儒: { start_year: -213, end_year: -212 },
  赵高专权: { start_year: -210, end_year: -207 },
  章邯镇压起义军: { start_year: -209, end_year: -207 }
};

// 事件名 → { 节点标题: 年份文字 }
const MAP = {
  秦始皇称皇帝: {
    扫灭六国天下一统: '前230-前221年',
    采皇采帝自号皇帝: '前221年',
    独尊天下集权于一身: '前221年',
    皇帝制度肇始: '前221年后'
  },
  '废分封、行郡县': {
    廷议天下分封之争: '前221年',
    李斯力主郡县: '前221年',
    始皇帝定策: '前221年',
    中央集权之基: '前221年后'
  },
  建立三公九卿制度: {
    新朝需新制: '前221年',
    三公分权制衡: '前221年',
    九卿各司其职: '前221年',
    官制垂范后世: '前221年后'
  },
  统一文字: {
    言异声文异形: '前221年前',
    定小篆为国字: '前221年',
    刻石立其标准: '前221年后',
    书同文文脉相通: '前221年后'
  },
  统一货币: {
    钱币纷杂难行: '前221年前',
    铸半两为本位: '前221年',
    商路由此而通: '前221年后',
    方圆之制流传: '前221年后'
  },
  统一度量衡: {
    丈量与斗斛不一: '前221年前',
    定标准颁天下: '前221年',
    制器以为凭证: '前221年',
    征纳有度国计有常: '前221年后'
  },
  推行秦律: {
    以法为治以刑为威: '前221年前',
    综六国而定律: '前221年',
    天下遵之如式: '前221年',
    严酷而天下怨: '前221年后'
  },
  秦始皇巡游与封禅: {
    宣威天下镇抚六国: '前219年',
    东临齐鲁行封禅: '前219年',
    勒石纪功昭告四海: '前219年',
    威加海内靡费不赀: '前219年后'
  },
  徐福出海求仙: {
    笃信神仙方术: '前219年',
    遣徐福入海: '前219年',
    海上仙山不得: '前219年',
    海上传说远播: '前219年后'
  },
  秦长城修筑: {
    胡骑屡犯北疆: '前215年',
    蒙恬率众筑城: '前214年',
    西起临洮东达辽东: '前214年',
    御胡而役苦民焦: '前214年后'
  },
  驰道修建: {
    帝业需通衢: '前220年',
    驰道天下纵横: '前220年',
    直道北贯边塞: '前212年',
    车同轨而政达四方: '前220年后'
  },
  灵渠开凿: {
    南征需转输: '前214年',
    监禄督凿灵渠: '前214年',
    湘漓相接漕运以通: '前214年',
    岭南自此归一: '前214年后'
  },
  阿房宫营建: {
    务炫帝王威仪: '前212年',
    阿房巍峨工役浩繁: '前212年',
    力役频仍民不堪命: '前212年',
    宫未成而国先亡: '前207年'
  },
  秦始皇陵营建: {
    即位居安营陵自广: '前247年',
    骊山巨冢穿地三泉: '前247-前208年',
    地宫珍宝兵俑拱卫: '前210年',
    厚葬劳民终成暴征: '前208年后'
  },
  蒙恬北击匈奴: {
    匈奴并为北患: '前215年',
    蒙恬率师北击: '前215年',
    筑城设郡充实边地: '前214年',
    胡不敢南下而牧马: '前214年后'
  },
  秦军征服百越: {
    略定岭南拓土千里: '前218年',
    五十万军分五路: '前218年',
    主帅遇害师出受挫: '前218年',
    岭南归入秦版图: '前214年'
  },
  岭南郡县设置: {
    百越既平设治安民: '前214年',
    置南海桂林象郡: '前214年',
    谪戍中原与越杂居: '前214年',
    岭南纳入统一体系: '前214年后'
  },
  焚书坑儒: {
    师古与吏政之争: '前213年',
    禁私学焚典籍: '前213年',
    方士生变坑杀儒生: '前212年',
    思想一统亦招千古之讥: '前212年后'
  },
  沙丘政变: {
    千秋巡游暴崩沙丘: '前210年',
    赵高李斯矫诏: '前210年',
    胡亥袭位赵高得志: '前210年',
    秦祚由此而变: '前210年后'
  },
  赵高专权: {
    拥立有功渐揽大权: '前210年',
    指鹿为马震慑朝堂: '前207年',
    罗织构陷排除异己: '前208年',
    纲纪废弛忠良尽去: '前207年后'
  },
  李斯之死: {
    相权与宦权交恶: '前208年',
    罗织谋反之罪: '前208年',
    含冤腰斩身死族灭: '前208年',
    朝纲独断秦政瓦解: '前208年后'
  },
  望夷宫之变: {
    关东大乱秦军败退: '前207年',
    围望夷宫迫帝逊位: '前207年',
    立子婴旋诛赵高: '前207年',
    秦廷彻底分裂: '前207年后'
  },
  陈胜吴广起义: {
    大雨误期惧法当斩: '前209年',
    斩木为兵揭竿而起: '前209年',
    张楚立号义军并起: '前209年',
    首义亡秦之先声: '前209年后'
  },
  章邯镇压起义军: {
    义军蜂起关东告急: '前209年',
    章邯受命统军: '前209年',
    一时力挽危局: '前208年',
    勇将难扶将倾之厦: '前207年后'
  },
  巨鹿之战: {
    秦军围赵于巨鹿: '前207年',
    项羽破釜沉舟: '前207年',
    九战九捷秦师瓦解: '前207年',
    秦亡已成定局: '前207年后'
  },
  刘邦入关: {
    楚军两路伐秦: '前207年',
    绕函谷出武关: '前207年',
    蓝田再战秦廷求和: '前207年',
    先入咸阳约法三章: '前207年后'
  },
  子婴投降: {
    大兵压境国势垂危: '前207年',
    临危诛赵高: '前207年',
    素车白马奉玺以降: '前207年',
    秦代至此终结: '前207年后'
  },
  秦朝灭亡: {
    严刑酷役积弊深重: '前207年前',
    烽烟遍起关东: '前209-前207年',
    主力覆灭军溃土崩: '前207年',
    二世而亡教训千古: '前207年后'
  }
};

const data = JSON.parse(fs.readFileSync(file, 'utf8'));
let eventsTouched = 0, nodesTouched = 0, totalNodes = 0;
const missingNodes = [], missingEvents = [], overrideReport = [];
const seenEvents = new Set();
let variedEvents = 0;

for (const e of data.events || []) {
  const name = String(e.name || '').trim();
  const map = MAP[name];
  if (!map) { missingEvents.push(name); continue; }

  if (YEAR_OVERRIDES[name]) {
    const before = { start_year: e.start_year, end_year: e.end_year };
    Object.assign(e, YEAR_OVERRIDES[name]);
    if (before.start_year !== e.start_year || before.end_year !== e.end_year) {
      overrideReport.push(name + '：' + before.start_year + '~' + before.end_year +
        ' → ' + e.start_year + '~' + e.end_year);
    }
  }

  const yearSet = new Set();
  for (const n of e.narratives || []) {
    totalNodes++;
    const title = String(n.title || '').trim();
    const yt = map[title];
    if (!yt) { missingNodes.push(name + '/' + title); continue; }
    if (n.year_text !== yt) { n.year_text = yt; nodesTouched++; }
    yearSet.add(yt);
  }
  if (yearSet.size > 1) variedEvents++;
  seenEvents.add(name);
  eventsTouched++;
}

const unmapped = Object.keys(MAP).filter(k => !seenEvents.has(k));
fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log('已编年事件', eventsTouched, '个，节点', totalNodes, '个，写入年份', nodesTouched, '条');
console.log('节点年份不一致的事件数：', variedEvents);
console.log('修正事件区间：', overrideReport.length ? overrideReport.join('；') : '无');
if (unmapped.length) console.log('映射中多余事件:', unmapped.join('、'));
if (missingEvents.length) console.log('未覆盖事件:', missingEvents.join('、'));
if (missingNodes.length) console.log('未覆盖节点:', missingNodes.join('、'));
console.log('缺失事件数：', missingEvents.length, '缺失节点数：', missingNodes.length);
console.log((missingEvents.length === 0 && missingNodes.length === 0) ? 'PASS' : 'FAIL');
