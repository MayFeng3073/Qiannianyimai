// 民国数据导入脚本：从 Excel 生成 frontend/public/data/dynasty_117.json
// 结构对齐 import-116.js（清朝），改朝代配置 / ID 前缀 / 关系表 / 区间年份解析
// 用法：node scripts/import-117.js
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
  id: 117, name: '民国', english_name: 'Republic of China',
  start_year: 1912, end_year: 1949,
  summary: '公元1912年中华民国建立，结束两千余年帝制，共和观念自此深入人心。北洋军阀割据混战，国民革命与南京国民政府相继而起，新文化运动与五四运动推动思想启蒙。1937年全面抗战爆发，全民御侮八年；1945年抗战胜利后内战再起，1949年国民党政权退守台湾，中国进入新的历史阶段。',
  capital: '南京', population: '约四亿五千万', duration: '约38年',
  representative_buildings: ['中山陵', '总统府', '中央博物院'],
  characteristics: { politics: 68, culture: 88, military: 82, technology: 74, openness: 72 }
};

// ---- 读取并过滤民国数据 ----
const minguo = r => String(col(r, '朝代')).includes('民国');
const l1 = read('1级人物数据.xlsx').filter(minguo);
const l2 = read('2级人物数据.xlsx').filter(minguo);
const ev = read('事件数据.xlsx').filter(minguo);
const kw = read('朝代热力图.xlsx').filter(minguo);
const rel = read('人物关系表.xlsx').filter(minguo);
const pev = read('人事关系表.xlsx').filter(minguo);

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
// 民国事件常含区间：1915—1916年 / 1922年、1924年 / 1920—1930年代 / 1923年起
function parseRange(s) {
  const t = String(s || '').trim();
  const years = (t.match(/\d{4}/g) || []).map(Number);
  if (!years.length) { const y = parseYear(t); return { start: y, end: y }; }
  const start = years[0];
  let end = years[years.length - 1];
  if (t.includes('年代')) end = start + 9;
  return { start, end };
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
// 代表成果按「，；」切分，但引号内的逗号不切（如「思想自由，兼容并包」）
function splitWorks(s) {
  const out = [];
  let buf = '', quote = null;
  for (const ch of String(s)) {
    if ('“”"「」'.includes(ch)) { quote = quote ? null : ch; buf += ch; continue; }
    if (!quote && '，,；;\n'.includes(ch)) { if (buf.trim()) out.push(buf.trim()); buf = ''; continue; }
    buf += ch;
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

// ============= 精准字典：民国一级人物代表成果的专属 description =============
const WORK_DESC_MAP_117 = {
  // —— 袁世凯 ——
  '编练新建陆军': '在小站编练新式陆军，奠定北洋军事集团基础。',
  '逼清帝退位': '迫使清帝逊位，结束两千余年帝制。',
  '就任大总统': '出任中华民国首任正式大总统，权力集中于中央。',
  '颁布《中华民国约法》': '颁布新约法，扩大总统权力并削弱议会。',
  // —— 孙中山 ——
  '创立兴中会': '创建近代首个革命团体，首倡推翻清朝。',
  '成立同盟会': '联合各革命团体成立同盟会，统一革命力量。',
  '提出三民主义': '提出民族、民权、民生三大主张。',
  '领导辛亥革命': '领导辛亥革命，推翻清朝、缔造民国。',
  '著《建国方略》': '著《建国方略》，规划国家建设蓝图。',
  // —— 段祺瑞 ——
  '辅佐创建北洋军': '参与北洋新军编练，成为北洋骨干将领。',
  '推动清帝退位': '领衔通电逼清帝退位，促成共和。',
  '抵制洪宪帝制': '拒绝拥戴袁世凯称帝，与之保持距离。',
  '讨平张勋复辟': '组织讨逆军平定张勋复辟，恢复共和。',
  // —— 张作霖 ——
  '统一东北军政': '统一奉天、吉林、黑龙江军政，称雄东北。',
  '发展东北实业与交通': '兴办铁路、工厂与垦务，扩充地方实力。',
  '入关控制北京政府': '率奉军入关，掌控北京政府与中枢。',
  // —— 蒋介石 ——
  '出任黄埔军校校长': '出任黄埔军校校长，培植嫡系军事骨干。',
  '领导北伐': '任北伐军总司令，击败北洋各系。',
  '坚持抗战': '领导正面战场抗战，任中国战区最高统帅。',
  '出席开罗会议': '出席开罗会议，与美英共商战后安排。',
  // —— 冯玉祥 ——
  '发动北京政变': '发动北京政变，推翻直系曹锟政府。',
  '五原誓师参加北伐': '在五原誓师，率西北军参加北伐。',
  '组建察哈尔抗日同盟军': '组建察哈尔抗日同盟军，收复多伦等失地。',
  // —— 阎锡山 ——
  '长期主政山西': '主政山西三十余年，形成独立的地方政权。',
  '创办山西大学': '创办山西大学，推动地方新式教育。',
  '任第二战区司令长官': '任第二战区司令长官，主持山西抗战。',
  '出任行政院长': '赴台后出任行政院长，主持岛内政务。',
  // —— 张学良 ——
  '宣布东北易帜': '宣布东北易帜，服从南京国民政府。',
  '率兵入关助蒋': '率东北军入关，助蒋介石结束中原大战。',
  '发动西安事变': '与杨虎城发动西安事变，促成停止内战。',
  // —— 李宗仁 ——
  '统一广西': '联合黄绍竑等统一广西，建立新桂系。',
  '北伐第七军军长': '任北伐第七军军长，所部号称钢军。',
  '指挥台儿庄战役': '指挥台儿庄战役，取得正面战场重大胜利。',
  '任代总统': '在国民党政权危局中出任代总统。',
  '回归大陆': '晚年自美国返回大陆，受到礼遇。',
  // —— 白崇禧 ——
  '参与统一广西': '参与统一广西，成为新桂系军事核心。',
  '北伐副参谋总长': '任北伐军副参谋总长，参与作战筹划。',
  '参与指挥台儿庄': '协助李宗仁指挥台儿庄战役。',
  '任国防部长': '出任国防部长，主持军事行政。',
  // —— 何应钦 ——
  '任黄埔军校总教官': '任黄埔军校总教官，成为黄埔系核心。',
  '任军政部长、参谋总长': '长期任军政部长与参谋总长，主持军事行政。',
  '代表中国接受日军投降': '代表中国在南京接受日军投降。',
  // —— 黄兴 ——
  '创建华兴会': '创建华兴会，组织两湖反清革命。',
  '参与筹建同盟会': '参与筹建同盟会，成为革命派主要领袖。',
  '组织多次反清起义': '组织多次武装起义，承担同盟会军事工作。',
  '任陆军总长': '任南京临时政府陆军总长，主持军事。',
  // —— 蔡锷 ——
  '领导云南重九起义': '领导云南重九起义，响应武昌革命。',
  '发动护国战争': '率先起兵讨袁，发动护国战争。',
  '迫袁取消帝制': '迫使袁世凯取消帝制，维护共和制度。',
  // —— 朱德 ——
  '参与领导南昌起义': '参与领导南昌起义，保存革命武装力量。',
  '率部上井冈山': '率部上井冈山，与毛泽东部会师。',
  '任红军总司令': '长期任红军总司令，主持军事指挥。',
  '任解放军总司令': '任人民解放军总司令，指挥解放战争。',
  // —— 彭德怀 ——
  '领导平江起义': '领导平江起义，创建红五军。',
  '任八路军副总指挥': '任八路军副总指挥，指挥华北抗战。',
  '指挥抗美援朝': '任志愿军司令员，指挥抗美援朝作战。',
  // —— 胡汉民 ——
  '任总统府秘书长': '任南京临时政府总统府秘书长。',
  '任立法院院长': '任立法院院长，主持国民党立法事务。',
  '阐发三民主义': '阐发三民主义理论，构建国民党意识形态。',
  // —— 宋子文 ——
  '统一广东财政': '整理广东财政，为北伐筹措军费。',
  '确立预算制与中央银行制度': '推行预算制，建立中央银行体系。',
  '主持战时对美借款': '主持战时对美借款，争取抗战外援。',
  '签订《中苏友好同盟条约》': '代表中国签订中苏友好同盟条约。',
  // —— 顾维钧 ——
  '拒签《凡尔赛和约》': '巴黎和会拒签对德和约，维护山东主权。',
  '签署《联合国宪章》': '代表中国第一个签署《联合国宪章》。',
  '长期出使美英法': '长期出使美英法，处理重大外交事务。',
  // —— 章太炎 ——
  '著《国故论衡》《文始》': '著《国故论衡》《文始》，奠定近代国学典范。',
  '主持《民报》笔政': '主持《民报》笔政，与改良派展开思想论战。',
  '开近代诸子学研究': '以新方法研治诸子，开近代诸子学。',
  // —— 蔡元培 ——
  '革新北京大学': '出任北大校长，重塑学风与学科制度。',
  '确立“思想自由，兼容并包”办学方针': '倡思想自由、兼容并包，广纳新旧学人。',
  '创建近代大学体制': '建立近代大学系科与评议制度。',
  // —— 陈独秀 ——
  '创办《新青年》': '创办《新青年》，发起新文化运动。',
  '发起新文化运动': '高举科学与民主，推动思想启蒙。',
  '参与创建中国共产党': '参与创建中国共产党，成为主要创始人。',
  '任首任总书记': '任中共首任总书记，主持早期党务。',
  // —— 胡适 ——
  '发表《文学改良刍议》': '发表《文学改良刍议》，倡导白话文学。',
  '著《中国哲学史大纲》': '著《中国哲学史大纲》，开现代学术范式。',
  '推动学术现代化': '提倡整理国故，推动学术方法现代化。',
  // —— 鲁迅 ——
  '著《呐喊》《彷徨》《野草》': '著《呐喊》《彷徨》《野草》，奠定现代文学。',
  '开创现代杂文传统': '开创现代杂文传统，以杂文介入现实。',
  '译介外国文学': '译介东欧与日本文学，拓展文学视野。',
  // —— 傅斯年 ——
  '创建历史语言研究所': '创建中央研究院历史语言研究所。',
  '主持殷墟考古发掘': '主持殷墟发掘，使殷商由传说变为信史。',
  '推动史学专业化': '倡史料学，推动史学研究专业化。',
  // —— 竺可桢 ——
  '创建中国第一个地学系': '创建中国高校第一个地学系。',
  '创建中央研究院气象研究所': '创建中国首个气象研究机构。',
  '开拓气候变迁研究': '开拓气候变迁与物候学研究。',
  // —— 叶企孙 ——
  '创建清华大学物理系': '创建清华物理系，奠定中国理科基础。',
  '精确测定普朗克常数': '精确测定普朗克常数，数值国际沿用多年。',
  '培养大批物理人才': '培养大批院士与诺奖级物理人才。',
  // —— 李四光 ——
  '首创地质力学': '创立地质力学，以力学方法研究地壳构造。',
  '指导大庆等油田勘探': '以陆相生油理论指导大庆等油田勘探。',
  '推动铀矿勘查': '推动铀矿勘查，服务国防工业。'
};

function genWorkDesc(name) {
  if (!name) return '';
  const n = name.trim();
  if (WORK_DESC_MAP_117[n]) return WORK_DESC_MAP_117[n];
  if (n.includes('战') || n.includes('军') || n.includes('起义')) return '军事领域的重要行动或成果。';
  if (n.includes('学') || n.includes('教育')) return '教育学术领域的重要建树。';
  if (n.includes('著') || n.includes('《')) return '著述或文献方面的重要成果。';
  if (n.includes('任') || n.includes('出任')) return '其政治生涯中的重要职务。';
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

// ---- 本名/字号/称号别名归并（称号列已自动登记，此处补本名与常用字）----
const ALIAS_MAP_117 = {
  '孙文': '孙中山', '逸仙': '孙中山',
  '蒋中正': '蒋介石', '中正': '蒋介石',
  '李德邻': '李宗仁', '白健生': '白崇禧', '蔡松坡': '蔡锷', '黄克强': '黄兴',
  '胡展堂': '胡汉民', '顾少川': '顾维钧', '段合肥': '段祺瑞', '张汉卿': '张学良',
  '何敬之': '何应钦', '阎百川': '阎锡山', '李仲揆': '李四光', '袁项城': '袁世凯',
  '蔡孑民': '蔡元培', '傅孟真': '傅斯年', '章炳麟': '章太炎', '炳麟': '章太炎',
  '周树人': '鲁迅', '周豫才': '鲁迅', '舒庆春': '老舍', '沈雁冰': '茅盾',
  '李芾甘': '巴金', '万家宝': '曹禺', '郭开贞': '郭沫若', '蒋百里': '蒋方震'
};

// ---- 二级人物分类（98 人按史实归类；与一级同名的 5 人导入时自动跳过）----
const L2_CAT_MAP_117 = {
  // 军事人物
  '聂荣臻': '军事人物', '叶挺': '军事人物', '薛岳': '军事人物', '卫立煌': '军事人物',
  '傅作义': '军事人物', '张自忠': '军事人物', '杜聿明': '军事人物', '孙立人': '军事人物',
  '贺龙': '军事人物', '刘伯承': '军事人物', '陈毅': '军事人物', '粟裕': '军事人物',
  '徐向前': '军事人物', '杨虎城': '军事人物', '程潜': '军事人物', '唐生智': '军事人物',
  '陈济棠': '军事人物', '陈绍宽': '军事人物', '朱培德': '军事人物', '刘湘': '军事人物',
  '宋哲元': '军事人物', '陈诚': '军事人物',
  // 政治人物
  '汪精卫': '政治人物', '宋教仁': '政治人物', '廖仲恺': '政治人物', '孔祥熙': '政治人物',
  '谭延闿': '政治人物', '林森': '政治人物', '唐绍仪': '政治人物', '王宠惠': '政治人物',
  '戴季陶': '政治人物', '张群': '政治人物', '王世杰': '政治人物', '蒋廷黻': '政治人物',
  '罗家伦': '政治人物', '卢作孚': '政治人物', '荣宗敬': '政治人物', '荣德生': '政治人物',
  '范旭东': '政治人物',
  // 思想人物
  '熊十力': '思想人物', '冯友兰': '思想人物', '梁漱溟': '思想人物', '陶行知': '思想人物',
  '晏阳初': '思想人物', '李大钊': '思想人物',
  // 文化人物
  '郭沫若': '文化人物', '茅盾': '文化人物', '巴金': '文化人物', '老舍': '文化人物',
  '曹禺': '文化人物', '沈从文': '文化人物', '张爱玲': '文化人物', '钱钟书': '文化人物',
  '周作人': '文化人物', '林语堂': '文化人物', '王国维': '文化人物', '陈寅恪': '文化人物',
  '顾颉刚': '文化人物', '钱穆': '文化人物', '陈垣': '文化人物', '赵元任': '文化人物',
  '李济': '文化人物', '梁思成': '文化人物', '齐白石': '文化人物', '徐悲鸿': '文化人物',
  '梅兰芳': '文化人物', '黄宾虹': '文化人物', '潘天寿': '文化人物', '林徽因': '文化人物',
  '吕碧城': '文化人物', '萧红': '文化人物', '丁玲': '文化人物', '萧军': '文化人物',
  '艾青': '文化人物', '沙汀': '文化人物', '叶圣陶': '文化人物', '朱自清': '文化人物',
  '闻一多': '文化人物', '穆旦': '文化人物', '张恨水': '文化人物', '黄侃': '文化人物',
  '刘师培': '文化人物', '吴宓': '文化人物', '梅贻琦': '文化人物', '张伯苓': '文化人物',
  // 科技人物
  '侯德榜': '科技人物', '詹天佑': '科技人物', '茅以升': '科技人物', '童第周': '科技人物',
  '林巧稚': '科技人物', '吴有训': '科技人物', '严济慈': '科技人物', '吴大猷': '科技人物',
  // 与一级同名的 5 人（导入时跳过，保留分类以备后用）
  '章太炎': '思想人物', '胡适': '文化人物', '傅斯年': '文化人物', '竺可桢': '科技人物', '叶企孙': '科技人物'
};
const DEFAULT_L2_CAT = '文化人物';

// 民国 Excel 的「影响力描述」部分条目过短（不足 8 字，校验视为断句碎片），此处整体替换为完整表述
const IMPACT_PATCH_117 = {
  '段祺瑞': ['北洋三杰，执掌北京政府', '三造共和，屡次左右政局', '派系政治加剧动荡。'],
  '蒋介石': ['黄埔建军，掌握国民党军权', '领导北伐抗战，掌控全国军政', '退台塑造两岸格局。'],
  '冯玉祥': ['北京政变改变政局', '西北军辗转北方，举足轻重', '组织抗日同盟军。'],
  '阎锡山': ['主政山西三十六年', '中原大战联合反蒋', '地方实力派典型。'],
  '张学良': ['东北易帜形式统一', '西安事变停止内战', '影响抗战进程走向。'],
  '李宗仁': ['指挥台儿庄大捷，鼓舞士气', '桂系核心领袖，长期与中央抗衡', '出任代总统，晚年回归大陆。'],
  '白崇禧': ['素有“小诸葛”之称，善用谋略', '北伐抗战中屡任参谋长要职', '桂系军事核心，与李宗仁相始终。'],
  '何应钦': ['黄埔系二号人物，执掌军政', '长期主持军事行政与后勤', '代表中国接受南京日军投降。'],
  '黄兴': ['同盟会武装组织者', '与孙中山并称“孙黄”，共襄革命', '共和开国元勋，功成不居。'],
  '蔡锷': ['护国战争首义，云南率先讨袁', '迫袁取消帝制，再造共和', '民国国葬第一人。'],
  '朱德': ['南昌起义保存革命火种', '井冈山会师，开辟农村道路', '被誉为“红军之父”。'],
  '彭德怀': ['领导平江起义，创建红五军', '指挥百团大战，重创日军', '率军抗美援朝，立下战功。'],
  '胡汉民': ['国民党重要理论家', '长期执掌党务，与蒋争权', '党权与军权之争的焦点。'],
  '顾维钧': ['巴黎和会拒签和约', '代表中国首签《联合国宪章》', '职业外交的典范。'],
  '章太炎': ['以国学根基倡革命', '主持《民报》论战，鼓吹革命', '兼治经史诸子，开学术新局。'],
  '蔡元培': ['兼容并包，重塑北大', '奠基现代大学制度', '倡导美育，开一代学风。'],
  '陈独秀': ['创办《新青年》，掀起新文化', '参与创建中国共产党', '影响二十世纪走向。'],
  '胡适': ['提倡白话文，改变文体', '《中国哲学史大纲》开新范式', '倡导整理国故，推动学术转型。'],
  '鲁迅': ['以小说解剖国民性', '开创现代杂文，影响一代文风', '提供持久的精神资源。'],
  '傅斯年': ['创建中央研究院史语所', '主持殷墟发掘，奠定现代考古', '推动史学专业化。'],
  '竺可桢': ['开创中国现代气象学研究', '创建地理系，培养地学人才', '执掌浙大十三年。'],
  '叶企孙': ['创建清华大学物理系', '合作测定普朗克常数', '育成一代物理人才。'],
  '李四光': ['首创地质力学，服务国家建设', '打破“中国贫油论”', '指导大庆油田勘探发现。']
};

const CAT_MAP = { '思想家': '思想人物', '思想家/政治家': '思想人物', '君主': '统治者', '皇帝': '统治者', '帝王': '统治者', '军事家': '军事人物', '军事家/政治家': '军事人物', '外交家': '政治人物', '改革家': '政治人物', '政治家': '政治人物', '文学家': '文化人物', '文学家/政治家': '文化人物', '史学家': '文化人物', '科学家': '科技人物', '医学家': '科技人物', '工程师': '科技人物', '发明家': '科技人物' };

const persons = [];
const nameToId = {};
const l1Persons = [];
const aliasMap = {};
const addAlias = (a, c) => { if (a && String(a).trim()) aliasMap[String(a).trim()] = c; };
const missingWorkDesc = [];

let i1 = 1;
for (const r of l1) {
  const rawName = String(col(r, '姓名')).trim();
  const pm = rawName.match(/^(.+?)（(.+?)）$/);
  const name = pm ? pm[1].trim() : rawName;
  const id = 117000 + i1++;
  nameToId[name] = id;
  addAlias(name, name);
  if (pm) { addAlias(pm[1], name); addAlias(pm[2], name); addAlias(rawName, name); }
  (String(col(r, '称号') || '') || '').split(/[；;]/).forEach(a => addAlias(a, name));
  const { birth, death } = pbd(col(r, '生年'), col(r, '卒年'));
  const rawCat = String(col(r, '人物类型') || '政治人物').trim();
  const cat = CAT_MAP[rawCat] || rawCat || '政治人物';
  const influence = Number(col(r, '历史影响力')) || 80;
  const impactRaw = col(r, '影响力描述');
  const impactList = IMPACT_PATCH_117[name]
    ? IMPACT_PATCH_117[name].slice()
    : (impactRaw ? String(impactRaw).split(/[；;]/).map(s => s.trim()).filter(Boolean) : []);
  const worksRaw = (() => { const fk = Object.keys(r).find(k => String(k).startsWith('代表成果')); return fk ? String(r[fk] || '') : ''; })();
  const works = worksRaw
    ? splitWorks(worksRaw).map(n => {
        const wn = n.trim();
        if (!WORK_DESC_MAP_117[wn]) missingWorkDesc.push(name + '·' + wn);
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
    let y = birth || death || 1912;
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
    id, name, dynasty: '民国',
    summary: String(col(r, '人物简介') || '').trim() || String(col(r, '历史地位') || '').trim(),
    historical_position: String(col(r, '历史地位') || '').trim(),
    achievement: (() => { const a = String(col(r, '称号') || '').trim(); return (a && a !== name) ? a : ''; })(),
    impact_list: impactList,
    later_quotes: parseLaterQuotes(col(r, '后人评价')),
    tags,
    image_url: imageUrl(name), birth_year: birth, death_year: death,
    category: cat, level: 1,
    birth_place: col(r, '出生地') ? String(col(r, '出生地')) : null,
    occupations: [],
    works, related_people: [], life_events: life, related_events: [],
    influence,
    dimension_scores: { historical_influence: influence, relation_activity: Number(col(r, '关系活跃度')) || dd[1], professional_1: Number(col(r, '专业维度①')) || dd[0], professional_2: Number(col(r, '专业维度②')) || dd[2], professional_3: Number(col(r, '专业维度③')) || dd[2] },
    narrative_relations: { nodes: [], edges: [] }
  };
  l1Persons.push(p);
  persons.push(p);
}
Object.entries(ALIAS_MAP_117).forEach(([a, c]) => { if (nameToId[c]) addAlias(a, c); });

// --- 二级人物 ---
const l2Persons = [];
let i2 = 1;
for (const r of l2) {
  const name = String(col(r, '姓名')).trim();
  if (nameToId[name]) continue; // 与一级同名者跳过，保留一级完整条目
  const id = 117100 + i2++;
  nameToId[name] = id;
  addAlias(name, name);
  const storyContent = String(col(r, '故事内容') || '').trim();
  const storyTitle = String(col(r, '故事标题') || '').trim();
  const cat = L2_CAT_MAP_117[name] || DEFAULT_L2_CAT;
  const p = {
    id, name, dynasty: '民国',
    summary: '',
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

// ---- 事件 (id 1173xx，支持时间区间) ----
const events = [];
let e1 = 1;
const TYPE_MAP = { '战争军事': '战争军事', '政治制度': '政治事件', '政治': '政治事件', '外交交流': '外交', '外交': '外交', '对外交流': '外交', '经济贸易': '经济', '经济': '经济', '思想教育': '思想文化', '思想文化': '思想文化', '文化艺术': '文化艺术', '文化': '文化艺术', '科技发明': '科技发明', '科技': '科技发明', '自然灾害': '自然灾害' };
for (const r of ev) {
  const id = 117300 + e1++;
  const name = String(col(r, '事件名称'));
  const { start, end } = parseRange(String(col(r, '发生时间') || ''));
  const y = start || 1912;
  const bg = {};
  for (const [k, v] of [['政治背景', 'political'], ['经济背景', 'economic'], ['社会背景', 'social'], ['文化背景', 'cultural'], ['地理背景', 'geographic']]) {
    const x = col(r, k); if (x) bg[v] = String(x);
  }
  const significance = String(col(r, '历史影响描述') || col(r, '历史影响') || '').trim();
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
    : `「${name}」作为民国时期重要的${etype}事件，深刻影响了当时的政治格局，是理解这段历史的关键节点。`;
  events.push({
    id, name, dynasty: '民国',
    start_year: y, end_year: (end == null ? y : end),
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

// ---- 关系归一化：人物关系表 7 类基础关系 ----
const REL_MAP_117 = {
  '君臣': '君臣', '亲属': '亲属', '继承': '继承', '敌对': '敌对', '盟友': '盟友',
  '师生': '师生', '影响': '影响',
  '同门': '师生', '政治继任': '继承', '政治冲突': '敌对',
  '学术影响': '影响', '文学影响': '影响', '艺术影响': '影响', '思想影响': '影响',
  '交流': '交流', '学术交流': '交流', '同僚': '同僚', '政治同僚': '同僚', '军事同僚': '同僚',
  '政治合作': '盟友', '政治盟友': '盟友', '军事合作': '盟友', '军事盟友': '盟友'
};
const REL_PRIO_117 = { '亲属': 9, '父子': 9, '母子': 9, '夫妻': 9, '兄弟': 9, '祖孙': 9, '叔侄': 9, '姻亲': 9, '君臣': 9, '师生': 8, '继承': 8, '敌对': 7, '盟友': 6, '交流': 5, '影响': 4, '同僚': 3 };
// 源表亲属类统一标为「亲属」，此处按人物对还原具体关系
const KIN_DETAIL_RAW_117 = {
  '张作霖|张学良': '父子',
  '宋子文|孙中山': '姻亲',
  '宋子文|蒋介石': '姻亲',
  '孔祥熙|蒋介石': '姻亲',
  '孔祥熙|孙中山': '姻亲'
};
const KIN_DETAIL_117 = {};
Object.entries(KIN_DETAIL_RAW_117).forEach(([k, v]) => {
  KIN_DETAIL_117[k.split('|').sort().join('|')] = v;
});
const UNKNOWN_REL = new Set();
let FLOW_ONLY = 0;

function canon(n) { return aliasMap[n] || n; }
function personByName(n) {
  return persons.find(p => p.name === n) || persons.find(p => p.name === (aliasMap[n] || ''));
}
// 每一条有向记录都保留：A→B 与 B→A 视为两条数据
const pairBest = new Map();
let REL_ROWS_DROPPED = 0;
for (const r of rel) {
  const rawA = String(col(r, '起点人物') || '').trim();
  const rawB = String(col(r, '终点人物') || '').trim();
  const a = canon(rawA);
  const b = canon(rawB);
  if (!a || !b || a === b) continue;
  const pa = personByName(a);
  const pb = personByName(b);
  // 只丢弃两端都不在册的行；一端在册时仍保留，用于在册人物的 related_people
  if (!pa && !pb) { REL_ROWS_DROPPED++; continue; }
  const raw = String(col(r, '关系类型') || '').trim();
  if (!raw) { FLOW_ONLY++; continue; }
  let type = REL_MAP_117[raw];
  if (!type) { UNKNOWN_REL.add(raw); continue; }
  if (type === '亲属') type = KIN_DETAIL_117[[a, b].sort().join('|')] || type;
  const key = `${a}|${b}`;
  const prev = pairBest.get(key);
  if (!prev || (REL_PRIO_117[type] || 0) > (REL_PRIO_117[prev.type] || 0)) {
    pairBest.set(key, { a, b, type, desc: String(col(r, '关系说明') || '').trim() });
  }
}
// 人物详情页按「本人-对端人物」去重，保留优先级最高的关系
const relatedMap = new Map();
function addRelated(from, to, type, desc) {
  if (!relatedMap.has(from)) relatedMap.set(from, new Map());
  const m = relatedMap.get(from);
  const prev = m.get(to);
  if (!prev || (REL_PRIO_117[type] || 0) > (REL_PRIO_117[prev.relation] || 0)) {
    m.set(to, { name: to, relation: type, influence: 75, desc });
  }
}
for (const { a, b, type, desc } of pairBest.values()) {
  addRelated(a, b, type, desc);
  addRelated(b, a, type, desc);
}
persons.forEach(p => {
  const m = relatedMap.get(p.name);
  p.related_people = (m ? [...m.values()] : [])
    .sort((x, y) => (REL_PRIO_117[y.relation] || 0) - (REL_PRIO_117[x.relation] || 0));
});

// ---- 人事关系表：按事件分组（含不在册人物）----
const ROLE_GROUP_117 = {
  '领导': 'leaders', '胜利方': 'leaders',
  '支持': 'participants', '参与': 'participants', '推动': 'participants', '完成': 'participants',
  '反对': 'opponents', '失败方': 'opponents',
  '见证': 'affected', '受影响': 'affected'
};
// 事件名别名：人事关系表用简称，事件表用全称
const EVENT_ALIAS_117 = {
  '中苏互不侵犯': '中苏互不侵犯条约',
  '国民经济建设': '国民经济建设运动'
};
const evByName = new Map(events.map(e => [e.name, e]));
const evByBase = new Map(events.map(e => [e.name.replace(/（.*?）/g, '').trim(), e]));
function matchEvent(n) {
  if (!n) return null;
  if (evByName.has(n)) return evByName.get(n);
  if (EVENT_ALIAS_117[n] && evByName.has(EVENT_ALIAS_117[n])) return evByName.get(EVENT_ALIAS_117[n]);
  const base = String(n).replace(/（.*?）/g, '').trim();
  return evByBase.get(base) || null;
}
let PEV_SKIPPED = 0;
for (const r of pev) {
  const eName = String(col(r, '事件') || '').trim();
  const pName = String(col(r, '人物') || '').trim();
  const e = matchEvent(eName); if (!e) { PEV_SKIPPED++; continue; }
  const p = personByName(pName);
  const name = p ? p.name : canon(pName);
  const role = String(col(r, '人事关系类型') || '').trim();
  const g = ROLE_GROUP_117[role] || 'participants';
  if (!e.person_groups[g].find(x => x.name === name)) {
    e.person_groups[g].push(p ? { name, role } : { name, role, cross_dynasty: '待接入' });
  }
  if (p && !p.related_events.find(x => x.name === e.name)) p.related_events.push({ name: e.name, role });
}
// 事件 related_persons 汇总全部出现人名（含不在册）
for (const e of events) {
  const names = new Set();
  ['leaders', 'participants', 'opponents', 'affected'].forEach(k => e.person_groups[k].forEach(x => names.add(x.name)));
  e.related_persons = [...names];
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

// ---- 关键词 ----
const KC = { '时代印象': 'era', '历史概念': 'event', '政治改革': 'civilization', '历史事件': 'event', '政治理念': 'civilization', '外交制度': 'civilization', '人物': 'person', '人物故事': 'person', '历史典故': 'event', '思想文化': 'civilization', '政治格局': 'era', '战争': 'event', '制度文化': 'civilization', '科技发明': 'civilization', '核心人物': 'person', '文明制度': 'civilization', '文化地理': 'geo' };
const KW_DESC_117 = {
  '帝制终结': '辛亥革命推翻帝制，共和观念自此深入人心。',
  '军阀割据': '北洋分裂后各系拥兵自重，割据混战。',
  '新文化运动': '以科学与民主为旗，掀起思想启蒙浪潮。',
  '民族救亡': '外患日深，救亡图存成为时代主题。',
  '抗日战争': '全民族抗战，近代中国最艰苦的反侵略战争。',
  '孙中山': '民主革命先行者，缔造中华民国的核心人物。',
  '辛亥革命': '推翻清朝、终结帝制的资产阶级革命。',
  '三民主义': '民族、民权、民生，同盟会与国民党的纲领。',
  '五四运动': '学生爱国运动，新民主主义革命的起点。',
  '租界': '列强在华设立的治外法权区域，城市特殊空间。',
  '蒋介石': '南京国民政府时期最高领导人。',
  '北伐战争': '国民革命军北上讨伐北洋军阀的战争。',
  '南京国民政府': '北伐后建立的中央政权，名义统一全国。',
  '革命根据地': '中共在乡村建立的武装割据区域。',
  '鲁迅': '现代文学奠基人，以小说与杂文批判国民性。',
  '社会转型': '传统社会向现代社会过渡的结构性变迁。',
  '民族资本主义': '近代民族资本兴办实业，曲折发展。',
  '新式教育': '废科举后兴起的学堂、大学与国民教育。',
  '解放战争': '国共两党争夺政权的全面内战。',
  '通商口岸': '条约开放的城市，对外贸易与西学输入的门户。'
};
const keywords = kw.map(r => {
  const name = String(col(r, '关键词'));
  return { name, value: Number(col(r, '权重')) || 50, category: KC[String(col(r, '类别'))] || 'era', desc: KW_DESC_117[name] || (name + '是民国时期的重要概念。') };
});

// ---- 写文件 ----
const out = {
  dynasty: DYN, persons, events, keywords,
  _meta: {
    imported_at: new Date().toISOString(),
    stats: { persons: persons.length, level1: persons.filter(p => p.level === 1).length, level2: persons.filter(p => p.level === 2).length, events: events.length, keywords: keywords.length },
    sources: ['1级人物数据.xlsx', '2级人物数据.xlsx', '事件数据.xlsx', '朝代热力图.xlsx', '人物关系表.xlsx', '人事关系表.xlsx']
  }
};
const target = path.join(dir, 'frontend/public/data/dynasty_117.json');
fs.writeFileSync(target, JSON.stringify(out, null, 2), 'utf-8');

console.log('dynasty_117.json 生成完成');
console.log('  人物: ' + persons.length + ' (一级 ' + persons.filter(p => p.level === 1).length + ', 二级 ' + persons.filter(p => p.level === 2).length + ')');
console.log('  事件: ' + events.length);
console.log('  关键词: ' + keywords.length);
console.log('  有向关系记录: ' + pairBest.size + '；两端均不在册丢弃: ' + REL_ROWS_DROPPED + '；人事关系未匹配事件跳过: ' + PEV_SKIPPED);
if (UNKNOWN_REL.size) console.log('  [注意] 未映射关系标签: ' + [...UNKNOWN_REL].join('、'));
if (missingWorkDesc.length) console.log('  [注意] 缺少成果描述的条目: ' + missingWorkDesc.join('、'));

// ---- 依次挂载后续精修脚本（文件不存在则跳过）----
if (fs.existsSync(path.join(__dirname, 'fix_117_content.js'))) {
  console.log('\n--- 运行事件内容精修 fix_117_content.js ---');
  require('./fix_117_content.js');
}
if (fs.existsSync(path.join(__dirname, 'fix_117_summaries.js'))) {
  console.log('\n--- 运行二级人物简介精修 fix_117_summaries.js ---');
  require('./fix_117_summaries.js');
}
if (fs.existsSync(path.join(__dirname, 'enrich_117_relations.js'))) {
  console.log('\n--- 运行数据丰富 enrich_117_relations.js ---');
  require('./enrich_117_relations.js');
}

// ---- 自查（读取最终产物）----
{
  const finalData = JSON.parse(fs.readFileSync(target, 'utf-8'));
  const fp = finalData.persons || [];
  const fe = finalData.events || [];
  const l2f = fp.filter(p => p.level === 2);
  const regNames = new Set(fp.map(p => p.name));
  const extEnds = new Set();
  for (const { a, b } of pairBest.values()) {
    if (!regNames.has(a)) extEnds.add(a);
    if (!regNames.has(b)) extEnds.add(b);
  }
  const groupExt = new Set();
  fe.forEach(e => ['leaders', 'participants', 'opponents', 'affected'].forEach(k =>
    (e.person_groups?.[k] || []).forEach(x => { if (!regNames.has(x.name)) groupExt.add(x.name); })));
  const avgL2 = l2f.length ? (l2f.reduce((s, p) => s + (p.related_people || []).length, 0) / l2f.length) : 0;
  console.log('\n===== 自查 =====');
  console.log('  一级人物: ' + fp.filter(p => p.level === 1).length);
  console.log('  二级人物: ' + l2f.length + '；summary 空值: ' + l2f.filter(p => !p.summary).length);
  console.log('  事件: ' + fe.length);
  console.log('  关键词: ' + (finalData.keywords || []).length);
  console.log('  关系总数(有向去重后): ' + pairBest.size);
  console.log('  因缘际会外部端点数量(不在册唯一人名): ' + extEnds.size);
  console.log('  事件 person_groups 中非在册人物数量: ' + groupExt.size);
  console.log('  二级 related_people 平均条数: ' + avgL2.toFixed(2));
}
