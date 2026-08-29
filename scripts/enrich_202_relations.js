/**
 * 春秋(dynasty_202)数据丰富脚本：
 *   #1 增加"历史脉络"宏观时间线(timelines)并为每条事件打上 timeline_id
 *   #2 为事件填充 related_persons / related_events（修复"推荐人物/推荐事件"）
 *   #3 为二级人物设置具体的"身份摘要+一句话定位"引语（覆盖早期通用模板）
 *   #4 丰富一级人物 related_people 与二级人物 narrative_relations（因缘际会/人际关系图）
 * 同时把 #3 的二级人物引语应用到夏商西周(dynasty_201)。
 * 用法: node scripts/enrich_202_relations.js
 */
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, '..', 'frontend', 'public', 'data');
const f202 = path.join(DIR, 'dynasty_202.json');
const f201 = path.join(DIR, 'dynasty_201.json');

function load(f) { return JSON.parse(fs.readFileSync(f, 'utf-8')); }
function save(f, o) { fs.writeFileSync(f, JSON.stringify(o, null, 2), 'utf-8'); }

/* ---------- #1 春秋历史脉络宏观时间线（12节点骨干） ---------- */
const CHUNQUI_TIMELINE_KEY = '春秋霸业兴衰';
const CHUNQUI_TIMELINE = [
  { title: '平王东迁', year: '前770年', desc: '东周肇始', event_id: 202301 },
  { title: '繻葛之战', year: '前707年', desc: '王权衰微', event_id: 202302 },
  { title: '齐桓公即位与管仲改革', year: '前685年', desc: '管仲变法', event_id: 202303 },
  { title: '葵丘会盟', year: '前651年', desc: '齐桓称霸', event_id: 202305 },
  { title: '城濮之战', year: '前632年', desc: '晋文霸业', event_id: 202308 },
  { title: '楚庄王问鼎中原', year: '前606年', desc: '楚王问鼎', event_id: 202312 },
  { title: '邲之战', year: '前597年', desc: '楚庄会盟', event_id: 202313 },
  { title: '晋悼公即位与晋国复兴', year: '前573年', desc: '晋室复兴', event_id: 202318 },
  { title: '晋楚弭兵会盟', year: '前546年', desc: '晋楚弭兵', event_id: 202320 },
  { title: '柏举之战', year: '前506年', desc: '吴师入郢', event_id: 202324 },
  { title: '勾践灭吴', year: '前473年', desc: '越灭吴', event_id: 202333 },
  { title: '三家分晋', year: '前403年', desc: '春秋终结', event_id: 202336 },
];

/* ---------- #3 二级人物引语（身份摘要+一句话定位）：按 name 索引 ---------- */
const LEVEL2_QUOTES_202 = {
  '齐襄公': '春秋齐国国君，在位时政令失序、兄弟相残，终因连称、管至父之乱而身死，是齐桓公称霸前夕齐国内乱的关键亲历者。',
  '齐僖公': '春秋早期齐国国君，积极通过婚姻与外交扩大齐国影响，为后来齐桓公称霸埋下了伏笔。',
  '齐昭公': '春秋齐国国君，继承君位后延续齐国在东方诸侯中的强势地位，使霸业得以承接。',
  '齐懿公': '齐桓公之子，其强硬施政激化了与贵族的矛盾，是齐国霸业由盛转衰时期的一位君主。',
  '公子纠': '齐桓公的同母兄弟，与公子小白争夺君位未成而败亡，其出局最终促成了齐桓公的即位。',
  '公子小白': '齐桓公即位前的名字，在公子夺位之争中胜出，即位后成为春秋首霸。',
  '高傒': '春秋齐国卿族高氏之主，拥立公子小白即位，是齐桓公称霸早期的重要政治支持者。',
  '国氏': '春秋齐国世卿国氏一族，与高氏共同执掌齐国政局，是齐国权力格局中的举足轻重者。',
  '高氏': '春秋齐国重要卿族之一，世代与国氏辅政，在齐国政治中地位举足轻重。',
  '宁戚': '齐桓公时期出身贫寒却得重用的贤臣，击牛角而歌自荐，最终跻身齐廷要职。',
  '隰朋': '齐桓公时期的重要大臣，与管仲、鲍叔牙等共理国政，是齐桓公霸业前期的重要辅臣。',
  '王子城父': '齐桓公时期齐国将领，在讨伐山戎等对外军事行动中为霸业贡献力量。',
  '宾须无': '齐桓公时期齐国大夫，活跃于齐国对外军事行动之中。',
  '东郭牙': '齐桓公时期重要人物，以识才荐贤著称，曾参与齐国政治事务。',
  '竖刁': '齐桓公晚年近幸之臣，以自宫求信于君，是齐桓公暮年政局中的关键近臣。',
  '易牙': '齐桓公晚年宠信的近臣，以精于烹饪深得君宠，是齐桓公暮年身边的亲信之一。',
  '开方': '卫国公子出身，后侍奉齐桓公，是齐桓公晚年宠信的近臣之一。',
  '公子无亏': '齐桓公晚年众多争位的儿子之一，卷入齐国"五公子争位"的权力斗争。',
  '齐昭公子潘': '齐桓公之子公子潘，齐桓公死后参与君位争夺，是齐国内乱中的角色之一。',
  '齐灵公': '春秋齐国国君，在位期间齐国再起继承风波，是齐国霸业中衰期的君主。',
  '晋献公': '春秋晋国国君，晚年宠爱骊姬并欲废太子，由此引发"骊姬之乱"，是晋国内乱的肇始者。',
  '骊姬': '晋献公晚年最受宠爱的妃子，其专宠与进谗引发了晋国"骊姬之乱"。',
  '奚齐': '晋献公与骊姬之子，因骊姬之乱被立为继承人，但未能顺利即位。',
  '申生': '晋献公太子，因骊姬进谗被迫害至死，是"骊姬之乱"的核心受害者。',
  '晋惠公（夷吾）': '晋献公之子，在君位争夺中获胜即位，后在韩原之战中被秦军俘虏。',
  '郤芮': '晋惠公的重要谋臣，曾参与阻挠晋文公重耳返晋的谋划。',
  '介之推': '晋文公重耳流亡十九年的忠诚追随者，功成不居、携母隐居绵山，成为寒食节的起源人物。',
  '狐突': '晋国大夫，其子狐毛狐偃追随重耳流亡，因"不召二子"忠于重耳而遭晋献公残害。',
  '狐毛': '狐突之子，重耳流亡时期的重要追随者，在城濮之战中立有战功。',
  '赵盾': '晋国执政大夫，晋襄公去世后主持晋政，是"赵氏孤儿"故事的第一代核心人物。',
  '郤缺': '郤芮之子，以举贤荐能著称，后成为晋国重要卿大夫。',
  '郤克': '郤缺之子，晋国重要卿大夫，因出使齐国受辱而促成鞍之战。',
  '栾书': '晋国重要卿大夫，参与并主导"弑晋厉公"的政治事变，是晋国栾氏的代表。',
  '士会（范武子）': '晋国著名政治家、军事家，一度避乱去秦、后又返晋，是晋国范氏的奠基者。',
  '荀林父': '晋国中军将，邲之战中因指挥失利而败于楚军。',
  '魏犨': '跟随重耳流亡的重要武将，晋文公时期的主要将领，是魏氏家族的先驱。',
  '魏绛': '晋悼公时期大夫，提出"和戎"之策以和缓边患，是春秋外交智慧的代表人物。',
  '先轸': '重耳流亡时期的重要追随者，后成为晋国军事统帅，最终战死疆场。',
  '荀首': '晋国荀氏的重要卿大夫，其子智罃在楚被俘，是荀氏家族的关键人物。',
  '韩厥': '晋国重要卿大夫，与赵氏关系密切，在"赵氏复兴"中发挥关键作用。',
  '赵武': '赵朔之子、"赵氏孤儿"中的遗腹子，历经磨难后复兴了赵氏家族。',
  '赵朔': '赵盾之子，晋国赵氏的重要继承人，惨死于"下宫之难"。',
  '程婴': '赵氏门客，为保全赵武而忍痛牺牲亲子，是"赵氏孤儿"故事中的忠义之士。',
  '公孙杵臼': '赵朔门客，与程婴合谋"以死救孤"，保全了赵武的性命。',
  '屠岸贾': '晋景公时期司寇，率人诛灭赵氏，是"下宫之难"的主导者。',
  '晋悼公': '春秋晋国国君，即位后整肃内政、复兴霸业，使晋国重振强国之威。',
  '楚武王': '春秋早期楚国君主，率先自封为王，不断扩张楚国势力，奠定楚国的强盛基础。',
  '楚文王': '楚国君主，继承楚武王的扩张路线，继续向汉水流域与中原推进。',
  '楚成王': '楚国君主，在位时楚国与晋国激烈争夺中原霸权，最终在城濮之战中败北。',
  '子玉': '楚成王时期最重要的军事将领之一，在城濮之战中兵败自杀。',
  '子西': '楚平王之子、楚昭王异母弟，楚国后期重要的令尹，在楚国复都中发挥关键作用。',
  '子反': '楚国重要将领，长期参与楚庄王时期的北进战争，是邲之战的关键人物。',
  '楚共王': '楚国君主，承接楚庄王留下的强国局面，与晋国在两国争霸中继续拉锯。',
  '楚康王': '楚国君主，在位时期晋楚双方均已疲惫，最终促成了弭兵会盟。',
  '楚灵王': '楚国君主，即位后希望恢复楚国的强盛与霸权，筑章华台游宴，后因内乱失位。',
  '楚平王': '原名弃疾，发动政变推翻楚灵王后即位，其"夺子妻为妃"埋下费无极谗害伍氏及楚吴冲突的伏笔。',
  '费无极': '楚平王时期重要大臣，进谗导致伍氏被诛，间接引发了伍子胥奔吴复仇。',
  '太子建': '楚平王太子，因费无极谗害而出奔，最终身死异乡，是楚国政治动荡的牺牲者。',
  '伯嚭': '楚国贵族出身，后逃往吴国并受重用，因受贿排挤伍子胥，是吴国由盛转衰的关键人物。',
  '养由基': '楚国著名武将，以"百步穿杨"的箭术闻名，是春秋射术的代表人物。',
  '楚昭王': '楚国君主，在位时楚吴矛盾激化，吴军一度攻入郢都，后赖申包胥复国之功重返朝野。',
  '昭奚恤': '楚国贵族和将领，曾在楚国政治与军事活动中占有重要地位，被誉为楚国名将。',
  '秦襄公': '秦国开国君主，因护送周平王东迁有功而受封立国，是秦国的奠基者。',
  '秦文公': '秦国君主，在位时进一步巩固关中统治，奠定了秦国在关中的根基。',
  '秦宣公': '秦国君主，在位时期秦国与晋国争夺河西，竞争日益加剧。',
  '秦成公': '秦国早期君主，在位时间较短，史料记载有限。',
  '秦康公': '秦国君主，早年任太子时曾护送晋文公重耳返晋，是秦晋关系中的重要人物。',
  '秦共公': '秦国君主，在位时期持续面对来自晋国的压力。',
  '秦景公': '春秋中期秦国的重要君主，在位时间较长，与晋国长期争霸。',
  '公孙枝': '秦穆公时期重要大臣，曾参与秦国的政治与军事事务。',
  '由余': '原属西戎，后进入秦国并受秦穆公重用，是辅佐秦穆公称霸西戎的重要谋臣。',
  '孟明视': '秦穆公时期重要将领，率军东进伐郑，在崤之战中兵败被俘，后复仇雪耻。',
  '西乞术': '秦穆公时期重要将领，与孟明视、白乙丙共同伐郑，在崤山被俘。',
  '白乙丙': '秦穆公时期秦国将领，与孟明视、西乞术并称秦军重要将领，一同参与崤之战。',
  '子车氏': '秦穆公去世后殉葬的"三良"，其殉葬引发了后世对秦人殉制度的争议。',
  '秦哀公': '秦国君主，吴军攻入郢都时出兵救楚，体现了秦国对楚国的战略支持。',
  '医和': '春秋时期著名医者，曾为晋景公诊病，其诊断与论述被视为古代医学的典范。',
  '鲁隐公': '《春秋》开篇记载的重要鲁国君主，因摄政及被弑而开启鲁国多变的政治局面。',
  '鲁桓公': '鲁国君主，在位时鲁齐往来密切，后出使齐国遇害。',
  '鲁庄公': '鲁国君主，在长勺之战中采纳曹刿之谋击败齐军。',
  '鲁闵公': '鲁庄公之后年幼即位的鲁国君主，统治很快陷入内部斗争，不久遇害。',
  '鲁文公': '鲁国君主，在位时鲁国在晋、楚两大势力之间周旋。',
  '鲁宣公': '鲁国君主，其即位与鲁国宫廷继承斗争密切相关。',
  '鲁成公': '鲁国君主，即位时晋楚争霸仍在继续，参与鞍之战后的会盟。',
  '鲁襄公': '鲁国君主，即位时年幼，政权逐渐被季孙氏、叔孙氏、孟孙氏三家卿族掌握。',
  '曹沫': '鲁国著名武士，在齐鲁会盟上持匕首劫持齐桓公，迫使齐国归还鲁地，书写了以勇力卫国的传奇。',
  '公子庆父': '鲁庄公之弟，鲁国早期权力斗争中的重要人物，是"庆父之难"的肇始者。',
  '臧文仲': '鲁国著名大夫，长期参与鲁国政治，以足智多谋著称。',
  '臧武仲': '鲁国大夫臧纥，出身臧氏，以足智多谋著称。',
  '季武子': '鲁国季孙氏的重要人物，是三桓势力不断壮大的关键推手。',
  '季孙宿': '鲁国季氏的重要卿大夫，活跃于晋楚争霸后期，参与弭兵会盟。',
  '叔孙豹': '鲁国叔孙氏的重要卿大夫，以外交才能著称，多次代表鲁国周旋于晋楚之间。',
  '孟献子': '鲁国孟孙氏的重要大夫，以俭朴和谨慎著称。',
  '南宫敬叔': '鲁国贵族，曾随孔子问礼，与孔子有深切渊源。',
  '子游': '孔子弟子，名言偃，以文学见长，曾在武城以礼乐教化百姓，是"弦歌而治"的代表。',
  '子夏': '孔子晚年重要弟子，以文学与经学见长，后在魏国西河设教，为传扬儒学的重要人物。',
  '子路': '孔子最著名的弟子之一，以刚直勇武著称，最终在卫国政变中结缨而死。',
  '子张': '孔子弟子，名颛孙师，以善于思考与询问政事著称。',
  '宰我': '孔子弟子，以善于言辞著称，因昼寝被孔子责备，名列孔门"言语"高足。',
  '冉耕': '孔子弟子，字伯牛，以德行著称，与颜回、闵子骞并列于孔门德行弟子之中。',
  '冉求': '孔子弟子，字子有，多才多艺，曾任事于季氏，是孔门"政事"高足。',
  '吴王寿梦': '吴国历史上重要的君主，在位期间吴国始称王，开始参与中原争霸。',
  '吴王诸樊': '寿梦长子，继承君位，开启吴国王位"兄弟相传"的格局。',
  '吴王余祭': '寿梦次子，继承兄长诸樊为吴王，是"季札让国"故事中的角色。',
  '吴王余昧': '寿梦第三子，继承君位成为吴王，其去世引发了吴国王位之争。',
  '吴王僚': '吴王余昧之子，即位后吴国王位继承问题仍悬而未决，最终被专诸刺杀。',
  '公子光': '吴王诸樊之子，认为王位本应属于自己，遂派专诸以"鱼腹藏剑"刺杀吴王僚，自立为吴王阖闾。',
  '专诸': '吴国著名刺客，受公子光与伍子胥安排，以"鱼腹藏剑"刺杀吴王僚，成就阖闾即位。',
  '要离': '吴王阖闾时期的刺客，受命刺杀庆忌，以智勇著称。',
  '被离': '吴国人物，传统文献中与伍子胥、要离有所联系，以识人荐贤著称。',
  '伍员': '字子胥，春秋末年最著名的政治家与军事家，因父兄被楚王所杀而奔吴，助吴破楚复仇、称雄一时。',
  '公孙雄': '吴国时期参与吴楚战争的人物。',
  '太宰嚭': '吴王夫差时期重要大臣，因受贿进谗致伍子胥被杀，是吴国由盛转衰的关键人物。',
  '夫概': '吴王阖闾之弟，在柏举之战等战役中表现勇猛，后一度自立为王。',
  '吴太伯': '周太王长子，为让位于季历而避居江南，被视为吴国之祖。',
  '越王允常': '越王勾践之父，在位时期越国逐渐壮大，并开始与吴国发生冲突。',
  '西施': '春秋越国绝世美女，越人进献吴王夫差以惑其心智，是越国复国大计中的关键人物。',
  '郑旦': '越国进献吴王夫差的美女，传统记载中常与西施并称。',
  '灵姑浮': '越国将领，活跃于越吴战争时期，以斩获吴王而闻名。',
  '计然': '越国时期著名谋士，范蠡之师，提出"七策富国"，是越国振兴的重要智囊。',
};

const LEVEL2_QUOTES_201 = {
  '后羿': '有穷氏首领，以善射著称，其名号与上古射日神话相融，兼具神话与历史色彩。',
  '寒浞': '寒国出身、后羿亲信，篡夺夏政，是"太康失国"后的乱政者。',
  '女艾': '少康谋臣，中国早期历史上罕见的女性政治人物，以善谋助少康复国。',
  '伯靡': '夏朝遗臣，忠于夏王室，是少康中兴的重要助力。',
  '关龙逢': '夏朝末年贤臣，以忠直敢谏著称，终被夏桀所害。',
  '妺喜': '有施氏之女，夏桀宠妃，后世多以之为夏亡之祸水。',
  '费昌': '夏末商族重要人物，商汤得力助手，在商族崛起中发挥关键作用。',
  '昆吾': '夏朝末年重要诸侯，为己姓部落首领，世代为夏朝重臣，后助夏与商相抗。',
  '皋陶': '东夷部落首领，"上古四圣"之一，以贤德智慧闻名，被视为中国法制与狱讼之祖。',
  '伯益': '东夷部落首领，舜禹时期重要人物，才智出众，助大禹治水，是嬴秦的先祖。',
  '伊尹': '商初重臣，辅佐商汤灭夏建商，功勋卓著，被誉为"元圣"，堪称千古贤相第一人。',
  '仲虺': '商汤重臣，奚仲之后，出身名门，才德兼备，为商初辅弼之臣。',
  '葛伯': '夏末葛国君主，葛国为夏朝东部门户，其失礼与拒商是商汤伐夏的导火索之一。',
  '巫咸': '商朝太戊时期重臣，精通天文历法与巫术，学识渊博，在商代文化史上占重要地位。',
  '甘盘': '商朝武丁时期的老师与重臣，对武丁的成长影响深远。',
  '傅说': '商朝武丁时期贤相，出身微贱而才能卓越，经武丁梦求而拜相，助武丁实现中兴。',
  '祖己': '商朝武丁之子，以孝行著称，在商人文化中具有重要地位。',
  '微子启': '商纣王庶兄，商末重要政治人物，后降周受封于宋，为宋国之祖。',
  '比干': '商纣王叔父，以忠直敢谏闻名，因强谏被剖心，是千古忠臣的典范。',
  '箕子': '商纣王叔父，博学多才，因谏而佯狂，周灭商后东渡朝鲜，是"箕子朝鲜"的传说贤者。',
  '妲己': '有苏氏之女，商纣王宠妃，后世多以其为商亡之祸因。',
  '飞廉': '商纣王将领，嬴姓，秦赵之先祖，在商末地位重要。',
  '太姒': '周文王正妃、周武王之母，以贤德著称、母仪天下，是周室母德的典范。',
  '伯邑考': '周文王长子、周武王之兄，为人仁厚孝顺，被商纣王所害。',
  '姜子牙': '姜姓吕氏，名尚，号太公望，中国历史上著名的军事家与政治家，兵家祖师，周室开国第一功臣。',
  '召公奭': '姬姓，周初重臣、太保，以廉洁公正著称、政绩斐然，留下"甘棠遗爱"的美谈。',
  '毕公高': '姬姓，周初重臣，周文王之子，贤德有才，是魏国之祖。',
  '管叔鲜': '姬姓，周文王之子、武王之弟，后参与"三监之乱"而被诛。',
  '蔡叔度': '姬姓，周文王之子、武王之弟，参与"三监之乱"而获罪。',
  '霍叔处': '姬姓，周文王之子、武王之弟，参与"三监之乱"。',
  '武庚': '纣王之子，商朝末代王族成员，受封于殷后联合三监叛乱，后败亡。',
  '康叔封': '姬姓，周武王之弟，周初重臣，深得周公信任，是卫国之祖。',
  '伯禽': '姬姓，周公旦长子，鲁国实际上的开国君主，克绍箕裘、励精图治。',
  '尹吉甫': '西周宣王时期重臣，文武兼备，辅佐宣王中兴，是《诗经》中重要的卿士。',
  '方叔': '西周宣王时期重臣，以军事才能著称，参与宣王的征伐，勇冠三军。',
  '召虎': '即召穆公，西周宣王时期重臣，以忠义著称，曾保育太子、参与"共和行政"，是宣王中兴的重要辅臣。',
  '荣夷公': '西周厉王时期宠臣，以善于逢迎著称，助长厉王"专利"之弊，激化了周室危机。',
  '召穆公': '即召虎，西周宣王时期重臣，以忠义和智慧著称，堪称栋梁之臣。',
  '褒姒': '褒国进献周幽王的美女，以冷艳绝伦著称，被后世视作"烽火戏诸侯"与西周灭亡的祸源之一。',
  '申侯': '西周末年申国君主，周幽王原配申后之父，因幽王废后立褒姒而引犬戎攻周，终结了西周。',
};

/* ---------- #4 二级人物「因缘际会」手动兜底（孤岛人物的历史关联） ---------- */
const CURATED_202 = {
  '齐懿公': { persons: [['齐桓公', '先君'], ['齐昭公', '兄弟'], ['高傒', '卿族'], ['国氏', '辅臣']], events: [] },
  '楚武王': { persons: [['楚文王', '子嗣'], ['楚成王', '后继'], ['楚庄王', '强楚之继'], ['子反', '武将']], events: ['楚庄王问鼎中原'] },
  '楚康王': { persons: [['楚共王', '先君'], ['楚灵王', '兄弟'], ['楚平王', '行弟'], ['伍子胥', '楚臣']], events: ['晋楚弭兵会盟'] },
  '楚灵王': { persons: [['楚康王', '兄弟'], ['楚平王', '行弟'], ['费无极', '谏臣'], ['太子建', '政争']], events: ['晋楚弭兵会盟', '楚庄王问鼎中原'] },
  '秦襄公': { persons: [['秦文公', '子嗣'], ['秦宣公', '子孙'], ['秦成公', '子孙']], events: ['平王东迁'] },
  '秦文公': { persons: [['秦襄公', '先君'], ['秦宣公', '子孙'], ['秦成公', '子孙'], ['秦康公', '子孙']], events: [] },
  '秦成公': { persons: [['秦宣公', '兄弟'], ['秦康公', '后继'], ['秦共公', '后继'], ['公孙枝', '秦臣']], events: [] },
  '秦共公': { persons: [['秦康公', '先君'], ['秦景公', '后继'], ['秦成公', '先君'], ['公孙枝', '秦臣']], events: [] },
  '秦景公': { persons: [['秦共公', '先君'], ['秦哀公', '后继'], ['秦康公', '先君'], ['由余', '谋臣']], events: [] },
  '公孙枝': { persons: [['由余', '同朝'], ['孟明视', '同朝'], ['西乞术', '同朝'], ['白乙丙', '同朝']], events: ['秦晋殽之战'] },
  '由余': { persons: [['秦景公', '秦君'], ['公孙枝', '同朝'], ['孟明视', '同朝'], ['秦哀公', '继君']], events: ['秦晋殽之战'] },
  '孟明视': { persons: [['西乞术', '同将'], ['白乙丙', '同将'], ['公孙枝', '同朝'], ['由余', '同朝']], events: ['秦晋殽之战'] },
  '西乞术': { persons: [['孟明视', '同将'], ['白乙丙', '同将'], ['公孙枝', '同朝'], ['由余', '同朝']], events: ['秦晋殽之战'] },
  '白乙丙': { persons: [['孟明视', '同将'], ['西乞术', '同将'], ['公孙枝', '同朝'], ['由余', '同朝']], events: ['秦晋殽之战'] },
  '子车氏': { persons: [['公孙枝', '秦臣'], ['由余', '秦臣'], ['孟明视', '秦将'], ['秦景公', '秦君']], events: ['秦晋殽之战'] },
  '鲁隐公': { persons: [['鲁桓公', '继君'], ['公子庆父', '宗族'], ['臧文仲', '大夫']], events: ['鲁国三桓专政'] },
  '鲁文公': { persons: [['鲁宣公', '继君'], ['鲁成公', '子孙'], ['叔孙豹', '卿族'], ['季武子', '卿族']], events: ['晋楚弭兵会盟'] },
  '鲁成公': { persons: [['鲁宣公', '先君'], ['鲁襄公', '继君'], ['晋景公', '晋君'], ['叔孙豹', '卿族']], events: ['鞍之战', '晋楚弭兵会盟'] },
  '孟献子': { persons: [['叔孙豹', '同盟'], ['季武子', '政友'], ['季孙宿', '卿族'], ['鲁襄公', '鲁君']], events: ['晋楚弭兵会盟', '鞍之战'] },
  '灵姑浮': { persons: [['越王勾践', '越君'], ['夫差', '吴君'], ['文种', '越臣'], ['范蠡', '越臣']], events: ['吴越檇李之战', '会稽之战与勾践受辱', '勾践灭吴'] },
  // —— 补充：节点过少的二级人物（真实可考关系，外围均取本朝已有人物/事件）——
  '齐僖公': { persons: [['齐襄公', '子嗣'], ['公子纠', '子嗣'], ['齐桓公', '子嗣']], events: [] },
  '齐襄公': { persons: [['齐僖公', '先君'], ['公子纠', '兄弟'], ['齐桓公', '兄弟'], ['高傒', '卿族']], events: [] },
  '齐昭公': { persons: [['齐桓公', '先君'], ['齐懿公', '继君'], ['公子无亏', '兄弟']], events: [] },
  '齐昭公子潘': { persons: [['齐桓公', '先君'], ['齐昭公', '兄弟'], ['齐懿公', '兄弟'], ['齐灵公', '后继']], events: [] },
  '高氏': { persons: [['高傒', '同族'], ['国氏', '同僚'], ['隰朋', '同僚']], events: [] },
  '王子城父': { persons: [['齐桓公', '齐君'], ['隰朋', '同僚'], ['宾须无', '同僚']], events: [] },
  '宾须无': { persons: [['齐桓公', '齐君'], ['隰朋', '同僚'], ['东郭牙', '同僚']], events: [] },
  '东郭牙': { persons: [['齐桓公', '齐君'], ['宾须无', '同僚'], ['隰朋', '同僚']], events: [] },
  '竖刁': { persons: [['齐桓公', '齐君'], ['易牙', '同党'], ['开方', '同党']], events: [] },
  '易牙': { persons: [['齐桓公', '齐君'], ['竖刁', '同党'], ['开方', '同党']], events: [] },
  '开方': { persons: [['齐桓公', '齐君'], ['易牙', '同党'], ['竖刁', '同党']], events: [] },
  '公子无亏': { persons: [['齐桓公', '先君'], ['齐昭公', '兄弟'], ['齐懿公', '兄弟']], events: [] },
  '齐灵公': { persons: [['齐昭公', '祖孙'], ['高氏', '卿族'], ['国氏', '卿族']], events: [] },
  '骊姬': { persons: [['晋献公', '夫妻'], ['奚齐', '母子'], ['申生', '政敌']], events: [] },
  '奚齐': { persons: [['晋献公', '父子'], ['骊姬', '母子'], ['申生', '敌对']], events: [] },
  '赵朔': { persons: [['赵盾', '父子'], ['韩厥', '同僚'], ['屠岸贾', '敌对']], events: [] },
  '楚文王': { persons: [['楚武王', '先君'], ['楚成王', '继君'], ['子玉', '武将']], events: [] },
  '昭奚恤': { persons: [['养由基', '同僚'], ['子西', '同朝'], ['费无极', '同朝']], events: [] },
  '秦宣公': { persons: [['秦襄公', '祖孙'], ['秦成公', '兄弟'], ['晋献公', '敌国']], events: [] },
  '医和': { persons: [['晋悼公', '晋君'], ['赵武', '同朝'], ['子产', '同朝']], events: [] },
  '鲁桓公': { persons: [['鲁隐公', '继君'], ['鲁庄公', '子嗣'], ['公子庆父', '子嗣']], events: [] },
  '鲁庄公': { persons: [['鲁桓公', '先君'], ['鲁闵公', '子嗣'], ['曹沫', '鲁臣']], events: [] },
  '鲁闵公': { persons: [['鲁庄公', '先君'], ['鲁文公', '兄弟'], ['公子庆父', '宗室']], events: [] },
  '鲁宣公': { persons: [['鲁文公', '继君'], ['鲁成公', '子嗣'], ['季武子', '卿族']], events: [] },
  '鲁襄公': { persons: [['鲁成公', '先君'], ['叔孙豹', '卿族'], ['季武子', '卿族']], events: [] },
  '曹沫': { persons: [['鲁庄公', '鲁君'], ['齐桓公', '敌对'], ['公子庆父', '同朝']], events: [] },
  '公子庆父': { persons: [['鲁桓公', '父子'], ['鲁庄公', '兄弟'], ['鲁闵公', '敌对']], events: [] },
  '臧文仲': { persons: [['鲁庄公', '鲁君'], ['臧武仲', '同族'], ['季武子', '同朝']], events: [] },
  '臧武仲': { persons: [['臧文仲', '先辈'], ['季武子', '同朝'], ['孟献子', '同朝']], events: [] },
  '南宫敬叔': { persons: [['孔子', '师生'], ['子路', '同门'], ['子夏', '同门']], events: [] },
  '子张': { persons: [['孔子', '师生'], ['子夏', '同门'], ['子路', '同门']], events: [] },
  '宰我': { persons: [['孔子', '师生'], ['冉求', '同门'], ['子路', '同门']], events: [] },
  '冉耕': { persons: [['孔子', '师生'], ['冉求', '同门'], ['宰我', '同门']], events: [] },
  '冉求': { persons: [['孔子', '师生'], ['冉耕', '同门'], ['子路', '同门'], ['子夏', '同门']], events: [] },
  '要离': { persons: [['公子光', '吴君'], ['专诸', '同僚'], ['夫概', '同朝']], events: [] },
};

/* 校验当日数据存在的名字/事件是否真实存在，避免引用脏数据 */
function sanitizeCurated(raw) {
  const personNames = new Set(raw.persons.map(p => p.name));
  const eventNames = new Set(raw.events.map(e => e.name));
  const out = {};
  Object.entries(CURATED_202).forEach(([id, spec]) => {
    const persons = (spec.persons || []).filter(([nm]) => personNames.has(nm));
    const events = (spec.events || []).filter(nm => eventNames.has(nm));
    if (persons.length + events.length > 0) out[id] = { persons, events };
  });
  return out;
}

/* 某人物 story 正文中提到的人名/事件名（只取数据集中真实存在的） */
function mentionedInStory(text, personNames, eventNames) {
  const found = new Set();
  if (!text) return found;
  [...eventNames].sort((a, b) => b.length - a.length).forEach(en => { if (text.includes(en)) found.add(en); });
  [...personNames].sort((a, b) => b.length - a.length).forEach(pn => { if (text.includes(pn)) found.add(pn); });
  return found;
}

/* 归一化关系标签：去掉历史遗留的 ·因缘 叠缀，保留干净的关系名称 */
function cleanRel(s) {
  const base = (s || '').split('·')[0].trim();
  return base || '关联';
}
const REL_SET = {
  '君臣': 1, '敌对': 1, '同盟': 1, '盟友': 1, '师生': 1, '继承': 1, '亲属': 1,
  '对手': 1, '朋友': 1, '兄弟': 1, '同朝': 1, '影响': 1, '交流': 1, '关联': 1,
  '参与': 1, '因缘': 1, '先君': 1, '后继': 1, '继君': 1, '子嗣': 1, '子孙': 1,
  '辅臣': 1, '宗族': 1, '卿族': 1, '大夫': 1, '武将': 1, '谋臣': 1, '谏臣': 1,
  '楚臣': 1, '秦臣': 1, '秦将': 1, '越臣': 1, '吴君': 1, '晋君': 1, '鲁君': 1, '秦君': 1,
};

// 关系重要性：人物↔人物连线只保留最重要的 1-2 条，避免因缘际会图线条过多过乱
const REL_PRIORITY = {
  '君臣': 12, '敌对': 11, '同盟': 11, '盟友': 10, '师生': 10, '亲属': 10,
  '子嗣': 9, '继承': 9, '兄弟': 9, '对手': 9, '先君': 8, '后继': 8, '继君': 8,
  '朋友': 8, '影响': 7, '卿族': 7, '宗族': 7, '辅臣': 6, '武将': 6, '谋臣': 6,
  '谏臣': 6, '楚臣': 6, '秦臣': 6, '秦将': 6, '越臣': 6, '吴君': 6, '晋君': 6,
  '鲁君': 6, '秦君': 6, '大夫': 5, '交流': 5, '同朝': 5, '参与': 4, '因缘': 3, '关联': 2,
};

// 真实关系白名单：人物↔人物连线只允许出现具体、可读的真实关系，剔除「因缘/关联/关系」等泛化标签
const REL_REAL = new Set(Object.keys(REL_SET).filter(k => !['关联', '因缘', '参与', '关系'].includes(k)));

/* ---------- 各问题处理 ---------- */
function main() {
  const d202 = load(f202);
  const events = d202.events || [];
  const persons = d202.persons || [];
  const personsById = new Map(persons.map(p => [p.id, p]));
  const nameSet = new Set(persons.map(p => p.name));

  console.log('===== #1 历史脉络时间线 =====');
  d202.timelines = d202.timelines || {};
  d202.timelines[CHUNQUI_TIMELINE_KEY] = CHUNQUI_TIMELINE;
  let tidCount = 0;
  events.forEach(ev => { ev.timeline_id = CHUNQUI_TIMELINE_KEY; tidCount++; });
  console.log('  timeline节点', CHUNQUI_TIMELINE.length, '；已为', tidCount, '条事件设置 timeline_id');

  // 事件维度的参与人/关联事件（复用给 #2/#4）
  const personEvents = new Map(); // name -> Set<eventId>
  events.forEach(ev => {
    const names = new Set([
      ...(ev.person_relations || []).flatMap(r => [r.source, r.target]),
      ...(ev.person_groups?.leaders || []).map(x => x.name),
      ...(ev.person_groups?.participants || []).map(x => x.name),
      ...(ev.person_groups?.opponents || []).map(x => x.name),
      ...(ev.person_groups?.affected || []).map(x => x.name),
    ]);
    names.forEach(n => { if (n && nameSet.has(n)) { if (!personEvents.has(n)) personEvents.set(n, new Set()); personEvents.get(n).add(ev.id); } });
  });

  // 关系线索：nameA->nameB -> type, count
  const relationClues = new Map(); // 'A|B' -> {type,count}
  events.forEach(ev => {
    (ev.person_relations || []).forEach(r => {
      if (!nameSet.has(r.source) || !nameSet.has(r.target)) return;
      const key = [r.source, r.target].sort().join('|');
      if (!relationClues.has(key)) relationClues.set(key, { type: r.type || '关系', count: 0 });
      relationClues.get(key).count++;
    });
  });

  // 事件共享人物 → 事件关联
  const evPersonSet = new Map();
  events.forEach(ev => {
    const names = new Set([
      ...(ev.person_relations || []).flatMap(r => [r.source, r.target]),
      ...(ev.person_groups?.leaders || []).map(x => x.name),
      ...(ev.person_groups?.participants || []).map(x => x.name),
      ...(ev.person_groups?.opponents || []).map(x => x.name),
      ...(ev.person_groups?.affected || []).map(x => x.name),
    ]);
    evPersonSet.set(ev.id, names);
  });
  function relatedEventNames(ev) {
    const mine = evPersonSet.get(ev.id) || new Set();
    const scored = [];
    events.forEach(o => {
      if (o.id === ev.id) return;
      let share = 0; (evPersonSet.get(o.id) || []).forEach(n => { if (mine.has(n)) share++; });
      if (share > 0) scored.push({ id: o.id, name: o.name, share });
    });
    scored.sort((a, b) => b.share - a.share);
    // 额外补充宏观时间线里的非本事件节点，保证有内容
    CHUNQUI_TIMELINE.forEach(t => { if (t.event_id !== ev.id && !scored.some(s => s.id === t.event_id)) scored.push({ id: t.event_id, name: t.title, share: 0 }); });
    return scored.slice(0, 6).map(s => s.name);
  }

  console.log('\n===== #2 推荐人物 / 推荐事件 =====');
  let rp=0, re=0;
  events.forEach(ev => {
    const names = new Set([
      ...(ev.person_relations || []).flatMap(r => [r.source, r.target]),
      ...(ev.person_groups?.leaders || []).map(x => x.name),
      ...(ev.person_groups?.participants || []).map(x => x.name),
      ...(ev.person_groups?.opponents || []).map(x => x.name),
      ...(ev.person_groups?.affected || []).map(x => x.name),
    ]);
    const relatedPersons = [...names].filter(n => nameSet.has(n)).slice(0, 12);
    ev.related_persons = relatedPersons;
    ev.related_events = relatedEventNames(ev).filter(n => n !== ev.name).slice(0, 6);
    if (ev.related_persons.length) rp++;
    if (ev.related_events.length) re++;
  });
  console.log('  已填充 related_persons 事件数:', rp, '/', events.length, '；related_events:', re, '/', events.length);

  console.log('\n===== #4 人物关系图 =====');
  // —— 共享：全局人物邻接（related_people 双向 + 事件 person_relations + story 共现）——
  const eventNamesArr = events.map(e => e.name);
  const personNamesArr = persons.map(p => p.name);
  const adjAll = new Map(); // name -> Map(other -> rel)
  const linkA = (a, b, rel) => {
    if (!nameSet.has(a) || !nameSet.has(b) || a === b) return;
    if (!adjAll.has(a)) adjAll.set(a, new Map());
    if (!adjAll.get(a).has(b)) adjAll.get(a).set(b, rel);
  };
  persons.forEach(pp => (pp.related_people || []).forEach(r => { if (r && r.name) linkA(pp.name, r.name, r.relation || '关系'); }));
  events.forEach(ev => (ev.person_relations || []).forEach(r => linkA(r.source, r.target, r.type || '关系')));
  persons.forEach(pp => mentionedInStory(pp.story?.content, personNamesArr, eventNamesArr).forEach(m => { if (nameSet.has(m)) linkA(pp.name, m, '因缘'); }));
  const degA = (nm) => (adjAll.get(nm) || new Map()).size;
  // 人物 -> 参与事件（名称）
  const evByName = new Map();
  events.forEach(ev => {
    const ppl = new Set();
    ['leaders', 'participants', 'opponents', 'affected'].forEach(k =>
      (ev.person_groups?.[k] || []).forEach(x => { if (nameSet.has(x.name)) ppl.add(x.name); }));
    ppl.forEach(n => { if (!evByName.has(n)) evByName.set(n, new Set()); evByName.get(n).add(ev.name); });
  });
  // 人物 -> 事件 -> 真实角色（用于因缘际会中「人物↔事件」连线的真实关系标签）
  const evRoleByName = new Map(); // name -> Map(事件名 -> 角色标签)
  events.forEach(ev => {
    const roleOf = (arr, label) => (arr || []).forEach(x => { if (!x.name) return; if (!evRoleByName.has(x.name)) evRoleByName.set(x.name, new Map()); evRoleByName.get(x.name).set(ev.name, label); });
    roleOf(ev.person_groups?.leaders, '主导');
    roleOf(ev.person_groups?.participants, '参与');
    roleOf(ev.person_groups?.opponents, '对抗');
    roleOf(ev.person_groups?.affected, '受影响');
  });
  // BFS 收集某人物的人际邻居（供一级 related_people 扩充）
  const bfsPersons = (center, maxCount) => {
    const direct = new Map(), indirect = new Map(), visited = new Set([center]);
    const q = [[center, 0]];
    while (q.length) {
      const [cur, dep] = q.shift();
      if (dep >= 2 || direct.size >= maxCount) break;
      for (const [nb, rel] of (adjAll.get(cur) || new Map())) {
        if (visited.has(nb)) continue;
        visited.add(nb);
        if (dep === 0) direct.set(nb, rel); else indirect.set(nb, rel);
        q.push([nb, dep + 1]);
        if (direct.size >= maxCount) break;
      }
    }
    return { direct, indirect };
  };

  // 一级：related_people
  let l1ok=0;
  persons.filter(p => (p.level || 1) === 1).forEach(p => {
    const merged = new Map(); // name -> {type, count}
    (p.related_people || []).forEach(rp2 => { if (rp2 && rp2.name) merged.set(rp2.name, { type: rp2.relation || '关系', count: (merged.get(rp2.name)?.count || 0) + 1 }); });
    // 事件 person_relations
    events.forEach(ev => (ev.person_relations || []).forEach(r => {
      const other = r.source === p.name ? r.target : (r.target === p.name ? r.source : null);
      if (other && nameSet.has(other)) { const cur = merged.get(other); merged.set(other, { type: r.type || (cur?.type || '关系'), count: (cur?.count || 0) + 1 }); }
    }));
    // 同事件共事（leaders/participants/opponents）
    events.forEach(ev => {
      const groups = [ev.person_groups?.leaders || [], ev.person_groups?.participants || [], ev.person_groups?.opponents || []];
      const inGroups = groups.some(g => g.some(x => x.name === p.name));
      if (!inGroups) return;
      groups.forEach((g, gi) => {
        g.forEach(x => { if (x.name && x.name !== p.name && nameSet.has(x.name)) { const rel = gi === 2 ? '敌对' : '同盟'; const cur = merged.get(x.name); if (!cur || cur.count === 0) merged.set(x.name, { type: rel, count: (cur?.count || 0) + 1 }); } });
      });
    });
    const arr = [...merged.values()].map(m => m);
    const list = [...merged.entries()].map(([nm, info]) => ({
      name: nm,
      relation: cleanRel(info.type),
      influence: Math.min(95, 55 + info.count * 8),
    })).sort((a, b) => b.influence - a.influence);
    // 不足时用 BFS 扩充实称人物，保证关系网有血有肉
    if (list.length < 6) {
      const have = new Set(list.map(x => x.name));
      const { direct, indirect } = bfsPersons(p.name, 8);
      [...direct.entries()].sort((a, b) => degA(b[0]) - degA(a[0])).forEach(([nm, rel]) => { if (!have.has(nm)) { have.add(nm); list.push({ name: nm, relation: cleanRel(rel) || '关系', influence: 60 }); } });
      [...indirect.entries()].sort((a, b) => degA(b[0]) - degA(a[0])).forEach(([nm, rel]) => { if (!have.has(nm) && list.length < 9) { have.add(nm); list.push({ name: nm, relation: '关联', influence: 50 }); } });
    }
    list.sort((a, b) => b.influence - a.influence);
    list.forEach((x, i) => { x.influence = Math.max(45, 88 - i * 3); });
    p.related_people = list.slice(0, 9);
    if (p.related_people.length >= 4) l1ok++;
  });
  console.log('  一级人物 related_people (>=4) 数量:', l1ok, '/', persons.filter(p=>p.level===1).length);

  // 二级：narrative_relations（因缘际会）—— 对标事件关系图谱：只有真实关系的星型图 + 真实事件关联，线条克制不溢出
  const curated = sanitizeCurated(d202);
  const buildL2Graph = (p) => {
    const center = p.name;
    const N = new Map(), E = new Map(); // edges: "src|tgt" -> {source,target,label}
    const addN = (name, type, size) => { if (!N.has(name)) N.set(name, { name, type, size: size || (type === 'person' ? (name === center ? 'large' : 'medium') : 'small') }); };
    const addE = (s, t, label) => { const k = [s, t].sort().join('|'); if (s !== t && !E.has(k)) E.set(k, { source: s, target: t, label, direction: 'forward' }); };
    addN(center, 'person', 'large');
    // 人物：只保留【真实关系】的直接邻接（剔除 因缘/关联/关系 等泛化标签），按影响力取前 5
    const cand = new Map(); // name -> 真实关系
    for (const [nb, rel] of (adjAll.get(center) || new Map())) {
      const r = cleanRel(rel);
      if (REL_REAL.has(r)) cand.set(nb, r);
    }
    [...cand.entries()].sort((a, b) => degA(b[0]) - degA(a[0])).forEach(([nm, rel], i) => {
      addN(nm, 'person', i < 4 ? 'medium' : 'small');
      addE(center, nm, rel);
    });
    // 事件：加入人物真实参与的事件（带真实角色标签，最多 2 个，总节点≤7）
    const evRoles = evRoleByName.get(center) || new Map();
    for (const [en, rel] of evRoles) { if (N.size >= 7) break; addN(en, 'event', 'small'); addE(center, en, rel); }
    // 人物↔人物：补充关键真实关系连线（只保留最重要的 2 条，避免线条杂乱）
    const personNodes = [...N.keys()].filter(nm => nm !== center && N.get(nm).type === 'person');
    const pairs = [];
    for (let i = 0; i < personNodes.length; i++)
      for (let j = i + 1; j < personNodes.length; j++) {
        const rel = adjAll.get(personNodes[i])?.get(personNodes[j]);
        if (rel && REL_REAL.has(cleanRel(rel))) pairs.push({ a: personNodes[i], b: personNodes[j], rel: cleanRel(rel) });
      }
    pairs.sort((x, y) => (REL_PRIORITY[y.rel] ?? 0) - (REL_PRIORITY[x.rel] ?? 0));
    pairs.slice(0, 2).forEach(({ a, b, rel }) => addE(a, b, rel));
    // 真实但不足的对偶兜底：真实关系/事件不足时，用"同事件共事者"补齐人物（同朝/同盟/敌对，
    // 均为同一事件内的真实、可读关系，避免站在"因缘"式的模糊推断上），保证图有血有肉
    if (personNodes.length < 3 && N.size < 6) {
      const evNamesForCenter = evByName.get(center) || new Set(); // 该人物参与过的事件名
      events.forEach(ev => {
        if (!evNamesForCenter.has(ev.name) || N.size >= 7) return;
        const groups = [ev.person_groups?.leaders || [], ev.person_groups?.participants || [], ev.person_groups?.opponents || []];
        groups.forEach((g, gi) => {
          if (N.size >= 7) return;
          g.forEach(x => {
            if (!x.name || x.name === center || !nameSet.has(x.name) || N.has(x.name)) return;
            // 优先取既有真实关系标签，否则按阵营给"同朝/敌对"（同朝＝同殿共事，客观可考）
            const known = adjAll.get(center)?.get(x.name);
            const rel = known && REL_REAL.has(cleanRel(known)) ? cleanRel(known) : (gi === 2 ? '敌对' : '同朝');
            addN(x.name, 'person', 'medium');
            addE(center, x.name, rel);
          });
        });
      });
    }
    // 手动兜底：不足5节点时用真实关系补充
    if (N.size < 5 && curated[p.name]) {
      const c = curated[p.name];
      const have = new Set(N.keys());
      c.persons.forEach(([nm, rel]) => { if (!have.has(nm) && N.size < 6) { addN(nm, 'person', 'medium'); addE(center, nm, cleanRel(rel) || '关系'); } });
      c.events.forEach(en => { if (!have.has(en) && N.size < 6) { addN(en, 'event', 'small'); addE(center, en, '参与'); } });
      curatedUsed++;
    }
    return { nodes: [...N.values()], edges: [...E.values()] };
  };
  let l2ok=0, curatedUsed=0;
  persons.filter(p => (p.level || 2) === 2).forEach(p => {
    let g = buildL2Graph(p);
    p.narrative_relations = g;
    if (g.nodes.length >= 5) l2ok++;
  });
  console.log('  二级人物因缘际会(>=5节点) 数量:', l2ok, '/', persons.filter(p=>p.level===2).length, '；手动兜底:', curatedUsed);

  save(f202, d202);

  console.log('\n===== #3 二级人物引语 =====');
  let q202=0;
  persons.filter(p => (p.level || 2) === 2).forEach(p => {
    const q = LEVEL2_QUOTES_202[p.name];
    if (q) { p.summary = q; q202++; }
  });
  console.log('  dynasty_202 二级人物引语更新:', q202, '/', persons.filter(p=>p.level===2).length);
  save(f202, d202);

  // ---------- 201 二级人物引语 ----------
  const d201 = load(f201);
  let q201=0, missing201=[];
  d201.persons.filter(p => (p.level || 2) === 2).forEach(p => {
    const q = LEVEL2_QUOTES_201[p.name];
    if (q) { p.summary = q; q201++; } else missing201.push(p.name);
  });
  save(f201, d201);
  console.log('  dynasty_201 二级人物引语更新:', q201, '/', d201.persons.filter(p=>p.level===2).length, missing201.length?('；未命中:'+missing201.join(',')):'');

  // ---------- 细化「关联/继承」关系：按实际亲属或确切关系拆分标注（与战国 fix_203 同口径） ----------
  const REL_FIX_202 = {
    // 血亲 / 姻亲
    '齐桓公>>齐襄公': '兄弟',
    '狐偃>>狐突': '父子',
    '狐偃>>狐毛': '兄弟',
    '季孙氏（季平子）>>季武子': '祖孙',
    '叔孙氏（叔孙穆子）>>叔孙豹': '宗亲',
    '夫差>>夫概': '叔侄',
    '越王勾践>>越王允常': '父子',
    // 确切基础关系
    '鲁昭公>>季武子': '君臣',
    '鲁昭公>>叔孙豹': '君臣',
    '文种>>越王允常': '君臣',
    // 错乱/跨客体的「继承」数据：弱化为符合时代的关联
    '郑庄公>>公子小白': '影响',
    '祭仲>>公子小白': '影响',
    '叔向>>晋厉公': '宗亲',
    // 确为诸候国继承关系的保留
    '晋厉公>>晋悼公': '继承',
    '齐桓公>>公子小白': '继承',
    // 其余泛化标签：归入确切基础关系
    '晋厉公>>楚庄王': '敌对',
    '老子>>孔子': '影响'
  };
  let relFixed202 = 0;
  const d202f = load(f202);
  d202f.persons.forEach(p => {
    (p.related_people || []).forEach(rp => {
      const k = `${p.name}>>${rp.name}`;
      if (REL_FIX_202[k]) { rp.relation = REL_FIX_202[k]; relFixed202++; }
    });
  });
  save(f202, d202f);
  console.log('  dynasty_202 关系细化(关联/继承):', relFixed202);

  // ---------- 201（夏商西周）关系细化：将笼统「亲属/支持/朋友」拆分为具体血亲与确切关系 ----------
  const REL_FIX_201 = {
    // 夏
    '启>>大禹': '父子', '启>>太康': '父子', '太康>>启': '父子', '太康>>仲康': '兄弟',
    '仲康>>太康': '兄弟', '仲康>>少康': '祖孙', '少康>>仲康': '祖孙', '夏桀>>妺喜': '夫妻',
    // 商
    '太甲>>商汤': '祖孙', '太戊>>盘庚': '宗亲', '盘庚>>祖甲': '宗亲', '盘庚>>武丁': '叔侄',
    '盘庚>>傅说': '影响', '武丁>>妇好': '夫妻', '武丁>>盘庚': '叔侄', '武丁>>祖己': '父子',
    '妇好>>武丁': '夫妻', '妇好>>傅说': '同僚', '妇好>>甘盘': '同僚', '妇好>>祖己': '母子',
    '祖甲>>盘庚': '宗亲', '祖甲>>武丁': '父子', '祖甲>>帝乙': '父子',
    '帝乙>>帝辛': '父子', '帝乙>>微子启': '父子', '帝乙>>比干': '兄弟', '帝乙>>箕子': '兄弟',
    '帝辛>>帝乙': '父子', '帝辛>>比干': '叔侄', '帝辛>>箕子': '叔侄', '帝辛>>微子启': '兄弟',
    // 周
    '周太王>>王季': '父子', '周太王>>周文王': '祖孙', '王季>>周太王': '父子', '王季>>周文王': '父子',
    '周文王>>王季': '父子', '周文王>>周武王': '父子', '周文王>>周公旦': '父子',
    '周武王>>周文王': '父子', '周武王>>周公旦': '兄弟', '周武王>>周成王': '父子', '周武王>>康叔封': '兄弟',
    '周成王>>周武王': '父子', '周成王>>伯禽': '宗亲', '周成王>>周康王': '父子',
    '周康王>>周成王': '父子', '周穆王>>周共王': '父子', '周穆王>>周厉王': '宗亲',
    '周厉王>>周穆王': '宗亲', '周厉王>>周宣王': '父子', '周宣王>>周幽王': '父子',
    '周宣王>>周厉王': '父子', '周幽王>>周宣王': '父子', '周幽王>>褒姒': '夫妻',
    '周公旦>>周文王': '父子', '周公旦>>周武王': '兄弟', '周公旦>>伯禽': '父子'
  };
  let relFixed201 = 0;
  const d201f = load(f201);
  d201f.persons.forEach(p => {
    (p.related_people || []).forEach(rp => {
      const k = `${p.name}>>${rp.name}`;
      if (REL_FIX_201[k]) { rp.relation = REL_FIX_201[k]; relFixed201++; }
    });
  });
  save(f201, d201f);
  console.log('  dynasty_201 关系细化(亲属/支持/朋友):', relFixed201);

  // ---------- 202（春秋）二级人物分类：120人按职业/身份映射到6类标准体系 ----------
  const L2_CAT_MAP_202 = {
    // 统治者
    202101:'统治者',202102:'统治者',202103:'统治者',202104:'统治者',202106:'统治者',202118:'统治者',
    202119:'统治者',202120:'统治者',202121:'统治者',202123:'统治者',202124:'统治者',202125:'统治者',
    202146:'统治者',202147:'统治者',202148:'统治者',202149:'统治者',202153:'统治者',202154:'统治者',
    202155:'统治者',202156:'统治者',202161:'统治者',202163:'统治者',202164:'统治者',202165:'统治者',
    202166:'统治者',202167:'统治者',202168:'统治者',202169:'统治者',202176:'统治者',202178:'统治者',
    202179:'统治者',202180:'统治者',202181:'统治者',202182:'统治者',202183:'统治者',202184:'统治者',
    202185:'统治者',202202:'统治者',202203:'统治者',202204:'统治者',202205:'统治者',202206:'统治者',
    202207:'统治者',202215:'统治者',202216:'统治者',
    // 政治人物（卿相/大夫/朝臣）
    202105:'政治人物',202107:'政治人物',202108:'政治人物',202109:'政治人物',202110:'政治人物',
    202111:'政治人物',202113:'政治人物',202114:'政治人物',202115:'政治人物',202116:'政治人物',
    202117:'政治人物',202122:'政治人物',202126:'政治人物',202128:'政治人物',202130:'政治人物',
    202131:'政治人物',202133:'政治人物',202134:'政治人物',202137:'政治人物',202139:'政治人物',
    202140:'政治人物',202141:'政治人物',202145:'政治人物',202151:'政治人物',202157:'政治人物',
    202158:'政治人物',202159:'政治人物',202170:'政治人物',202171:'政治人物',202175:'政治人物',
    202187:'政治人物',202188:'政治人物',202189:'政治人物',202190:'政治人物',202191:'政治人物',
    202192:'政治人物',202193:'政治人物',202210:'政治人物',202212:'政治人物',202213:'政治人物',
    // 军事人物（将帅/刺客/神射）
    202112:'军事人物',202129:'军事人物',202132:'军事人物',202135:'军事人物',202136:'军事人物',202138:'军事人物',
    202142:'军事人物',202150:'军事人物',202152:'军事人物',202160:'军事人物',202162:'军事人物',
    202172:'军事人物',202173:'军事人物',202174:'军事人物',202186:'军事人物',202208:'军事人物',
    202209:'军事人物',202211:'军事人物',202214:'军事人物',202219:'军事人物',
    // 思想人物（诸子/孔门弟子/谋略家）
    202195:'思想人物',202196:'思想人物',202197:'思想人物',202198:'思想人物',202199:'思想人物',
    202200:'思想人物',202201:'思想人物',202220:'思想人物',
    // 文化人物（隐士/义士/美人/贤者）
    202127:'文化人物',202143:'文化人物',202144:'文化人物',202194:'文化人物',202217:'文化人物',202218:'文化人物',
    // 科技人物（医者）
    202177:'科技人物'
  };
  const d202c = load(f202);
  let cat202 = 0;
  (d202c.persons || []).forEach(p => {
    if ((p.level || 2) === 2 && L2_CAT_MAP_202[String(p.id)]) { p.category = L2_CAT_MAP_202[String(p.id)]; cat202++; }
  });
  save(f202, d202c);
  console.log('  dynasty_202 二级人物分类:', cat202, '/', (d202c.persons||[]).filter(p=>(p.level||2)===2).length);

  console.log('\n完成。');
}
main();