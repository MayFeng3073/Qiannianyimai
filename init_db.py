# -*- coding: utf-8 -*-
"""
历史知识图谱数据库初始化
========================

创建 5 张表：
  1. person           - 历史人物
  2. person_role      - 人物职业标签
  3. event            - 历史事件
  4. person_relation  - 人物之间关系（父子/夫妻/师生等）
  5. person_event     - 人物参与事件

数据库: database/history_graph.db (SQLite)
"""

import os
import sqlite3

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "database", "history_graph.db")


def init_database(db_path=None, reset=False):
    """
    创建并初始化数据库。

    Args:
        db_path: 数据库路径，默认 database/history_graph.db
        reset: 如果数据库已存在，是否先删除再重建

    Returns:
        sqlite3.Connection
    """
    if db_path is None:
        db_path = DB_PATH

    # 确保目录存在
    db_dir = os.path.dirname(db_path)
    os.makedirs(db_dir, exist_ok=True)

    # 重置模式：先删除旧库
    if reset and os.path.exists(db_path):
        os.remove(db_path)
        print(f"[init_db] 已删除旧数据库: {db_path}")

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # ---------------- 1. 人物表 ----------------
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS person (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT,
            birth_year  INTEGER,
            death_year  INTEGER,
            dynasty     TEXT,
            summary     TEXT,
            image_url   TEXT
        )
    """)

    # ---------------- 2. 人物职业标签表 ----------------
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS person_role (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            person_id   INTEGER,
            role_name   TEXT
        )
    """)

    # ---------------- 3. 事件表 ----------------
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS event (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT,
            start_year  INTEGER,
            end_year    INTEGER,
            event_type  TEXT,
            summary     TEXT,
            image_url   TEXT
        )
    """)

    # ---------------- 4. 人物关系表 ----------------
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS person_relation (
            id                INTEGER PRIMARY KEY AUTOINCREMENT,
            source_person_id  INTEGER,
            target_person_id  INTEGER,
            relation_type     TEXT
        )
    """)

    # ---------------- 5. 人物-事件关联表 ----------------
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS person_event (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            person_id   INTEGER,
            event_id    INTEGER,
            role        TEXT
        )
    """)

    conn.commit()
    print(f"[init_db] ✓ 数据库初始化成功: {db_path}")
    print(f"          共创建 5 张表: person, person_role, event, person_relation, person_event")

    return conn


if __name__ == "__main__":
    # 直接运行时初始化数据库（重置模式）
    init_database(reset=True)
    print("\n完成！数据库已创建。")
