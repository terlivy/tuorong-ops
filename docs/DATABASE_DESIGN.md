# 数据库设计文档

## 1. 数据库

SQLite 文件：

```text
data/ops-platform.db
```

## 2. 核心表

### users

管理员账号表。

- id
- username
- password_hash
- display_name
- created_at

### assets

资产中心。统一管理合作门店、合作商、公司、联系人。

- name
- assetType
- contactName
- phone
- wechat
- address
- longitude
- latitude
- businessTags
- assetStatus
- cooperationStage
- settlementStatus
- notes

### people

人员中心。

- name
- phone
- role
- area
- relatedAsset
- status
- notes

### projects

项目/产品中心。

- projectCode
- projectName
- businessType
- upstream
- pricingRule
- minPrice
- maxPrice
- status

### opportunities

业务机会管理。

- businessName
- assetName
- businessType
- owner
- stage
- expectedAmount
- dealAmount
- nextFollowDate
- notes

### execution_tasks

执行任务管理。

- taskName
- businessType
- assetName
- projectName
- executor
- taskDate
- reportedHours
- approvedHours
- status
- result

### equipment_records

采集业务设备出入库记录。

- recordTitle
- equipmentType
- flowType
- quantity
- assetName
- handler
- recordDate
- status
- notes

### settlements

结算管理。

- settlementName
- businessType
- relatedObject
- direction
- amount
- cost
- profit
- status
- invoiceStatus
- notes

### supply_demand

供需管理。

- demandTitle
- recordType
- assetName
- category
- quantity
- budget
- matchStatus
- notes

### supply_chain_orders

供应链管理。

- orderName
- supplier
- assetName
- productName
- quantity
- unitPrice
- totalAmount
- deliveryStatus
- paymentStatus
- notes

### issues

问题管理。

- title
- sourceModule
- relatedObject
- owner
- priority
- status
- dueDate
- description
- result

## 3. 设计说明

当前版本使用扁平表结构，便于快速部署和 CSV 导入导出。后续如果业务复杂度提升，可以逐步增加外键关系和流水明细表。
