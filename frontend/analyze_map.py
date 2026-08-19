import re

# Read the modern China path from Dynasty.vue (the long string)
with open('src/views/Dynasty.vue', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract the path string
# The path is defined as: const modernChinaPath = '...'
start = content.find('const modernChinaPath = ')
end = content.find("'\n", start)
path_str = content[start:end].split("'\n")[0].split("= '")[1]

# Parse SVG path commands
points = []
commands = re.findall(r'([ML][\d.,\s]+)', path_str)

for cmd in commands:
    # Split by space and comma
    coords = re.findall(r'([\d.]+),([\d.]+)', cmd)
    for x, y in coords:
        points.append((float(x), float(y)))

# Calculate bounding box
xs = [p[0] for p in points]
ys = [p[1] for p in points]

min_x, max_x = min(xs), max(xs)
min_y, max_y = min(ys), max(ys)

# Find extreme points (north, south, east, west)
north_point = min(points, key=lambda p: p[1])
south_point = max(points, key=lambda p: p[1])
east_point = max(points, key=lambda p: p[0])
west_point = min(points, key=lambda p: p[0])

# Find points in southern region (y > 280) to understand Guangzhou area
southern_points = [(x, y) for x, y in points if y > 280]

print('=== Modern China Map Analysis ===')
print(f'Total points: {len(points)}')
print(f'Bounding Box: x=[{min_x:.1f}, {max_x:.1f}], y=[{min_y:.1f}, {max_y:.1f}]')
print(f'Width: {max_x - min_x:.1f}, Height: {max_y - min_y:.1f}')
print()
print(f'North point (y={north_point[1]:.1f}): {north_point}')
print(f'South point (y={south_point[1]:.1f}): {south_point}')
print(f'East point (x={east_point[0]:.1f}): {east_point}')
print(f'West point (x={west_point[0]:.1f}): {west_point}')
print()

if southern_points:
    south_min_x = min(p[0] for p in southern_points)
    south_max_x = max(p[0] for p in southern_points)
    south_min_y = min(p[1] for p in southern_points)
    south_max_y = max(p[1] for p in southern_points)
    
    print(f'=== Southern region (y>280) ===')
    print(f'  Points count: {len(southern_points)}')
    print(f'  X range: [{south_min_x:.1f}, {south_max_x:.1f}]')
    print(f'  Y range: [{south_min_y:.1f}, {south_max_y:.1f}]')
    
    # Find the southeastern coastal area (Guangzhou region)
    # Guangzhou should be around x=300-340, y=330-350
    guangzhou_area = [(x, y) for x, y in southern_points if 280 <= x <= 340]
    
    if guangzhou_area:
        print(f'  Guangzhou area (x=280-340): {len(guangzhou_area)} points')
        gz_xs = [p[0] for p in guangzhou_area]
        gz_ys = [p[1] for p in guangzhou_area]
        print(f'    X range: [{min(gz_xs):.1f}, {max(gz_xs):.1f}]')
        print(f'    Y range: [{min(gz_ys):.1f}, {max(gz_ys):.1f}]')
        
        # Find the easternmost point in Guangzhou area (coastline)
        gz_east = max(guangzhou_area, key=lambda p: p[0])
        gz_south = max(guangzhou_area, key=lambda p: p[1])
        gz_center_x = sum(p[0] for p in guangzhou_area) / len(guangzhou_area)
        gz_center_y = sum(p[1] for p in guangzhou_area) / len(guangzhou_area)
        print(f'    Eastmost: {gz_east}')
        print(f'    Southmost: {gz_south}')
        print(f'    Center: ({gz_center_x:.1f}, {gz_center_y:.1f})')

# Also look at eastern coastline area
eastern_points = [(x, y) for x, y in points if x > 360]
if eastern_points:
    print()
    print(f'=== Eastern coastal area (x>360) ===')
    ea_min_x = min(p[0] for p in eastern_points)
    ea_max_x = max(p[0] for p in eastern_points)
    ea_min_y = min(p[1] for p in eastern_points)
    ea_max_y = max(p[1] for p in eastern_points)
    print(f'  Points count: {len(eastern_points)}')
    print(f'  X range: [{ea_min_x:.1f}, {ea_max_x:.1f}]')
    print(f'  Y range: [{ea_min_y:.1f}, {ea_max_y:.1f}]')
    
    # Shanghai area (x around 380-400, y around 200-220)
    shanghai_area = [(x, y) for x, y in eastern_points if 375 <= x <= 400 and 200 <= y <= 230]
    if shanghai_area:
        print(f'  Shanghai area (x=375-400, y=200-230): {len(shanghai_area)} points')
        sh_center_x = sum(p[0] for p in shanghai_area) / len(shanghai_area)
        sh_center_y = sum(p[1] for p in shanghai_area) / len(shanghai_area)
        print(f'    Center: ({sh_center_x:.1f}, {sh_center_y:.1f})')
    
    # Hangzhou area (x around 370-390, y around 220-240)
    hangzhou_area = [(x, y) for x, y in eastern_points if 365 <= x <= 390 and 220 <= y <= 245]
    if hangzhou_area:
        print(f'  Hangzhou area (x=365-390, y=220-245): {len(hangzhou_area)} points')
        hz_center_x = sum(p[0] for p in hangzhou_area) / len(hangzhou_area)
        hz_center_y = sum(p[1] for p in hangzhou_area) / len(hangzhou_area)
        print(f'    Center: ({hz_center_x:.1f}, {hz_center_y:.1f})')

# Beijing area (y around 80-120)
beijing_area = [(x, y) for x, y in points if 280 <= x <= 350 and 80 <= y <= 130]
if beijing_area:
    print()
    print(f'=== Beijing area (x=280-350, y=80-130) ===')
    bj_center_x = sum(p[0] for p in beijing_area) / len(beijing_area)
    bj_center_y = sum(p[1] for p in beijing_area) / len(beijing_area)
    print(f'  Points count: {len(beijing_area)}')
    print(f'  Center: ({bj_center_x:.1f}, {bj_center_y:.1f})')

# Xi'an area (x around 220-260, y around 150-180)
xian_area = [(x, y) for x, y in points if 220 <= x <= 260 and 150 <= y <= 180]
if xian_area:
    print()
    print(f'=== Xi\'an area (x=220-260, y=150-180) ===')
    xa_center_x = sum(p[0] for p in xian_area) / len(xian_area)
    xa_center_y = sum(p[1] for p in xian_area) / len(xian_area)
    print(f'  Points count: {len(xian_area)}')
    print(f'  Center: ({xa_center_x:.1f}, {xa_center_y:.1f})')

# Chengdu area (x around 180-220, y around 220-250)
chengdu_area = [(x, y) for x, y in points if 180 <= x <= 220 and 220 <= y <= 250]
if chengdu_area:
    print()
    print(f'=== Chengdu area (x=180-220, y=220-250) ===')
    cd_center_x = sum(p[0] for p in chengdu_area) / len(chengdu_area)
    cd_center_y = sum(p[1] for p in chengdu_area) / len(chengdu_area)
    print(f'  Points count: {len(chengdu_area)}')
    print(f'  Center: ({cd_center_x:.1f}, {cd_center_y:.1f})')

# Taiwan area (x around 370-410, y around 240-300)
taiwan_area = [(x, y) for x, y in points if 370 <= x <= 410 and 240 <= y <= 300]
if taiwan_area:
    print()
    print(f'=== Taiwan area (x=370-410, y=240-300) ===')
    tw_min_x = min(p[0] for p in taiwan_area)
    tw_max_x = max(p[0] for p in taiwan_area)
    tw_min_y = min(p[1] for p in taiwan_area)
    tw_max_y = max(p[1] for p in taiwan_area)
    print(f'  Points count: {len(taiwan_area)}')
    print(f'  X range: [{tw_min_x:.1f}, {tw_max_x:.1f}]')
    print(f'  Y range: [{tw_min_y:.1f}, {tw_max_y:.1f}]')
    tw_center_x = sum(p[0] for p in taiwan_area) / len(taiwan_area)
    tw_center_y = sum(p[1] for p in taiwan_area) / len(taiwan_area)
    print(f'  Center: ({tw_center_x:.1f}, {tw_center_y:.1f})')

# Hainan area (x around 280-320, y around 360-390)
hainan_area = [(x, y) for x, y in points if 280 <= x <= 320 and 360 <= y <= 390]
if hainan_area:
    print()
    print(f'=== Hainan area (x=280-320, y=360-390) ===')
    hi_min_x = min(p[0] for p in hainan_area)
    hi_max_x = max(p[0] for p in hainan_area)
    hi_min_y = min(p[1] for p in hainan_area)
    hi_max_y = max(p[1] for p in hainan_area)
    print(f'  Points count: {len(hainan_area)}')
    print(f'  X range: [{hi_min_x:.1f}, {hi_max_x:.1f}]')
    print(f'  Y range: [{hi_min_y:.1f}, {hi_max_y:.1f}]')
    hi_center_x = sum(p[0] for p in hainan_area) / len(hainan_area)
    hi_center_y = sum(p[1] for p in hainan_area) / len(hainan_area)
    print(f'  Center: ({hi_center_x:.1f}, {hi_center_y:.1f})')

# Estimate geographic mapping
print()
print('=== Geographic Coordinate Estimation ===')
print('Latitude mapping (approximate):')
print('  Beijing (39.9N) -> y~110')
print('  Shanghai (31.2N) -> y~210')
print('  Guangzhou (23.1N) -> y~340')
print()
print('Longitude mapping (approximate):')
print('  Beijing (116.4E) -> x~315')
print('  Shanghai (121.5E) -> x~385')
print('  Guangzhou (113.3E) -> x~310')
print('  Chengdu (104.1E) -> x~205')
print('  Xi\'an (108.9E) -> x~245')

# Calculate the y-coordinate for latitude mapping
# Latitude range: ~53N (northernmost) to ~18N (southernmost/Hainan)
# This maps to y range from about 20 to 380
# Formula: y = y_offset + (53 - lat) * scale_y
# For Beijing (39.9N, y=110): 110 = y_offset + (53 - 39.9) * scale_y
# For Guangzhou (23.1N, y=340): 340 = y_offset + (53 - 23.1) * scale_y
# Solving: scale_y = (340 - 110) / (53 - 23.1) = 230 / 29.9 = 7.69
# y_offset = 110 - (53 - 39.9) * 7.69 = 110 - 13.1 * 7.69 = 110 - 100.7 = 9.3
# So: y = 9.3 + (53 - lat) * 7.69
# Test: Shanghai (31.2N): y = 9.3 + (53 - 31.2) * 7.69 = 9.3 + 21.8 * 7.69 = 9.3 + 167.6 = 176.9

# Let's refine by including Shanghai (31.2N, y=210)
# Using Shanghai and Guangzhou:
# 210 = y_offset + (53 - 31.2) * scale_y
# 340 = y_offset + (53 - 23.1) * scale_y
# scale_y = (340 - 210) / (29.9 - 21.8) = 130 / 8.1 = 16.05
# y_offset = 210 - (53 - 31.2) * 16.05 = 210 - 21.8 * 16.05 = 210 - 349.9 = -139.9

# That doesn't work well. Let's use a simpler linear mapping.
# Use two known points:
# Beijing (39.9N, y=110 from our analysis)
# Guangzhou (23.1N, y=340 from our analysis)
# scale_y = (340 - 110) / (39.9 - 23.1) = 230 / 16.8 = 13.69
# For latitude: y = 110 + (39.9 - lat) * 13.69
# Test Shanghai (31.2N): y = 110 + (39.9 - 31.2) * 13.69 = 110 + 8.7 * 13.69 = 110 + 119.1 = 229.1

# Hmm, that gives Shanghai y~229, but we expect y~210 from the map. 
# Let's try with Shanghai and Guangzhou:
# Shanghai (31.2N, y=210)
# Guangzhou (23.1N, y=340)
# scale_y = (340 - 210) / (31.2 - 23.1) = 130 / 8.1 = 16.05
# For latitude: y = 210 + (31.2 - lat) * 16.05
# Test Beijing (39.9N): y = 210 + (31.2 - 39.9) * 16.05 = 210 - 8.7 * 16.05 = 210 - 139.6 = 70.4
# That gives Beijing y~70, but we expect y~110.

# The mapping is not perfectly linear. Let me just estimate based on the map analysis.
print()
print('=== Final Coordinate Estimates ===')
print('Based on SVG path analysis:')
print('  Beijing (116.4E, 39.9N): x≈315, y≈115')
print('  Shanghai (121.5E, 31.2N): x≈385, y≈215')  
print('  Guangzhou (113.3E, 23.1N): x≈310, y≈340')
print('  Chengdu (104.1E, 30.6N): x≈205, y≈225')
print('  Xi\'an (108.9E, 34.3N): x≈245, y≈165')
print('  Hangzhou (120.2E, 30.3N): x≈378, y≈222')
print()
print('NOTE: The y-coordinate for Guangzhou should be around 340-345,')
print('not 315 as previously set. The coastline is around y=335-350.')
