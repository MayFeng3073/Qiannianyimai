<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

interface Props {
  dynastyId: number
  dynastyName: string
}
const props = defineProps<Props>()

interface GeoFeature {
  properties: { name?: string }
  geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: unknown }
}

const features = ref<GeoFeature[]>([])
const asiaFeatures = ref<GeoFeature[]>([])
const loadFailed = ref(false)

onMounted(async () => {
  try {
    const [chinaRes, asiaRes] = await Promise.all([
      fetch('/data/china-provinces.json'),
      fetch('/data/asia-countries.json')
    ])
    if (!chinaRes.ok) throw new Error('HTTP ' + chinaRes.status)
    const chinaJson = await chinaRes.json()
    features.value = (chinaJson.features || []).filter((f: GeoFeature) => f.geometry && f.properties?.name)
    if (asiaRes.ok) {
      const asiaJson = await asiaRes.json()
      asiaFeatures.value = (asiaJson.features || []).filter((f: GeoFeature) => f.geometry && f.properties?.name)
    }
  } catch {
    loadFailed.value = true
  }
})

/* ---------------- 统一投影：经纬度 → SVG 像素（亚洲范围，等比投影） ---------------- */
const LON_MIN = 50
const LON_MAX = 150
const LAT_MIN = 0
const LAT_MAX = 60
const W = 630
const H = 384
const PAD_X = 6
const PAD_Y = 6
const SX = (W - PAD_X * 2) / (LON_MAX - LON_MIN)
const SY = (H - PAD_Y * 2) / (LAT_MAX - LAT_MIN)

const projX = (lon: number) => PAD_X + (lon - LON_MIN) * SX
const projY = (lat: number) => PAD_Y + (LAT_MAX - lat) * SY

const ringPath = (ring: number[][]) => {
  let d = ''
  for (let i = 0; i < ring.length; i++) {
    const x = projX(ring[i][0]).toFixed(1)
    const y = projY(ring[i][1]).toFixed(1)
    d += (i === 0 ? 'M' : 'L') + x + ' ' + y
  }
  return d + 'Z'
}

const featurePath = (f: GeoFeature) => {
  const g = f.geometry
  const polys = (g.type === 'Polygon' ? [g.coordinates] : g.coordinates) as number[][][][]
  return polys.map((poly) => poly.map(ringPath).join('')).join('')
}

const provinceName = (f: GeoFeature) =>
  (f.properties.name || '')
    .replace(/维吾尔|壮族|回族|特别行政区|自治区|省|市/g, '')
    .trim()

/* ---------------- 控制等级：2 直接统治 / 1 羁縻·都护 / 0 未及 ---------------- */
type Level = 0 | 1 | 2
type LevelTable = Record<string, Level>

const LEVELS: Record<number, LevelTable> = {
  // 唐（高宗极盛）：羁縻与都护府不画成直辖，避免把势力范围当成版图
  112: {
    陕西: 2, 河南: 2, 山西: 2, 河北: 2, 山东: 2, 安徽: 2, 江苏: 2, 浙江: 2, 江西: 2,
    福建: 2, 湖北: 2, 湖南: 2, 广东: 2, 广西: 2, 海南: 2, 四川: 2, 重庆: 2, 贵州: 2,
    甘肃: 2, 宁夏: 2, 北京: 2, 天津: 2, 上海: 2,
    新疆: 1, 内蒙古: 1, 辽宁: 1, 吉林: 1, 青海: 1,
    西藏: 0, 云南: 0, 黑龙江: 0, 台湾: 0, 香港: 0, 澳门: 0
  },
  // 宋（北宋）：燕云未得、河西与西域未及，西南仅羁縻
  113: {
    河南: 2, 山东: 2, 安徽: 2, 江苏: 2, 浙江: 2, 江西: 2, 福建: 2, 湖北: 2, 湖南: 2,
    广东: 2, 广西: 2, 海南: 2, 四川: 2, 重庆: 2, 陕西: 2, 上海: 2,
    河北: 1, 山西: 1, 贵州: 1,
    内蒙古: 0, 辽宁: 0, 吉林: 0, 黑龙江: 0, 新疆: 0, 西藏: 0, 青海: 0, 云南: 0,
    宁夏: 0, 甘肃: 0, 台湾: 0, 北京: 0, 天津: 0, 香港: 0, 澳门: 0
  },
  // 元（忽必烈时期）：漠北、东北、青藏并入，西域为宗藩，澎湖设巡检司
  114: {
    内蒙古: 2, 辽宁: 2, 吉林: 2, 黑龙江: 2, 河北: 2, 山西: 2, 山东: 2, 河南: 2,
    陕西: 2, 甘肃: 2, 宁夏: 2, 安徽: 2, 江苏: 2, 浙江: 2, 江西: 2, 福建: 2,
    湖北: 2, 湖南: 2, 广东: 2, 广西: 2, 海南: 2, 四川: 2, 重庆: 2, 贵州: 2,
    云南: 2, 西藏: 2, 青海: 2, 北京: 2, 天津: 2, 上海: 2,
    新疆: 1, 台湾: 1,
    香港: 0, 澳门: 0
  }
}

const FILL: Record<Level, string> = {
  2: '#E3C181',
  1: '#F4E6C8',
  0: '#E9E6DF'
}
const STROKE: Record<Level, string> = {
  2: '#B08A3E',
  1: '#C9AC74',
  0: '#D3D0C8'
}

const levelOf = (name: string): Level => {
  const table = LEVELS[props.dynastyId] || {}
  return table[name] ?? 0
}

const shapes = computed(() => {
  return features.value
    .map((f) => {
      const name = provinceName(f)
      const level = levelOf(name)
      return {
        name,
        level,
        d: featurePath(f),
        fill: level === 0 ? 'none' : FILL[level],
        stroke: level === 0 ? 'none' : STROKE[level]
      }
    })
    .sort((a, b) => a.level - b.level)
})

const asiaPaths = computed(() =>
  asiaFeatures.value.map((f) => ({ name: f.properties.name || '', d: featurePath(f) }))
)

/* ---------------- 域外疆域：现代中国轮廓之外的控制区（示意） ---------------- */
interface ExtraTerritory {
  name: string
  level: 1 | 2
  ring: number[][]
}

const EXTRA_TERRITORIES: Record<number, ExtraTerritory[]> = {
  112: [
    {
      name: '安西·北庭',
      level: 1,
      ring: [[73, 40], [80, 39], [86, 40], [92, 40], [93, 45], [89, 47], [82, 47], [76, 46], [73, 44]]
    },
    {
      name: '安北都护府',
      level: 1,
      ring: [[88, 46], [95, 48], [102, 50], [110, 50], [116, 50], [118, 46], [112, 43], [104, 43], [96, 44]]
    },
    {
      name: '安东都护府',
      level: 1,
      ring: [[124, 39], [126, 39], [127, 41], [129, 42], [129, 39], [127, 38], [125, 38]]
    }
  ],
  114: [
    {
      name: '蒙古高原',
      level: 2,
      ring: [[85, 45], [90, 48], [98, 50], [108, 52], [116, 53], [122, 52], [126, 49], [120, 46], [112, 44], [104, 43], [96, 44], [88, 44]]
    },
    {
      name: '岭北行省',
      level: 2,
      ring: [[80, 52], [95, 55], [112, 57], [130, 56], [140, 55], [145, 50], [138, 48], [128, 50], [118, 50], [105, 53], [92, 52]]
    },
    {
      name: '中亚东部',
      level: 1,
      ring: [[60, 42], [70, 44], [75, 46], [80, 45], [78, 40], [72, 38], [65, 38], [60, 40]]
    },
    {
      name: '朝鲜半岛',
      level: 2,
      ring: [[124, 38], [126, 38], [128, 39], [130, 42], [129, 43], [126, 43], [124, 41]]
    }
  ]
}

const extras = computed(() =>
  (EXTRA_TERRITORIES[props.dynastyId] || []).map((t) => ({
    ...t,
    d: ringPath(t.ring),
    fill: FILL[t.level],
    stroke: STROKE[t.level]
  }))
)

/* ---------------- 关键城市（经纬度） ---------------- */
interface City {
  name: string
  lon: number
  lat: number
  capital?: boolean
}

const CITIES: Record<number, City[]> = {
  112: [
    { name: '长安', lon: 108.94, lat: 34.34, capital: true },
    { name: '洛阳', lon: 112.45, lat: 34.62 },
    { name: '扬州', lon: 119.42, lat: 32.39 },
    { name: '成都', lon: 104.07, lat: 30.66 },
    { name: '广州', lon: 113.26, lat: 23.13 },
    { name: '龟兹', lon: 82.96, lat: 41.72 },
    { name: '北庭', lon: 89.19, lat: 43.99 },
    { name: '安东', lon: 125.75, lat: 39.03 }
  ],
  113: [
    { name: '开封', lon: 114.31, lat: 34.8, capital: true },
    { name: '临安', lon: 120.16, lat: 30.27 },
    { name: '江宁', lon: 118.8, lat: 32.06 },
    { name: '成都', lon: 104.07, lat: 30.66 },
    { name: '泉州', lon: 118.59, lat: 24.91 },
    { name: '广州', lon: 113.26, lat: 23.13 },
    { name: '秦州', lon: 105.72, lat: 34.58 }
  ],
  114: [
    { name: '大都', lon: 116.4, lat: 39.9, capital: true },
    { name: '上都', lon: 116.18, lat: 42.36 },
    { name: '西安', lon: 108.94, lat: 34.34 },
    { name: '成都', lon: 104.07, lat: 30.66 },
    { name: '杭州', lon: 120.16, lat: 30.27 },
    { name: '广州', lon: 113.26, lat: 23.13 },
    { name: '昆明', lon: 102.83, lat: 24.88 },
    { name: '拉萨', lon: 91.11, lat: 29.65 },
    { name: '平壤', lon: 125.75, lat: 39.03 }
  ]
}

const cities = computed(() =>
  (CITIES[props.dynastyId] || []).map((c) => ({
    ...c,
    x: projX(c.lon),
    y: projY(c.lat)
  }))
)

const legend = [
  { label: '直接统治', fill: FILL[2], stroke: STROKE[2], dash: false },
  { label: '羁縻 / 都护府', fill: FILL[1], stroke: STROKE[1], dash: true },
  { label: '亚洲底图', fill: '#ECE9E2', stroke: '#D9D5CA', dash: false },
  { label: '现代中国', fill: '#E6E2D8', stroke: '#B7B1A3', dash: false }
]
</script>

<template>
  <div>
    <div class="bg-white/40 rounded-md border border-[#D8B26A]/20 p-4">
      <svg viewBox="0 0 630 384" class="w-full" style="max-height: 420px;">
        <rect x="0" y="0" width="630" height="384" fill="#F0EDE6" opacity="0.5" />

        <!-- 第一层：亚洲底图（地理参照） -->
        <g v-if="asiaPaths.length">
          <path
            v-for="a in asiaPaths"
            :key="'asia-' + a.name"
            :d="a.d"
            fill="#ECE9E2"
            stroke="#D9D5CA"
            stroke-width="0.5"
            vector-effect="non-scaling-stroke"
          >
            <title>{{ a.name }}</title>
          </path>
        </g>

        <!-- 第二层：现代中国轮廓 -->
        <g v-if="shapes.length">
          <path
            v-for="s in shapes"
            :key="'cn-' + s.name"
            :d="s.d"
            fill="#E6E2D8"
            stroke="#B7B1A3"
            stroke-width="0.6"
            vector-effect="non-scaling-stroke"
          />
        </g>

        <!-- 第三层：当朝疆域（省域控制程度） -->
        <g v-if="shapes.length">
          <path
            v-for="s in shapes"
            :key="'dy-' + s.name"
            :d="s.d"
            :fill="s.fill"
            :stroke="s.stroke"
            :stroke-width="s.level === 2 ? 0.9 : 0.6"
            :stroke-dasharray="s.level === 1 ? '3 2' : undefined"
            vector-effect="non-scaling-stroke"
          >
            <title>{{ s.name }}</title>
          </path>
        </g>

        <!-- 域外疆域（现代中国轮廓之外） -->
        <g v-if="extras.length">
          <path
            v-for="t in extras"
            :key="t.name"
            :d="t.d"
            :fill="t.fill"
            :stroke="t.stroke"
            :stroke-width="t.level === 2 ? 0.9 : 0.6"
            :stroke-dasharray="t.level === 1 ? '3 2' : undefined"
            vector-effect="non-scaling-stroke"
          >
            <title>{{ t.name }}</title>
          </path>
        </g>

        <g v-for="c in cities" :key="c.name">
          <circle
            :cx="c.x"
            :cy="c.y"
            :r="c.capital ? 4.5 : 3"
            :fill="c.capital ? '#C34739' : '#355C5A'"
            :stroke="c.capital ? '#C34739' : '#4A6F7A'"
            stroke-width="1.2"
            opacity="0.9"
          />
          <circle v-if="c.capital" :cx="c.x" :cy="c.y" r="9" fill="#C34739" opacity="0.15" />
          <text
            :x="c.x"
            :y="c.y + (c.capital ? 15 : 12)"
            text-anchor="middle"
            :font-size="c.capital ? 11 : 9"
            :fill="c.capital ? '#C34739' : '#4A4A3A'"
            :font-weight="c.capital ? 'bold' : 'normal'"
            font-family="serif"
          >{{ c.name }}</text>
        </g>

        <text
          v-if="loadFailed"
          x="315"
          y="192"
          text-anchor="middle"
          font-size="12"
          fill="#C34739"
        >地图数据加载失败</text>

        <g transform="translate(10, 362)">
          <g v-for="(l, i) in legend" :key="l.label" :transform="`translate(${i * 150}, 0)`">
            <rect
              x="0"
              y="0"
              width="13"
              height="9"
              :fill="l.fill"
              :stroke="l.stroke"
              stroke-width="1.2"
              rx="1"
              :stroke-dasharray="l.dash ? '3 2' : undefined"
            />
            <text x="17" y="8" font-size="8" fill="#4A4A3A" opacity="0.75">{{ l.label }}</text>
          </g>
        </g>
      </svg>

      <div class="text-center mt-2 space-y-0.5">
        <p class="text-xs text-[#4A4A3A]/50">{{ dynastyName }}疆域势力范围 · 亚洲底图 + 现代中国轮廓</p>
        <p class="text-[11px] text-[#4A4A3A]/40">浅灰为亚洲地理参照，灰色省界为现代中国轮廓；配色表示当朝控制程度，不代表精确历史边界</p>
      </div>
    </div>
  </div>
</template>
