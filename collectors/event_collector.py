# -*- coding: utf-8 -*-
"""
历史事件采集器 (Event Collector)
=================================

数据来源:
  1. Wikidata (SPARQL + wbsearchentities)
  2. Wikipedia 中文简介

测试事件:
  安史之乱, 鸦片战争, 辛亥革命, 抗日战争, 改革开放

采集字段:
  event 表: 事件名称 / 开始年份 / 结束年份 / 事件类型 / 简介 / 图片

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
QUERY_WAIT = 3
BETWEEN_EVENT_WAIT = 5

# 预设事件 QID 映射
# 注意：部分事件（如安史之乱、甲午战争、北伐战争）Wikidata 无独立条目
EVENT_QID_MAP = {
    "安史之乱": "",         # Wikidata 无独立条目，从 Wikipedia 获取简介
    "鸦片战争": "Q220984",   # 包含第一次 + 第二次鸦片战争
    "辛亥革命": "Q190517",   # 1911 年辛亥革命
    "抗日战争": "Q170314",   # 第二次中日战争（1937-1945）
    "改革开放": "Q1205521",  # 1978 年后的经济改革
}

# 测试事件列表
TEST_EVENTS = ["安史之乱", "鸦片战争", "辛亥革命", "抗日战争", "改革开放"]


# =====================================================================
# HTTP 工具函数（与 person_collector 相同，避免外部依赖）
# =====================================================================
def _http_get_json(url, timeout=30):
    headers = {"User-Agent": USER_AGENT, "Accept": "application/json"}
    for attempt in range(RETRY_MAX):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            wait = RETRY_WAIT_START * (attempt + 1)
            time.sleep(wait)
    return None


def _http_post_sparql(query, timeout=60):
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
    if not isinstance(item, dict):
        return ""
    x = item.get(key)
    if not isinstance(x, dict):
        return ""
    return x.get("value", "") or ""


# =====================================================================
# Wikidata: 事件 QID
# =====================================================================
def find_event_qid(name):
    """获取事件 QID，优先使用预设映射。"""
    if name in EVENT_QID_MAP:
        qid = EVENT_QID_MAP[name]
        if qid:
            print(f"  [QID] 使用预设: {name} → Q{qid}")
            return qid
        else:
            print(f"  [QID] Wikidata 无独立条目: {name}（将从 Wikipedia 补充）")
            return None

    # 动态搜索
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
    if result and result.get("search"):
        first = result["search"][0]
        qid = first.get("id", "")
        label = first.get("label", "")
        print(f"  [QID] 匹配: {label} ({qid})")
        return qid
    return None


# =====================================================================
# Wikidata: SPARQL 查询事件结构化字段
# =====================================================================
def query_event_structured(qid):
    """通过 SPARQL 查询事件的结构化数据。"""
    q = f"""
    SELECT ?labelZh ?labelEn ?startYear ?endYear ?imageUrl ?typeLabel WHERE {{
      OPTIONAL {{ wd:{qid} rdfs:label ?labelZh . FILTER(LANG(?labelZh) = "zh") }}
      OPTIONAL {{ wd:{qid} rdfs:label ?labelEn . FILTER(LANG(?labelEn) = "en") }}
      OPTIONAL {{
        wd:{qid} wdt:P580 ?start .
        BIND(YEAR(?start) AS ?startYear)
      }}
      OPTIONAL {{
        wd:{qid} wdt:P582 ?end .
        BIND(YEAR(?end) AS ?endYear)
      }}
      OPTIONAL {{
        wd:{qid} wdt:P585 ?point .
        BIND(YEAR(?point) AS ?pointYear)
      }}
      OPTIONAL {{ wd:{qid} wdt:P18 ?imageUrl }}
      OPTIONAL {{
        wd:{qid} wdt:P31 ?type .
        ?type rdfs:label ?typeLabel .
        FILTER(LANG(?typeLabel) = "zh")
      }}
    }}
    LIMIT 20
    """
    time.sleep(QUERY_WAIT)
    data = _http_post_sparql(q)

    out = {
        "name_zh": "",
        "start_year": None,
        "end_year": None,
        "point_year": None,
        "image_url": "",
        "instance_types": [],
    }

    if data and "results" in data:
        seen_types = set()
        for b in data["results"].get("bindings", []):
            if not out["name_zh"]:
                out["name_zh"] = _val(b, "labelZh") or _val(b, "labelEn")
            if out["start_year"] is None and _val(b, "startYear"):
                try: out["start_year"] = int(float(_val(b, "startYear")))
                except: pass
            if out["end_year"] is None and _val(b, "endYear"):
                try: out["end_year"] = int(float(_val(b, "endYear")))
                except: pass
            if out["point_year"] is None and _val(b, "pointYear"):
                try: out["point_year"] = int(float(_val(b, "pointYear")))
                except: pass
            if not out["image_url"]:
                out["image_url"] = _val(b, "imageUrl")
            t = _val(b, "typeLabel")
            if t and t not in seen_types:
                seen_types.add(t)
                out["instance_types"].append(t)

    return out


# =====================================================================
# Wikipedia 简介 + 年份提取
# =====================================================================
def fetch_wikipedia_summary(name):
    """获取 Wikipedia 中文简介。返回 (summary, url) 或 (None, None)。"""
    url = WIKIPEDIA_ZH.format(title=urllib.parse.quote(name))
    data = _http_get_json(url)
    if data:
        summary = data.get("extract") or ""
        if summary and "消歧义" not in summary and len(summary) >= 10:
            return summary, url
    return None, None


def extract_years_from_text(text):
    """从简介文本中启发式提取年份。返回 (start, end) 或 (None, None)。"""
    if not text:
        return None, None

    # 模式 1: "XXXX年-X月-X日至XXXX年-X月-X日" 或 "XXXX年-XXXX年"
    m = re.search(r"(前?\d{1,4})年[^\d]{0,10}(\d{1,4})年", text[:200])
    if m:
        try:
            start = int(m.group(1).replace("前", "-"))
            end = int(m.group(2))
            return start, end
        except (ValueError, TypeError):
            pass

    # 模式 2: 开头 "XXXX年"
    m = re.search(r"(前?\d{1,4})年", text[:100])
    if m:
        try:
            start = int(m.group(1).replace("前", "-"))
            return start, None
        except (ValueError, TypeError):
            pass

    return None, None


# =====================================================================
# 事件类型分类（基于名称关键词）
# =====================================================================
def classify_event_type(name):
    """启发式分类事件类型。"""
    if any(k in name for k in ["战争", "战", "战役", "起义", "叛乱", "之乱", "革命"]):
        return "战争/革命"
    if any(k in name for k in ["改革", "开放", "变法", "新政"]):
        return "改革/政治"
    if any(k in name for k in ["运动"]):
        return "社会运动"
    return "历史事件"


# =====================================================================
# 主流程：采集并写入数据库
# =====================================================================
def collect_events(conn, names=None, logger=None):
    """
    采集指定的历史事件数据并写入数据库。

    Args:
        conn: sqlite3.Connection
        names: 事件名称列表，默认使用 TEST_EVENTS
        logger: 日志函数

    Returns:
        list: 每个事件的采集结果
    """
    if names is None:
        names = TEST_EVENTS

    results = []
    cursor = conn.cursor()

    for idx, name in enumerate(names, 1):
        print(f"\n[{idx}/{len(names)}] 正在采集事件: {name}")
        event_result = {
            "name": name,
            "status": "error",
            "event_id": None,
            "errors": [],
        }

        try:
            # 1. 获取 QID（可能为 None，表示 Wikidata 无独立条目）
            qid = find_event_qid(name)

            # 2. 如果有 QID，用 SPARQL 查询结构化字段
            start_year = None
            end_year = None
            name_zh = None
            image_url = None

            if qid:
                structured = query_event_structured(qid)
                name_zh = structured["name_zh"]
                start_year = structured["start_year"] or structured["point_year"]
                end_year = structured["end_year"] or structured["point_year"]
                image_url = structured["image_url"]
                print(f"  [Wikidata] 名称: {name_zh} | 起止: {start_year}-{end_year}")

            # 3. 总是尝试获取 Wikipedia 简介
            summary_text, summary_url = fetch_wikipedia_summary(name)
            if summary_text:
                print(f"  [Wikipedia] 简介已获取 ({len(summary_text)} 字)")

                # 如果 Wikidata 没有提供年份，尝试从简介文本提取
                if start_year is None and end_year is None:
                    extracted_start, extracted_end = extract_years_from_text(summary_text)
                    if extracted_start is not None:
                        start_year = extracted_start
                        end_year = extracted_end or extracted_start
                        print(f"  [Wikipedia] 从简介文本提取年份: {start_year}-{end_year}")

            # 4. 事件类型分类
            event_type = classify_event_type(name)

            # 5. 写入 event 表
            display_name = name_zh or name
            cursor.execute("""
                INSERT INTO event (name, start_year, end_year, event_type, summary, image_url)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                display_name,
                start_year,
                end_year,
                event_type,
                summary_text,
                image_url or None,
            ))
            event_id = cursor.lastrowid
            conn.commit()
            print(f"  ✓ 已插入 event.id = {event_id}: {display_name}")
            print(f"     起止: {start_year}-{end_year} | 类型: {event_type}")

            event_result.update({
                "status": "ok",
                "event_id": event_id,
                "qid": qid,
                "name_zh": display_name,
                "start_year": start_year,
                "end_year": end_year,
                "event_type": event_type,
                "has_summary": bool(summary_text),
                "has_image": bool(image_url),
                "data_source": "wikidata+wikipedia" if qid else "wikipedia_only",
            })
            if logger:
                source = "Wikidata+Wikipedia" if qid else "Wikipedia Only"
                logger(f"OK | 事件 | {display_name} | {source} | 起止 {start_year}-{end_year} | {event_type}")

        except Exception as e:
            msg = f"采集 {name} 时发生异常: {e}"
            event_result["errors"].append(msg)
            print(f"  ✗ {msg}")
            if logger:
                logger(f"ERROR | 事件 | {name} | {e}")

        results.append(event_result)
        time.sleep(BETWEEN_EVENT_WAIT)

    print(f"\n事件采集完成，共 {len(results)} 件，成功 {sum(1 for r in results if r['status'] == 'ok')} 件")
    return results


if __name__ == "__main__":
    from init_db import init_database
    conn = init_database(reset=True)
    results = collect_events(conn)
    conn.close()
    for r in results:
        print(r)
