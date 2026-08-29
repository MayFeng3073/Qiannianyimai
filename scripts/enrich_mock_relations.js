/**
 * 为 mock/data.ts 中 23 位「二级人物（上古/传说）」补齐 narrative_relations。
 *
 * 这些人物此前没有 story 与 narrative_relations，因缘际会显示为空。
 * 此处依据其 summary / related_people / life_events 内容，按「因缘际会」叙事规则
 * （1 核心 + 3~4 外围节点、叙事性连线短语、pos 确定性布局）补齐数据。
 *
 * 插入方式：在每个角色对象的 `id: <id>,` 行后插入 narrative_relations 字段。
 */
const fs = require('fs')
const path = require('path')

const file = path.join(__dirname, '..', 'frontend', 'src', 'mock', 'data.ts')
let src = fs.readFileSync(file, 'utf8')

const enrich = {
  1015: {
    nodes: [
      { id: 'qb', name: '岐伯', type: 'person', size: 'large', pos: 'center' },
      { id: 'hd', name: '黄帝', type: 'person', size: 'medium', pos: 'top' },
      { id: 'lg', name: '雷公', type: 'person', size: 'medium', pos: 'left' },
      { id: 'hdnj', name: '黄帝内经', type: 'story', size: 'medium', pos: 'right' },
      { id: 'qhzs', name: '岐黄之术', type: 'story', size: 'medium', pos: 'bottom' }
    ],
    edges: [
      { source: 'hd', target: 'qb', label: '问对论医', direction: 'forward' },
      { source: 'qb', target: 'lg', label: '答疑解惑', direction: 'forward' },
      { source: 'qb', target: 'hdnj', label: '合著', direction: 'forward' },
      { source: 'qb', target: 'qhzs', label: '开创', direction: 'forward' }
    ]
  },
  1016: {
    nodes: [
      { id: 'lg', name: '雷公', type: 'person', size: 'large', pos: 'center' },
      { id: 'hd', name: '黄帝', type: 'person', size: 'medium', pos: 'top' },
      { id: 'qb', name: '岐伯', type: 'person', size: 'medium', pos: 'left' },
      { id: 'hdnj', name: '黄帝内经', type: 'story', size: 'medium', pos: 'right' }
    ],
    edges: [
      { source: 'qb', target: 'lg', label: '师从请教', direction: 'forward' },
      { source: 'hd', target: 'lg', label: '共议医道', direction: 'forward' },
      { source: 'lg', target: 'hdnj', label: '问学见录', direction: 'forward' }
    ]
  },
  1018: {
    nodes: [
      { id: 'nb', name: '女魃', type: 'person', size: 'large', pos: 'center' },
      { id: 'hd', name: '黄帝', type: 'person', size: 'medium', pos: 'top' },
      { id: 'cy', name: '蚩尤', type: 'person', size: 'medium', pos: 'left' },
      { id: 'zlzz', name: '涿鹿之战', type: 'event', size: 'medium', pos: 'right' },
      { id: 'hs', name: '旱神', type: 'story', size: 'medium', pos: 'bottom' }
    ],
    edges: [
      { source: 'nb', target: 'hd', label: '助战', direction: 'forward' },
      { source: 'nb', target: 'zlzz', label: '驱雨助胜', direction: 'forward' },
      { source: 'cy', target: 'zlzz', label: '施放风雨', direction: 'forward' },
      { source: 'nb', target: 'hs', label: '神力耗尽化身', direction: 'forward' }
    ]
  },
  1020: {
    nodes: [
      { id: 'gg', name: '共工', type: 'person', size: 'large', pos: 'center' },
      { id: 'zr', name: '祝融', type: 'person', size: 'medium', pos: 'top' },
      { id: 'xl', name: '相柳', type: 'person', size: 'medium', pos: 'left' },
      { id: 'tdzb', name: '天地灾变', type: 'story', size: 'medium', pos: 'right' },
      { id: 'nwbt', name: '女娲补天', type: 'story', size: 'medium', pos: 'bottom' }
    ],
    edges: [
      { source: 'gg', target: 'zr', label: '争帝战败', direction: 'forward' },
      { source: 'gg', target: 'xl', label: '统领', direction: 'forward' },
      { source: 'gg', target: 'tdzb', label: '怒触不周山', direction: 'forward' },
      { source: 'tdzb', target: 'nwbt', label: '引出', direction: 'forward' }
    ]
  },
  1021: {
    nodes: [
      { id: 'zr', name: '祝融', type: 'person', size: 'large', pos: 'center' },
      { id: 'gg', name: '共工', type: 'person', size: 'medium', pos: 'top' },
      { id: 'nfdz', name: '南方火神', type: 'story', size: 'medium', pos: 'right' },
      { id: 'tdzb', name: '天地灾变', type: 'story', size: 'medium', pos: 'bottom' }
    ],
    edges: [
      { source: 'zr', target: 'gg', label: '击败', direction: 'forward' },
      { source: 'gg', target: 'tdzb', label: '怒触不周山', direction: 'forward' },
      { source: 'zr', target: 'nfdz', label: '被尊为', direction: 'forward' }
    ]
  },
  1027: {
    nodes: [
      { id: 'hj', name: '后稷', type: 'person', size: 'large', pos: 'center' },
      { id: 's', name: '舜', type: 'person', size: 'medium', pos: 'top' },
      { id: 'jn', name: '姜嫄', type: 'person', size: 'medium', pos: 'left' },
      { id: 'ngwm', name: '农耕文明', type: 'story', size: 'medium', pos: 'right' },
      { id: 'zc', name: '周朝', type: 'story', size: 'medium', pos: 'bottom' }
    ],
    edges: [
      { source: 'jn', target: 'hj', label: '生养', direction: 'forward' },
      { source: 's', target: 'hj', label: '任为农官', direction: 'forward' },
      { source: 'hj', target: 'ngwm', label: '教民稼穑', direction: 'forward' },
      { source: 'hj', target: 'zc', label: '后代立国', direction: 'forward' }
    ]
  },
  201034: {
    nodes: [
      { id: 'gy', name: '皋陶', type: 'person', size: 'large', pos: 'center' },
      { id: 's', name: '舜', type: 'person', size: 'medium', pos: 'top' },
      { id: 'dy', name: '大禹', type: 'person', size: 'medium', pos: 'left' },
      { id: 'sfwm', name: '司法文明', type: 'story', size: 'medium', pos: 'right' },
      { id: 'xiezhi', name: '獬豸断狱', type: 'story', size: 'medium', pos: 'bottom' }
    ],
    edges: [
      { source: 's', target: 'gy', label: '委以司法', direction: 'forward' },
      { source: 'gy', target: 'xiezhi', label: '借兽断狱', direction: 'forward' },
      { source: 'gy', target: 'sfwm', label: '开创', direction: 'forward' },
      { source: 'gy', target: 'dy', label: '辅佐', direction: 'forward' }
    ]
  },
  1029: {
    nodes: [
      { id: 'dz', name: '丹朱', type: 'person', size: 'large', pos: 'center' },
      { id: 'y', name: '尧', type: 'person', size: 'medium', pos: 'top' },
      { id: 'sh', name: '舜', type: 'person', size: 'medium', pos: 'left' },
      { id: 'wjyd', name: '未继帝位', type: 'story', size: 'medium', pos: 'right' },
      { id: 'csz', name: '禅让制', type: 'story', size: 'medium', pos: 'bottom' }
    ],
    edges: [
      { source: 'y', target: 'dz', label: '不传', direction: 'forward' },
      { source: 'y', target: 'sh', label: '禅让', direction: 'forward' },
      { source: 'dz', target: 'wjyd', label: '无缘', direction: 'forward' },
      { source: 'dz', target: 'csz', label: '见证', direction: 'forward' }
    ]
  },
  1030: {
    nodes: [
      { id: 'sj', name: '商均', type: 'person', size: 'large', pos: 'center' },
      { id: 's', name: '舜', type: 'person', size: 'medium', pos: 'top' },
      { id: 'dy', name: '大禹', type: 'person', size: 'medium', pos: 'left' },
      { id: 'wjyd', name: '未继帝位', type: 'story', size: 'medium', pos: 'right' },
      { id: 'csz', name: '禅让制', type: 'story', size: 'medium', pos: 'bottom' }
    ],
    edges: [
      { source: 's', target: 'sj', label: '不传', direction: 'forward' },
      { source: 's', target: 'dy', label: '禅让', direction: 'forward' },
      { source: 'sj', target: 'wjyd', label: '无缘', direction: 'forward' },
      { source: 'sj', target: 'csz', label: '见证', direction: 'forward' }
    ]
  },
  1031: {
    nodes: [
      { id: 'eh', name: '娥皇', type: 'person', size: 'large', pos: 'center' },
      { id: 'y', name: '尧', type: 'person', size: 'medium', pos: 'top' },
      { id: 's', name: '舜', type: 'person', size: 'medium', pos: 'left' },
      { id: 'xfcs', name: '湘妃传说', type: 'story', size: 'medium', pos: 'right' },
      { id: 'xfbz', name: '湘妃竹', type: 'story', size: 'medium', pos: 'bottom' }
    ],
    edges: [
      { source: 'y', target: 'eh', label: '许配', direction: 'forward' },
      { source: 'eh', target: 's', label: '相伴', direction: 'forward' },
      { source: 'eh', target: 'xfbz', label: '泪洒竹林', direction: 'forward' },
      { source: 'eh', target: 'xfcs', label: '殉情', direction: 'forward' }
    ]
  },
  1032: {
    nodes: [
      { id: 'ny', name: '女英', type: 'person', size: 'large', pos: 'center' },
      { id: 'y', name: '尧', type: 'person', size: 'medium', pos: 'top' },
      { id: 's', name: '舜', type: 'person', size: 'medium', pos: 'left' },
      { id: 'xfcs', name: '湘妃传说', type: 'story', size: 'medium', pos: 'right' },
      { id: 'xfbz', name: '湘妃竹', type: 'story', size: 'medium', pos: 'bottom' }
    ],
    edges: [
      { source: 'y', target: 'ny', label: '许配', direction: 'forward' },
      { source: 'ny', target: 's', label: '相伴', direction: 'forward' },
      { source: 'ny', target: 'xfbz', label: '泪洒竹林', direction: 'forward' },
      { source: 'ny', target: 'xfcs', label: '殉情', direction: 'forward' }
    ]
  },
  1033: {
    nodes: [
      { id: 'xl', name: '相柳', type: 'person', size: 'large', pos: 'center' },
      { id: 'gg', name: '共工', type: 'person', size: 'medium', pos: 'top' },
      { id: 'dy', name: '大禹', type: 'person', size: 'medium', pos: 'left' },
      { id: 'dyzs', name: '大禹治水', type: 'event', size: 'medium', pos: 'right' },
      { id: 'dzyb', name: '毒沼遗祸', type: 'story', size: 'medium', pos: 'bottom' }
    ],
    edges: [
      { source: 'gg', target: 'xl', label: '麾下', direction: 'forward' },
      { source: 'dy', target: 'xl', label: '斩杀', direction: 'forward' },
      { source: 'xl', target: 'dyzs', label: '为害', direction: 'forward' },
      { source: 'xl', target: 'dzyb', label: '死后遗毒', direction: 'forward' }
    ]
  },
  1034: {
    nodes: [
      { id: 'hb', name: '河伯', type: 'person', size: 'large', pos: 'center' },
      { id: 'xmb', name: '西门豹', type: 'person', size: 'medium', pos: 'top' },
      { id: 'hhsh', name: '黄河水患', type: 'event', size: 'medium', pos: 'right' },
      { id: 'hbqf', name: '河伯娶妇', type: 'story', size: 'medium', pos: 'bottom' }
    ],
    edges: [
      { source: 'hb', target: 'hhsh', label: '兴波', direction: 'forward' },
      { source: 'hhsh', target: 'hbqf', label: '催生', direction: 'forward' },
      { source: 'xmb', target: 'hbqf', label: '破除', direction: 'forward' }
    ]
  },
  1035: {
    nodes: [
      { id: 'bz', name: '白泽', type: 'person', size: 'large', pos: 'center' },
      { id: 'hd', name: '黄帝', type: 'person', size: 'medium', pos: 'top' },
      { id: 'jtnx', name: '九天玄女', type: 'person', size: 'medium', pos: 'left' },
      { id: 'bzt', name: '白泽图', type: 'story', size: 'medium', pos: 'right' },
      { id: 'rs', name: '瑞兽传说', type: 'story', size: 'medium', pos: 'bottom' }
    ],
    edges: [
      { source: 'bz', target: 'hd', label: '现身授知', direction: 'forward' },
      { source: 'hd', target: 'bzt', label: '命人记录', direction: 'forward' },
      { source: 'bz', target: 'rs', label: '通晓万灵', direction: 'forward' }
    ]
  },
  1036: {
    nodes: [
      { id: 'jtnx', name: '九天玄女', type: 'person', size: 'large', pos: 'center' },
      { id: 'hd', name: '黄帝', type: 'person', size: 'medium', pos: 'top' },
      { id: 'cy', name: '蚩尤', type: 'person', size: 'medium', pos: 'left' },
      { id: 'zlzz', name: '涿鹿之战', type: 'event', size: 'medium', pos: 'right' },
      { id: 'zs', name: '战神', type: 'story', size: 'medium', pos: 'bottom' }
    ],
    edges: [
      { source: 'jtnx', target: 'hd', label: '授以兵法', direction: 'forward' },
      { source: 'jtnx', target: 'zlzz', label: '助战', direction: 'forward' },
      { source: 'cy', target: 'zlzz', label: '布雾', direction: 'forward' },
      { source: 'jtnx', target: 'zs', label: '被尊为', direction: 'forward' }
    ]
  },
  1037: {
    nodes: [
      { id: 'st', name: '神荼', type: 'person', size: 'large', pos: 'center' },
      { id: 'yl', name: '郁垒', type: 'person', size: 'medium', pos: 'top' },
      { id: 'ms', name: '门神', type: 'story', size: 'medium', pos: 'right' },
      { id: 'tfn', name: '桃符年俗', type: 'story', size: 'medium', pos: 'bottom' }
    ],
    edges: [
      { source: 'st', target: 'yl', label: '并肩', direction: 'forward' },
      { source: 'st', target: 'ms', label: '守卫鬼门', direction: 'forward' },
      { source: 'ms', target: 'tfn', label: '衍生', direction: 'forward' }
    ]
  },
  1038: {
    nodes: [
      { id: 'yl', name: '郁垒', type: 'person', size: 'large', pos: 'center' },
      { id: 'st', name: '神荼', type: 'person', size: 'medium', pos: 'top' },
      { id: 'ms', name: '门神', type: 'story', size: 'medium', pos: 'right' },
      { id: 'tfn', name: '桃符年俗', type: 'story', size: 'medium', pos: 'bottom' }
    ],
    edges: [
      { source: 'yl', target: 'st', label: '并肩', direction: 'forward' },
      { source: 'yl', target: 'ms', label: '守卫鬼门', direction: 'forward' },
      { source: 'ms', target: 'tfn', label: '衍生', direction: 'forward' }
    ]
  },
  1040: {
    nodes: [
      { id: 'xj', name: '修己', type: 'person', size: 'large', pos: 'center' },
      { id: 'g', name: '鲧', type: 'person', size: 'medium', pos: 'top' },
      { id: 'dy', name: '大禹', type: 'person', size: 'medium', pos: 'left' },
      { id: 'pfsy', name: '剖腹生禹', type: 'story', size: 'medium', pos: 'right' },
      { id: 'zsgc', name: '治水功成', type: 'story', size: 'medium', pos: 'bottom' }
    ],
    edges: [
      { source: 'xj', target: 'g', label: '之夫', direction: 'forward' },
      { source: 'xj', target: 'dy', label: '生养', direction: 'forward' },
      { source: 'xj', target: 'pfsy', label: '孕三载', direction: 'forward' },
      { source: 'dy', target: 'zsgc', label: '继父志', direction: 'forward' }
    ]
  },
  1041: {
    nodes: [
      { id: 'ffs', name: '防风氏', type: 'person', size: 'large', pos: 'center' },
      { id: 'dy', name: '大禹', type: 'person', size: 'medium', pos: 'top' },
      { id: 'tss', name: '涂山氏', type: 'person', size: 'medium', pos: 'left' },
      { id: 'kjhm', name: '会稽会盟', type: 'event', size: 'medium', pos: 'right' },
      { id: 'cdbs', name: '迟到被杀', type: 'story', size: 'medium', pos: 'bottom' }
    ],
    edges: [
      { source: 'dy', target: 'kjhm', label: '会盟', direction: 'forward' },
      { source: 'ffs', target: 'kjhm', label: '迟到', direction: 'forward' },
      { source: 'kjhm', target: 'cdbs', label: '立威', direction: 'forward' },
      { source: 'ffs', target: 'tss', label: '统领', direction: 'forward' }
    ]
  },
  1042: {
    nodes: [
      { id: 'xh', name: '羲和', type: 'person', size: 'large', pos: 'center' },
      { id: 'dj', name: '帝俊', type: 'person', size: 'medium', pos: 'top' },
      { id: 'cx', name: '常羲', type: 'person', size: 'medium', pos: 'left' },
      { id: 'srys', name: '十日神话', type: 'story', size: 'medium', pos: 'right' },
      { id: 'yr', name: '驾日', type: 'story', size: 'medium', pos: 'bottom' }
    ],
    edges: [
      { source: 'dj', target: 'xh', label: '之妻', direction: 'forward' },
      { source: 'xh', target: 'srys', label: '生育', direction: 'forward' },
      { source: 'xh', target: 'yr', label: '六龙御天', direction: 'forward' },
      { source: 'xh', target: 'cx', label: '日月并称', direction: 'forward' }
    ]
  },
  1043: {
    nodes: [
      { id: 'cx', name: '常羲', type: 'person', size: 'large', pos: 'center' },
      { id: 'dj', name: '帝俊', type: 'person', size: 'medium', pos: 'top' },
      { id: 'xh', name: '羲和', type: 'person', size: 'medium', pos: 'left' },
      { id: 'syy', name: '十二月神话', type: 'story', size: 'medium', pos: 'right' },
      { id: 'ys', name: '月神', type: 'story', size: 'medium', pos: 'bottom' }
    ],
    edges: [
      { source: 'dj', target: 'cx', label: '之妻', direction: 'forward' },
      { source: 'cx', target: 'syy', label: '生育', direction: 'forward' },
      { source: 'cx', target: 'ys', label: '掌管', direction: 'forward' },
      { source: 'cx', target: 'xh', label: '日月并称', direction: 'forward' }
    ]
  },
  1044: {
    nodes: [
      { id: 'srs', name: '燧人氏', type: 'person', size: 'large', pos: 'center' },
      { id: 'ycs', name: '有巢氏', type: 'person', size: 'medium', pos: 'top' },
      { id: 'zqhh', name: '钻木取火', type: 'event', size: 'medium', pos: 'right' },
      { id: 'hz', name: '火祖', type: 'story', size: 'medium', pos: 'bottom' }
    ],
    edges: [
      { source: 'srs', target: 'zqhh', label: '发明', direction: 'forward' },
      { source: 'zqhh', target: 'hz', label: '开文明', direction: 'forward' },
      { source: 'srs', target: 'ycs', label: '并称', direction: 'forward' }
    ]
  },
  1045: {
    nodes: [
      { id: 'ycs', name: '有巢氏', type: 'person', size: 'large', pos: 'center' },
      { id: 'srs', name: '燧人氏', type: 'person', size: 'medium', pos: 'top' },
      { id: 'gwyc', name: '构木为巢', type: 'event', size: 'medium', pos: 'right' },
      { id: 'jzzz', name: '建筑之祖', type: 'story', size: 'medium', pos: 'bottom' }
    ],
    edges: [
      { source: 'ycs', target: 'gwyc', label: '发明', direction: 'forward' },
      { source: 'gwyc', target: 'jzzz', label: '辟文明', direction: 'forward' },
      { source: 'ycs', target: 'srs', label: '并称', direction: 'forward' }
    ]
  }
}

const fmt = (obj) => {
  return JSON.stringify(obj, null, 0).replace(/"/g, "'")
}
const toTS = (id, nr) => {
  const lines = []
  lines.push('    narrative_relations: {')
  lines.push('      nodes: [')
  nr.nodes.forEach(n => lines.push(`        { id: '${n.id}', name: '${n.name}', type: '${n.type}', size: '${n.size}', pos: '${n.pos}' },`))
  lines.push('      ],')
  lines.push('      edges: [')
  nr.edges.forEach(e => lines.push(`        { source: '${e.source}', target: '${e.target}', label: '${e.label}', direction: '${e.direction}' },`))
  lines.push('      ]')
  lines.push('    },')
  return lines.join('\n')
}

let inserted = 0
for (const id of Object.keys(enrich)) {
  const needle = `\n    id: ${id},`
  const idx = src.indexOf(needle)
  if (idx === -1) {
    console.log(`未找到 id: ${id}`)
    continue
  }
  const insertPos = idx + needle.length
  src = src.slice(0, insertPos) + '\n' + toTS(id, enrich[id]) + src.slice(insertPos)
  inserted++
}

fs.writeFileSync(file, src, 'utf8')
console.log(`已为 ${inserted} 位上古人物的 mock 数据插入 narrative_relations`)
