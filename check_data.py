# -*- coding: utf-8 -*-
import pandas as pd
import json
import os

# 设置工作目录
os.chdir(r"d:\SHUMEI\GraduationProject")

print("=" * 70)
print("【Excel 数据检测报告】")
print("=" * 70)

# ========== 1. 读取一级人物数据 ==========
print("\n" + "=" * 70)
print("一、1级人物数据.xlsx")
print("=" * 70)

df1 = pd.read_excel("1级人物数据.xlsx")
print(f"列名: {df1.columns.tolist()}")
print(f"\n总行数: {len(df1)}")

# 找到朝代字段
dynasty_col1 = None
for col in df1.columns:
    if '朝代' in str(col):
        dynasty_col1 = col
        break

if dynasty_col1:
    print(f"\n朝代字段: [{dynasty_col1}]")
    print("朝代值分布:")
    print(df1[dynasty_col1].value_counts().to_string())
else:
    print("\n⚠️ 未找到朝代字段!")

# 找到ID字段
id_col1 = None
for col in df1.columns:
    if 'PersonID' in str(col) or '人物ID' in str(col) or 'ID' == str(col):
        id_col1 = col
        break

# 找到姓名字段
name_col1 = None
for col in df1.columns:
    if '姓名' in str(col) or 'name' in str(col).lower():
        name_col1 = col
        break

print(f"\nID字段: [{id_col1}]")
print(f"姓名字段: [{name_col1}]")

# ========== 2. 读取二级人物数据 ==========
print("\n" + "=" * 70)
print("二、2级人物数据.xlsx")
print("=" * 70)

df2 = pd.read_excel("2级人物数据.xlsx")
print(f"列名: {df2.columns.tolist()}")
print(f"\n总行数: {len(df2)}")

dynasty_col2 = None
for col in df2.columns:
    if '朝代' in str(col):
        dynasty_col2 = col
        break

if dynasty_col2:
    print(f"\n朝代字段: [{dynasty_col2}]")
    print("朝代值分布:")
    print(df2[dynasty_col2].value_counts().to_string())
else:
    print("\n⚠️ 未找到朝代字段!")

id_col2 = None
for col in df2.columns:
    if 'SupportPersonID' in str(col) or '二级' in str(col) or 'ID' == str(col):
        id_col2 = col
        break

name_col2 = None
for col in df2.columns:
    if '姓名' in str(col) or 'name' in str(col).lower():
        name_col2 = col
        break

print(f"\nID字段: [{id_col2}]")
print(f"姓名字段: [{name_col2}]")

# ========== 3. 读取事件数据 ==========
print("\n" + "=" * 70)
print("三、事件数据.xlsx")
print("=" * 70)

df3 = pd.read_excel("事件数据.xlsx")
print(f"列名: {df3.columns.tolist()}")
print(f"\n总行数: {len(df3)}")

dynasty_col3 = None
for col in df3.columns:
    if '朝代' in str(col):
        dynasty_col3 = col
        break

if dynasty_col3:
    print(f"\n朝代字段: [{dynasty_col3}]")
    print("朝代值分布:")
    print(df3[dynasty_col3].value_counts().to_string())
else:
    print("\n⚠️ 未找到朝代字段!")

id_col3 = None
for col in df3.columns:
    if 'EventID' in str(col) or '事件ID' in str(col):
        id_col3 = col
        break

name_col3 = None
for col in df3.columns:
    if '事件名称' in str(col) or '名称' in str(col):
        name_col3 = col
        break

print(f"\nID字段: [{id_col3}]")
print(f"名称字段: [{name_col3}]")

# ========== 4. 读取人物关系数据 ==========
print("\n" + "=" * 70)
print("四、人物关系表.xlsx")
print("=" * 70)

df4 = pd.read_excel("人物关系表.xlsx")
print(f"列名: {df4.columns.tolist()}")
print(f"\n总行数: {len(df4)}")

# 找到起点和终点字段
start_col = None
end_col = None
for col in df4.columns:
    if '起点' in str(col):
        start_col = col
    if '终点' in str(col):
        end_col = col
    if '源' in str(col) or 'source' in str(col).lower():
        start_col = col
    if '目标' in str(col) or 'target' in str(col).lower():
        end_col = col

print(f"\n起点字段: [{start_col}]")
print(f"终点字段: [{end_col}]")

# 显示前几条关系数据
print("\n前5条关系:")
print(df4.head(5).to_string())

# ========== 5. 读取人事关系数据 ==========
print("\n" + "=" * 70)
print("五、人事关系表.xlsx")
print("=" * 70)

df5 = pd.read_excel("人事关系表.xlsx")
print(f"列名: {df5.columns.tolist()}")
print(f"\n总行数: {len(df5)}")

# 找到事件和人物字段
event_col = None
person_col = None
for col in df5.columns:
    if '事件' in str(col):
        event_col = col
    if '人物' in str(col) and '关系' not in str(col):
        person_col = col

print(f"\n事件字段: [{event_col}]")
print(f"人物字段: [{person_col}]")

# 显示前几条人事关系
print("\n前5条人事关系:")
print(df5.head(5).to_string())

print("\n" + "=" * 70)
print("【初步结构识别完成】")
print("=" * 70)
