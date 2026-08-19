import { readFileSync, writeFileSync } from 'fs'
import { feature } from 'topojson-client'
import { geoMercator, geoPath } from 'd3-geo'

// Load the world TopoJSON (50m resolution for more detail)
const topo = JSON.parse(readFileSync('scripts/countries-50m.json', 'utf-8'))

// Convert to GeoJSON
const countries = feature(topo, topo.objects.countries)

// Find China (ISO code 156)
const china = countries.features.find(f => f.id === '156')
if (!china) {
  console.error('China not found!')
  process.exit(1)
}

// Create a Mercator projection centered on China
const projection = geoMercator()
  .fitExtent([[0, 0], [500, 400]], china)

const pathGen = geoPath(projection)

// Generate the SVG path string for the full China outline
const svgPath = pathGen(china)

console.log('=== Modern China SVG Path (viewBox 0 0 500 400) ===')
console.log(svgPath)

// Also extract individual polygon paths for reference
// This helps us understand the structure (mainland, Taiwan, Hainan, etc.)
console.log('\n=== Individual polygon paths ===')
if (china.geometry.type === 'MultiPolygon') {
  china.geometry.coordinates.forEach((polygon, i) => {
    const singlePoly = {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: polygon },
      properties: {}
    }
    const path = pathGen(singlePoly)
    console.log(`Polygon ${i}: ${path}`)
  })
} else if (china.geometry.type === 'Polygon') {
  console.log('Single polygon')
}

// Save to file
const output = {
  modernChinaPath: svgPath,
  viewBox: '0 0 500 400',
  geometryType: china.geometry.type
}

writeFileSync('scripts/china-path.json', JSON.stringify(output, null, 2))
console.log('\nSaved to scripts/china-path.json')