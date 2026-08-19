import { readFileSync, writeFileSync } from 'fs'

// Read Dynasty.vue
const content = readFileSync('src/views/Dynasty.vue', 'utf-8')

// Extract the modernChinaPath (the real China outline from Natural Earth)
const modernPathRegex = /const modernChinaPath = '([^']+)'/
const modernMatch = content.match(modernPathRegex)
if (!modernMatch) {
  console.error('Could not find modernChinaPath in Dynasty.vue')
  process.exit(1)
}

const modernPath = modernMatch[1]
console.log('Modern China path extracted, length:', modernPath.length)

// Parse SVG path into segments (each "M ... Z" is a separate polygon)
function parsePathToSegments(pathStr) {
  const segments = []
  let currentSegment = []
  let currentCmd = 'M'
  
  // Split by command letters
  const parts = pathStr.match(/[MLZ][^MLZ]*/g) || []
  
  for (const part of parts) {
    const cmd = part[0]
    const coords = part.slice(1).trim()
    
    if (cmd === 'M') {
      if (currentSegment.length > 0) {
        segments.push(currentSegment)
      }
      currentSegment = []
      currentCmd = 'M'
    }
    
    if (coords) {
      // Parse coordinates: "364.52,329.358" or "364.52,329.358L 364.225,329.888"
      const pairs = coords.split(/[L\s]+/).filter(Boolean)
      for (const pair of pairs) {
        const [x, y] = pair.split(',').map(Number)
        if (!isNaN(x) && !isNaN(y)) {
          currentSegment.push([x, y])
        }
      }
    }
    
    if (cmd === 'Z') {
      if (currentSegment.length > 0) {
        segments.push(currentSegment)
      }
      currentSegment = []
    }
  }
  
  if (currentSegment.length > 0) {
    segments.push(currentSegment)
  }
  
  return segments
}

function segmentsToPath(segments) {
  return segments.map(seg => {
    if (seg.length === 0) return ''
    let path = `M ${seg[0][0]} ${seg[0][1]}`
    for (let i = 1; i < seg.length; i++) {
      path += ` L ${seg[i][0]} ${seg[i][1]}`
    }
    path += ' Z'
    return path
  }).join('')
}

// Simplify a segment by keeping every Nth point (Ramer-Douglas-Peucker style)
function simplifySegment(points, keepEvery = 3) {
  if (points.length <= 10) return points
  
  const simplified = []
  for (let i = 0; i < points.length; i += keepEvery) {
    simplified.push(points[i])
  }
  // Always include the last point
  if (simplified[simplified.length - 1] !== points[points.length - 1]) {
    simplified.push(points[points.length - 1])
  }
  return simplified
}

const segments = parsePathToSegments(modernPath)
console.log(`Found ${segments.length} segments, point counts:`, segments.map(s => s.length))

// Find the main segment (largest by point count)
const mainSegmentIdx = segments.reduce((maxIdx, seg, idx, arr) => 
  seg.length > arr[maxIdx].length ? idx : maxIdx, 0)
console.log(`Main segment has ${segments[mainSegmentIdx].length} points`)

// Simplify the main segment to about 50-60 points for a recognizable outline
const keepEvery = Math.max(1, Math.floor(segments[mainSegmentIdx].length / 55))
const simplifiedMain = simplifySegment(segments[mainSegmentIdx], keepEvery)
console.log(`Simplified main segment: ${simplifiedMain.length} points (keepEvery=${keepEvery})`)

// Create the simplified China path
const simplifiedSegments = [...segments]
simplifiedSegments[mainSegmentIdx] = simplifiedMain
const simplifiedChinaPath = segmentsToPath(simplifiedSegments)
console.log('Simplified China path length:', simplifiedChinaPath.length)

// Now create dynasty-specific versions by adjusting the simplified path
// Each dynasty gets a different scale/offset based on historical territory
function transformSegment(points, scaleX, scaleY, offsetX, offsetY, centerX, centerY) {
  return points.map(([x, y]) => {
    const dx = x - centerX
    const dy = y - centerY
    return [
      Math.round(centerX + dx * scaleX + offsetX),
      Math.round(centerY + dy * scaleY + offsetY)
    ]
  })
}

// Calculate the center of the main segment
const centerX = simplifiedMain.reduce((sum, p) => sum + p[0], 0) / simplifiedMain.length
const centerY = simplifiedMain.reduce((sum, p) => sum + p[1], 0) / simplifiedMain.length
console.log(`Center: (${centerX.toFixed(1)}, ${centerY.toFixed(1)})`)

// Create dynasty-specific paths
// 上古: smallest, centered on Yellow River basin
// 汉朝: close to modern China but slightly smaller in west/north
// 唐朝: largest, extends significantly west and north
// 宋朝: smallest, southern focus, no northern territories
// 明朝: similar to modern China but slightly smaller
// 清朝: largest, extends north and west beyond modern China

const dynastyTransforms = {
  '上古': { scaleX: 0.35, scaleY: 0.38, offsetX: -20, offsetY: 35 },
  '汉朝': { scaleX: 0.88, scaleY: 0.85, offsetX: 0, offsetY: 5 },
  '唐朝': { scaleX: 1.12, scaleY: 1.15, offsetX: -15, offsetY: -15 },
  '宋朝': { scaleX: 0.55, scaleY: 0.58, offsetX: 25, offsetY: 50 },
  '明朝': { scaleX: 0.92, scaleY: 0.90, offsetX: -5, offsetY: 5 },
  '清朝': { scaleX: 1.18, scaleY: 1.22, offsetX: -20, offsetY: -25 },
}

const dynastyPaths = {}
for (const [name, transform] of Object.entries(dynastyTransforms)) {
  const transformedMain = transformSegment(
    simplifiedMain, 
    transform.scaleX, transform.scaleY, 
    transform.offsetX, transform.offsetY,
    centerX, centerY
  )
  const dynastySegments = [...simplifiedSegments]
  dynastySegments[mainSegmentIdx] = transformedMain
  dynastyPaths[name] = segmentsToPath(dynastySegments)
  console.log(`${name} path length: ${dynastyPaths[name].length}`)
}

// Now update Dynasty.vue
const mapPathRegex = /const chinaMapPath = computed\(\(\) => \{[\s\S]*?return paths\[dynasty\.value\?\.name \|\| ''\] \|\| paths\['上古'\]/

const newMapPath = `const chinaMapPath = computed(() => {
  const paths: Record<string, string> = {
    '上古': '${dynastyPaths['上古']}',
    '汉朝': '${dynastyPaths['汉朝']}',
    '唐朝': '${dynastyPaths['唐朝']}',
    '宋朝': '${dynastyPaths['宋朝']}',
    '明朝': '${dynastyPaths['明朝']}',
    '清朝': '${dynastyPaths['清朝']}'
  }
  return paths[dynasty.value?.name || ''] || paths['上古']`

const newContent = content.replace(mapPathRegex, newMapPath)

writeFileSync('src/views/Dynasty.vue', newContent)
console.log('\nDynasty.vue updated with simplified China-based dynasty paths!')