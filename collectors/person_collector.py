# -*- coding: utf-8 -*-
"""
历史人物采集器 (Person Collector)
=================================

数据来源:
  1. Wikidata (SPARQL + wbsearchentities)
  2. Wikipedia 中文简介

测试人物:
  孔子, 曹操, 李白, 苏轼, 岳飞

采集字段:
  person 表:   姓名 / 生年 / 卒年 / 朝代 / 简介 / 图片
  person_role: 职业标签
  person_relation: 人物之间关系（父子 / 夫妻 / 师生等）
  person_event: 人物参与事件

仅使用 Python 标准库 (sqlite3 / urllib / json / re / time / os)。
"""

import json
import os
import re
import sqlite3
import time
import urllib.request
import urllib.parse

# =====================================================================
# 全局配置
# =====================================================================
SPARQL_ENDPOINT = "https://query.wikidata.org/sparql"
SEARCH_API = "https://www.wikidata.org/w/api.php"
WIKIPEDIA_ZH = "https://zh.wikipedia.org/api/rest_v1/page/summary/{title}"

USER_AGENT = "HistoricalFeasibility/1.0 (Student Thesis; Python/3)"

# 节流配置
RETRY_MAX = 5
RETRY_WAIT_START = 5
QUERY_WAIT = 3        # 单次查询间等待
BETWEEN_PERSON_WAIT = 5  # 切换人物间等待

# 预设人物 QID（避免搜索失败）
PERSON_QID_MAP = {
    "孔子": "Q4604",
    "曹操": "Q204077",
    "李白": "Q7071",
    "苏轼": "Q36020",
    "岳飞": "Q334398",
}

# 测试人物列表
TEST_PERSONS = ["孔子", "曹操", "李白", "苏轼", "岳飞"]

# =====================================================================
# HTTP 工具函数
# =====================================================================
def _http_get_json(url, timeout=30):
    """带重试的 HTTP GET，返回解析后的 JSON。"""
    headers = {"User-Agent": USER_AGENT, "Accept": "application/json"}
    last_err = None
    for attempt in range(RETRY_MAX):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            last_err = e
            wait = RETRY_WAIT_START * (attempt + 1)
            time.sleep(wait)
    return None


def _http_post_sparql(query, timeout=60):
    """发送 SPARQL POST 查询。"""
    data = urllib.parse.urlencode({"query": query}).encode("utf-8")
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "application/sparql-results+json",
    }
    for attempt in range(RETRY_MAX):
        try:
            req = urllib.request.Request(SPARQL_ENDPOINT, data=data, headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            wait = RETRY_WAIT_START * (attempt + 1)
            time.sleep(wait)
    return None


def _val(item, key):
    """从 SPARQL 结果中安全取值。"""
    if not isinstance(item, dict):
        return ""
    x = item.get(key)
    if not isinstance(x, dict):
        return ""
    return x.get("value", "") or ""


def _extract_qid(uri):
    """从 'http://www.wikidata.org/entity/Q123' 提取 'Q123'。"""
    if not uri:
        return ""
    m = re.search(r"(Q\d+)$", uri)
    return m.group(1) if m else ""


# =====================================================================
# Wikidata: QID 获取
# =====================================================================
def find_person_qid(name):
    """
    获取人物的 Wikidata QID。
    优先使用预设 QID，否则通过 Wikidata API 搜索。
    """
    if name in PERSON_QID_MAP:
        print(f"  [QID] 使用预设: {name} → Q{PERSON_QID_MAP[name]}")
        return PERSON_QID_MAP[name]

    print(f"  [QID] Wikidata 搜索: {name}")
    params = {
        "action": "wbsearchentities",
        "search": name,
        "language": "zh",
        "type": "item",
        "limit": "3",
        "format": "json",
    }
    url = SEARCH_API + "?" + urllib.parse.urlencode(params)
    result = _http_get_json(url)

    if not result or "search" not in result or not result["search"]:
        return None

    for item in result["search"][:3]:
        qid = item.get("id", "")
        label = item.get("label", "")
        desc = item.get("description", "")
        if any(k in desc.lower() for k in ["politician", "philosopher", "poet",
                                            "writer", "general", "emperor", "military"]):
            print(f"  [QID] 匹配: {label} ({qid}) - {desc}")
            return qid

    first = result["search"][0]
    print(f"  [QID] fallback: {first.get('label', '')} ({first.get('id', '')})")
    return first.get("id", "")


# =====================================================================
# Wikidata: SPARQL 查询人物结构化字段（改进版）
# =====================================================================
def query_person_structured(qid):
    """
    通过 SPARQL 查询人物结构化信息 - 改进版。
    核心改进：先查 QID，再单独查询中文标签，避免中文标签过滤导致数据丢失。
    """
    out = {
        "name_zh": "",
        "name_en": "",
        "birth_year": None,
        "death_year": None,
        "image_url": "",
        "roles": [],
        "events": [],      # [(event_qid, event_name_zh, event_year)]
        "relations": [],   # [(target_qid, target_name_zh, relation_type)]
    }

    # ---- 查询 1: 基本信息 + 职业 QID + 生卒年 + 图片 ----
    q1 = f"""
    SELECT ?labelZh ?labelEn ?birthYear ?deathYear ?imageUrl ?occ WHERE {{
      OPTIONAL {{ wd:{qid} rdfs:label ?labelZh . FILTER(LANG(?labelZh) = "zh") }}
      OPTIONAL {{ wd:{qid} rdfs:label ?labelEn . FILTER(LANG(?labelEn) = "en") }}
      OPTIONAL {{
        wd:{qid} wdt:P569 ?birth .
        BIND(YEAR(?birth) AS ?birthYear)
      }}
      OPTIONAL {{
        wd:{qid} wdt:P570 ?death .
        BIND(YEAR(?death) AS ?deathYear)
      }}
      OPTIONAL {{ wd:{qid} wdt:P18 ?imageUrl }}
      OPTIONAL {{ wd:{qid} wdt:P106 ?occ }}
    }}
    LIMIT 30
    """
    time.sleep(QUERY_WAIT)
    data1 = _http_post_sparql(q1)

    occ_qids = []  # 收集职业 QID
    if data1 and "results" in data1:
        for b in data1["results"].get("bindings", []):
            if not out["name_zh"]:
                out["name_zh"] = _val(b, "labelZh")
            if not out["name_en"]:
                out["name_en"] = _val(b, "labelEn")
            if out["birth_year"] is None and _val(b, "birthYear"):
                try:
                    out["birth_year"] = int(float(_val(b, "birthYear")))
                except (ValueError, TypeError):
                    pass
            if out["death_year"] is None and _val(b, "deathYear"):
                try:
                    out["death_year"] = int(float(_val(b, "deathYear")))
                except (ValueError, TypeError):
                    pass
            if not out["image_url"]:
                out["image_url"] = _val(b, "imageUrl")
            occ_uri = _val(b, "occ")
            if occ_uri:
                occ_qid = _extract_qid(occ_uri)
                if occ_qid and occ_qid not in occ_qids:
                    occ_qids.append(occ_qid)

    # 如果没有中文名，用英文名
    if not out["name_zh"] and out["name_en"]:
        out["name_zh"] = out["name_en"]

    # ---- 查询 1b: 职业 QID 的中文标签 ----
    if occ_qids:
        q1b = f"""
        SELECT ?item ?label WHERE {{
          VALUES ?item {{ {' '.join(f'wd:{q}' for q in occ_qids)} }}
          ?item rdfs:label ?label .
          FILTER(LANG(?label) = "zh")
        }}
        """
        time.sleep(QUERY_WAIT)
        data1b = _http_post_sparql(q1b)
        label_map = {}
        if data1b and "results" in data1b:
            for b in data1b["results"].get("bindings", []):
                q = _extract_qid(_val(b, "item"))
                label = _val(b, "label")
                if q and label:
                    label_map[q] = label
        for q in occ_qids:
            if q in label_map:
                out["roles"].append(label_map[q])

    # ---- 查询 2: 关系 QID (P22父亲, P25母亲, P40子女, P26配偶, P3373兄弟姐妹) ----
    rel_prop_map = {
        "P22": "父亲",
        "P25": "母亲",
        "P40": "子女",
        "P26": "配偶",
        "P3373": "兄弟姐妹",
    }
    rel_targets = []  # [(target_qid, relation_type)]
    for prop, rel_type in rel_prop_map.items():
        q2 = f"""
        SELECT ?target WHERE {{
          wd:{qid} wdt:{prop} ?target .
        }}
        LIMIT 10
        """
        time.sleep(QUERY_WAIT)
        data2 = _http_post_sparql(q2)
        if data2 and "results" in data2:
            for b in data2["results"].get("bindings", []):
                t_qid = _extract_qid(_val(b, "target"))
                if t_qid and (t_qid, rel_type) not in [(t, r) for t, r in rel_targets]:
                    rel_targets.append((t_qid, rel_type))

    # 查询关系目标的中文标签
    if rel_targets:
        target_qids = list(set(t for t, _ in rel_targets))
        q2b = f"""
        SELECT ?item ?label WHERE {{
          VALUES ?item {{ {' '.join(f'wd:{q}' for q in target_qids)} }}
          ?item rdfs:label ?label .
          FILTER(LANG(?label) = "zh")
        }}
        """
        time.sleep(QUERY_WAIT)
        data2b = _http_post_sparql(q2b)
        label_map = {}
        if data2b and "results" in data2b:
            for b in data2b["results"].get("bindings", []):
                q = _extract_qid(_val(b, "item"))
                label = _val(b, "label")
                if q and label:
                    label_map[q] = label
        for t_qid, rel_type in rel_targets:
            t_name = label_map.get(t_qid, "")
            if t_name:  # 只存能找到中文标签的
                out["relations"].append((t_qid, t_name, rel_type))

    # ---- 查询 3: 参与事件 QID (P1344参与事件, P793重要事件) ----
    event_targets = []  # [(event_qid,)]
    for event_prop in ["P1344", "P793"]:
        q3 = f"""
        SELECT ?event WHERE {{
          wd:{qid} wdt:{event_prop} ?event .
        }}
        LIMIT 10
        """
        time.sleep(QUERY_WAIT)
        data3 = _http_post_sparql(q3)
        if data3 and "results" in data3:
            for b in data3["results"].get("bindings", []):
                e_qid = _extract_qid(_val(b, "event"))
                if e_qid and e_qid not in [e for e, in event_targets]:
                    event_targets.append((e_qid,))

    # 查询事件的中文标签和年份
    if event_targets:
        evt_qids = list(set(e for (e,) in event_targets))
        q3b = f"""
        SELECT ?item ?label ?year WHERE {{
          VALUES ?item {{ {' '.join(f'wd:{q}' for q in evt_qids)} }}
          ?item rdfs:label ?label .
          FILTER(LANG(?label) = "zh")
          OPTIONAL {{
            ?item wdt:P585|wdt:P580 ?time .
            BIND(YEAR(?time) AS ?year)
          }}
        }}
        """
        time.sleep(QUERY_WAIT)
        data3b = _http_post_sparql(q3b)
        if data3b and "results" in data3b:
            for b in data3b["results"].get("bindings", []):
                e_qid = _extract_qid(_val(b, "item"))
                e_name = _val(b, "label")
                e_year = None
                yr = _val(b, "year")
                if yr:
                    try: e_year = int(float(yr))
                    except: pass
                if e_qid and e_name:
                    out["events"].append((e_qid, e_name, e_year))

    return out


# =====================================================================
# Wikipedia: 获取中文简介
# =====================================================================
def fetch_wikipedia_summary(name, fallback=None):
    """获取 Wikipedia 中文简介，返回 (summary, url) 或 (None, None)。"""
    candidates = [name]
    if fallback and fallback != name:
        candidates.append(fallback)

    for try_name in candidates:
        url = WIKIPEDIA_ZH.format(title=urllib.parse.quote(try_name))
        data = _http_get_json(url)
        if not data:
            continue
        summary = data.get("extract") or ""
        if summary and "消歧义" not in summary and len(summary) >= 10:
            return summary, url

    return None, None


# =====================================================================
# 辅助：根据生卒年推断朝代（支持公元前）
# =====================================================================
def infer_dynasty(birth_year, death_year):
    """
    根据卒年（或生年）推断朝代，支持公元前（负数年份）。
    公元前的年份 Wikidata 返回为负数: 公元前551年 → -551
    """
    ref = death_year if death_year is not None else birth_year
    if ref is None:
        return ""

    # 朝代时间轴（公元前用负数，公元后用正数）
    # (start_year, end_year, dynasty_name) - start/end inclusive
    dynasties = [
        # 上古/夏商
        (-2070, -1600, "夏朝"),
        (-1600, -1046, "商朝"),
        # 周
        (-1046, -771, "西周"),
        (-770, -476, "春秋"),
        (-475, -221, "战国"),
        # 秦
        (-221, -207, "秦朝"),
        # 汉
        (-206, 9, "西汉"),
        (9, 23, "新朝"),
        (25, 220, "东汉"),
        # 三国
        (220, 280, "三国"),
        # 晋
        (265, 316, "西晋"),
        (317, 420, "东晋"),
        # 南北朝
        (420, 589, "南北朝"),
        # 隋唐
        (581, 618, "隋朝"),
        (618, 907, "唐朝"),
        # 五代
        (907, 960, "五代十国"),
        # 宋
        (960, 1127, "北宋"),
        (1127, 1279, "南宋"),
        # 元明清
        (1271, 1368, "元朝"),
        (1368, 1644, "明朝"),
        (1644, 1912, "清朝"),
        # 近现代
        (1912, 1949, "民国"),
        (1949, 9999, "中华人民共和国"),
    ]
    for start, end, name in dynasties:
        if start <= ref <= end:
            return name
    return ""


# =====================================================================
# 主流程：采集并写入数据库
# =====================================================================
def collect_persons(conn, names=None, logger=None):
    """
    采集指定的历史人物数据并写入数据库。
    改进：关系查询先用 QID 匹配数据库中的人物，避免依赖中文标签名称匹配
    """
    if names is None:
        names = TEST_PERSONS

    results = []
    cursor = conn.cursor()

    # 存储 QID → person_id 映射，用于关系匹配
    qid_to_person_id = {}

    for idx, name in enumerate(names, 1):
        print(f"\n[{idx}/{len(names)}] 正在采集人物: {name}")
        person_result = {
            "name": name,
            "status": "error",
            "person_id": None,
            "qid": None,
            "errors": [],
        }

        try:
            # 1. 获取 QID
            qid = find_person_qid(name)
            if not qid:
                msg = f"无法获取 {name} 的 Wikidata QID"
                person_result["errors"].append(msg)
                print(f"  ✗ {msg}")
                if logger:
                    logger(f"FAIL | 人物 | {name} | {msg}")
                results.append(person_result)
                time.sleep(BETWEEN_PERSON_WAIT)
                continue

            person_result["qid"] = qid

            # 2. SPARQL 查询结构化字段
            structured = query_person_structured(qid)

            # 3. Wikipedia 简介
            summary_text, summary_url = fetch_wikipedia_summary(name, structured.get("name_zh", ""))

            # 4. 推断朝代
            dynasty = infer_dynasty(structured["birth_year"], structured["death_year"])

            # 5. 写入 person 表（同时存 QID 方便关系匹配）
            display_name = structured["name_zh"] or name
            cursor.execute("""
                INSERT INTO person (name, birth_year, death_year, dynasty, summary, image_url)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                display_name,
                structured["birth_year"],
                structured["death_year"],
                dynasty,
                summary_text,
                structured["image_url"] or None,
            ))
            person_id = cursor.lastrowid
            conn.commit()

            # 存储 QID 映射
            qid_to_person_id[qid] = person_id

            print(f"  ✓ 已插入 person.id = {person_id}: {display_name}")
            print(f"     生卒: {structured['birth_year']} - {structured['death_year']} | 朝代: {dynasty}")

            # 6. 写入 person_role
            if structured["roles"]:
                role_data = [(person_id, role) for role in structured["roles"][:10]]
                cursor.executemany("INSERT INTO person_role (person_id, role_name) VALUES (?, ?)", role_data)
                conn.commit()
                print(f"  ✓ 已插入 {len(role_data)} 个职业标签")

            # 7. 暂存 relations/events 数据（等所有人都入库后再处理）
            person_result["_relations"] = structured["relations"]
            person_result["_events"] = structured["events"]

            person_result.update({
                "status": "ok",
                "person_id": person_id,
                "name_zh": display_name,
                "birth_year": structured["birth_year"],
                "death_year": structured["death_year"],
                "dynasty": dynasty,
                "roles_count": len(structured["roles"]),
                "relations_count_raw": len(structured["relations"]),
                "events_count_raw": len(structured["events"]),
                "has_summary": bool(summary_text),
                "has_image": bool(structured["image_url"]),
            })
            if logger:
                logger(f"OK | 人物 | {display_name} (Q{qid}) | 生卒 {structured['birth_year']}-{structured['death_year']} | {dynasty}")

        except Exception as e:
            msg = f"采集 {name} 时发生异常: {e}"
            person_result["errors"].append(msg)
            print(f"  ✗ {msg}")
            if logger:
                logger(f"ERROR | 人物 | {name} | {e}")

        results.append(person_result)
        time.sleep(BETWEEN_PERSON_WAIT)

    # ---- 第二阶段：处理关系（person_relation）和事件关联（person_event）----
    print("\n--- 处理人物关系和事件关联 ---")
    for person_result in results:
        if person_result["status"] != "ok":
            continue
        person_id = person_result["person_id"]
        person_qid = person_result["qid"]

        # 7. person_relation: 匹配关系目标是否在采集的人物中
        rel_count = 0
        relations = person_result.get("_relations", [])
        if relations:
            for t_qid, t_name, rel_type in relations:
                # 先按 QID 匹配
                if t_qid in qid_to_person_id:
                    target_id = qid_to_person_id[t_qid]
                    cursor.execute("""
                        INSERT INTO person_relation (source_person_id, target_person_id, relation_type)
                        VALUES (?, ?, ?)
                    """, (person_id, target_id, rel_type))
                    rel_count += 1
                else:
                    # 按中文名匹配（容错）
                    cursor.execute("SELECT id FROM person WHERE name = ? LIMIT 1", (t_name,))
                    target_row = cursor.fetchone()
                    if target_row:
                        cursor.execute("""
                            INSERT INTO person_relation (source_person_id, target_person_id, relation_type)
                            VALUES (?, ?, ?)
                        """, (person_id, target_row[0], rel_type))
                        rel_count += 1
            conn.commit()
            if rel_count:
                print(f"  ✓ {person_result['name_zh']}: 建立 {rel_count} 条人物关系")

        person_result["relations_count"] = rel_count

        # 8. person_event: 关联参与的事件
        event_count = 0
        events = person_result.get("_events", [])
        if events:
            for e_qid, e_name, e_year in events:
                cursor.execute("SELECT id FROM event WHERE name = ? LIMIT 1", (e_name,))
                evt_row = cursor.fetchone()
                if evt_row:
                    event_id = evt_row[0]
                else:
                    cursor.execute("""
                        INSERT INTO event (name, start_year, event_type, summary)
                        VALUES (?, ?, ?, ?)
                    """, (e_name, e_year if e_year else None, "历史事件", None))
                    event_id = cursor.lastrowid
                cursor.execute("""
                    INSERT INTO person_event (person_id, event_id, role)
                    VALUES (?, ?, ?)
                """, (person_id, event_id, "参与者"))
                event_count += 1
            conn.commit()
            if event_count:
                print(f"  ✓ {person_result['name_zh']}: 关联 {event_count} 个历史事件")

        person_result["events_count"] = event_count

    print(f"\n人物采集完成，共 {len(results)} 人，成功 {sum(1 for r in results if r['status'] == 'ok')} 人")
    return results


if __name__ == "__main__":
    from init_db import init_database
    conn = init_database(reset=True)
    results = collect_persons(conn)
    conn.close()
    for r in results:
        print(r)
