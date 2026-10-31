/**
 * 民国(dynasty_117)内容精修：40 个事件「事件经过」全部手写
 * 规则：每个事件 3-5 个阶段节点，顺序 起因 → 经过(可2个) → 转折(可选) → 结果
 *       title 4-7 字且无标点；description 20-40 字（去空白计）
 * 只写 events[].narratives，不改动 summary 等其他字段；可重复执行（幂等）
 * 用法: node scripts/fix_117_content.js
 */
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'frontend', 'public', 'data', 'dynasty_117.json');

function load() { return JSON.parse(fs.readFileSync(FILE, 'utf-8')); }
function save(o) { fs.writeFileSync(FILE, JSON.stringify(o, null, 2), 'utf-8'); }

const EVENT_NARRATIVES = {
  117301: [ // 二次革命
    { tag: '起因', title: '宋案激起', description: '宋教仁遇刺，袁世凯向五国银行团大借款，革命党人愤而起兵。' },
    { tag: '经过', title: '江西举兵', description: '李烈钧在湖口宣布独立，黄兴入南京督师，南方数省相继响应。' },
    { tag: '转折', title: '北洋压境', description: '北洋军分路南下，革命军兵力分散、饷械不继，战局迅速逆转。' },
    { tag: '结果', title: '革命失败', description: '讨袁军溃败，孙中山、黄兴等再度流亡日本，国民党被解散。' }
  ],
  117302: [ // 护国战争
    { tag: '起因', title: '帝制激起', description: '袁世凯承认日本二十一条后称帝，西南军政要员密谋反袁。' },
    { tag: '经过', title: '云南首义', description: '蔡锷等通电独立，组织护国军分路入川、入黔、入桂。' },
    { tag: '转折', title: '各省响应', description: '贵州、广西相继独立，北洋内部离心，帝制难以为继。' },
    { tag: '结果', title: '帝制取消', description: '袁世凯被迫撤销帝制，不久病逝，护国战争结束。' }
  ],
  117303: [ // 直奉战争
    { tag: '起因', title: '直奉争权', description: '直系与奉系在控制北京政府上矛盾激化，双方整军备战。' },
    { tag: '经过', title: '第一次交战', description: '1922年两军在山海关一带交战，奉军失利退回关外。' },
    { tag: '经过', title: '再起战端', description: '1924年直奉再战，冯玉祥临阵倒戈发动北京政变，直系瓦解。' },
    { tag: '结果', title: '奉系入关', description: '直系失败后奉军再度入关，与国民军共掌北京政局。' }
  ],
  117304: [ // 北伐战争
    { tag: '起因', title: '整合南方', description: '国民党改组后建立国民革命军，决定北上讨伐北洋各系。' },
    { tag: '经过', title: '两湖战场', description: '北伐军先取湖南、湖北，汀泗桥、贺胜桥连战皆捷，攻克武汉。' },
    { tag: '经过', title: '东南底定', description: '东路进军江浙，击溃孙传芳部，相继占领南京、上海。' },
    { tag: '转折', title: '宁汉分裂', description: '四一二后国民党内部分裂，北伐一度停顿，后继续北进。' },
    { tag: '结果', title: '北洋终结', description: '奉系退回关外，张学良宣布东北易帜，全国名义统一。' }
  ],
  117305: [ // 中原大战
    { tag: '起因', title: '裁军之争', description: '蒋介石推动编遣裁军，与阎锡山、冯玉祥、李宗仁矛盾激化。' },
    { tag: '经过', title: '联军反蒋', description: '阎冯桂等组成反蒋联军，在河南、山东与中央军激战。' },
    { tag: '转折', title: '张学良入关', description: '张学良通电拥蒋并率东北军入关，反蒋联军腹背受敌。' },
    { tag: '结果', title: '中央取胜', description: '联军溃败，阎冯下野，蒋介石地位进一步巩固。' }
  ],
  117306: [ // 九一八事变
    { tag: '起因', title: '蓄谋已久', description: '日本关东军蓄意制造事端，图谋侵占中国东北。' },
    { tag: '经过', title: '突袭沈阳', description: '日军炸毁南满铁路柳条湖段，当夜进攻北大营与沈阳城。' },
    { tag: '转折', title: '不抵抗方针', description: '东北当局执行不抵抗方针，日军数日内占沈阳并扩大进攻。' },
    { tag: '结果', title: '东北沦陷', description: '数月之间东北三省相继沦陷，日本扶植伪满洲国。' }
  ],
  117307: [ // 全面抗战
    { tag: '起因', title: '卢沟桥畔', description: '日军挑起卢沟桥事变，进攻北平，中国守军奋起抵抗。' },
    { tag: '经过', title: '淞沪会战', description: '国民政府调集重兵于上海作战，粉碎日军速战速决的企图。' },
    { tag: '经过', title: '持久相持', description: '南京、武汉相继失守后，国民政府迁渝，转入持久抗战。' },
    { tag: '转折', title: '国际变局', description: '太平洋战争爆发，中国与美英结盟，抗战纳入世界战场。' },
    { tag: '结果', title: '日本投降', description: '1945年日本宣布无条件投降，中国取得抗战胜利。' }
  ],
  117308: [ // 台儿庄战役
    { tag: '起因', title: '徐州门户', description: '日军南北夹击徐州，台儿庄成为必争的战略要点。' },
    { tag: '经过', title: '死守庄内', description: '守军与日军在庄内展开巷战，反复争夺，伤亡惨重。' },
    { tag: '转折', title: '外围合围', description: '第五战区调集部队完成外线包围，对日军形成夹击。' },
    { tag: '结果', title: '正面大捷', description: '日军溃退，中国取得正面战场首次重大胜利。' }
  ],
  117309: [ // 袁世凯称帝
    { tag: '起因', title: '帝制鼓吹', description: '袁氏授意筹安会鼓吹君主立宪，制造恢复帝制的舆论。' },
    { tag: '经过', title: '拥戴推举', description: '各省代表与所谓国民代表大会投票拥戴袁世凯为皇帝。' },
    { tag: '转折', title: '改元洪宪', description: '1916年改元洪宪，遭西南独立与列强观望，内外交困。' },
    { tag: '结果', title: '帝制收场', description: '被迫撤销帝制，恢复民国年号，袁氏威望尽失。' }
  ],
  117310: [ // 护法运动
    { tag: '起因', title: '约法被弃', description: '段祺瑞拒绝恢复《临时约法》与国会，孙中山倡议护法。' },
    { tag: '经过', title: '南下组府', description: '孙中山南下广州，联合西南军阀组织护法军政府。' },
    { tag: '转折', title: '军阀掣肘', description: '西南军阀与北洋妥协，孙中山被排挤，护法难以为继。' },
    { tag: '结果', title: '运动失败', description: '孙中山离粤赴沪，护法运动未能恢复约法与国会。' }
  ],
  117311: [ // 国民党改组
    { tag: '起因', title: '屡挫求变', description: '国民党历经失败，孙中山决心改组以重振革命力量。' },
    { tag: '经过', title: '联俄联共', description: '接受苏俄援助与中共合作，确立联俄、联共、扶助农工。' },
    { tag: '经过', title: '黄埔建军', description: '创办黄埔军校，建立党军，培养革命军事骨干。' },
    { tag: '结果', title: '组织一新', description: '召开一大，建立中央执行委员会与地方党部，面目一新。' }
  ],
  117312: [ // 宁汉分裂
    { tag: '起因', title: '路线分歧', description: '北伐后国民党内左右派在容共与分共问题上分歧激化。' },
    { tag: '经过', title: '四一二政变', description: '蒋介石在上海发动清党，另立南京国民政府。' },
    { tag: '转折', title: '宁汉对峙', description: '武汉与南京两个中央各自标榜正统，党务军务陷于分裂。' },
    { tag: '结果', title: '宁汉合流', description: '双方妥协合流，左派失势，国共合作全面破裂。' }
  ],
  117313: [ // 东北易帜
    { tag: '起因', title: '皇姑屯变', description: '张作霖在皇姑屯被日军炸死，张学良继掌东北军政。' },
    { tag: '经过', title: '权衡去就', description: '日本多方阻挠，张学良权衡局势，倾向归附南京中央。' },
    { tag: '转折', title: '通电易帜', description: '1928年底宣布东北易帜，改挂青天白日旗，服从国民政府。' },
    { tag: '结果', title: '名义统一', description: '东北纳入南京政权体系，全国实现形式上的统一。' }
  ],
  117314: [ // 西安事变
    { tag: '起因', title: '剿共受挫', description: '东北军、西北军与红军作战失利，将士要求停止内战。' },
    { tag: '经过', title: '临潼扣蒋', description: '张学良、杨虎城在临潼扣押蒋介石，通电提出抗日主张。' },
    { tag: '转折', title: '和平斡旋', description: '中共主张和平解决，周恩来等赴西安谈判，力促事态缓和。' },
    { tag: '结果', title: '转向抗战', description: '蒋介石接受停止内战、联共抗日，事变成抗战转折点。' }
  ],
  117315: [ // 重庆谈判
    { tag: '起因', title: '胜利之后', description: '抗战胜利后，国共在受降与政权问题上矛盾凸显。' },
    { tag: '经过', title: '电邀赴渝', description: '蒋介石三次电邀毛泽东赴重庆，商讨和平建国大计。' },
    { tag: '转折', title: '焦点分歧', description: '军队整编与解放区政权成为谈判焦点，双方反复博弈。' },
    { tag: '结果', title: '双十协定', description: '国共签署《双十协定》，和平建国未及落实即起内战。' }
  ],
  117316: [ // 新文化运动
    { tag: '起因', title: '共和受挫', description: '民国初年政治乱象使知识分子转向思想文化层面寻求变革。' },
    { tag: '经过', title: '青年高举', description: '陈独秀创办《新青年》，提倡民主、科学与新文学。' },
    { tag: '转折', title: '文学革命', description: '胡适发表文学改良主张，白话文运动随之兴起。' },
    { tag: '结果', title: '思想转型', description: '新文化运动推动思想解放，为五四与马克思主义传播开路。' }
  ],
  117317: [ // 北大改革
    { tag: '起因', title: '旧学积弊', description: '北大沿袭旧式官僚习气，学风不振，亟需整顿。' },
    { tag: '经过', title: '延揽新学', description: '蔡元培出任校长，聘陈独秀、胡适等新派学者任教。' },
    { tag: '转折', title: '兼容并包', description: '确立思想自由、兼容并包方针，新旧各派并立讲坛。' },
    { tag: '结果', title: '学风一新', description: '北大成为新文化运动的中心与全国学术重镇。' }
  ],
  117318: [ // 五四运动
    { tag: '起因', title: '山东危机', description: '巴黎和会决定将德国在山东权益转让日本，消息传回国内。' },
    { tag: '经过', title: '学生游行', description: '北京学生集会游行，提出外争主权、内除国贼的口号。' },
    { tag: '转折', title: '全国响应', description: '各地学生罢课、工人罢工、商人罢市，运动迅速蔓延。' },
    { tag: '结果', title: '拒签和约', description: '当局释放学生，中国代表最终拒签对德和约。' }
  ],
  117319: [ // 古史辨运动
    { tag: '起因', title: '疑古思潮', description: '新文化运动推动学术批判，传统古史体系受到质疑。' },
    { tag: '经过', title: '层累之说', description: '顾颉刚提出层累地造成古史说，引发学界大论战。' },
    { tag: '转折', title: '多方争鸣', description: '疑古与信古各方撰文辩论，论战文章汇编为《古史辨》。' },
    { tag: '结果', title: '史学转向', description: '古史辨推动史料批判，重塑现代中国史学的方法意识。' }
  ],
  117320: [ // 殷墟发掘
    { tag: '起因', title: '甲骨之惑', description: '甲骨文大量流出，其出土地与年代亟需科学验证。' },
    { tag: '经过', title: '田野发掘', description: '史语所在安阳小屯展开系统发掘，建立地层与类型方法。' },
    { tag: '转折', title: '大坑出土', description: 'YH127坑出土大量整版甲骨，殷商史事得以实证。' },
    { tag: '结果', title: '商史成真', description: '殷墟发掘把殷商由传说变为信史，奠定现代考古学。' }
  ],
  117321: [ // 乡村建设运动
    { tag: '起因', title: '农村凋敝', description: '军阀混战与灾荒使农村破产，知识界寻求乡村改良之路。' },
    { tag: '经过', title: '定县实验', description: '晏阳初以定县为试验场，推行平民教育与生计改良。' },
    { tag: '转折', title: '邹平乡建', description: '梁漱溟在邹平以乡农学校组织合作，尝试地方自治。' },
    { tag: '结果', title: '影响有限', description: '实验取得局部成效，却难敌时局动荡与制度性困境。' }
  ],
  117322: [ // 左联成立
    { tag: '起因', title: '文坛转向', description: '革命文学论争后，左翼作家亟需统一组织与纲领。' },
    { tag: '经过', title: '沪上结盟', description: '鲁迅、茅盾等在上海成立左翼作家联盟，创办机关刊物。' },
    { tag: '转折', title: '高压查禁', description: '国民党当局查禁刊物、通缉作家，左联活动转入地下。' },
    { tag: '结果', title: '文学新潮', description: '左翼文学推动社会剖析创作，影响一代青年作者。' }
  ],
  117323: [ // 梅兰芳访美
    { tag: '起因', title: '京剧出海', description: '梅兰芳与齐如山等筹划赴美演出，向西方介绍京剧。' },
    { tag: '经过', title: '跨洋登台', description: '剧团在纽约、芝加哥等地演出，场场引起关注。' },
    { tag: '转折', title: '学界评议', description: '美国学界与媒体研讨京剧程式，肯定其艺术价值。' },
    { tag: '结果', title: '声名远播', description: '访问使京剧进入世界舞台，提升中国戏曲的国际声誉。' }
  ],
  117324: [ // 本位文化论战
    { tag: '起因', title: '西化反思', description: '全盘西化主张流行，引发对本土文化出路的争论。' },
    { tag: '经过', title: '十教授宣言', description: '王新命等发表中国本位的文化建设宣言，主张文化重建。' },
    { tag: '转折', title: '各方回应', description: '西化派与本位派著文交锋，讨论传统与现代的关系。' },
    { tag: '结果', title: '论争未已', description: '论战推动文化取向的反思，分歧延续至后世学界。' }
  ],
  117325: [ // 中研院成立
    { tag: '起因', title: '科研散落', description: '近代科研机构零散，亟需国家层面的学术中枢。' },
    { tag: '经过', title: '筹设建院', description: '南京国民政府设立中央研究院，蔡元培出任院长。' },
    { tag: '转折', title: '分所并举', description: '陆续设立物理、化学、气象、历史语言等研究所。' },
    { tag: '结果', title: '学术建制', description: '中研院成为全国最高学术机构，奠定科研建制基础。' }
  ],
  117326: [ // 侯氏制碱
    { tag: '起因', title: '洋碱垄断', description: '纯碱长期依赖进口，民族工业受制于外资垄断。' },
    { tag: '经过', title: '永利建厂', description: '范旭东创办永利碱厂，侯德榜主持技术攻关。' },
    { tag: '转折', title: '突破工艺', description: '侯德榜改进索尔维法，创制联合制碱新工艺。' },
    { tag: '结果', title: '侯氏碱法', description: '新法在世界范围推广，中国制碱工业实现自主。' }
  ],
  117327: [ // 钱塘江大桥
    { tag: '起因', title: '江防急需', description: '浙赣交通受钱塘江阻隔，抗战备战亟需跨江通道。' },
    { tag: '经过', title: '自主设计', description: '茅以升主持设计施工，采用气压沉箱与钢桁结构。' },
    { tag: '转折', title: '战火逼近', description: '大桥建成不久，日军逼近杭州，工程面临毁弃抉择。' },
    { tag: '结果', title: '炸桥御敌', description: '为阻日军南下，建设者忍痛炸毁大桥，战后重建。' }
  ],
  117328: [ // 巴黎和会
    { tag: '起因', title: '战胜国列席', description: '一战结束，中国以战胜国身份出席巴黎和会。' },
    { tag: '经过', title: '力争主权', description: '顾维钧等据理力争，要求收回山东权益与废除不平等条约。' },
    { tag: '转折', title: '列强私相授受', description: '列强将德国在山东权益让予日本，中国诉求落空。' },
    { tag: '结果', title: '拒签和约', description: '消息传回国内引发五四运动，中国代表拒签对德和约。' }
  ],
  117329: [ // 华盛顿会议
    { tag: '起因', title: '远东秩序', description: '列强为调整远东与海军军备，召开华盛顿会议。' },
    { tag: '经过', title: '边缘席位', description: '中国参会但地位有限，提出关税与治外法权等要求。' },
    { tag: '转折', title: '山东交涉', description: '中日就山东问题展开会谈，中国收回部分权益。' },
    { tag: '结果', title: '有限收回', description: '会议签订《九国公约》，中国收回山东主权但受多方约束。' }
  ],
  117330: [ // 修约外交
    { tag: '起因', title: '条约束缚', description: '不平等条约体系束缚中国主权，朝野要求修约。' },
    { tag: '经过', title: '分别交涉', description: '北京政府与列强分别谈判，争取关税与领事裁判权调整。' },
    { tag: '转折', title: '进展有限', description: '列强以政局动荡为由拖延，修约成果十分有限。' },
    { tag: '结果', title: '承前启后', description: '修约努力为南京国民政府时期的废约外交积累经验。' }
  ],
  117331: [ // 中苏互不侵犯条约
    { tag: '起因', title: '外患加深', description: '日本侵华步步紧逼，中国亟需争取国际支持。' },
    { tag: '经过', title: '中苏谈判', description: '国民政府与苏联磋商互助，签订互不侵犯条约。' },
    { tag: '转折', title: '苏联援华', description: '条约签订后苏联提供贷款与军械，援华物资陆续东运。' },
    { tag: '结果', title: '外交支撑', description: '条约在抗战初期为中国提供了重要外部支援。' }
  ],
  117332: [ // 平等新约
    { tag: '起因', title: '废约呼声', description: '太平洋战争爆发后，废除不平等条约的呼声高涨。' },
    { tag: '经过', title: '中美英谈判', description: '中国与美英等国就取消治外法权等展开谈判。' },
    { tag: '转折', title: '签约实现', description: '1943年签订新约，取消在华治外法权与租界特权。' },
    { tag: '结果', title: '主权恢复', description: '百年不平等条约体系被撕开缺口，国际地位提升。' }
  ],
  117333: [ // 开罗宣言
    { tag: '起因', title: '战时协商', description: '盟国商讨战后对日安排，中国以大国身份参与。' },
    { tag: '经过', title: '三国会谈', description: '蒋介石与罗斯福、丘吉尔在开罗会晤，商定战后处置。' },
    { tag: '转折', title: '明文宣示', description: '宣言规定日本归还窃取的中国领土，包括东北与台湾。' },
    { tag: '结果', title: '法理依据', description: '开罗宣言成为战后中国收复失地的重要国际法依据。' }
  ],
  117334: [ // 关税自主
    { tag: '起因', title: '关税受制', description: '协定关税使中国失去税率自主，财政与产业深受其害。' },
    { tag: '经过', title: '交涉宣示', description: '国民政府与列强谈判，宣布恢复关税自主权。' },
    { tag: '转折', title: '分国签约', description: '先后与各国分别签订新约，逐步取得税率自主。' },
    { tag: '结果', title: '财政增收', description: '关税收入显著增加，为经济建设提供财力支持。' }
  ],
  117335: [ // 法币改革
    { tag: '起因', title: '币制混乱', description: '银本位下货币混乱、白银外流，金融形势严峻。' },
    { tag: '经过', title: '统一发行', description: '国民政府发行法币，禁止白银流通，统一货币发行。' },
    { tag: '转折', title: '信用初立', description: '法币初行稳定物价，后因财政赤字而依赖增发。' },
    { tag: '结果', title: '通胀隐忧', description: '抗战与内战时期法币急剧贬值，酿成恶性通胀。' }
  ],
  117336: [ // 国民经济建设运动
    { tag: '起因', title: '建设呼声', description: '南京国民政府推动经济建设，号召国民参与生产。' },
    { tag: '经过', title: '多方推进', description: '提倡造林、开矿、交通与合作社，各地设立机构。' },
    { tag: '转折', title: '战前筹备', description: '运动为抗战前的工业与交通建设作了物质准备。' },
    { tag: '结果', title: '成效有限', description: '受政局与战事影响，运动成效有限但影响深远。' }
  ],
  117337: [ // 工业内迁
    { tag: '起因', title: '沿海危机', description: '战火逼近沿海工业区，工厂设备面临资敌之危。' },
    { tag: '经过', title: '抢运西迁', description: '政府组织工厂、学校与物资沿长江向西南迁移。' },
    { tag: '转折', title: '艰难复工', description: '设备辗转川滇，工人重建厂房，在轰炸中坚持生产。' },
    { tag: '结果', title: '后方支撑', description: '内迁工业支撑战时军需民用，改变中国工业布局。' }
  ],
  117338: [ // 江淮水灾
    { tag: '起因', title: '暴雨成灾', description: '1931年江淮流域持续暴雨，江河水位暴涨。' },
    { tag: '经过', title: '堤防溃决', description: '高邮、芜湖等地堤坝相继溃决，洪水淹没大片农田。' },
    { tag: '转折', title: '赈济艰难', description: '政府与社会团体组织赈济，灾民流离，疫病流行。' },
    { tag: '结果', title: '灾情惨重', description: '受灾人口数以千万计，暴露水利与救济体系的薄弱。' }
  ],
  117339: [ // 花园口决堤
    { tag: '起因', title: '阻敌西进', description: '日军沿陇海线西进，当局决定以水代兵阻滞其攻势。' },
    { tag: '经过', title: '掘堤放水', description: '1938年在郑州花园口掘开黄河大堤，洪水向东南泛滥。' },
    { tag: '转折', title: '未阻日军', description: '洪水未能阻止日军进攻武汉，反而淹没豫皖苏大片地区。' },
    { tag: '结果', title: '黄泛区生', description: '数十万民众死亡，黄泛区形成，生态与社会长期受创。' }
  ],
  117340: [ // 中原大饥荒
    { tag: '起因', title: '天灾人祸', description: '战乱与征粮之下，河南又遭旱灾与蝗灾，粮食锐减。' },
    { tag: '经过', title: '饥荒蔓延', description: '灾情沿陇海线蔓延，灾民以树皮草根充饥，饿殍遍野。' },
    { tag: '转折', title: '赈济受阻', description: '战时交通与征粮制度阻碍救济，消息经外媒披露。' },
    { tag: '结果', title: '惨痛教训', description: '数百万生命损失，成为战时社会苦难的深刻印记。' }
  ]
};

const d = load();
let applied = 0;
const missing = [];
for (const e of d.events || []) {
  const nodes = EVENT_NARRATIVES[e.id];
  if (nodes) { e.narratives = nodes.map(n => ({ year: e.start_year, ...n })); applied++; }
  else missing.push(e.name);
}
save(d);

const len = s => String(s || '').replace(/\s/g, '').length;
const badTitle = [];
const badLen = [];
Object.entries(EVENT_NARRATIVES).forEach(([id, nodes]) => {
  nodes.forEach(n => {
    if (n.title.length < 4 || n.title.length > 7 || /[，。、；：！？“”（）《》]/.test(n.title)) badTitle.push(`${id}/${n.title}`);
    if (len(n.description) < 20 || len(n.description) > 40) badLen.push(`${id}/${n.title}(${len(n.description)})`);
  });
});
console.log(`事件经过已写入：${applied}/${Object.keys(EVENT_NARRATIVES).length} 个事件`);
console.log('未覆盖事件：' + (missing.length ? missing.join('、') : '无'));
console.log('标题不合规：' + (badTitle.length ? badTitle.join('；') : '无'));
console.log('描述字数越界：' + (badLen.length ? badLen.join('；') : '无'));
