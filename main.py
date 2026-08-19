# -*- coding: utf-8 -*-
"""
历史知识图谱数据采集 —— 主入口
=================================

执行流程:
  1. 初始化 SQLite 数据库 (database/history_graph.db)
  2. 从 Wikidata + Wikipedia 采集测试人物数据
  3. 从 Wikidata + Wikipedia 采集测试事件数据
  4. 输出导入日志 (output/import_log.txt)
  5. 输出统计信息 (output/statistics.json)

运行方式:
  python main.py
"""

import json
import os
import sys
import time
import datetime

# stdout 强制 UTF-8（Windows 终端）
try:
    sys.stdout.reconfigure(line_buffering=True, encoding="utf-8")
except Exception:
    pass

from init_db import init_database
from collectors.person_collector import collect_persons, TEST_PERSONS
from collectors.event_collector import collect_events, TEST_EVENTS

# =====================================================================
# 路径配置
# =====================================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, "output")
DB_PATH = os.path.join(BASE_DIR, "database", "history_graph.db")
LOG_PATH = os.path.join(OUTPUT_DIR, "import_log.txt")
STAT_PATH = os.path.join(OUTPUT_DIR, "statistics.json")

os.makedirs(OUTPUT_DIR, exist_ok=True)


# =====================================================================
# 日志系统
# =====================================================================
class Logger:
    def __init__(self, log_path):
        self.log_path = log_path
        self.entries = []
        # 清空旧日志
        with open(log_path, "w", encoding="utf-8") as f:
            f.write("# 历史知识图谱 —— 数据导入日志\n")
            f.write(f"# 生成时间: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"# 数据源: Wikidata + Wikipedia (中文)\n")
            f.write("# " + "=" * 60 + "\n\n")

    def log(self, message):
        timestamp = datetime.datetime.now().strftime("%H:%M:%S")
        line = f"[{timestamp}] {message}"
        self.entries.append(line)
        with open(self.log_path, "a", encoding="utf-8") as f:
            f.write(line + "\n")
        print(line)

    def write_summary(self, person_results, event_results):
        """在日志末尾追加汇总信息。"""
        with open(self.log_path, "a", encoding="utf-8") as f:
            f.write("\n# " + "=" * 60 + "\n")
            f.write("# 汇总信息\n")
            f.write("# " + "=" * 60 + "\n")
            f.write(f"# 人物: 成功 {sum(1 for r in person_results if r['status'] == 'ok')} / {len(person_results)}\n")
            f.write(f"# 事件: 成功 {sum(1 for r in event_results if r['status'] == 'ok')} / {len(event_results)}\n")
            f.write(f"# 总日志条目: {len(self.entries)}\n")


# =====================================================================
# 统计信息生成
# =====================================================================
def generate_statistics(conn, person_results, event_results):
    """从数据库读取统计信息并写入 statistics.json。"""
    cursor = conn.cursor()

    # 从数据库真实计数
    cursor.execute("SELECT COUNT(*) FROM person")
    person_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM event")
    event_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM person_role")
    role_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM person_relation")
    relation_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM person_event")
    person_event_count = cursor.fetchone()[0]

    # 人物详情（从数据库读）
    cursor.execute("SELECT id, name, birth_year, death_year, dynasty FROM person ORDER BY id")
    person_details = []
    for row in cursor.fetchall():
        pid, name, b, d, dynasty = row
        cursor.execute("SELECT role_name FROM person_role WHERE person_id = ?", (pid,))
        roles = [r[0] for r in cursor.fetchall()]
        person_details.append({
            "id": pid,
            "name": name,
            "birth_year": b,
            "death_year": d,
            "dynasty": dynasty,
            "roles_count": len(roles),
            "roles": roles,
        })

    # 事件详情
    cursor.execute("SELECT id, name, start_year, end_year, event_type FROM event ORDER BY id")
    event_details = []
    for row in cursor.fetchall():
        eid, name, s, e, etype = row
        event_details.append({
            "id": eid,
            "name": name,
            "start_year": s,
            "end_year": e,
            "event_type": etype,
        })

    stats = {
        "generated_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "database": "database/history_graph.db",
        "tables": {
            "person": person_count,
            "person_role": role_count,
            "event": event_count,
            "person_relation": relation_count,
            "person_event": person_event_count,
        },
        "data_sources": ["Wikidata (SPARQL + API)", "Wikipedia (中文简介)"],
        "persons": person_details,
        "events": event_details,
    }

    with open(STAT_PATH, "w", encoding="utf-8") as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)

    return stats


# =====================================================================
# 主流程
# =====================================================================
def main():
    print("=" * 60)
    print(" 《历史中的我》 —— 历史知识图谱数据采集系统")
    print(" Historical Knowledge Graph Data Collector")
    print("=" * 60)
    print(f" 数据库: {DB_PATH}")
    print(f" 日志输出: {LOG_PATH}")
    print(f" 统计输出: {STAT_PATH}")
    print(f" 数据源: Wikidata | Wikipedia")
    print("=" * 60)

    start_time = time.time()

    # 1. 初始化数据库（重置）
    print("\n>>> 步骤 1/4: 初始化数据库")
    conn = init_database(reset=True)
    logger = Logger(LOG_PATH)
    logger.log("数据库初始化成功，共 5 张表")

    # 2. 采集人物
    print("\n>>> 步骤 2/4: 采集历史人物")
    print(f" 待采集人物: {', '.join(TEST_PERSONS)}")
    print("  (网络请求 + Wikidata SPARQL 查询，约需 2-3 分钟)")
    person_results = collect_persons(conn, names=TEST_PERSONS, logger=logger.log)

    # 3. 采集事件
    print("\n>>> 步骤 3/4: 采集历史事件")
    print(f" 待采集事件: {', '.join(TEST_EVENTS)}")
    print("  (网络请求 + Wikidata SPARQL 查询，约需 2-3 分钟)")
    event_results = collect_events(conn, names=TEST_EVENTS, logger=logger.log)

    # 4. 生成统计
    print("\n>>> 步骤 4/4: 生成统计报告")
    stats = generate_statistics(conn, person_results, event_results)
    logger.log("统计报告生成完成")
    logger.write_summary(person_results, event_results)

    conn.close()

    # 5. 输出漂亮的报告
    elapsed = int(time.time() - start_time)
    print("\n" + "=" * 60)
    print(" 采集完成！统计报告")
    print("=" * 60)
    print(f" 耗时: {elapsed} 秒")
    print(f" 数据库: {DB_PATH}")
    print(f" 日志: {LOG_PATH}")
    print(f" 统计: {STAT_PATH}")
    print()

    print(" 数据表统计:")
    for table, count in stats["tables"].items():
        bar = "█" * min(count * 2, 40)
        print(f"   {table:<20s} {count:>5d} 条 {bar}")
    print()

    print(" 人物详情:")
    for p in stats["persons"]:
        print(f"   [id={p['id']:>2d}] {p['name']:<10s} "
              f"{p['birth_year']}-{p['death_year']} "
              f"| {p['dynasty']:<10s} "
              f"| {p['roles_count']} 个标签")
    print()

    print(" 事件详情:")
    for e in stats["events"]:
        print(f"   [id={e['id']:>2d}] {e['name']:<15s} "
              f"{e['start_year']}-{e['end_year']} "
              f"| {e['event_type']}")

    print("\n" + "=" * 60)
    print(" ✓ 全部完成！数据库与报告已生成")
    print("=" * 60)


if __name__ == "__main__":
    main()
