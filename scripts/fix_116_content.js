/**
 * 清朝(dynasty_116)内容精修：38 个事件「事件经过」全部手写
 * 规则：每个事件 3-5 个阶段节点，顺序 起因 → 经过(可2个) → 转折(可选) → 结果
 *       title 4-7 字且无标点；description 20-40 字（去空白计）
 * 只写 events[].narratives，不改动 summary 等其他字段；可重复执行（幂等）
 * 用法: node scripts/fix_116_content.js
 */
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'frontend', 'public', 'data', 'dynasty_116.json');

function load() { return JSON.parse(fs.readFileSync(FILE, 'utf-8')); }
function save(o) { fs.writeFileSync(FILE, JSON.stringify(o, null, 2), 'utf-8'); }

const EVENT_NARRATIVES = {
  116301: [ // 后金建立（清朝前身）
    { tag: '起因', title: '女真分裂', description: '女真诸部林立，明朝分而治之，努尔哈赤逐步统一。' },
    { tag: '经过', title: '统一建州', description: '努尔哈赤以十三副遗甲起兵，逐步统一建州女真诸部。' },
    { tag: '经过', title: '八旗创制', description: '他整编军民为八旗，以旗统兵，创制满文并设官理讼。' },
    { tag: '转折', title: '称汗建国', description: '1616年在赫图阿拉称汗，国号后金，建元天命。' },
    { tag: '结果', title: '与明对峙', description: '后金建立后公开与明朝分庭抗礼，成为清朝政权前身。' }
  ],
  116302: [ // 萨尔浒之战
    { tag: '起因', title: '后金崛起', description: '努尔哈赤统一女真各部后公开反明，明朝决意调兵进剿。' },
    { tag: '经过', title: '四路进兵', description: '1619年杨镐分兵四路，合击赫图阿拉，企图一举破金。' },
    { tag: '转折', title: '各个击破', description: '努尔哈赤集中八旗主力，五日之内连破三路明军。' },
    { tag: '结果', title: '明军大败', description: '明军损失惨重，辽东攻守之势逆转，后金转入进攻。' }
  ],
  116303: [ // 皇太极称帝
    { tag: '起因', title: '后金壮大', description: '皇太极继位后降服朝鲜、收服漠南蒙古，外部压力减轻。' },
    { tag: '经过', title: '改号大清', description: '1636年皇太极在盛京称帝，改国号为大清，改元崇德。' },
    { tag: '转折', title: '仿明设官', description: '设内三院与六部都察院，削弱八旗贝勒共治的旧传统。' },
    { tag: '结果', title: '皇权集中', description: '汗权集中，八旗蒙古与汉军扩编，多元帝国框架初成。' }
  ],
  116304: [ // 松锦之战
    { tag: '起因', title: '锦州被围', description: '1640年清军围困锦州，明朝调集洪承畴等部北上救援。' },
    { tag: '经过', title: '明军驰援', description: '洪承畴率八总兵十三万大军自宁远北上，与清军对峙。' },
    { tag: '转折', title: '粮道被断', description: '清军截断明军粮道，松山、锦州相继被围，军心动摇。' },
    { tag: '结果', title: '关外尽失', description: '1642年松山城破，洪承畴、祖大寿降清，宁锦防线瓦解。' }
  ],
  116305: [ // 清军入关
    { tag: '起因', title: '北京陷落', description: '1644年李自成攻入北京，明朝覆亡，北方出现权力真空。' },
    { tag: '经过', title: '三桂请兵', description: '吴三桂据守山海关，向多尔衮请兵，清军乘机南下。' },
    { tag: '经过', title: '山海关战', description: '清军入关与吴三桂合兵，在山海关击败李自成的大顺军。' },
    { tag: '转折', title: '定都北京', description: '多尔衮率军直入北京，顺治帝随即迁都，定鼎中原。' },
    { tag: '结果', title: '全国政权', description: '清朝由东北地方政权转为全国王朝，开始建立中原统治。' }
  ],
  116306: [ // 三藩之乱
    { tag: '起因', title: '三藩势大', description: '三藩握有重兵财权与地方人事权，与中央矛盾日益激化。' },
    { tag: '经过', title: '撤藩令下', description: '康熙帝决定撤藩，吴三桂于1673年首先在云南起兵。' },
    { tag: '经过', title: '叛军响应', description: '耿精忠、尚之信等相继响应，战火波及南方多省。' },
    { tag: '转折', title: '分化瓦解', description: '康熙帝坚持平叛，对叛军分化招抚，逐步扭转战局。' },
    { tag: '结果', title: '攻破昆明', description: '清军历时八年攻破昆明，三藩割据终结，南方秩序重建。' }
  ],
  116307: [ // 统一台湾
    { tag: '起因', title: '郑氏据台', description: '郑氏政权退据台湾，长期与清朝隔海对峙，海疆未定。' },
    { tag: '经过', title: '施琅督师', description: '康熙帝命施琅率水师进取台湾，整军备战于福建沿海。' },
    { tag: '转折', title: '澎湖决战', description: '1683年清军在澎湖击败郑氏水师主力，郑克塽投降。' },
    { tag: '结果', title: '设府治台', description: '清朝设台湾府隶福建省，台湾纳入版图，海防体系建立。' }
  ],
  116308: [ // 尼布楚条约
    { tag: '起因', title: '雅克萨冲突', description: '沙俄东扩侵入黑龙江流域，清朝出兵围攻雅克萨，冲突不断。' },
    { tag: '经过', title: '军事施压', description: '雅克萨之战后清朝在军事上占优，俄方补给困难，愿意议和。' },
    { tag: '转折', title: '尼布楚谈判', description: '1689年双方在尼布楚谈判，索额图等代表清廷签约。' },
    { tag: '结果', title: '划定边界', description: '条约划定中俄东段边界，黑龙江流域归中国，边疆暂安。' }
  ],
  116309: [ // 多伦会盟
    { tag: '起因', title: '喀尔喀南迁', description: '准噶尔进攻漠北，喀尔喀蒙古各部南迁，向清朝归附求援。' },
    { tag: '经过', title: '多伦会盟', description: '1691年康熙帝与喀尔喀各部首领在多伦诺尔举行会盟。' },
    { tag: '转折', title: '编旗设爵', description: '清廷仿内蒙古编旗之制，赐封爵位，划定各部牧地。' },
    { tag: '结果', title: '纳入管辖', description: '喀尔喀蒙古由临时归附转为制度性管辖，北部边疆巩固。' }
  ],
  116310: [ // 军机处设立
    { tag: '起因', title: '西北用兵', description: '雍正初年西北用兵，军报频仍，需要快速统一的中枢调度。' },
    { tag: '经过', title: '设军机处', description: '1729年雍正帝设办理军机处，军机大臣由皇帝简派承旨。' },
    { tag: '结果', title: '中枢定型', description: '军机处取代议政王大臣会议，皇权专制与文书行政定型。' }
  ],
  116311: [ // 改土归流
    { tag: '起因', title: '土司割据', description: '西南土司世袭割据，与中央集权矛盾长期存在，治理受阻。' },
    { tag: '经过', title: '鄂尔泰推行', description: '1726年起鄂尔泰在云贵等地推行改土归流，废除土司。' },
    { tag: '转折', title: '武力改流', description: '对抗拒改流者，清廷调兵进剿，事平后改设流官治理。' },
    { tag: '结果', title: '编户纳赋', description: '土民由土司属民转为国家编户，西南赋税纳入中央体系。' }
  ],
  116312: [ // 驻藏大臣设立
    { tag: '起因', title: '西藏纷争', description: '西藏内部纷争不断，准噶尔威胁仍在，清朝决定直接介入。' },
    { tag: '经过', title: '派驻大臣', description: '雍正五年清廷正式设立驻藏大臣，遣官常驻拉萨总理藏务。' },
    { tag: '结果', title: '共治西藏', description: '驻藏大臣与达赖、班禅共同治理，西藏政务纳入中央体系。' }
  ],
  116313: [ // 平定准回
    { tag: '起因', title: '准部内乱', description: '准噶尔部内乱，大小和卓割据南疆，清朝决意经略西北。' },
    { tag: '经过', title: '进兵天山', description: '1755年起清军分路深入天山南北，逐一击破准部与回部。' },
    { tag: '转折', title: '两部和卓', description: '大小和卓据守叶尔羌等地抗拒，清军转战数年后平定。' },
    { tag: '结果', title: '新疆建治', description: '天山南北纳入版图，清廷设官驻军屯田，治理体系建立。' }
  ],
  116314: [ // 四库全书编纂
    { tag: '起因', title: '文治需要', description: '乾隆帝欲汇集历代典籍，掌控学术话语，彰显文治气象。' },
    { tag: '经过', title: '开馆编纂', description: '1773年开馆编书，分经史子集四部，学者参与抄录校勘。' },
    { tag: '转折', title: '禁毁删改', description: '修书同时查禁违碍书籍，大量典籍被禁毁或删改。' },
    { tag: '结果', title: '七阁分藏', description: '全书抄录七部藏于南北七阁，古籍得以系统保存。' }
  ],
  116315: [ // 红楼梦问世
    { tag: '起因', title: '家族兴衰', description: '曹雪芹出身江宁织造世家，家族败落后迁居北京，生活困顿。' },
    { tag: '经过', title: '十年创作', description: '他在困顿中以贾府兴衰为线索，写成《红楼梦》前八十回。' },
    { tag: '转折', title: '抄本流传', description: '全书以抄本在士人中流传，脂砚斋等批语随之出现。' },
    { tag: '结果', title: '程高刊行', description: '乾隆五十六年程伟元、高鹗排印一百二十回本，小说广泛流行。' }
  ],
  116316: [ // 马戛尔尼使华
    { tag: '起因', title: '英使来华', description: '英国以祝寿为名派马戛尔尼使团来华，要求开放口岸通商。' },
    { tag: '经过', title: '礼仪之争', description: '清廷与英使围绕觐见礼仪争执，最终以单膝跪礼折中。' },
    { tag: '转折', title: '承德接见', description: '1793年乾隆帝在承德接见使团，英方通商要求被逐一回绝。' },
    { tag: '结果', title: '通商被拒', description: '使团南返，清廷以与天朝体制不合拒绝全部要求，交涉告终。' }
  ],
  116317: [ // 广州十三行贸易
    { tag: '起因', title: '开海设关', description: '康熙二十四年开海贸易，清廷在广州设粤海关管理外贸。' },
    { tag: '经过', title: '行商成形', description: '十三行作为官方外贸团体逐步成形，行商居中管理交易。' },
    { tag: '转折', title: '一口通商', description: '乾隆二十二年实行一口通商，广州成为唯一对欧美口岸。' },
    { tag: '结果', title: '特权废除', description: '鸦片战争后五口通商，十三行的外贸垄断特权被废除。' }
  ],
  116318: [ // 文字狱
    { tag: '起因', title: '华夷之辨', description: '清朝以满洲贵族统治汉地，对华夷之辨与反清话语高度敏感。' },
    { tag: '经过', title: '三朝屡兴', description: '康熙、雍正、乾隆三朝屡兴文狱，庄廷鑨、戴名世等案震动士林。' },
    { tag: '转折', title: '四库查禁', description: '乾隆朝借编《四库全书》查禁违碍书籍，株连作者与刻书者。' },
    { tag: '结果', title: '转向考据', description: '士人为避祸埋头考据，思想表达空间收窄，文化控制定型。' }
  ],
  116319: [ // 白莲教起义
    { tag: '起因', title: '吏治败坏', description: '乾隆晚年吏治腐败，地方控制松动，白莲教在民间秘密传播。' },
    { tag: '经过', title: '川楚起事', description: '嘉庆元年白莲教在川楚陕边境起事，清廷调集多省兵力镇压。' },
    { tag: '转折', title: '山地流转', description: '起义军依托山区流动作战，清军疲于奔命，战事久拖不决。' },
    { tag: '结果', title: '九年平定', description: '战事历时九年，耗费约二亿两白银，清朝国力严重削弱。' }
  ],
  116320: [ // 鸦片输入与白银外流
    { tag: '起因', title: '英商走私', description: '英国商人以走私方式向中国输入鸦片，牟取高额利润。' },
    { tag: '经过', title: '输入激增', description: '1820年代约十八万箱，1830年代增至约三十四万箱。' },
    { tag: '转折', title: '银贵钱贱', description: '白银大量外流，银贵钱贱加重百姓负担，国家税收受损。' },
    { tag: '结果', title: '禁烟渐起', description: '道光帝命官员查究，始知走私为白银外流主因，禁烟呼声渐起。' }
  ],
  116321: [ // 鸦片战争
    { tag: '起因', title: '虎门销烟', description: '道光帝派林则徐赴广东禁烟，1839年虎门销毁收缴鸦片。' },
    { tag: '经过', title: '英军北上', description: '1840年英军自海路北上，攻陷定海，直逼大沽与南京。' },
    { tag: '经过', title: '清军屡败', description: '清军海防废弛，屡战失利，道光帝在战和之间摇摆。' },
    { tag: '转折', title: '签约求和', description: '1842年清廷被迫签订《南京条约》，割香港、赔款、开五口。' },
    { tag: '结果', title: '条约体系', description: '天朝体制被迫接受条约形式，中国开始被纳入不平等条约体系。' }
  ],
  116322: [ // 太平天国运动
    { tag: '起因', title: '拜上帝会', description: '洪秀全以拜上帝会动员民众，在两广山区积聚反清力量。' },
    { tag: '经过', title: '金田起义', description: '1851年洪秀全在广西金田起义，建号太平天国，北上进军。' },
    { tag: '经过', title: '定都天京', description: '1853年太平军攻占南京，定为天京，建立与清廷对峙的政权。' },
    { tag: '转折', title: '湘淮反攻', description: '清廷正规军溃败，曾国藩办湘军、李鸿章办淮军逐步反攻。' },
    { tag: '结果', title: '天京陷落', description: '1864年湘军攻陷天京，太平天国失败，湘淮系督抚在战争中崛起。' }
  ],
  116323: [ // 第二次鸦片战争
    { tag: '起因', title: '修约要求', description: '英法以修约为名提出扩大通商特权，清廷拒绝后战端再起。' },
    { tag: '经过', title: '攻陷大沽', description: '1858年英法联军攻陷大沽炮台，迫使清廷签订《天津条约》。' },
    { tag: '转折', title: '联军入京', description: '1860年英法联军攻入北京，焚毁圆明园，咸丰帝北逃热河。' },
    { tag: '结果', title: '北京条约', description: '恭亲王奕訢留京议和，签订《北京条约》，外国公使进驻北京。' }
  ],
  116324: [ // 辛酉政变
    { tag: '起因', title: '八臣辅政', description: '咸丰帝去世，遗命肃顺等八大臣赞襄政务，慈禧与奕訢不满。' },
    { tag: '经过', title: '联合奕訢', description: '慈禧与恭亲王奕訢联合，联络京内官员，密谋夺权。' },
    { tag: '转折', title: '逮捕八臣', description: '1861年政变发动，逮捕肃顺等八大臣，废除祺祥年号。' },
    { tag: '结果', title: '垂帘听政', description: '改元同治，两宫垂帘听政，奕訢以议政王主政，慈禧掌握最高权力。' }
  ],
  116325: [ // 洋务运动
    { tag: '起因', title: '内忧外患', description: '两次鸦片战争后清廷内外交困，洋务派以自强求富相号召。' },
    { tag: '经过', title: '创办军工', description: '曾国藩、李鸿章等创办近代军工企业，编练新式海陆军。' },
    { tag: '转折', title: '扩展民用', description: '洋务由军工扩展至轮船、煤矿、铁厂与纺织等民用领域。' },
    { tag: '结果', title: '甲午暴露', description: '甲午战败后洋务成果与局限同时暴露，未能使清朝富强。' }
  ],
  116326: [ // 江南制造总局设立
    { tag: '起因', title: '自强需要', description: '洋务派以自强为名推动军工，清廷批准在上海设机器制造局。' },
    { tag: '经过', title: '收厂并局', description: '同治四年曾国藩、李鸿章收购美商旗记铁厂，并入两洋炮局。' },
    { tag: '结果', title: '军工译书', description: '总局制造枪炮弹药与轮船，附设翻译馆广方言馆，译印西书。' }
  ],
  116327: [ // 京师同文馆设立
    { tag: '起因', title: '交涉需才', description: '总理衙门办理对外交涉急需译才，奕訢奏请设立外语学堂。' },
    { tag: '经过', title: '设馆授课', description: '同治元年同文馆设立，先开英文、法文、俄文班，后增设算学等科。' },
    { tag: '结果', title: '并入大学堂', description: '1902年同文馆并入京师大学堂，官办新式教育由此延续。' }
  ],
  116328: [ // 收复新疆
    { tag: '起因', title: '阿古柏侵占', description: '阿古柏侵占新疆大部，沙俄又据伊犁，西北边疆危机深重。' },
    { tag: '经过', title: '抬棺进疆', description: '左宗棠以钦差大臣督办新疆军务，率军抬棺进疆，志在收复。' },
    { tag: '转折', title: '先北后南', description: '清军采取先北后南方略，先后收复乌鲁木齐、达坂城与吐鲁番。' },
    { tag: '结果', title: '全疆收复', description: '至1878年初，除伊犁外新疆全境收复，阿古柏势力覆灭。' }
  ],
  116329: [ // 丁戊奇荒
    { tag: '起因', title: '华北旱灾', description: '光绪初年华北持续大旱，山西、河南、陕西等地连年歉收。' },
    { tag: '经过', title: '赤地千里', description: '灾情蔓延至直隶山东，赤地千里，灾民鬻妻卖子流离失所。' },
    { tag: '结果', title: '赈济有限', description: '清廷蠲缓钱粮、开仓放赈，但仓储空虚，传统荒政收效有限。' }
  ],
  116330: [ // 中法战争
    { tag: '起因', title: '法国侵越', description: '法国侵略越南并进犯中国东南沿海，清廷下诏应战。' },
    { tag: '经过', title: '两路鏖战', description: '战争在越南北部与台湾两个战场展开，福建水师遭重创。' },
    { tag: '转折', title: '镇南关捷', description: '1885年冯子材在镇南关大败法军，取得陆路大捷。' },
    { tag: '结果', title: '乘胜即收', description: '清廷以乘胜即收为由议和，承认法国对越南的保护权。' }
  ],
  116331: [ // 甲午战争
    { tag: '起因', title: '朝鲜出兵', description: '日本借朝鲜东学党起义出兵，1894年丰岛海战爆发。' },
    { tag: '经过', title: '平壤黄海', description: '清军陆战败于平壤，黄海海战中北洋水师受挫，退守威海卫。' },
    { tag: '转折', title: '威海覆没', description: '1895年北洋水师困守威海卫，全军覆没，丁汝昌自尽。' },
    { tag: '结果', title: '马关条约', description: '清廷被迫签订《马关条约》，割台湾、赔二亿两，半殖民地化加深。' }
  ],
  116332: [ // 戊戌变法
    { tag: '起因', title: '甲午战败', description: '甲午战败后民族危机加深，康有为、梁启超等推动变法维新。' },
    { tag: '经过', title: '明定国是', description: '1898年6月光绪帝颁布明定国是诏，推行官制教育改革。' },
    { tag: '转折', title: '慈禧政变', description: '慈禧太后发动政变，囚禁光绪帝，变法诏令多被废止。' },
    { tag: '结果', title: '六君遇害', description: '谭嗣同等六君子被杀，康梁流亡，变法仅持续一百零三天。' }
  ],
  116333: [ // 义和团与八国联军
    { tag: '起因', title: '扶清灭洋', description: '义和团以扶清灭洋为口号，在山东、直隶一带迅速兴起。' },
    { tag: '经过', title: '进入京津', description: '义和团进入京津，围攻使馆与教堂，局势日益失控。' },
    { tag: '转折', title: '联军入侵', description: '慈禧借义和团之力对外宣战，八国联军攻陷天津、北京。' },
    { tag: '结果', title: '辛丑条约', description: '慈禧携光绪帝西逃西安，1901年清廷签订《辛丑条约》。' }
  ],
  116334: [ // 清末新政与预备立宪
    { tag: '起因', title: '辛丑之后', description: '《辛丑条约》签订后清廷统治危机加深，宣布推行新政。' },
    { tag: '经过', title: '推行新政', description: '设督办政务处，改革官制、编练新军、兴办学堂、奖励工商。' },
    { tag: '转折', title: '预备立宪', description: '1905年派五大臣出洋考察，1906年宣布预备仿行宪政。' },
    { tag: '结果', title: '皇族内阁', description: '1911年成立责任内阁，满族与皇族占多数，被讥为皇族内阁。' }
  ],
  116335: [ // 废科举
    { tag: '起因', title: '科举积弊', description: '科举取士积弊日深，新式学堂兴起，士人上升通道亟待调整。' },
    { tag: '经过', title: '督抚奏请', description: '袁世凯、张之洞等督抚联名奏请立停科举，清廷准奏。' },
    { tag: '结果', title: '立停科举', description: '自1906年起永远停止乡试会试与岁科考，科举制度终结。' }
  ],
  116336: [ // 京张铁路建成
    { tag: '起因', title: '收回路权', description: '清廷收回筑路权，在英俄相持中以不借外债、不用洋匠定案。' },
    { tag: '经过', title: '詹天佑主持', description: '1905年詹天佑主持京张铁路工程，自丰台至张家口穿越燕山。' },
    { tag: '转折', title: '人字线路', description: '他以人字形线路与竖井开凿法，解决八达岭坡度与隧道难题。' },
    { tag: '结果', title: '全线通车', description: '1909年京张铁路全线通车，为第一条国人自建的干线铁路。' }
  ],
  116337: [ // 东北鼠疫
    { tag: '起因', title: '疫情蔓延', description: '1910年冬鼠疫自满洲里经铁路沿线蔓延至哈尔滨等地。' },
    { tag: '经过', title: '伍连德受命', description: '清廷任命伍连德为全权总医官，赴东北主持防疫。' },
    { tag: '转折', title: '判定肺疫', description: '他经尸检确定此次为肺鼠疫，经飞沫传播，遂推行口罩防护。' },
    { tag: '结果', title: '四月控制', description: '铁路检疫、交通管制、隔离患者与集中火化并行，约四个月控制疫情。' }
  ],
  116338: [ // 武昌起义与清帝退位
    { tag: '起因', title: '保路风潮', description: '清廷皇族内阁与铁路国有引发保路风潮，湖北新军倾向革命。' },
    { tag: '经过', title: '武昌起义', description: '1911年10月10日武昌新军起义，占领武汉三镇，各省响应。' },
    { tag: '转折', title: '起用袁世凯', description: '清廷镇压不力，重新起用袁世凯，以北洋军南下镇压。' },
    { tag: '结果', title: '清帝退位', description: '1912年2月12日隆裕太后颁退位诏书，清朝统治结束。' }
  ]
};

// ---- 合规检查：标题 4-7 字无标点；描述 20-40 字（去空白）；节点 3-5 个 ----
const PUNCT = /[，。、；：！？,.;:!?"'“”‘’（）()《》〈〉—…·\s]/;
const VALID_TAGS = ['起因', '经过', '转折', '结果'];
const strip = s => String(s).replace(/\s+/g, '');
function validate() {
  const issues = [];
  Object.entries(EVENT_NARRATIVES).forEach(([id, arr]) => {
    if (arr.length < 3 || arr.length > 5) issues.push(`${id} 节点数=${arr.length}`);
    if (arr[0].tag !== '起因') issues.push(`${id} 首节点非起因`);
    if (arr[arr.length - 1].tag !== '结果') issues.push(`${id} 末节点非结果`);
    arr.forEach((n, i) => {
      if (!VALID_TAGS.includes(n.tag)) issues.push(`${id} 第${i + 1}节点 tag=${n.tag}`);
      if (n.title.length < 4 || n.title.length > 7) issues.push(`${id}「${n.title}」标题长度=${n.title.length}`);
      if (PUNCT.test(n.title)) issues.push(`${id}「${n.title}」标题含标点`);
      const len = strip(n.description).length;
      if (len < 20 || len > 40) issues.push(`${id}「${n.title}」描述字数=${len}`);
    });
  });
  return issues;
}

const d = load();
const issues = validate();
if (issues.length) {
  console.log('检出不规范条目：');
  issues.forEach(x => console.log('  ' + x));
}

let applied = 0;
const missing = [];
const dist = {};
for (const e of d.events) {
  const narr = EVENT_NARRATIVES[e.id];
  if (!narr) { missing.push(e.id + ' ' + e.name); continue; }
  e.narratives = narr.map(n => ({ year: e.start_year, tag: n.tag, title: n.title, description: n.description }));
  applied++;
  dist[narr.length] = (dist[narr.length] || 0) + 1;
}
save(d);

// ---- 复核输出 ----
const all = d.events.flatMap(e => e.narratives || []);
const punctTitles = all.filter(n => PUNCT.test(n.title)).length;
const descLen = all.map(n => strip(n.description).length);
const empty = d.events.filter(e => (e.narratives || []).length === 0);

console.log(`事件经过覆盖：${applied}/${d.events.length}`);
console.log('节点数分布：' + Object.keys(dist).sort().map(k => `${k}节点 ${dist[k]}个`).join('；'));
console.log(`narratives 总数：${all.length}`);
console.log(`标题含标点数：${punctTitles}`);
console.log(`标题长度 min/max：${Math.min(...all.map(n => n.title.length))}/${Math.max(...all.map(n => n.title.length))}`);
console.log(`描述字数 min/max：${Math.min(...descLen)}/${Math.max(...descLen)}`);
if (empty.length) console.log('仍无 narratives 的事件：' + empty.map(e => e.id + ' ' + e.name).join('；'));
if (missing.length) console.log('未覆盖事件（脚本内无条目）：' + missing.join('；'));
