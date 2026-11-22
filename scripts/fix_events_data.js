/**
 * 春秋(dynasty_202)事件数据补全脚本：
 *   #1 background：为晋阳之战/智氏灭亡/三家分晋补全经济/社会/文化/地理背景
 *   #2 person_groups：为所有事件补全 leaders/participants/opponents/affected，避免空分组
 *   #3 impacts：为所有事件补全 政治/历史/文化/社会 四个维度及完整文字描述（思维评分）
 * 用法: node scripts/fix_events_data.js
 */
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, '..', 'frontend', 'public', 'data');
const F = path.join(DIR, 'dynasty_202.json');
const data = JSON.parse(fs.readFileSync(F, 'utf-8'));

/* ---------- 按事件id的补全数据 ---------- */
const ENRICH = {
  /* ===== 202301 平王东迁 ===== */
  202301: {
    person_groups: {
      leaders: [{ name: '周平王', role: '主导者' }],
      participants: [
        { name: '秦襄公', role: '护驾东迁' },
        { name: '郑庄公', role: '诸侯拥戴' }
      ],
      opponents: [{ name: '申侯', role: '引戎破京' }],
      affected: [{ name: '周幽王', role: '身死国破' }]
    },
    impacts: [
      { name: '历史影响', score: 98, description: '标志着西周结束和东周开始。周王室的实际控制力逐渐下降，诸侯国的力量不断增强，春秋时期长期的诸侯争霸由此拉开序幕。' },
      { name: '政治影响', score: 96, description: '周王室权威大幅削弱，天子“天下共主”的地位名存实亡，诸侯开始竞相争夺对天下的主导权。' },
      { name: '社会影响', score: 85, description: '关中宗周旧地失守，大批贵族与百姓随王室东迁洛邑，人口与社会结构重新整合，诸侯国的自主性显著增强。' },
      { name: '文化影响', score: 88, description: '周礼仍是天下共尊的价值框架，但“尊王攘夷”逐渐成为诸侯争霸时高举的政治旗帜，礼制秩序开始松动。' }
    ]
  },

  /* ===== 202302 繻葛之战 ===== */
  202302: {
    person_groups: {
      leaders: [{ name: '郑庄公', role: '胜利方' }],
      participants: [
        { name: '祭仲', role: '郑国谋臣' },
        { name: '祝聃', role: '射王中肩' }
      ],
      opponents: [
        { name: '周桓王', role: '失败方' },
        { name: '蔡侯', role: '联军将领' },
        { name: '卫侯', role: '联军将领' }
      ],
      affected: [{ name: '周王室', role: '威望尽失' }]
    },
    impacts: [
      { name: '历史影响', score: 94, description: '郑国取得胜利，周天子的军事威望受到重大打击。此战成为春秋早期“王室衰微、诸侯强盛”的重要标志。' },
      { name: '政治影响', score: 95, description: '周天子“礼乐征伐自天子出”的权威被彻底打破，诸侯以实力为尊的政治格局正式确立。' },
      { name: '社会影响', score: 86, description: '“君不君、臣不臣”的现实动摇了西周以来的宗法等级观念，各国卿士与君主的关系随之发生深刻变化。' },
      { name: '文化影响', score: 89, description: '“射王中肩”成为礼崩乐坏的标志性事件，后世史家以此作为春秋王权衰落的重要文献佐证。' }
    ]
  },

  /* ===== 202303 齐桓公即位与管仲改革 ===== */
  202303: {
    person_groups: {
      leaders: [
        { name: '齐桓公', role: '明君' },
        { name: '管仲', role: '改革主持者' }
      ],
      participants: [
        { name: '鲍叔牙', role: '荐贤之功' },
        { name: '高傒', role: '拥立有功' },
        { name: '隰朋', role: '辅政大臣' }
      ],
      opponents: [
        { name: '公子小白', role: '争位失败者' },
        { name: '公子纠', role: '争位失败者' }
      ],
      affected: [
        { name: '国氏', role: '传统世卿受冲击' },
        { name: '宁戚', role: '布衣得用' }
      ]
    },
    impacts: [
      { name: '历史影响', score: 97, description: '管仲改革使齐国迅速崛起，为齐桓公“九合诸侯、一匡天下”的首霸地位奠定坚实基础。' },
      { name: '政治影响', score: 95, description: '“尊王攘夷”与“会盟称霸”的政治模式由此确立，深刻影响了此后春秋各国的外交与权力运作。' },
      { name: '社会影响', score: 88, description: '参其国而伍其鄙的户籍与士农工商分业政策，稳定了齐国社会秩序，促进了阶级流动。' },
      { name: '文化影响', score: 86, description: '“仓廪实而知礼节，衣食足而知荣辱”的治国理念，成为先秦经济思想与民本思想的重要源头。' }
    ]
  },

  /* ===== 202304 齐桓公伐楚 ===== */
  202304: {
    person_groups: {
      leaders: [
        { name: '齐桓公', role: '联军统帅' },
        { name: '管仲', role: '谋划师' }
      ],
      participants: [
        { name: '鲍叔牙', role: '联军将领' },
        { name: '申生', role: '参战诸侯' }
      ],
      opponents: [
        { name: '楚成王', role: '楚国君主' },
        { name: '屈完', role: '楚国使者' }
      ],
      affected: [{ name: '楚昭王', role: '楚国后继君主' }]
    },
    impacts: [
      { name: '历史影响', score: 93, description: '召陵会盟迫使楚国暂缓北进，齐桓公“尊王攘夷”的霸业达到顶峰，中原诸侯一度重新凝聚。' },
      { name: '政治影响', score: 92, description: '齐楚两大集团以会盟而非决战化解冲突，开创了春秋大国“以会盟定疆界”的外交先例。' },
      { name: '社会影响', score: 84, description: '中原诸侯在北御楚患的共同目标下加强联系，促进了诸侯国之间的会盟与联姻往来。' },
      { name: '文化影响', score: 85, description: '“风马牛不相及”等外交辞令流传后世，体现了春秋时期诸侯外交辞令文化的成熟。' }
    ]
  },

  /* ===== 202305 葵丘会盟 ===== */
  202305: {
    person_groups: {
      leaders: [{ name: '齐桓公', role: '盟主' }],
      participants: [
        { name: '管仲', role: '辅弼盟主' },
        { name: '晋献公', role: '与会诸侯' },
        { name: '宋襄公', role: '与会诸侯' }
      ],
      opponents: [{ name: '周襄王', role: '名义天子' }],
      affected: [{ name: '宰孔', role: '天子使者' }]
    },
    impacts: [
      { name: '历史影响', score: 95, description: '葵丘会盟标志齐桓公霸业达到顶峰，周襄王遣使赐胙，齐桓公“九合诸侯、一匡天下”的霸业臻于极盛。' },
      { name: '政治影响', score: 94, description: '会盟约定“尊王攘夷、诛不孝、无易树子、无以妾为妻”，确立了诸侯共同维护周礼秩序的政治公约。' },
      { name: '社会影响', score: 83, description: '盟约约束诸侯不得壅塞水利、不得阻碍粮食流通，一定程度上保障了各国百姓的生存环境。' },
      { name: '文化影响', score: 87, description: '葵丘之盟成为后世“霸主会盟”的典范，五霸会盟的礼制与辞令文化由此定型。' }
    ]
  },

  /* ===== 202306 重耳返晋即位 ===== */
  202306: {
    person_groups: {
      leaders: [
        { name: '晋文公', role: '归国即位' },
        { name: '狐偃', role: '流亡重臣' },
        { name: '赵衰', role: '流亡重臣' }
      ],
      participants: [
        { name: '狐突', role: '晋国旧臣' },
        { name: '秦穆公', role: '出兵送归' }
      ],
      opponents: [{ name: '郤芮', role: '反对派大夫' }],
      affected: [
        { name: '晋惠公（夷吾）', role: '被取代之君' },
        { name: '晋怀公', role: '被废之君' }
      ]
    },
    impacts: [
      { name: '历史影响', score: 96, description: '重耳返晋即位成为晋国由乱转治的转折点，此后晋国在晋文公治理下迅速崛起为春秋霸主。' },
      { name: '政治影响', score: 93, description: '晋文公推行“昭旧族、爱亲戚、明贤良、赏功劳”等政策，重建了晋国政治秩序与卿族格局。' },
      { name: '社会影响', score: 85, description: '十九年流亡经历使晋文公深知民间疾苦，其轻徭薄赋、劝课农桑的政策使晋国社会渐趋安定。' },
      { name: '文化影响', score: 86, description: '晋文公重用贤才、以德服人的形象成为后世明君典范，“退避三舍”等典故也由此传颂。' }
    ]
  },

  /* ===== 202307 介之推隐居绵山 ===== */
  202307: {
    person_groups: {
      leaders: [{ name: '晋文公', role: '封赏之主' }],
      participants: [
        { name: '狐偃', role: '受赏之臣' },
        { name: '介母', role: '随隐之母' }
      ],
      opponents: [{ name: '晋惠公（夷吾）', role: '前朝旧主' }],
      affected: [
        { name: '介之推', role: '功成身退' },
        { name: '狐突', role: '忠义之臣' }
      ]
    },
    impacts: [
      { name: '历史影响', score: 88, description: '介之推“不言禄”的高洁品格被《左传》《史记》反复书写，成为历代士人孤高自守的精神典范。' },
      { name: '政治影响', score: 80, description: '晋文公封赏功臣时“隐而死”，促使统治者反思赏罚之公，对后世封赏制度有所警醒。' },
      { name: '社会影响', score: 86, description: '寒食节纪念介之推的风俗深入民间，绵山由此成为纪念忠孝节义的重要文化圣地。' },
      { name: '文化影响', score: 90, description: '“士为知己者死”与“功成不必在我”的价值取向，深刻塑造了中国士人阶层的精神气质。' }
    ]
  },

  /* ===== 202308 城濮之战 ===== */
  202308: {
    person_groups: {
      leaders: [
        { name: '晋文公', role: '晋军统帅' },
        { name: '先轸', role: '晋军主将' }
      ],
      participants: [
        { name: '狐毛', role: '晋军上军将' },
        { name: '魏犨', role: '晋军将领' }
      ],
      opponents: [
        { name: '子玉', role: '楚军主将' },
        { name: '楚成王', role: '楚国君主' }
      ],
      affected: [{ name: '宋襄公', role: '受援诸侯' }]
    },
    impacts: [
      { name: '历史影响', score: 97, description: '晋文公通过城濮之战击败楚国，确立了晋国在中原的霸主地位，晋楚争霸的格局由此正式形成。' },
      { name: '政治影响', score: 95, description: '“退避三舍”以信义取胜的政治智慧赢得诸侯信任，晋国成为新一代天下霸主。' },
      { name: '社会影响', score: 84, description: '大战之后中原各国免除楚患之危，晋国霸权为中原诸侯提供了相对稳定的发展环境。' },
      { name: '文化影响', score: 88, description: '“退避三舍”成为守信重义、先礼后兵的经典典故，深刻影响了中国传统战争伦理与外交辞令。' }
    ]
  },

  /* ===== 202309 秦晋殽之战 ===== */
  202309: {
    person_groups: {
      leaders: [
        { name: '晋襄公', role: '晋军决策者' },
        { name: '先轸', role: '晋军主将' }
      ],
      participants: [
        { name: '孟明视', role: '秦军主帅' },
        { name: '西乞术', role: '秦军将领' },
        { name: '白乙丙', role: '秦军将领' }
      ],
      opponents: [{ name: '秦穆公', role: '秦军后援' }],
      affected: [
        { name: '晋文公', role: '新丧之君' },
        { name: '秦康公', role: '秦晋交恶后继者' }
      ]
    },
    impacts: [
      { name: '历史影响', score: 92, description: '殽之战使秦晋由同盟变为世仇，秦军东进受阻，转而西向称霸“霸西戎”，重塑了春秋大国格局。' },
      { name: '政治影响', score: 90, description: '晋国扼守崤函天险遏制秦人东进，确立了晋国“阻秦于西”的长期战略优势。' },
      { name: '社会影响', score: 82, description: '大战使秦晋两国百姓承受兵戈之祸，“师劳力竭”的教训警示后世慎战。' },
      { name: '文化影响', score: 84, description: '《左传》以“蹇叔哭师”记述此战，成为忠臣预见、劝谏君主的经典文学母题。' }
    ]
  },

  /* ===== 202310 赵穿弑晋灵公 ===== */
  202310: {
    person_groups: {
      leaders: [{ name: '赵穿', role: '弑君者' }],
      participants: [
        { name: '赵盾', role: '执政大夫' },
        { name: '公孙杵臼', role: '赵氏家臣' }
      ],
      opponents: [{ name: '屠岸贾', role: '灵公宠臣' }],
      affected: [{ name: '晋灵公', role: '被弑之君' }]
    },
    impacts: [
      { name: '历史影响', score: 89, description: '“赵盾弑其君”事件激化晋国公室与卿族矛盾，为后来晋国卿族坐大、君权旁落埋下伏笔。' },
      { name: '政治影响', score: 91, description: '执政大臣与君主兵戈相向，暴露了晋国君权衰微、卿权膨胀的深层危机。' },
      { name: '社会影响', score: 80, description: '君臣相残削弱了晋国社会对公室的向心力，卿族家臣势力随之抬头。' },
      { name: '文化影响', score: 93, description: '董狐直笔与孔子“书法不隐”的评语，树立了中国史学秉笔直书、直书其事的传统。' }
    ]
  },

  /* ===== 202311 董狐书“赵盾弑其君” ===== */
  202311: {
    person_groups: {
      leaders: [{ name: '董狐', role: '晋国史官' }],
      participants: [{ name: '赵穿', role: '弑君当事人' }],
      opponents: [{ name: '赵盾', role: '被书之执政' }],
      affected: [
        { name: '晋灵公', role: '被弑之君' },
        { name: '孔子', role: '后世评点者' }
      ]
    },
    impacts: [
      { name: '历史影响', score: 90, description: '董狐直笔成为中国古代史学“秉笔直书”精神的源头，被后世史家奉为直笔典范。' },
      { name: '政治影响', score: 86, description: '“法不阿贵、董狐直笔”警示权臣需对君主之死承担责任，强化了政治责任的伦理约束。' },
      { name: '社会影响', score: 78, description: '史官仗义执言的品格深入人心，提升了士人阶层敢于直谏的社会风骨。' },
      { name: '文化影响', score: 94, description: '“董狐之笔”成为史家操守的代名词，孔子赞其“古之良史也”，影响中国史学传统两千余年。' }
    ]
  },

  /* ===== 202312 楚庄王问鼎中原 ===== */
  202312: {
    person_groups: {
      leaders: [{ name: '楚庄王', role: '问鼎之主' }],
      participants: [
        { name: '伍举', role: '楚国大臣' },
        { name: '王孙满', role: '周室应答者' }
      ],
      opponents: [{ name: '楚灵王', role: '后世效仿者' }],
      affected: [{ name: '周定王', role: '周室天子' }]
    },
    impacts: [
      { name: '历史影响', score: 93, description: '“问鼎中原”彰显楚国北上争霸的雄心，成为楚国由南方大国迈向中原争霸的重要标志。' },
      { name: '政治影响', score: 92, description: '王孙满“在德不在鼎”的应答，为周王室挽回了颜面，也使楚庄王暂缓了对周天子的直接挑战。' },
      { name: '社会影响', score: 81, description: '楚庄王整顿内政、问鼎中原的举措增强了楚国凝聚力，中原百姓开始正视南方强国的崛起。' },
      { name: '文化影响', score: 90, description: '“问鼎中原”“在德不在鼎”成为汉语中追求权力与德政并重的经典成语与政治箴言。' }
    ]
  },

  /* ===== 202313 邲之战 ===== */
  202313: {
    person_groups: {
      leaders: [
        { name: '楚庄王', role: '楚军统帅' },
        { name: '荀林父', role: '晋军主帅' }
      ],
      participants: [
        { name: '子反', role: '楚军将领' },
        { name: '荀首', role: '晋军将领' }
      ],
      opponents: [{ name: '楚共王', role: '楚庄王后继者' }],
      affected: [
        { name: '荀罃', role: '被俘晋将' },
        { name: '郑襄公', role: '被围之君' }
      ]
    },
    impacts: [
      { name: '历史影响', score: 92, description: '邲之战使楚庄王确立中原霸权，晋国则遭遇晋文公以来最惨重失败，晋楚争霸的天平一度倒向楚国。' },
      { name: '政治影响', score: 91, description: '楚国“观兵于周疆、问鼎中原”之后又取得邲之捷，中原诸侯被迫重新权衡对晋楚两强的取舍。' },
      { name: '社会影响', score: 83, description: '战争揭示了晋军将帅不和、指挥失序的积弊，晋国战后掀起整军经武、重整卿族的风气。' },
      { name: '文化影响', score: 85, description: '“邲之战”与“城濮之战”并称晋楚争霸两大战役，成为研究春秋战争史与军事指挥的经典案例。' }
    ]
  },

  /* ===== 202314 鞍之战 ===== */
  202314: {
    person_groups: {
      leaders: [
        { name: '郤克', role: '晋军主帅' },
        { name: '晋景公', role: '晋国君主' }
      ],
      participants: [
        { name: '郤缺', role: '晋国大臣' },
        { name: '栾书', role: '晋军将领' }
      ],
      opponents: [{ name: '齐庄公', role: '齐国君主' }],
      affected: [
        { name: '齐顷公', role: '战败之君' },
        { name: '晏婴', role: '战后之臣' }
      ]
    },
    impacts: [
      { name: '历史影响', score: 90, description: '鞍之战重创齐国，晋国得以扭转邲之战后的颓势，重新确立对中原诸侯的威慑力。' },
      { name: '政治影响', score: 88, description: '齐国被迫与晋结盟、交出霸业余威，晋国在晋楚争霸中的外交空间随之扩大。' },
      { name: '社会影响', score: 81, description: '战败使齐顷公励精图治、轻徭薄赋，齐国社会在战后一度休养生息、重归安定。' },
      { name: '文化影响', score: 84, description: '“鞍之战”中御者与勇士的忠勇故事被《左传》生动记载，成为后世忠义文学的素材。' }
    ]
  },

  /* ===== 202315 士会返晋 ===== */
  202315: {
    person_groups: {
      leaders: [
        { name: '士会（范武子）', role: '归国执政' },
        { name: '晋景公', role: '晋国君主' }
      ],
      participants: [
        { name: '荀林父', role: '晋国执政' },
        { name: '郤缺', role: '促归之臣' }
      ],
      opponents: [{ name: '秦康公', role: '秦国之主' }],
      affected: [{ name: '士燮', role: '范氏后继者' }]
    },
    impacts: [
      { name: '历史影响', score: 87, description: '士会返晋后执掌国政、整肃纲纪，为晋国在晋楚争霸中重新崛起提供了政治与军事人才支撑。' },
      { name: '政治影响', score: 85, description: '晋国以智谋召回流亡秦国的人才，展现了春秋人才外交与治国用人的高超智慧。' },
      { name: '社会影响', score: 79, description: '士会推行明德慎罚、以和为贵的治国方略，使晋国上下风气趋于宽和有序。' },
      { name: '文化影响', score: 86, description: '士会家族开创范氏一系，其后人范宣子、范鞅等相继执政，深刻影响晋国卿族政治文化。' }
    ]
  },

  /* ===== 202316 鄢陵之战 ===== */
  202316: {
    person_groups: {
      leaders: [
        { name: '晋厉公', role: '晋军统帅' },
        { name: '栾书', role: '晋军主将' }
      ],
      participants: [
        { name: '士会（范武子）', role: '晋国执政' },
        { name: '郤至', role: '晋军将领' }
      ],
      opponents: [
        { name: '楚共王', role: '楚军统帅' },
        { name: '子反', role: '楚军主将' }
      ],
      affected: [{ name: '郑成公', role: '受争之君' }]
    },
    impacts: [
      { name: '历史影响', score: 91, description: '鄢陵之战晋国击败楚国，遏制了楚国北进势头，晋楚争霸进入拉锯与平衡阶段。' },
      { name: '政治影响', score: 89, description: '晋厉公借此战威震中原，却因倚重外姓、猜忌卿族而种下被弑的祸根，功业与危机并存。' },
      { name: '社会影响', score: 82, description: '连年大战消耗晋楚国力，促使双方寻求弭兵息争，间接推动了晋楚弭兵会盟的达成。' },
      { name: '文化影响', score: 83, description: '鄢陵之战中“察气观星”等军事文化细节被《左传》详录，成为古代军事观测的珍贵史料。' }
    ]
  },

  /* ===== 202317 栾书弑晋厉公 ===== */
  202317: {
    person_groups: {
      leaders: [
        { name: '栾书', role: '政变主谋' },
        { name: '荀偃', role: '政变同谋' }
      ],
      participants: [{ name: '晋悼公', role: '新立之君' }],
      opponents: [{ name: '晋厉公', role: '被弑之君' }],
      affected: [{ name: '郤至', role: '遭灭之卿' }]
    },
    impacts: [
      { name: '历史影响', score: 89, description: '栾书弑晋厉公后拥立晋悼公，晋国在悼公治下重振霸业，君权与卿权的博弈进入新阶段。' },
      { name: '政治影响', score: 90, description: '晋厉公削卿失败反遭身死，说明卿族势力已成晋国政坛不可撼动的力量，公室进一步孤立。' },
      { name: '社会影响', score: 80, description: '政变频仍使晋国政令起伏，也促使悼公即位后励精图治、整饬内政以安抚民心。' },
      { name: '文化影响', score: 82, description: '“栾书缶”等出土文物印证了栾氏家族的显赫地位，为后世研究晋国卿族历史提供了实物佐证。' }
    ]
  },

  /* ===== 202318 晋悼公即位与晋国复兴 ===== */
  202318: {
    person_groups: {
      leaders: [{ name: '晋悼公', role: '中兴之君' }],
      participants: [
        { name: '魏绛', role: '和戎之臣' },
        { name: '士会（范武子）', role: '执政贤臣' },
        { name: '韩厥', role: '执政贤臣' }
      ],
      opponents: [{ name: '楚共王', role: '争霸对手' }],
      affected: [{ name: '郑成公', role: '摇摆诸侯' }]
    },
    impacts: [
      { name: '历史影响', score: 94, description: '晋悼公“三驾疲楚”、再霸中原，使晋国在中衰之后重登霸主之位，延绥了晋国霸权近二十年。' },
      { name: '政治影响', score: 92, description: '悼公整顿卿族、汰除冗吏、任用贤能，重建了晋国高效有序的军政体制。' },
      { name: '社会影响', score: 85, description: '魏绛“和戎”之策使晋国边境安宁、百姓得息，促进了晋国与戎狄各族的经济文化交流。' },
      { name: '文化影响', score: 84, description: '悼公“恤民”“用人”的治国形象成为后世中兴之君的典范，其政绩载入《左传》流传后世。' }
    ]
  },

  /* ===== 202319 魏绛和戎 ===== */
  202319: {
    person_groups: {
      leaders: [
        { name: '魏绛', role: '和戎倡导者' },
        { name: '晋悼公', role: '采纳之君' }
      ],
      participants: [
        { name: '魏犨', role: '魏氏先祖' },
        { name: '韩厥', role: '执政贤臣' }
      ],
      opponents: [{ name: '戎族首领', role: '和谈对象' }],
      affected: [{ name: '诸戎', role: '结好之族' }]
    },
    impacts: [
      { name: '历史影响', score: 88, description: '魏绛和戎以怀柔取代征伐，为晋国赢得了稳定的后方，也开创了春秋“以和治边”的经典外交范式。' },
      { name: '政治影响', score: 86, description: '和戎政策减轻了晋国边防负担，使晋国得以集中力量对抗楚国、再霸中原。' },
      { name: '社会影响', score: 89, description: '晋与戎狄“修范防、通商贾”，促进边境贸易与民族往来，改善了边地百姓的生存境况。' },
      { name: '文化影响', score: 85, description: '“和戎”思想蕴含和合共生、以德服人的智慧，成为中国古代民族关系思想的重要遗产。' }
    ]
  },

  /* ===== 202320 晋楚弭兵会盟 ===== */
  202320: {
    person_groups: {
      leaders: [
        { name: '向戌', role: '弭兵倡导者' },
        { name: '晋悼公', role: '晋国代表' }
      ],
      participants: [
        { name: '楚康王', role: '楚国代表' },
        { name: '赵武', role: '晋国执政' }
      ],
      opponents: [{ name: '伯州犁', role: '楚国大臣' }],
      affected: [{ name: '子产', role: '郑国执政' }]
    },
    impacts: [
      { name: '历史影响', score: 95, description: '弭兵会盟使晋楚两大集团休兵近四十年，中原诸侯获得长期和平，春秋争霸转入相对缓和阶段。' },
      { name: '政治影响', score: 93, description: '晋楚并尊、共主诸侯的新格局形成，各国纷纷转向内政变革与卿族博弈，历史重心由争霸转向变法。' },
      { name: '社会影响', score: 90, description: '长久的和平使中原各国休养生息、人口增长、商贸繁荣，百姓得以免受连年战乱之苦。' },
      { name: '文化影响', score: 87, description: '弭兵之会推动礼乐外交与“讲信修睦”理念传播，为春秋晚期思想的活跃繁荣创造了条件。' }
    ]
  },

  /* ===== 202321 晋国六卿崛起 ===== */
  202321: {
    person_groups: {
      leaders: [{ name: '韩厥', role: '六卿代表' }],
      participants: [
        { name: '赵盾', role: '赵氏代表' },
        { name: '栾书', role: '栾氏代表' },
        { name: '魏绛', role: '魏氏代表' }
      ],
      opponents: [{ name: '晋厉公', role: '削卿之君' }],
      affected: [
        { name: '晋悼公', role: '国势之君' },
        { name: '晋定公', role: '后期之君' }
      ]
    },
    impacts: [
      { name: '历史影响', score: 93, description: '六卿崛起使晋国公室名存实亡，为后来韩、赵、魏三家分晋与战国七雄格局的形成铺平了道路。' },
      { name: '政治影响', score: 92, description: '卿族执掌军政大权、互相兼并，晋国政权结构由公室主导转向卿族共治。' },
      { name: '社会影响', score: 85, description: '各卿族竞相抚恤封邑百姓、发展经济以壮大实力，客观上促进了地方经济的开发与进步。' },
      { name: '文化影响', score: 83, description: '六卿之争中的权谋与变革思想，为战国法家与纵横家思想的兴起提供了历史土壤。' }
    ]
  },

  /* ===== 202322 吴王阖闾即位 ===== */
  202322: {
    person_groups: {
      leaders: [
        { name: '公子光', role: '即位之主' },
        { name: '专诸', role: '行刺之臣' }
      ],
      participants: [
        { name: '伍员', role: '辅佐之臣' },
        { name: '被离', role: '相士' }
      ],
      opponents: [{ name: '吴王僚', role: '被弑之君' }],
      affected: [
        { name: '吴王余昧', role: '前任之君' },
        { name: '庆忌', role: '僚之遗嗣' }
      ]
    },
    impacts: [
      { name: '历史影响', score: 92, description: '阖闾即位开启吴国霸业，其后任用伍子胥、孙武，使吴国一举崛起为春秋后期最强大的南方国家。' },
      { name: '政治影响', score: 90, description: '阖闾“任贤使能、励精图治”，改革吴国军政体制，为吴国争霸中原奠定了基础。' },
      { name: '社会影响', score: 83, description: '阖闾筑城治国、发展生产，吴国社会经济快速发展，江南地区由此逐步走向繁荣。' },
      { name: '文化影响', score: 85, description: '阖闾时期吴国的崛起与“吴钩”等尚武文化，成为后世描写江南刚健之风的经典意象。' }
    ]
  },

  /* ===== 202323 专诸刺吴王僚 ===== */
  202323: {
    person_groups: {
      leaders: [
        { name: '公子光', role: '政变主谋' },
        { name: '伍员', role: '举荐专诸' }
      ],
      participants: [
        { name: '专诸', role: '行刺刺客' },
        { name: '被离', role: '识人之士' }
      ],
      opponents: [{ name: '吴王僚', role: '被刺之君' }],
      affected: [
        { name: '吴王余昧', role: '继承次序' },
        { name: '庆忌', role: '僚之遗嗣' }
      ]
    },
    impacts: [
      { name: '历史影响', score: 91, description: '专诸刺王僚使阖闾顺利即位，直接推动吴国走向强盛，深刻改变了春秋后期的江南政治格局。' },
      { name: '政治影响', score: 89, description: '以刺客行大事成为春秋政治斗争的重要手段，开启战国秦汉刺客政治的滥觞。' },
      { name: '社会影响', score: 80, description: '“鱼腹藏剑”的传奇色彩使专诸成为民间崇拜的侠义形象，深刻影响后世武侠文化。' },
      { name: '文化影响', score: 92, description: '专诸与荆轲、聂政并称古代四大刺客，“士为知己者死”的侠义精神成为中国文化的重要母题。' }
    ]
  },

  /* ===== 202324 柏举之战 ===== */
  202324: {
    person_groups: {
      leaders: [
        { name: '公子光', role: '吴军统帅' },
        { name: '孙武', role: '吴军主将' },
        { name: '伍员', role: '吴军谋主' }
      ],
      participants: [
        { name: '夫概', role: '吴军先锋' },
        { name: '养由基', role: '楚军勇将' }
      ],
      opponents: [{ name: '楚昭王', role: '楚国之君' }],
      affected: [
        { name: '楚平王', role: '楚政之弊' },
        { name: '令尹子常', role: '楚军主帅' }
      ]
    },
    impacts: [
      { name: '历史影响', score: 94, description: '柏举之战以少胜多，吴军五战五捷直入郢都，楚国几近亡国，是春秋时期最大的军事奇袭之一。' },
      { name: '政治影响', score: 92, description: '吴国的强势崛起与楚国的重创，彻底改变了春秋后期的力量对比，中原诸侯无不震动。' },
      { name: '社会影响', score: 84, description: '楚都沦陷使楚国贵族与百姓流离失所，也促使楚国痛定思痛、重整国政。' },
      { name: '文化影响', score: 90, description: '孙武在此战中实践《孙子兵法》奇正相生、避实击虚的战术思想，为兵学经典提供了现实注脚。' }
    ]
  },

  /* ===== 202325 吴军攻破郢都 ===== */
  202325: {
    person_groups: {
      leaders: [
        { name: '公子光', role: '吴军统帅' },
        { name: '伍员', role: '灭楚谋主' }
      ],
      participants: [
        { name: '孙武', role: '吴军主将' },
        { name: '伯嚭', role: '吴国大臣' }
      ],
      opponents: [
        { name: '楚昭王', role: '逃亡之君' },
        { name: '楚平王', role: '被鞭之君' }
      ],
      affected: [{ name: '申包胥', role: '求援之臣' }]
    },
    impacts: [
      { name: '历史影响', score: 93, description: '郢都陷落使楚国遭受立国以来最惨重的打击，楚国几至灭亡，春秋南方的力量格局被彻底改写。' },
      { name: '政治影响', score: 91, description: '吴国占据楚都、楚王流亡，楚国中央权威崩溃，为日后秦国救楚、楚人复国埋下伏笔。' },
      { name: '社会影响', score: 85, description: '战乱使楚国百姓生灵涂炭，吴军暴行激起楚人同仇敌忾，增强了楚国的民族凝聚力。' },
      { name: '文化影响', score: 88, description: '伍子胥“鞭尸三百”的复仇故事震撼千古，成为中国文学中复仇与忠孝主题的经典母题。' }
    ]
  },

  /* ===== 202326 伍子胥复仇 ===== */
  202326: {
    person_groups: {
      leaders: [
        { name: '伍员', role: '复仇主角' },
        { name: '公子光', role: '助仇之君' }
      ],
      participants: [
        { name: '孙武', role: '伐楚主将' },
        { name: '伍举', role: '伍氏先祖' }
      ],
      opponents: [
        { name: '楚平王', role: '被鞭之君' },
        { name: '费无极', role: '谗佞之臣' }
      ],
      affected: [
        { name: '楚昭王', role: '逃亡之君' },
        { name: '申包胥', role: '复国志士' }
      ]
    },
    impacts: [
      { name: '历史影响', score: 92, description: '伍子胥以吴灭楚、掘墓鞭尸，实现了空前绝后的个人复仇，也深刻影响了吴楚两国此后的历史走向。' },
      { name: '政治影响', score: 90, description: '伍子胥的复仇强化了吴国的扩张野心，也使楚国朝野铭记亡国之痛，成为楚人复国自强的精神动力。' },
      { name: '社会影响', score: 83, description: '“忠孝难两全”的困境使伍子胥形象复杂而深刻，成为民间信仰中被祭祀的刚烈之神。' },
      { name: '文化影响', score: 93, description: '伍子胥复仇与“过昭关一夜白头”的传说广为流传，是中国叙事文学与戏曲的重要题材。' }
    ]
  },

  /* ===== 202327 申包胥哭秦庭 ===== */
  202327: {
    person_groups: {
      leaders: [{ name: '申包胥', role: '乞师之臣' }],
      participants: [
        { name: '秦哀公', role: '出兵之君' },
        { name: '楚昭王', role: '待救之君' }
      ],
      opponents: [{ name: '公子光', role: '吴军统帅' }],
      affected: [{ name: '伍员', role: '楚之旧交' }]
    },
    impacts: [
      { name: '历史影响', score: 91, description: '申包胥哭秦庭七日七夜感动秦哀公，秦军出兵救楚，使濒临灭亡的楚国得以复国，深刻影响春秋南方格局。' },
      { name: '政治影响', score: 89, description: '楚国借秦援而复立，秦楚结好成为此后数十年南方政治的重要基石。' },
      { name: '社会影响', score: 85, description: '申包胥“存亡继绝”的忠义精神激励楚国上下同仇敌忾，增强了楚人的国家认同。' },
      { name: '文化影响', score: 92, description: '“哭秦庭”成为中国忠臣义士、爱国情怀的经典典故，历代文人咏叹不绝。' }
    ]
  },

  /* ===== 202328 楚国复国 ===== */
  202328: {
    person_groups: {
      leaders: [
        { name: '楚昭王', role: '复国之君' },
        { name: '申包胥', role: '乞师复国' }
      ],
      participants: [
        { name: '秦哀公', role: '出兵救楚' },
        { name: '子西', role: '楚军主将' }
      ],
      opponents: [
        { name: '公子光', role: '吴军统帅' },
        { name: '夫概', role: '吴军将领' }
      ],
      affected: [{ name: '伍员', role: '伐楚之臣' }]
    },
    impacts: [
      { name: '历史影响', score: 90, description: '楚国从几近亡国的深渊中复国，此后继续保有南方大国的地位，吴楚争霸格局由此长期延续。' },
      { name: '政治影响', score: 88, description: '复国后楚昭王“出亡则亡、入国则存”，励精图治、任贤纳谏，使楚国国势逐渐复苏。' },
      { name: '社会影响', score: 84, description: '亡国复国的惨痛经历使楚国上下抱团自强，社会凝聚力空前增强。' },
      { name: '文化影响', score: 83, description: '楚国复国历程成为后世“国虽破而魂不灭”的叙事原型，丰富了中华民族自强不息的文化记忆。' }
    ]
  },

  /* ===== 202329 吴越檇李之战 ===== */
  202329: {
    person_groups: {
      leaders: [
        { name: '公子光', role: '吴军统帅' },
        { name: '越王允常', role: '越国君主' }
      ],
      participants: [
        { name: '灵姑浮', role: '越军将领' },
        { name: '夫差', role: '吴国太子' }
      ],
      opponents: [{ name: '勾践', role: '越国后继之君' }],
      affected: [{ name: '阖闾', role: '伤重而薨' }]
    },
    impacts: [
      { name: '历史影响', score: 89, description: '檇李之战中吴王阖闾伤重而死，吴越两国由此结下世仇，开启了吴越争霸的长期历史。' },
      { name: '政治影响', score: 87, description: '夫差即位后立志复仇灭越，吴国战略重心由北上中原转向南灭越国，改变了两国的外交走向。' },
      { name: '社会影响', score: 82, description: '吴越边境战事连绵，百姓深受兵燹之苦，但也催生了江南尚武刚烈的民风。' },
      { name: '文化影响', score: 86, description: '吴越争霸的故事由此发端，为后来“卧薪尝胆”“西施浣纱”等经典传说提供了历史背景。' }
    ]
  },

  /* ===== 202330 会稽之战与勾践受辱 ===== */
  202330: {
    person_groups: {
      leaders: [{ name: '夫差', role: '吴军统帅' }],
      participants: [
        { name: '范蠡', role: '越国谋臣' },
        { name: '文种', role: '越国谋臣' }
      ],
      opponents: [{ name: '越王勾践', role: '战败之君' }],
      affected: [
        { name: '伍员', role: '主战之臣' },
        { name: '伯嚭', role: '受赂之臣' }
      ]
    },
    impacts: [
      { name: '历史影响', score: 90, description: '会稽之战使越国几乎亡国，勾践被迫屈辱求和、入吴为奴，开启了吴越兴亡最富戏剧性的篇章。' },
      { name: '政治影响', score: 88, description: '夫差听信伯嚭、不纳伍子胥之言而饶越国，为日后越国反噬埋下致命隐患。' },
      { name: '社会影响', score: 84, description: '越国战败后国力凋敝、民心思变，勾践夫妇入吴为奴的屈辱成为越人刻骨铭心的集体记忆。' },
      { name: '文化影响', score: 87, description: '“会稽之耻”成为忍辱负重、奋发图强的文化符号，激励后世无数仁人志士。' }
    ]
  },

  /* ===== 202331 勾践卧薪尝胆 ===== */
  202331: {
    person_groups: {
      leaders: [{ name: '越王勾践', role: '复国明君' }],
      participants: [
        { name: '范蠡', role: '治国谋臣' },
        { name: '文种', role: '治国谋臣' },
        { name: '西施', role: '美人计主角' }
      ],
      opponents: [
        { name: '夫差', role: '吴国之君' },
        { name: '伍员', role: '吴国忠臣' }
      ],
      affected: [
        { name: '计然', role: '经济谋士' },
        { name: '郑旦', role: '献美之女' }
      ]
    },
    impacts: [
      { name: '历史影响', score: 93, description: '“卧薪尝胆”使越国由弱转强，最终复仇灭吴，是春秋历史上以屈求伸、绝地反击的巅峰范例。' },
      { name: '政治影响', score: 91, description: '勾践“十年生聚、十年教训”，推行休养生息、发展生产、整军经武，使越国政治经济全面复兴。' },
      { name: '社会影响', score: 86, description: '勾践与民同耕、奖励生育的政策迅速恢复越国人口与生产力，社会面貌焕然一新。' },
      { name: '文化影响', score: 92, description: '“卧薪尝胆”成为中华民族忍辱负重、自强不息精神的最高象征，激励后世无数志士。' }
    ]
  },

  /* ===== 202332 黄池之会 ===== */
  202332: {
    person_groups: {
      leaders: [{ name: '夫差', role: '争盟之主' }],
      participants: [
        { name: '越王勾践', role: '后方之敌' },
        { name: '晋定公', role: '争盟对手' }
      ],
      opponents: [{ name: '伍员', role: '谏阻之臣' }],
      affected: [
        { name: '范蠡', role: '乘虚之谋' },
        { name: '文种', role: '乘虚之谋' }
      ]
    },
    impacts: [
      { name: '历史影响', score: 89, description: '黄池之会是吴国霸业的顶点，也是由盛转衰的拐点——夫差北上争盟之际，越国乘虚而入，吴国从此一蹶不振。' },
      { name: '政治影响', score: 87, description: '夫差“外争霸于中原、内失防于越国”，其战略失误为越国灭吴提供了决定性窗口。' },
      { name: '社会影响', score: 82, description: '吴国倾力北上、国力虚耗，百姓负担沉重，为吴国政局的动荡埋下伏笔。' },
      { name: '文化影响', score: 84, description: '“螳螂捕蝉、黄雀在后”的典故与此密切相关，成为讽喻只顾眼前、忽视后患的经典成语。' }
    ]
  },

  /* ===== 202333 勾践灭吴 ===== */
  202333: {
    person_groups: {
      leaders: [
        { name: '越王勾践', role: '灭吴之君' },
        { name: '文种', role: '越军谋主' }
      ],
      participants: [
        { name: '范蠡', role: '越军主将' },
        { name: '计然', role: '后勤谋士' }
      ],
      opponents: [
        { name: '夫差', role: '吴国末君' },
        { name: '太宰嚭', role: '吴国权臣' }
      ],
      affected: [
        { name: '伍员', role: '含冤忠臣' },
        { name: '公孙雄', role: '吴国使者' }
      ]
    },
    impacts: [
      { name: '历史影响', score: 94, description: '勾践灭吴终结了吴国的霸业，越国一跃成为春秋后期的东方霸主，为战国时代越国的强盛奠定基础。' },
      { name: '政治影响', score: 92, description: '“勾践灭吴”以弱胜强、绝地反攻，成为后世治国与战略运筹的经典范本。' },
      { name: '社会影响', score: 85, description: '灭吴之后越国吞并吴地、广纳民力，江南地区的社会经济格局由此发生深刻变化。' },
      { name: '文化影响', score: 91, description: '“飞鸟尽、良弓藏”的悲叹与范蠡泛舟五湖的传说，塑造了中国功成身退的士人理想人格。' }
    ]
  },

  /* ===== 202334 晋阳之战 ===== */
  202334: {
    background: {
      political: '晋国后期，六卿兼并愈演愈烈，智氏凭借拥立悼公之功跃居卿族之首，晋国公室已被架空，卿族之间由合纵走向火并。',
      economic: '各卿族占有大量封邑与人口，智氏向韩、魏索地扩充实力，土地与赋税的争夺成为卿族战争的经济根源。',
      social: '新兴地主阶级与旧贵族矛盾尖锐，卿族家臣阶层兴起，社会结构在兼并战争中加速重构。',
      cultural: '宗法礼制进一步瓦解，“以强兼弱”取代“礼让为先”，为战国弱肉强食的政治文化拉开序幕。',
      geographic: '晋阳位于今山西太原一带，四面环山、城高池深，是赵氏经营多年的坚固根据地。'
    },
    person_groups: {
      leaders: [
        { name: '赵襄子', role: '赵氏之主' },
        { name: '智伯瑶', role: '智氏之主' }
      ],
      participants: [
        { name: '韩康子', role: '韩氏之主' },
        { name: '魏桓子', role: '魏氏之主' }
      ],
      opponents: [{ name: '晋出公', role: '被架空之君' }],
      affected: [{ name: '晋哀公', role: '傀儡之君' }]
    },
    impacts: [
      { name: '历史影响', score: 92, description: '晋阳之战中赵氏联合韩魏反攻灭智，奠定了三家分晋的直接基础，是春秋向战国过渡的关键战役。' },
      { name: '政治影响', score: 93, description: '智氏灭族后晋国政权尽归韩赵魏，公室再无反制之力，三家分晋的政治进程由此不可逆转。' },
      { name: '社会影响', score: 84, description: '旷日持久的围城之战使百姓备受煎熬，但赵氏固守晋阳的坚韧意志也凝聚了民心。' },
      { name: '文化影响', score: 85, description: '“唇亡齿寒”“围魏救赵”等智慧与此战关联紧密，成为后世兵法与权谋文化的重要素材。' }
    ]
  },

  /* ===== 202335 智氏灭亡 ===== */
  202335: {
    background: {
      political: '智伯瑶刚愎自用、向韩魏强索土地，激化卿族矛盾；赵襄子拒绝割地后，智伯瑶率韩魏围攻晋阳，最终反被三家联合绞杀。',
      economic: '智氏兼并土地、积聚实力的扩张政策，最终导致韩魏赵联合反制，经济利益的分配成为三家分智的直接导火索。',
      social: '卿族家臣与新兴力量在战争中崭露头角，旧有贵族等级秩序加速瓦解，土地人口重新分配。',
      cultural: '智伯瑶“贪而愎”的覆灭成为后世“骄兵必败”“多行不义必自毙”的历史鉴戒。',
      geographic: '晋阳城地处晋中盆地，三面环山，攻守之势易变，是决定智氏存亡的战略要地。'
    },
    person_groups: {
      leaders: [
        { name: '赵襄子', role: '反攻主谋' },
        { name: '韩康子', role: '倒戈之盟' },
        { name: '魏桓子', role: '倒戈之盟' }
      ],
      participants: [{ name: '智伯瑶', role: '智氏之主' }],
      opponents: [{ name: '晋出公', role: '旁观之君' }],
      affected: [{ name: '智果', role: '智氏族人' }]
    },
    impacts: [
      { name: '历史影响', score: 90, description: '智氏覆灭后，晋国四大卿族仅存韩赵魏三家，为三家分晋和战国格局的最终确立扫清了最后障碍。' },
      { name: '政治影响', score: 92, description: '韩赵魏瓜分智氏土地人口，三家实力大增，晋国公室彻底沦为附庸。' },
      { name: '社会影响', score: 82, description: '智氏族人遭屠戮驱逐，卿族兼并的血腥现实使“士”阶层重新思考依附与独立之道。' },
      { name: '文化影响', score: 86, description: '智伯瑶“贪而无厌”致亡的故事被《左传》《资治通鉴》反复引证，成为治国用人的反面教材。' }
    ]
  },

  /* ===== 202336 三家分晋 ===== */
  202336: {
    background: {
      political: '卿族长期兼并，君权削亡，晋国政权尽归韩赵魏三家，分晋势成必然。',
      economic: '铁器牛耕推广，生产力提升，新兴地主阶级崛起，土地私有化加速瓦解井田制，为三家瓜分晋土奠定经济基础。',
      social: '旧有贵族世卿制崩溃，士阶层与新兴地主崛起，社会各阶层的权力结构发生根本重组。',
      cultural: '周礼与宗法秩序进一步崩坏，“礼乐征伐自诸侯出”愈演愈烈，为战国变法与百家争鸣准备了思想土壤。',
      geographic: '晋地跨今山西、河北、河南交界，韩赵魏各自拥有稳固的封地，地理上已具备立国分治的条件。'
    },
    person_groups: {
      leaders: [
        { name: '赵襄子', role: '赵氏之主' },
        { name: '韩康子', role: '韩氏之主' },
        { name: '魏桓子', role: '魏氏之主' }
      ],
      participants: [
        { name: '周威烈王', role: '册封天子' },
        { name: '晋悼公', role: '历史背景人物' }
      ],
      opponents: [{ name: '晋幽公', role: '名存实亡之君' }],
      affected: [{ name: '晋烈公', role: '末代余君' }]
    },
    impacts: [
      { name: '历史影响', score: 99, description: '三家分晋被史学界视为春秋战国分界的重要标志，标志着周代宗法分封秩序的根本瓦解。' },
      { name: '政治影响', score: 98, description: '晋国一分为三，形成韩赵魏三国，周天子被迫承认既成事实，战国七雄的政治版图就此奠定。' },
      { name: '社会影响', score: 95, description: '井田制彻底崩溃、土地私有制确立，新的地主与农民阶级登上历史舞台，社会结构焕然一新。' },
      { name: '文化影响', score: 92, description: '世卿世禄制度被打破，士阶层崛起、百家争鸣序幕拉开，中国思想文化进入空前繁荣的轴心时代。' }
    ]
  },

  /* ===== 202337 鲁国三桓专政 ===== */
  202337: {
    person_groups: {
      leaders: [
        { name: '季孙氏（季平子）', role: '三桓之首' },
        { name: '叔孙氏（叔孙穆子）', role: '三桓之一' },
        { name: '孟献子', role: '三桓之一' }
      ],
      participants: [
        { name: '季武子', role: '季氏前代' },
        { name: '季孙宿', role: '季氏代表' },
        { name: '叔孙豹', role: '叔孙氏代表' }
      ],
      opponents: [{ name: '鲁昭公', role: '被逐之君' }],
      affected: [
        { name: '鲁定公', role: '受制之君' },
        { name: '鲁哀公', role: '受制之君' }
      ]
    },
    impacts: [
      { name: '历史影响', score: 95, description: '体现春秋时期诸侯国内部卿族崛起、君权衰落的普遍趋势，是“礼崩乐坏”在鲁国的集中写照。' },
      { name: '政治影响', score: 98, description: '三桓长期把持鲁国军政大权、架空国君，鲁国公室名存实亡，孔子“堕三都”亦以失败告终。' },
      { name: '社会影响', score: 90, description: '“四分公室”“三分公室”改变了鲁国赋税与兵制，百姓的负担与依附关系随之深刻调整。' },
      { name: '文化影响', score: 85, description: '三桓僭越礼制、八佾舞于庭，孔子发出“是可忍孰不可忍”之叹，成为春秋礼制崩坏的著名注脚。' }
    ]
  },

  /* ===== 202338 孔子周游列国 ===== */
  202338: {
    person_groups: {
      leaders: [{ name: '孔子', role: '周游主持者' }],
      participants: [
        { name: '子路', role: '随行弟子' },
        { name: '子贡', role: '随行弟子' },
        { name: '颜回', role: '随行弟子' },
        { name: '冉有', role: '随行弟子' }
      ],
      opponents: [{ name: '鲁定公', role: '鲁国之君' }],
      affected: [
        { name: '子夏', role: '随行弟子' },
        { name: '子游', role: '随行弟子' }
      ]
    },
    impacts: [
      { name: '历史影响', score: 96, description: '孔子周游列国虽未实现政治理想，却使儒家学说在列国传播，为儒学成为中国文化主流奠定了基础。' },
      { name: '政治影响', score: 88, description: '孔子的政治主张虽未被采用，但其“德治”“礼治”思想深刻影响了后世王朝的治国理念。' },
      { name: '社会影响', score: 90, description: '孔子师徒于困顿中讲学不辍，推动了私学的兴盛与教育下移，改变了“学在官府”的局面。' },
      { name: '文化影响', score: 98, description: '“韦编三绝”“发愤忘食”等事迹塑造了中国文人的治学精神，周游列国成为文化苦旅的永恒象征。' }
    ]
  },

  /* ===== 202339 季札让国 ===== */
  202339: {
    person_groups: {
      leaders: [
        { name: '季札', role: '让国之贤' },
        { name: '吴王寿梦', role: '欲传之君' }
      ],
      participants: [
        { name: '吴王诸樊', role: '依次继位' },
        { name: '吴王余祭', role: '依次继位' },
        { name: '吴王余昧', role: '依次继位' }
      ],
      opponents: [{ name: '吴王僚', role: '继位之君' }],
      affected: [
        { name: '公子光', role: '阖闾之父系' },
        { name: '吴太伯', role: '让国先贤' }
      ]
    },
    impacts: [
      { name: '历史影响', score: 91, description: '季札让国延缓了吴国王位之争的爆发，但其兄弟相承的旧制终究难以为继，为吴国后来的王位政变埋下伏笔。' },
      { name: '政治影响', score: 85, description: '季札三让王位、恪守礼让，以德望维系吴国政局于一时，成为以“让”安邦的典范。' },
      { name: '社会影响', score: 87, description: '季札出使中原、观乐论政，其仁德风范赢得列国敬重，提升了吴国的文化声誉。' },
      { name: '文化影响', score: 92, description: '“季札挂剑”的守信故事与“观周乐”的乐论思想流传千古，成为中国诚信文化与礼乐文化的经典符号。' }
    ]
  }
};

/* ---------- 应用补全 ---------- */
let bgFixed = 0, pgFixed = 0, imFixed = 0;
data.events.forEach(ev => {
  const e = ENRICH[ev.id];
  if (!e) return;

  // #1 background（仅补缺失字段）
  if (e.background) {
    ev.background = ev.background || {};
    Object.keys(e.background).forEach(k => {
      if (!ev.background[k]) {
        ev.background[k] = e.background[k];
        bgFixed++;
      }
    });
  }

  // #2 person_groups（整体替换，确保四组完整）
  if (e.person_groups) {
    const before = (ev.person_groups ? Object.values(ev.person_groups).reduce((s, a) => s + (a ? a.length : 0), 0) : 0);
    ev.person_groups = e.person_groups;
    const after = Object.values(ev.person_groups).reduce((s, a) => s + a.length, 0);
    if (after > before) pgFixed += after - before;
  }

  // #3 impacts（整体替换为四维完整描述）
  if (e.impacts) {
    ev.impacts = e.impacts;
    imFixed++;
  }
});

fs.writeFileSync(F, JSON.stringify(data, null, 2), 'utf-8');
console.log('完成! 背景补全字段:', bgFixed, '| 关键人物净增:', pgFixed, '| impacts补全事件:', imFixed);
