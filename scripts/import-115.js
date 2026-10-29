// 明朝数据导入脚本 v1：从 Excel 生成 frontend/public/data/dynasty_115.json
// 结构对齐 import-114.js（元朝），改朝代配置 / ID 前缀 / 别名 / 关系归一 / 二级分类 / 事件字段
// 用法：node scripts/import-115.js
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const dir = 'd:/SHUMEI/GraduationProject';

function read(fn) {
  const wb = XLSX.readFile(path.join(dir, fn));
  return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
}
function col(r, ...ks) {
  for (const k of ks) {
    const fk = Object.keys(r).find(kk => String(kk).includes(k));
    if (fk && r[fk] != null && String(r[fk]) !== '') return r[fk];
  }
  return null;
}

const DYN = {
  id: 115, name: '明', english_name: 'Ming Dynasty',
  start_year: 1368, end_year: 1644,
  summary: '公元1368年朱元璋在应天府称帝建明，同年北伐攻克大都，元廷北遁。明初废丞相、设卫所，皇权空前集中；永乐迁都北京、七下西洋，国势鼎盛。中后期内阁与宦官交替弄权，边患、党争、财政危机交织，终在农民战争与清军入关的双重打击下于1644年覆亡。明代商品经济繁荣、小说戏曲与科技著述辈出，是中华文明走向近代的重要转折期。',
  capital: '应天（南京）、北京', population: '约一亿五千万（鼎盛）', duration: '约276年',
  representative_buildings: ['紫禁城', '明长城', '天坛', '明孝陵'],
  characteristics: { politics: 88, culture: 92, military: 85, technology: 90, openness: 70 }
};

// ---- 读取并过滤明朝数据 ----
const l1 = read('1级人物数据.xlsx').filter(r => String(col(r, '朝代')).includes('明'));
const l2 = read('2级人物数据.xlsx').filter(r => String(col(r, '朝代')).includes('明'));
const ev = read('事件数据.xlsx').filter(r => String(col(r, '朝代')).includes('明'));
const kw = read('朝代热力图.xlsx').filter(r => String(col(r, '朝代')).includes('明'));
const rel = read('人物关系表.xlsx');
const pev = read('人事关系表.xlsx');

// ---- 年份解析（世纪按初/前期/中期/中后期/后期取代表年）----
function parseYear(s) {
  if (!s || typeof s !== 'string') return null;
  const t = s.trim();
  let m = t.match(/约?公元前?(\d{1,4})(?:年|世纪)?/);
  if (m) return t.includes('世纪') ? -parseInt(m[1]) * 100 : -parseInt(m[1]);
  m = t.match(/约?(\d{1,2})世纪(初|前期|中叶|中期|中后期|后期|末)?/);
  if (m) {
    const base = (parseInt(m[1]) - 1) * 100;
    const off = { '初': 10, '前期': 20, '中叶': 50, '中期': 50, '中后期': 80, '后期': 80, '末': 90 }[m[2]] ?? 50;
    return base + off;
  }
  m = t.match(/约?(\d{1,4})年?/);
  if (m) return parseInt(m[1]);
  return null;
}
function pbd(b, d) {
  return { birth: (b && b !== '不详') ? parseYear(String(b)) : null, death: (d && d !== '不详') ? parseYear(String(d)) : null };
}
function imageUrl(name, type = 'person') {
  const size = type === 'person' ? 'portrait_3_4' : 'landscape_16_9';
  const phr = type === 'person' ? 'ancient chinese historical figure ' + name + ' traditional ink painting style portrait' : 'ancient chinese historical event ' + name + ' traditional ink painting style';
  return 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + encodeURIComponent(phr) + '&image_size=' + size;
}
function fmtYear(y) {
  if (y == null) return '';
  return y < 0 ? `前${Math.abs(y)}年` : `${y}年`;
}

// ============= 精准字典：明朝一级人物代表成果的专属 description（158 条） =============
// 约定：每条约 25-35 字、无年份、单行、完整句
const WORK_DESC_MAP = {
  // —— 朱元璋 ——
  '建立明朝': '推翻元朝统治，建立明朝，重建全国统一政权。',
  '废丞相制度': '废除中书省与丞相，政务分归六部，皇权高度集中。',
  '《大明律》': '主持编定《大明律》，确立明代法制的基本框架。',
  '卫所制度': '推行卫所制，寓兵于农，构建全国军事防御体系。',
  '恢复农业': '招抚流民、奖励垦荒，恢复战乱后的农业生产。',
  // —— 朱棣 ——
  '迁都北京': '将都城由南京迁往北京，重塑国家政治地理格局。',
  '《永乐大典》': '下令编纂大型类书，汇集保存历代典籍文献。',
  '郑和下西洋': '派遣庞大船队远航西洋，拓展明朝海外交往。',
  '北征蒙古': '五次亲征漠北，打击蒙古势力，巩固北部边疆。',
  // —— 朱高炽 ——
  '调整赋役': '减轻赋役负担，与民休息，缓和洪武以来的紧张。',
  '平反冤狱': '纠正前朝冤案，宽宥获罪官员，缓和政治气氛。',
  '恢复部分建文旧臣名誉': '为部分建文旧臣恢复名誉，调整永乐朝严苛政策。',
  // —— 朱瞻基 ——
  '稳定中央政局': '在皇位更替之际稳定中枢，维持朝政正常运转。',
  '整顿边防': '整饬北方边防，调整军事部署，巩固边疆安全。',
  '宣德官窑': '推动官窑瓷器生产，宣德青花成为一代工艺典范。',
  '行政整顿': '整顿官僚机构与行政流程，提高朝廷办事效率。',
  // —— 朱祁镇 ——
  '两度即位': '先后两次登上帝位，亲历明代皇位更替的动荡。',
  '复位': '通过夺门之变重登皇位，改元天顺，重掌朝政。',
  '废除宫妃殉葬': '临终下诏废除宫妃殉葬，终结一项残酷旧制。',
  // —— 朱祁钰 ——
  '京师防御': '土木之变后组织京师城防，击退瓦剌进攻。',
  '战后军政整顿': '整饬战败后的军政体系，重整北方防御力量。',
  // —— 朱见深 ——
  '恢复于谦名誉': '为于谦平反昭雪，恢复其名誉与身后礼遇。',
  '设立西厂': '设立西厂，强化特务侦缉，扩大宦官权力。',
  '整顿部分军政': '整饬部分军务与官员考核，维持边防运转。',
  // —— 朱祐樘 ——
  '整顿吏治': '整肃官僚队伍，惩治贪腐，改善官场风气。',
  '财政调整': '调整财政收支，节省开支，缓解府库压力。',
  '限制近侍干政': '约束宦官与近侍权力，防止内廷干预朝政。',
  // —— 朱厚照 ——
  '平定宁王之乱': '迅速平定宁王朱宸濠叛乱，维护中央权威。',
  '应州之战': '亲临应州督战，击退蒙古骑兵的进犯。',
  '正德时期政治调整': '调整朝廷人事与军事部署，应对内外变局。',
  // —— 朱厚熜 ——
  '调整礼制': '借大礼议重塑礼制，确立生父的皇考地位。',
  '嘉靖时期财政军政': '整顿财政与军务，应对边患和财政紧张。',
  '海防政策': '调整沿海防务与贸易管理，应对倭患加剧。',
  // —— 朱载坖 ——
  '隆庆和议': '与蒙古俺答达成封贡互市，缓和北部边患。',
  '月港开海': '开放福建月港出海贸易，调整海禁政策。',
  '调整边防政策': '调整北边防御与互市安排，稳定边境秩序。',
  // —— 朱翊钧 ——
  '考成法推行时期': '支持考成法推行，强化对官员政绩的考核。',
  '财政整顿': '整顿国家财政收支，缓解府库亏空压力。',
  '万历三大征': '主持宁夏、朝鲜、播州三役，维护边疆秩序。',
  // —— 朱常洛 ——
  '调整矿税': '罢除矿监税使，减轻民间负担，缓和矛盾。',
  '人事任命': '调整内阁与部院人事，起用被贬官员。',
  '泰昌新政': '即位后推行宽政，试图纠正万历朝积弊。',
  // —— 朱由校 ——
  '宫廷木作': '酷好木工营造，宫廷器作精巧，却疏于朝政。',
  '天启时期政治格局': '放任宦官势力扩张，形成内廷主导的政局。',
  '辽东军政': '调整辽东防务与军饷，应对后金崛起。',
  // —— 朱由检 ——
  '清除魏忠贤集团': '即位后迅速铲除魏忠贤势力，整顿内廷。',
  '调整军政人事': '频繁更换阁臣与督抚，试图重整军政。',
  '多次军事整顿': '多次整饬军务、加派军饷，应对内外战事。',
  // —— 朱由崧 ——
  '建立弘光政权': '在南京建立弘光政权，延续明朝宗室统治。',
  '南明初期政权整合尝试': '整合南明军政力量，试图守住江南半壁。',
  // —— 朱由榔 ——
  '维持南明政权': '辗转西南坚持抗清，维系永历政权十余年。',
  '联合西南抗清力量': '联合大西军余部与地方势力共同抗清。',
  // —— 徐达 ——
  '攻克大都': '率军北伐攻克大都，终结元朝在中原的统治。',
  '北伐中原': '统兵北伐，收复中原与华北广大地区。',
  '北方边防': '镇守北平，整饬边防，防御蒙古残余势力。',
  // —— 常遇春 ——
  '鄱阳湖之战': '在鄱阳湖决战中率军奋击，助朱元璋定大局。',
  '北伐': '随徐达北伐，为明军先锋，屡破元军。',
  '平定中原': '率军平定中原诸地，为明朝统一扫清障碍。',
  // —— 刘伯温（刘基）——
  '辅佐朱元璋': '为朱元璋筹划战略，参与谋划建国大计。',
  '《郁离子》': '著《郁离子》，以寓言讽刺时政、寄寓治道。',
  '诗文著述': '诗文古朴劲健，为明初文坛重要一家。',
  '参与明初政务': '参与明初制度设计与律令制定，多有建白。',
  // —— 于谦 ——
  '组织京师防御': '土木之变后主持京师防务，击退瓦剌大军。',
  '整顿军政': '整饬京营与边防军务，恢复明朝军事力量。',
  '《石灰吟》': '以《石灰吟》明志，清白气节传诵后世。',
  // —— 王阳明（王守仁）——
  '《传习录》': '门人辑录讲学语录为《传习录》，传心学宗旨。',
  '《大学问》': '著《大学问》，阐发万物一体与致良知之说。',
  '阳明心学': '创立心学体系，主张心即理、知行合一。',
  // —— 张居正 ——
  '考成法': '推行考成法，以事考人，提高行政执行效率。',
  '清丈土地': '主持清丈全国田亩，清理隐田，扩大税基。',
  '推动赋役改革': '推动一条鞭法，将赋役折银统一征收。',
  // —— 海瑞 ——
  '《治安疏》': '上《治安疏》直陈时弊，抨击皇帝怠政。',
  '地方治理': '任地方官时清丈田亩、兴修水利，政声卓著。',
  // —— 郑和 ——
  '七下西洋': '七次率船队远航西洋，抵达亚非三十余国。',
  '海外外交': '以册封赏赐开展外交，建立朝贡与邦交往来。',
  '海上航路': '开辟并巩固远洋航路，积累航海经验与图籍。',
  '海外贸易与交流': '促进丝绸瓷器外销与中外物产人员交流。',
  // —— 戚继光 ——
  '编练戚家军': '招募训练戚家军，纪律严明，屡破倭寇。',
  '创制练兵制度': '创制一套练兵与战阵制度，提升实战能力。',
  '整顿蓟镇防务': '镇守蓟镇，修整边墙、训练车营，巩固北防。',
  '编著《纪效新书》': '著《纪效新书》，总结练兵与抗倭实战经验。',
  '编著《练兵实纪》': '著《练兵实纪》，系统论述军队训练与管理。',
  // —— 俞大猷 ——
  '平定东南沿海倭患': '转战东南沿海，屡破倭寇，为抗倭主将。',
  '整顿地方军队': '整训地方军伍，改善装备与战法，提高战力。',
  '参与福建抗倭': '率军入闽作战，与戚继光协同平定倭患。',
  '编著《剑经》': '著《剑经》，总结棍法武艺与实战技法。',
  '撰有《正气堂集》': '著《正气堂集》，收录奏议、书札与兵法文章。',
  // —— 袁崇焕 ——
  '主持宁远防务': '主持宁远防务，凭坚城重炮击退后金进攻。',
  '加强辽东城防': '修筑宁远、锦州等城，构建关外防御体系。',
  '运用火器守城': '善用红夷大炮守城，以火器克制后金骑兵。',
  '整顿辽东军务': '整饬辽东军伍与粮饷，重建关外军事力量。',
  // —— 孙承宗 ——
  '主持辽东防务': '以辽东经略主持关外防务，统筹军政全局。',
  '推动关宁防线建设': '构筑关宁锦防线，层层设防以固守辽西。',
  '整顿边军': '整训边军、修整城堡，提升关外防御能力。',
  '培养和提拔边将': '举荐培养袁崇焕、祖大寿等边将，充实军伍。',
  // —— 李自成 ——
  '建立大顺政权': '在西安建立大顺政权，设置官制、整编军队。',
  '推翻明朝中央政权': '率军攻入北京，终结明朝中央统治。',
  '推动明末政治秩序崩溃': '连年征战与政权更迭，加速旧秩序瓦解。',
  // —— 张献忠 ——
  '建立大西政权': '在成都建立大西政权，控制四川大部。',
  '攻占成都': '率军攻占成都，据蜀中为反明抗清基地。',
  '组织西南军事政权': '编练军队、设置官署，经营西南一隅。',
  // —— 史可法 ——
  '主持扬州防务': '督师扬州，组织城防抵抗清军南下。',
  '组织南明军政': '统筹南明军务与粮饷，力图支撑江北防线。',
  '抵抗清军南下': '率部坚守扬州，城破殉国，气节彪炳。',
  // —— 郑成功 ——
  '组织海上抗清力量': '以金厦为基地，整合海上武装坚持抗清。',
  '收复台湾': '进军台湾，驱逐荷兰殖民者，收复宝岛。',
  '建立台湾郑氏政权': '在台湾设府县、兴屯垦，建立郑氏统治。',
  '发展海上贸易网络': '经营东亚海上贸易，积累抗清财力。',
  // —— 李时珍 ——
  '编纂《本草纲目》': '历时多年编成《本草纲目》，系统整理药物。',
  '整理药物分类': '按部类纲目重新归类药物，建立分类体系。',
  '校勘历代本草': '校订历代本草讹误，考订药名与产地。',
  '记录民间药物知识': '广采民间验方与药物知识，补前人之未备。',
  // —— 徐光启 ——
  '与利玛窦合译《几何原本》': '与利玛窦合译《几何原本》，引入西方几何学。',
  '编纂《农政全书》': '编成《农政全书》，汇集农业与水利知识。',
  '参与《崇祯历书》编修': '主持修订历法，引入西方天文计算方法。',
  '推动农业技术整理': '总结农事与荒政经验，推动实用技术传播。',
  // —— 宋应星 ——
  '编著《天工开物》': '著《天工开物》，系统记录农工生产技术。',
  '整理农业技术': '总结耕作、水利与农副产品加工技术。',
  '记录手工业生产流程': '详记纺织、制盐、造纸等工艺流程。',
  '总结矿冶与制造工艺': '记述采矿、冶炼与兵器制造的实际工艺。',
  // —— 徐霞客 ——
  '长期实地考察': '数十年跋涉山川，实地考察地理与地貌。',
  '记录岩溶地貌': '系统记录喀斯特溶洞与峰林地貌特征。',
  '考察西南山川水系': '深入西南考察江河源流与山脉走向。',
  '留下《徐霞客游记》': '留下日记体游记，兼具地理与文学价值。',
  // —— 汤显祖 ——
  '创作《牡丹亭》': '作《牡丹亭》，以情抗理，成为传奇巅峰。',
  '创作《紫钗记》': '作《紫钗记》，写霍小玉爱情，文辞婉丽。',
  '创作《邯郸记》': '作《邯郸记》，借黄粱梦讽刺功名富贵。',
  '创作《南柯记》': '作《南柯记》，以蚁国寓言寄寓世情。',
  '发展传奇戏曲表现': '拓展传奇体制与情感表达，影响后世戏曲。',
  // —— 吴承恩 ——
  '传统上归名《西游记》': '传统上被视为《西游记》作者，集成取经故事。',
  '发展神魔小说叙事': '推动神魔小说叙事成熟，想象奇诡、结构宏阔。',
  '塑造孙悟空等经典形象': '塑造孙悟空等形象，寄寓反抗与自由精神。',
  // —— 董其昌 ——
  '创作山水画': '山水画取法宋元，笔墨秀润，自成一格。',
  '发展书法风格': '书法秀润生拙，自成一家，影响清代书坛。',
  '提出书画理论': '倡“南北宗论”，以禅喻画，影响画史观念。',
  '收藏与鉴赏古代书画': '精于鉴藏，梳理古代书画谱系与品评标准。',
  // —— 唐寅 ——
  '创作人物画': '人物画工细生动，仕女题材尤为传神。',
  '诗文创作': '诗文才情纵逸，与祝允明等并称吴中才子。',
  '发展吴门文人艺术': '推动吴门文人书画与诗文的融合与传播。',
  // —— 魏忠贤 ——
  '掌控司礼监与东厂权力网络': '把持司礼监与东厂，控制票拟与侦缉大权。',
  '形成以个人为核心的政治派系': '结党营私，形成遍及内外廷的阉党集团。',
  '推动宫廷与外廷权力冲突': '干预朝政、打击东林，激化宫廷与士林冲突。',
  // —— 严嵩 ——
  '长期掌握内阁权力': '久居内阁首辅，把持票拟，长期专擅朝政。',
  '建立严氏政治网络': '援引亲信、排除异己，形成严氏一门的政治网络。',
  '参与嘉靖朝政务运作': '迎合皇帝意旨处理政务，影响嘉靖朝政局走向。',
  // —— 黄宗羲 ——
  '著《明夷待访录》': '著《明夷待访录》，批判君主专制，倡天下为主。',
  '编纂《明儒学案》': '编纂《明儒学案》，系统梳理明代学术流派。',
  '整理浙东学术': '整理浙东学术脉络，开创清代浙东史学传统。',
  '发展经史研究': '以经史互证治学，推动实学与史学发展。',
  // —— 顾炎武 ——
  '著《日知录》': '著《日知录》，以札记考据贯通经史与治道。',
  '编纂《天下郡国利病书》': '编纂《天下郡国利病书》，辑录各地地理利弊。',
  '研究音韵': '精研音韵之学，考订古音，开清代朴学先河。',
  '整理经史地理资料': '广辑方志与地理资料，为经世致用提供依据。',
};

function genWorkDesc(name) {
  if (!name) return '';
  const n = name.trim();
  if (WORK_DESC_MAP[n]) return WORK_DESC_MAP[n];
  if (n.includes('经') || n.includes('历')) return '古代天文历法领域的重要成就或典籍。';
  if (n.includes('史') || n.includes('书')) return '历史编纂或文献整理领域的重要工作。';
  if (n.includes('治') || n.includes('法') || n.includes('政')) return '与政治治理、制度改革相关的重要举措。';
  if (n.includes('战') || n.includes('军')) return '军事领域的重要行动或成果。';
  if (n.includes('水') || n.includes('河')) return '水利工程或治理河患方面的重要工作。';
  if (n.includes('科') || n.includes('考')) return '科举或教育文化领域的重要事件。';
  if (n.includes('画') || n.includes('书') || n.includes('诗') || n.includes('曲')) return '文学艺术领域的重要成就。';
  if (n.includes('贸') || n.includes('商') || n.includes('海')) return '商业贸易或对外交流领域的重要活动。';
  return n + '是其人生中的重要成就之一。';
}
function parseLaterQuotes(raw) {
  if (!raw) return [];
  const s = String(raw);
  const out = [];
  s.split(/[；;]/).forEach(seg => {
    seg = seg.trim();
    if (!seg) return;
    let m = seg.match(/[“「"]([^”」"]{2,})[”」"]\s*(?:——|—|–|-)\s*(《[^》]{1,40}》|[^《》]{1,40})?/);
    if (m && m[1]) {
      const text = m[1].trim();
      let author = (m[2] || '').trim();
      author = author.replace(/^——?/, '').trim();
      if (author && author.length > 30) author = author.slice(0, 30);
      if (!author) author = '史评';
      out.push({ text, author });
      return;
    }
    m = seg.match(/^(.{2,30}?)\s*(?:——|—|–|-)\s*(《[^》]{1,40}》|[^《》]{1,40})?$/);
    if (m && m[1]) {
      out.push({ text: m[1].trim(), author: ((m[2] || '').replace(/^——?/, '').trim()) || '史评' });
    }
  });
  return out;
}

// ---- 庙号/称号别名归并（称号列已自动登记，此处补齐常用异名）----
const ALIAS_MAP_115 = {
  '洪武帝': '朱元璋', '永乐帝': '朱棣', '洪熙帝': '朱高炽', '宣德帝': '朱瞻基',
  '正统帝': '朱祁镇', '天顺帝': '朱祁镇', '景泰帝': '朱祁钰', '成化帝': '朱见深',
  '弘治帝': '朱祐樘', '正德帝': '朱厚照', '嘉靖帝': '朱厚熜', '隆庆帝': '朱载坖',
  '万历帝': '朱翊钧', '泰昌帝': '朱常洛', '天启帝': '朱由校', '崇祯帝': '朱由检',
  '弘光帝': '朱由崧', '永历帝': '朱由榔',
  '刘基': '刘伯温', '王守仁': '王阳明',
  '明太祖': '朱元璋', '明成祖': '朱棣', '明仁宗': '朱高炽', '明宣宗': '朱瞻基',
  '明英宗': '朱祁镇', '明代宗': '朱祁钰', '明宪宗': '朱见深', '明孝宗': '朱祐樘',
  '明武宗': '朱厚照', '明世宗': '朱厚熜', '明穆宗': '朱载坖', '明神宗': '朱翊钧',
  '明光宗': '朱常洛', '明熹宗': '朱由校', '明思宗': '朱由检'
};

// ---- 二级人物分类（105人，Excel 无类型列，按史实归类）----
const L2_CAT_MAP_115 = {
  // 统治者（皇室成员）
  '马皇后': '统治者', '孙太后': '统治者', '钱皇后': '统治者',
  // 军事人物
  '李文忠': '军事人物', '冯胜': '军事人物', '邓愈': '军事人物', '汤和': '军事人物',
  '沐英': '军事人物', '傅友德': '军事人物', '蓝玉': '军事人物', '张辅': '军事人物',
  '朱能': '军事人物', '丘福': '军事人物', '石亨': '军事人物', '曹吉祥': '军事人物',
  '王骥': '军事人物', '胡宗宪': '军事人物', '谭纶': '军事人物', '孙传庭': '军事人物',
  '卢象升': '军事人物', '毛文龙': '军事人物', '祖大寿': '军事人物', '洪承畴': '军事人物',
  '吴三桂': '军事人物', '李定国': '军事人物', '张煌言': '军事人物', '郑芝龙': '军事人物',
  '高迎祥': '军事人物', '罗汝才': '军事人物', '刘宗敏': '军事人物', '孙可望': '军事人物',
  '阎应元': '军事人物', '王景弘': '军事人物',
  // 政治人物
  '李善长': '政治人物', '胡惟庸': '政治人物', '朱升': '政治人物', '陶安': '政治人物',
  '叶琛': '政治人物', '姚广孝': '政治人物', '解缙': '政治人物', '杨士奇': '政治人物',
  '杨荣': '政治人物', '杨溥': '政治人物', '蹇义': '政治人物', '夏原吉': '政治人物',
  '陈诚': '政治人物', '金幼孜': '政治人物', '胡濙': '政治人物', '王振': '政治人物',
  '杨善': '政治人物', '李贤': '政治人物', '商辂': '政治人物', '马文升': '政治人物',
  '刘大夏': '政治人物', '刘健': '政治人物', '谢迁': '政治人物', '杨廷和': '政治人物',
  '汪直': '政治人物', '徐阶': '政治人物', '高拱': '政治人物', '申时行': '政治人物',
  '李春芳': '政治人物', '王锡爵': '政治人物', '严世蕃': '政治人物', '瞿式耜': '政治人物',
  // 思想人物
  '王艮': '思想人物', '王畿': '思想人物', '钱德洪': '思想人物', '徐爱': '思想人物',
  '湛若水': '思想人物', '邹守益': '思想人物', '聂豹': '思想人物', '罗洪先': '思想人物',
  '李贽': '思想人物', '顾宪成': '思想人物', '高攀龙': '思想人物', '方孝孺': '思想人物',
  '黄道周': '思想人物', '王夫之': '思想人物', '方以智': '思想人物',
  // 文化人物
  '李东阳': '文化人物', '王世贞': '文化人物', '李攀龙': '文化人物', '徐渭': '文化人物',
  '文徵明': '文化人物', '仇英': '文化人物', '冯梦龙': '文化人物', '凌濛初': '文化人物',
  '袁宏道': '文化人物', '袁宗道': '文化人物', '袁中道': '文化人物', '罗贯中': '文化人物',
  '施耐庵': '文化人物', '陈洪绶': '文化人物', '唐顺之': '文化人物', '陈子龙': '文化人物',
  '夏完淳': '文化人物', '柳如是': '文化人物', '钱谦益': '文化人物', '张岱': '文化人物',
  '马欢': '文化人物',
  // 科技人物
  '潘季驯': '科技人物', '李之藻': '科技人物', '吴又可': '科技人物', '陈实功': '科技人物'
};
const DEFAULT_L2_CAT = '政治人物';

const CAT_MAP = { '思想家': '思想人物', '思想家/政治家': '思想人物', '君主': '统治者', '皇帝': '统治者', '帝王': '统治者', '军事家': '军事人物', '军事家/政治家': '军事人物', '外交家': '政治人物', '改革家': '政治人物', '政治家': '政治人物', '文学家': '文化人物', '文学家/政治家': '文化人物', '史学家': '文化人物', '科学家': '科技人物', '医学家': '科技人物', '工程师': '科技人物', '发明家': '科技人物' };

const persons = [];
const nameToId = {};
const l1Persons = [];
const aliasMap = {};
const addAlias = (a, c) => { if (a && String(a).trim()) aliasMap[String(a).trim()] = c; };

let i1 = 1;
for (const r of l1) {
  const rawName = String(col(r, '姓名')).trim();
  const pm = rawName.match(/^(.+?)（(.+?)）$/);
  const name = pm ? pm[1].trim() : rawName;
  const id = 115000 + i1++;
  nameToId[name] = id;
  addAlias(name, name);
  if (pm) { addAlias(pm[1], name); addAlias(pm[2], name); }
  (String(col(r, '称号') || '') || '').split(/[；;]/).forEach(a => addAlias(a, name));
  const { birth, death } = pbd(col(r, '生年'), col(r, '卒年'));
  const rawCat = String(col(r, '人物类型') || '政治人物').trim();
  const cat = CAT_MAP[rawCat] || rawCat || '政治人物';
  const influence = Number(col(r, '历史影响力')) || 80;
  const impactRaw = col(r, '影响力描述');
  const impactList = impactRaw
    ? String(impactRaw).split(/[；;]/).map(s => s.trim()).filter(Boolean)
    : [];
  const worksRaw = (() => { const fk = Object.keys(r).find(k => String(k).startsWith('代表成果')); return fk ? String(r[fk] || '') : ''; })();
  const works = worksRaw
    ? worksRaw.split(/[，,；;、\n]/).filter(Boolean).map(n => {
        const wn = n.trim();
        return { name: wn, description: genWorkDesc(wn) };
      }).slice(0, 5)
    : [];
  let life = [];
  const lifeRaw = col(r, '人生时间轴');
  if (lifeRaw) {
    try {
      const arr = JSON.parse(String(lifeRaw).trim());
      if (Array.isArray(arr)) {
        life = arr.map(x => ({
          year: parseYear(String(x.year || '')),
          title: String(x.title || '').trim(),
          description: String(x.description || '').trim(),
          importance: Number(x.importance) || 5
        }));
      }
    } catch (e) {}
  }
  if (!life.length) {
    let y = birth || death || 1450;
    const storyRaw = col(r, '代表事件');
    const items = storyRaw ? String(storyRaw).split(/[，,；;、]/) : [];
    life = items.filter(Boolean).slice(0, 4).map((t, k) => ({ year: y + k, title: t.trim(), description: name + '人生重要节点：' + t.trim(), importance: 8 }));
  }
  const dimDefaults = {
    '统治者': [95, 88, 92], '政治人物': [88, 85, 80], '军事人物': [88, 82, 75],
    '文化人物': [82, 78, 88], '思想人物': [82, 76, 90], '科技人物': [88, 80, 90]
  };
  const dd = dimDefaults[cat] || [85, 80, 80];
  const tags = col(r, '人物标签') ? String(col(r, '人物标签')).split(/[；;、/\n]/).map(s => s.trim()).filter(Boolean).slice(0, 5) : [];
  const p = {
    id, name, dynasty: '明',
    summary: String(col(r, '人物简介') || '').trim() || String(col(r, '历史地位') || '').trim(),
    historical_position: String(col(r, '历史地位') || '').trim(),
    achievement: (() => { const a = String(col(r, '称号') || '').trim(); return (a && a !== name) ? a : ''; })(),
    impact_list: impactList,
    later_quotes: parseLaterQuotes(col(r, '后人评价')),
    tags,
    image_url: imageUrl(name), birth_year: birth, death_year: death,
    category: cat, level: 1,
    birth_place: col(r, '出生地') ? String(col(r, '出生地')) : null,
    occupations: col(r, '身份') ? String(col(r, '身份')).split(/[，,；;]/).filter(Boolean) : [],
    works, related_people: [], life_events: life, related_events: [],
    influence,
    dimension_scores: { historical_influence: influence, relation_activity: Number(col(r, '关系活跃度')) || dd[1], professional_1: Number(col(r, '专业维度①')) || dd[0], professional_2: Number(col(r, '专业维度②')) || dd[2], professional_3: Number(col(r, '专业维度③')) || dd[2] },
    narrative_relations: { nodes: [], edges: [] }
  };
  l1Persons.push(p);
  persons.push(p);
}
Object.entries(ALIAS_MAP_115).forEach(([a, c]) => { if (nameToId[c]) addAlias(a, c); });

// --- 二级人物 ---
const l2Persons = [];
let i2 = 1;
for (const r of l2) {
  const name = String(col(r, '姓名')).trim();
  if (nameToId[name]) continue;
  const id = 115100 + i2++;
  nameToId[name] = id;
  addAlias(name, name);
  const storyContent = String(col(r, '故事内容') || '').trim();
  const storyTitle = String(col(r, '故事标题') || '').trim();
  const summary = (storyTitle && storyTitle.length >= 3)
    ? `${name}是明朝时期的历史人物，其重要事迹为「${storyTitle}」，从侧面展现了这一时期的历史风貌。`
    : `${name}是明朝时期的历史人物，其事迹载于史籍文献，从侧面展现了这一时期的历史风貌。`;
  const cat = L2_CAT_MAP_115[name] || DEFAULT_L2_CAT;
  const p = {
    id, name, dynasty: '明',
    summary,
    image_url: imageUrl(name),
    birth_year: null, death_year: null,
    category: cat, level: 2,
    birth_place: null,
    occupations: [],
    works: [], related_people: [], life_events: [], related_events: [],
    influence: 60,
    dimension_scores: { historical_influence: 60, relation_activity: 55, professional_1: 55, professional_2: 55, professional_3: 55 },
    story: { title: storyTitle, content: storyContent, image_url: imageUrl(name) },
    narrative_relations: { nodes: [], edges: [] }
  };
  l2Persons.push(p);
  persons.push(p);
}

// ---- 事件 (id 1153xx) ----
const events = [];
let e1 = 1;
const TYPE_MAP = { '战争军事': '战争军事', '政治制度': '政治事件', '政治': '政治事件', '外交交流': '外交', '外交': '外交', '对外交流': '外交', '经济贸易': '经济', '经济': '经济', '思想教育': '思想文化', '思想文化': '思想文化', '文化艺术': '文化艺术', '文化': '文化艺术', '科技发明': '科技发明', '科技': '科技发明', '自然灾害': '自然灾害' };
for (const r of ev) {
  const id = 115300 + e1++;
  const name = String(col(r, '事件名称'));
  const y = parseYear(String(col(r, '发生时间') || '')) || 1368;
  const bg = {};
  for (const [k, v] of [['政治背景', 'political'], ['经济背景', 'economic'], ['社会背景', 'social'], ['文化背景', 'cultural'], ['地理背景', 'geographic']]) {
    const x = col(r, k); if (x) bg[v] = String(x);
  }
  const significance = String(col(r, '历史影响') || '').trim();
  const rawType = String(col(r, '类型') || '').trim();
  const etype = TYPE_MAP[rawType] || '政治事件';
  const impacts = [];
  for (const [colKey, nameKey] of [['政治影响', '政治影响'], ['社会影响', '社会影响'], ['文化影响', '文化影响'], ['历史影响', '历史影响']]) {
    const fk = Object.keys(r).find(kk => String(kk).trim() === colKey);
    const v = fk ? r[fk] : null;
    if (v != null && !isNaN(Number(v))) impacts.push({ name: nameKey, score: Number(v) });
  }
  const summaryText = String(col(r, '简介') || '').trim();
  const osFirst = significance ? String(significance).split(/。/)[0].trim() : '';
  const one_sentence = (osFirst && osFirst.length >= 8 && osFirst !== summaryText)
    ? osFirst
    : `「${name}」作为明朝时期重要的${etype}事件，深刻影响了当时的政治格局，是理解这段历史的关键节点。`;
  events.push({
    id, name, dynasty: '明',
    start_year: y, end_year: y,
    summary: summaryText,
    event_type: etype,
    related_persons: [],
    significance,
    image_url: imageUrl(name, 'event'),
    one_sentence,
    person_groups: { leaders: [], participants: [], opponents: [], affected: [] },
    narratives: [], background: bg, impacts, chain: [], related_events: [], person_relations: []
  });
}

// ---- 关系归一化：Excel 36 种描述性标签 → 基础关系（对齐表头 7 类 + 同僚/交流）----
const REL_MAP_115 = {
  '君臣': '君臣', '亲属': '亲属', '继承': '继承', '敌对': '敌对', '盟友': '盟友',
  '师生': '师生', '同门': '师生', '政治继任': '继承', '政治冲突': '敌对',
  '影响': '影响', '学术影响': '影响', '文学影响': '影响', '艺术影响': '影响', '思想影响': '影响',
  '医学传统': '影响', '文学传统': '影响', '政治提携': '影响',
  '交流': '交流', '学术交流': '交流', '学术交往': '交流', '文学交往': '交流', '文坛交往': '交流',
  '文艺交往': '交流', '思想呼应': '交流', '同代文人': '交流',
  '同僚': '同僚', '政治同僚': '同僚', '军事同僚': '同僚', '幕僚': '同僚', '军事文书合作': '同僚',
  '政治合作': '盟友', '政治盟友': '盟友', '军事合作': '盟友', '军事盟友': '盟友',
  '文坛盟友': '盟友', '抗清盟友': '盟友', '学术盟友': '盟友', '抗清志士': '盟友'
};
const REL_PRIO_115 = { '亲属': 9, '父子': 9, '母子': 9, '夫妻': 9, '兄弟': 9, '祖孙': 9, '叔侄': 9, '舅甥': 9, '堂兄弟': 9, '姻亲': 9, '义父子': 9, '君臣': 9, '师生': 8, '继承': 8, '敌对': 7, '盟友': 6, '交流': 5, '影响': 4, '同僚': 3 };
// 源表把亲属类都标成「亲属」，这里按人物对还原具体关系；未列出的亲属对保留「亲属」
const KIN_DETAIL_RAW = {
  '朱元璋|朱棣': '父子', '朱元璋|马皇后': '夫妻', '朱元璋|李文忠': '舅甥',
  '朱高炽|朱棣': '父子', '朱瞻基|朱高炽': '父子',
  '朱祁镇|朱祁钰': '兄弟', '朱祁镇|孙太后': '母子', '朱祁钰|孙太后': '母子',
  '朱见深|朱祁镇': '父子', '朱祐樘|朱见深': '父子', '朱厚照|朱祐樘': '父子',
  '朱厚熜|朱厚照': '堂兄弟', '朱载坖|朱厚熜': '父子', '朱翊钧|朱载坖': '父子',
  '朱常洛|朱翊钧': '父子', '朱常洛|朱由检': '父子', '朱由校|朱常洛': '父子',
  '朱由检|朱由校': '兄弟', '朱由崧|朱由检': '堂兄弟', '朱由榔|朱由崧': '堂兄弟',
  '李文忠|徐达': '姻亲', '郑成功|郑芝龙': '父子', '严嵩|严世蕃': '父子',
  '朱元璋|沐英': '义父子', '沐英|马皇后': '母子', '常遇春|蓝玉': '姻亲',
  '朱棣|马皇后': '母子', '李文忠|马皇后': '舅甥', '孙太后|朱见深': '祖孙',
  '朱祁镇|钱皇后': '夫妻', '朱见深|钱皇后': '母子',
  '袁宏道|袁宗道': '兄弟', '袁宏道|袁中道': '兄弟', '袁宗道|袁中道': '兄弟',
  '吴三桂|祖大寿': '舅甥', '柳如是|钱谦益': '夫妻'
};
// 关系对键统一按字符序排列，避免「朱棣|朱高炽」与「朱高炽|朱棣」查不到
const KIN_DETAIL_115 = {};
Object.entries(KIN_DETAIL_RAW).forEach(([k, v]) => {
  KIN_DETAIL_115[k.split('|').sort().join('|')] = v;
});
const UNKNOWN_REL = new Set();
let FLOW_ONLY = 0;

function canon(n) { return aliasMap[n] || n; }
function personByName(n) {
  return persons.find(p => p.name === n) || persons.find(p => p.name === (aliasMap[n] || ''));
}
// 每一条有向记录都保留：A→B 与 B→A 视为两条数据
const pairBest = new Map();
for (const r of rel) {
  const a = canon(String(col(r, '起点人物') || '').trim());
  const b = canon(String(col(r, '终点人物') || '').trim());
  if (!a || !b || a === b) continue;
  if (!personByName(a) || !personByName(b)) continue;
  const raw = String(col(r, '关系类型') || '').trim();
  // 关系类型为空的行是「用途=因缘际会」的辅助记录，只用于因缘际会图谱，不进人物关系
  if (!raw) { FLOW_ONLY++; continue; }
  let type = REL_MAP_115[raw];
  if (!type) { UNKNOWN_REL.add(raw); continue; }
  if (type === '亲属') type = KIN_DETAIL_115[[a, b].sort().join('|')] || type;
  const key = `${a}|${b}`;
  const prev = pairBest.get(key);
  if (!prev || (REL_PRIO_115[type] || 0) > (REL_PRIO_115[prev.type] || 0)) {
    pairBest.set(key, { a, b, type, desc: String(col(r, '关系说明') || '').trim() });
  }
}
// 人物详情页按「本人-对端人物」去重，保留优先级最高的关系，避免同一人重复出现
const relatedMap = new Map();
function addRelated(from, to, type, desc) {
  if (!relatedMap.has(from)) relatedMap.set(from, new Map());
  const m = relatedMap.get(from);
  const prev = m.get(to);
  if (!prev || (REL_PRIO_115[type] || 0) > (REL_PRIO_115[prev.relation] || 0)) {
    m.set(to, { name: to, relation: type, influence: 75, desc });
  }
}
for (const { a, b, type, desc } of pairBest.values()) {
  addRelated(a, b, type, desc);
  addRelated(b, a, type, desc);
}
// 按关系强度排序后截断，避免重要关系被尾部丢弃
persons.forEach(p => {
  const m = relatedMap.get(p.name);
  p.related_people = (m ? [...m.values()] : [])
    .sort((x, y) => (REL_PRIO_115[y.relation] || 0) - (REL_PRIO_115[x.relation] || 0))
    .slice(0, 10);
});

// ---- 关键人物角色分类 ----
function classifyRole(role) {
  const s = role || '';
  const OPPO = ['失败', '对立', '对抗', '反对', '挑战', '复仇对象', '竞争', '被消灭', '对手', '敌对', '敌', '讨伐对象', '征讨对象', '征伐对象', '落败', '竞争者', '叛乱', '被伐', '对抗方', '敌对者'];
  const AFF = ['被杀', '被弑', '被刺', '被俘', '被架空', '被救', '被驱逐', '失势', '末代君主', '逃亡', '受封', '被取代', '前任', '隐士', '被记史', '受害者', '被废', '受影响'];
  const LEAD = ['主导', '胜利', '盟主', '主角', '君主', '统帅', '主将', '主谋', '谋划', '军政谋划', '执行', '推动', '主持', '提出', '复国功臣', '功臣', '中兴', '创立', '组织', '元帅', '国君', '霸主', '变法者', '改革者', '支持', '完成', '联合者', '联盟者', '三家之一', '代表', '领导'];
  if (OPPO.some(k => s.includes(k))) return 'opponents';
  if (AFF.some(k => s.includes(k))) return 'affected';
  if (LEAD.some(k => s.includes(k))) return 'leaders';
  return 'participants';
}
for (const r of pev) {
  const eName = col(r, '事件'), pName = col(r, '人物');
  const e = events.find(x => x.name === eName); if (!e) continue;
  const p = personByName(pName);
  const name = p ? p.name : canon(String(pName));
  const role = String(col(r, '人事关系类型'));
  const g = classifyRole(role);
  if (!e.person_groups[g].find(x => x.name === name)) e.person_groups[g].push(p ? { name, role } : { name, role, cross_dynasty: '待接入' });
  if (p) { if (!p.related_events.find(x => x.name === eName)) p.related_events.push({ name: eName, role }); }
}

// ---- event.person_relations ----
for (const e of events) {
  const names = new Set();
  Object.values(e.person_groups).forEach(arr => arr.forEach(x => names.add(x.name)));
  const findPersonId = n => personByName(n)?.id;
  const rels = [];
  const seenPair = new Set();
  for (const { a, b, type, desc } of pairBest.values()) {
    if (names.has(a) && names.has(b)) {
      const key = `${a}|${b}`;
      if (seenPair.has(key)) continue;
      seenPair.add(key);
      rels.push({ source: a, target: b, type, desc, sourceId: findPersonId(a), targetId: findPersonId(b) });
    }
  }
  e.person_relations = rels.slice(0, 8);
}

// ---- 事件经过（初版占位，由 fix_115_content.js 全部手写覆盖）----
function buildNarratives(evObj) {
  const summary = evObj.summary;
  if (!summary) return [];
  const sents = summary.split(/[。；]/).map(s => s.trim()).filter(Boolean).slice(0, 6);
  if (sents.length === 0) return [];
  const y = evObj.start_year;
  const tags = ['起因', '经过', '转折', '结果'];
  return sents.map((s, i) => ({
    year: y,
    tag: tags[i % tags.length],
    title: s.split(/[，,。；;、]/)[0].trim().slice(0, 6).replace(/[，。；、,.:：！?？]+$/, '') || '史事始末',
    description: s
  }));
}
events.forEach(e => { e.narratives = buildNarratives(e); });

// ---- 历史脉络 ----
{
  const eventPersonMap = new Map();
  for (const e of events) {
    const set = new Set();
    Object.values(e.person_groups).forEach(arr => (arr || []).forEach(x => set.add(x.name)));
    eventPersonMap.set(e.id, set);
  }
  const yearOf = id => events.find(e => e.id === id).start_year;
  const fmt = id => fmtYear(yearOf(id));
  for (const e of events) {
    const myNames = eventPersonMap.get(e.id);
    let causes = [], conses = [];
    for (const other of events) {
      if (other.id === e.id) continue;
      const shared = [...myNames].filter(n => eventPersonMap.get(other.id).has(n)).length;
      if (shared === 0) continue;
      if (other.start_year < e.start_year) causes.push({ id: other.id, shared });
      else if (other.start_year > e.start_year) conses.push({ id: other.id, shared });
    }
    causes.sort((a, b) => b.shared - a.shared || b.id - a.id || 0);
    conses.sort((a, b) => b.shared - a.shared || a.id - b.id || 0);
    let chain = [];
    causes.slice(0, 1).forEach(c => chain.push({ type: 'cause', title: c.id, year: fmt(c.id) }));
    chain.push({ type: 'event', title: e.id, year: fmt(e.id) });
    conses.slice(0, 2).forEach(c => chain.push({ type: 'consequence', title: c.id, year: fmt(c.id) }));
    if (causes.length === 0 || conses.length === 0) {
      const sorted = events.map(x => x.id).filter(id => id !== e.id).sort((a, b) => yearOf(a) - yearOf(b));
      const before = sorted.filter(id => yearOf(id) < e.start_year).pop();
      const after = sorted.filter(id => yearOf(id) > e.start_year)[0];
      chain = [];
      if (before) chain.push({ type: 'cause', title: before, year: fmt(before) });
      chain.push({ type: 'event', title: e.id, year: fmt(e.id) });
      if (after) chain.push({ type: 'consequence', title: after, year: fmt(after) });
      if (sorted.length === 0) chain = [{ type: 'event', title: e.name, year: fmt(e.id) }];
    }
    chain.forEach(c => { c.title = events.find(x => x.id === c.title)?.name || c.title; });
    e.chain = chain;
    if (e.chain.length === 0) e.chain = [{ type: 'event', title: e.name, year: fmt(e.id) }];
  }
}

// ---- 贡献富化（仅兜底：只在名称与事件完全一致时用事件简介）----
{
  const evByName = {};
  events.forEach(e => { evByName[e.name] = e; });
  for (const p of l1Persons) {
    (p.works || []).forEach(w => {
      if (w.description && !w.description.includes('是其人生中的重要成就')) return;
      const matched = evByName[w.name];
      w.description = matched && matched.summary ? matched.summary : `系${p.name}在明时期的重要建树。`;
    });
  }
}

// ---- 关键词 ----
const KC = { '时代印象': 'era', '历史概念': 'event', '政治改革': 'civilization', '历史事件': 'event', '政治理念': 'civilization', '外交制度': 'civilization', '人物': 'person', '人物故事': 'person', '历史典故': 'event', '思想文化': 'civilization', '政治格局': 'era', '战争': 'event', '制度文化': 'civilization', '科技发明': 'civilization', '核心人物': 'person', '文明制度': 'civilization', '文化地理': 'geo' };
const keywords = kw.map(r => ({ name: String(col(r, '关键词')), value: Number(col(r, '权重（100）')) || 50, category: KC[String(col(r, '类别'))] || 'era', desc: String(col(r, '关键词')) + '是明朝时期的重要概念。' }));

// ---- 写文件 ----
const out = { dynasty: DYN, persons, events, keywords, _meta: { imported_at: new Date().toISOString(), stats: { persons: persons.length, level1: persons.filter(p => p.level === 1).length, level2: persons.filter(p => p.level === 2).length, events: events.length, keywords: keywords.length } } };
const target = path.join(dir, 'frontend/public/data/dynasty_115.json');
fs.writeFileSync(target, JSON.stringify(out, null, 2), 'utf-8');

console.log('dynasty_115.json 生成完成');
console.log('  人物: ' + persons.length + ' (一级 ' + persons.filter(p => p.level === 1).length + ', 二级 ' + persons.filter(p => p.level === 2).length + ')');
console.log('  事件: ' + events.length);
console.log('  关键词: ' + keywords.length);
console.log('  有向关系记录: ' + pairBest.size + '；因缘际会专用记录(跳过): ' + FLOW_ONLY);
if (UNKNOWN_REL.size) console.log('  [注意] 未映射关系标签: ' + [...UNKNOWN_REL].join('、'));

if (fs.existsSync(path.join(__dirname, 'fix_115_content.js'))) {
  console.log('\n--- 运行内容精修 fix_115_content.js ---');
  require('./fix_115_content.js');
}
if (fs.existsSync(path.join(__dirname, 'fix_115_stories.js'))) {
  console.log('\n--- 运行二级人物故事精修 fix_115_stories.js ---');
  require('./fix_115_stories.js');
}
if (fs.existsSync(path.join(__dirname, 'fix_115_summaries.js'))) {
  console.log('\n--- 运行二级人物简介精修 fix_115_summaries.js ---');
  require('./fix_115_summaries.js');
}
if (fs.existsSync(path.join(__dirname, 'enrich_115_relations.js'))) {
  console.log('\n--- 运行数据丰富 enrich_115_relations.js ---');
  require('./enrich_115_relations.js');
}
