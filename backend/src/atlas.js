// ATLAS_CATEGORIES 与 Excel 权威源「atlas可拓展及作业场景汇总表.xlsx」严格对齐
// 路径：/mnt/c/Users/Administrator/Desktop/atlas可拓展及作业场景汇总表.xlsx
// 修订：2026-09-22 — 增加 workstation/workDetail 字段（每个子业态 AI 补全的工位清单 + 工作内容）
const ATLAS_CATEGORIES = [
  {
    key: 'retail_consumer',
    name: '零售与消费品',
    en: 'Retail and Consumer Goods',
    children: [
      ['appliance_store', '家电商店', 'Appliance Store',
        '样品展示区 | 仓库库存区 | 维修售后区 | 收银洽谈区 | 客户体验区',
        '商品讲解与选购引导；现场性能演示；订单核对与收款；配送安装协调；售后回访登记'],
      ['cleaning_supply_store', '清洁用品商店', 'Cleaning Supply Store',
        '货架陈列区 | 散装分装区 | 试用展示区 | 收银台 | 仓库补货区',
        '商品上架补货；散装称重分装；试用装补充；客户咨询解答；收银与库存盘点'],
      ['convenience_store', '便利店', 'Convenience store',
        '收银台 | 货架陈列区 | 冷柜饮料区 | 热食加工区 | 仓库补货区',
        '商品上架与补货；收银结算；冷柜温度巡检；热食加热与包装；早晚报废清点'],
      ['electronics_shop', '电子产品店', 'Electronics Shop',
        '样品体验区 | 配件销售区 | 维修售后区 | 收银洽谈区 | 仓库区',
        '产品演示与体验引导；配件搭配推荐；售后维修受理；订单核对收款；库存盘点'],
      ['fishing_shop', '渔具店', 'Fishing shop',
        '钓具陈列区 | 鱼饵冷藏区 | 配件销售区 | 试用咨询区 | 收银区',
        '钓具陈列与讲解；鱼饵冷藏保鲜；配件搭配推荐；渔情咨询解答；收银与会员管理'],
      ['furniture_store', '家具店', 'Furniture store',
        '客厅家具展示区 | 卧室家具区 | 材质体验区 | 设计洽谈区 | 仓库发货区',
        '家具搭配讲解；材质触感体验；客户需求沟通；方案设计与报价；配送安装协调'],
      ['garden_center_flower_market', '花园中心（ 花卉市场）', 'Garden Center (Flower Market)',
        '花卉展示区 | 绿植盆栽区 | 园艺工具区 | 包装修剪区 | 收银洽谈区',
        '花卉分拣与保鲜；盆栽日常养护；客户搭配咨询；包装修剪与配送；节日预订'],
      ['gift_shop', '礼品店', 'Gift Shop',
        '节庆礼品区 | 定制礼品区 | 包装服务区 | 收银洽谈区 | 仓库补货区',
        '礼品搭配推荐；定制礼品接单；包装与贺卡代写；会员积分与兑换；收银与配送'],
      ['grocery_store', '杂货店', 'Grocery store',
        '货架陈列区 | 称重散装区 | 冷柜区 | 收银台 | 仓库补货区',
        '商品上架补货；散装称重分装；冷柜温度巡检；客户咨询；收银与库存盘点'],
      ['home_decor_store', '家具装饰店', 'Home Decor Store',
        '装饰品展示区 | 布艺样品区 | 灯具情景区 | 软装搭配咨询区 | 收银洽谈区',
        '风格搭配讲解；布艺裁剪建议；灯具情景演示；全屋软装方案；订单配送协调'],
      ['kitchenware_store', '厨具店', 'Kitchenware Store',
        '锅具展示区 | 餐具样品区 | 小家电体验区 | 客户咨询区 | 收银洽谈区',
        '锅具性能演示；餐具搭配推荐；小家电体验讲解；客户使用咨询；订单核对'],
      ['paint_store', '油漆店', 'Paint Store',
        '色卡展示区 | 涂料调配区 | 工具销售区 | 客户咨询区 | 仓库区',
        '色卡选色指导；涂料现场调配；涂刷工具搭配；施工方案咨询；订单与配送'],
      ['produce_shop', '蔬果店', 'Produce shop',
        '进货分拣区 | 称重打包区 | 货架陈列区 | 冷库保鲜区 | 收银台',
        '蔬果分拣与质检；称重贴签；货架陈列补货；冷库保鲜温度巡检；收银结算与早晚报废'],
      ['shoe_store', '鞋店', 'Shoe Store',
        '鞋款展示区 | 试穿区 | 鞋垫配件区 | 客户咨询区 | 仓库补货区',
        '鞋款推荐与讲解；试穿尺码服务；鞋垫配件搭售；会员积分兑换；收银与退货'],
      ['sports_store', '体育用品', 'Sports Store',
        '器械展示区 | 球类销售区 | 服装配件区 | 试用体验区 | 收银洽谈区',
        '器械性能演示；运动选品咨询；服装试穿建议；配件搭配推荐；订单核对收款'],
      ['stationery_store', '文具店', 'Stationery Store',
        '笔本销售区 | 学生文具区 | 办公耗材区 | 客户咨询区 | 收银区',
        '文具分类陈列；办公耗材推荐；学生用品搭配；团购订单处理；收银与盘点'],
      ['supermarket', '超级市场', 'Supermarket',
        '生鲜区 | 食品区 | 日化区 | 收银区 | 仓库补货区',
        '商品上架补货；生鲜分拣打包；促销陈列维护；收银与会员卡；冷柜温度巡检'],
    ].map(child),
  },
  {
    key: 'food_beverage',
    name: '食品与饮料',
    en: 'Food and Beverage',
    children: [
      ['bread_bakery', '面包烘焙店', 'Bread Bakery',
        '原料储存区 | 发酵区 | 烘焙操作区 | 展示售卖区 | 清洗区',
        '原料验收与储存；面团发酵与整形；烘焙温度控制；成品展示与售卖；器具清洁消毒'],
      ['cake_shop', '蛋糕店', 'Cake shop',
        '原料储存区 | 蛋糕裱花区 | 烘焙区 | 展示售卖区 | 清洗区',
        '原料验收储存；蛋糕裱花装饰；烘焙温度控制；成品展示与定制接单；器具清洁消毒'],
      ['commercial_kitchen', '商业厨房', 'Commercial Kitchen',
        '厨房操作台 | 食材预处理区 | 烹饪灶台 | 餐具清洗消毒区 | 出餐区',
        '食材预处理切配；烹饪制作；分餐打包；厨具清洁消毒；出餐质检'],
      ['ice_cream_shop', '冰激淋', 'Ice Cream Shop',
        '原料储存区（低温） | 加工操作区 | 制冷机区 | 展示售卖区 | 清洗区',
        '原料低温储存；冰激淋调制；制冷机温度控制；成品展示售卖；器具清洁消毒'],
      ['pastry_shop', '糕点店', 'Pastry shop',
        '原料储存区 | 烘焙操作区 | 烹饪烘烤区 | 展示售卖区 | 清洗区',
        '原料验收储存；糕点制作；烘烤温度控制；成品展示售卖；器具清洁消毒'],
      ['pizzeria', '披萨', 'Pizzeria',
        '面饼制作区 | 配料准备区 | 烤炉烘烤区 | 出餐打包区 | 清洗区',
        '面饼制作与发酵；配料切配与铺料；烤炉温度控制；披萨切分与出餐；器具清洁消毒'],
      ['private_chef', '私人厨房', 'Private chef',
        '食材预处理区 | 烹饪灶台区 | 餐具清洗区 | 客户用餐区 | 出餐区',
        '食材验收预处理；烹饪制作与摆盘；餐具清洁消毒；客户用餐接待；餐后收拾'],
      ['restaurant', '餐厅', 'Restaurant',
        '厨房冷库食材储备区 | 洗菜清洗区 | 烹饪区 | 前厅用餐区 | 餐具清洗区',
        '食材清洗与切配；烹饪与摆盘；餐具清洗消毒；前厅接待与点餐；餐厅清洁与翻台'],
      ['street_vendor', '街头小贩（ 室内备餐阶段）', 'Street Vendor',
        '食材储存区 | 加工操作区 | 烹饪区 | 清洗区 | 出餐区',
        '原料验收储存；食材清洗切配；烹饪加工；成品包装；器具清洁消毒'],
      ['takeout_food', '外卖食品', 'Takeout Food',
        '食材储存区 | 加工操作区 | 烹饪区 | 打包出餐区 | 清洗区',
        '原料验收储存；食材清洗切配；烹饪加工；外卖打包与封签；器具清洁消毒'],
    ].map(child),
  },
  {
    key: 'auto_transport',
    name: '汽车与运输',
    en: 'Automotive and Transportation',
    children: [
      ['auto_repair', '汽车维修', 'Auto repair',
        '故障诊断工位 | 机修作业区 | 配件仓库 | 钣金喷漆区 | 完工检验区',
        '故障码读取与诊断；配件更换；机修与系统调试；钣金喷漆修复；完工检验交车'],
      ['bicycle_repair', '自行车维修', 'Bicycle repair',
        '故障诊断工位 | 维修作业区 | 配件销售区 | 检测调试区 | 客户接待区',
        '故障诊断与方案确认；传动与刹车更换；轮胎修补与换新；调试与质检交付；配件销售'],
      ['boat_repair', '船舶维修', 'Boat repair',
        '船体上岸区 | 引擎检修区 | 船舱维修区 | 配件仓库 | 完工试航区',
        '船体清洗与检验；引擎拆装检修；船舱电路与内饰修复；试航与质检交付'],
      ['car_detailing', '汽车美容', 'Car detailing',
        '接车预洗区 | 精洗车间 | 漆面抛光区 | 内饰清洁区 | 质检交车区',
        '车辆预冲洗与泥沙冲离；车身手工精洗；漆面打蜡与抛光；内饰吸尘与养护；质检与交车'],
      ['motorcycle_detailing', '摩托车精细保养', 'Motorcycle detailing',
        '接车预洗区 | 精洗车间 | 漆面抛光区 | 零部件养护区 | 质检交车区',
        '车辆预冲洗；车身手工精洗；漆面抛光打蜡；零部件润滑养护；质检与交车确认'],
      ['motorcycle_repair', '摩托车维修', 'Motorcycle repair',
        '故障诊断工位 | 机修作业区 | 配件仓库 | 调试检测区 | 客户接待区',
        '故障诊断与方案确认；发动机与传动维修；配件更换；调试与质检交付'],
    ].map(child),
  },
  {
    key: 'repair_service',
    name: '维修服务',
    en: 'Repair Services',
    children: [
      ['appliance_repair', '家电维修', 'Appliance repair',
        '故障诊断工位 | 维修操作区 | 配件仓库 | 检测设备区 | 客户接待区',
        '故障诊断与方案确认；硬件拆装更换；系统调试与运行测试；数据备份恢复；完工交付'],
      ['computer_repair', '电脑维修', 'Computer repair',
        '故障诊断工位 | 维修操作区 | 配件仓库 | 检测设备区 | 客户接待区',
        '故障诊断与方案确认；硬件拆装更换；系统重装与调试；数据备份与恢复；完工测试与交付'],
      ['electromechanical_workshop', '机电维修', 'Electromechanical workshop',
        '故障诊断工位 | 机械拆装区 | 电气测试区 | 配件仓库 | 完工检验区',
        '故障诊断与方案确认；机械零部件更换；电气线路排查与修复；系统调试；完工测试交付'],
      ['electronics_repair', '电子维修', 'Electronics repair',
        '故障诊断工位 | 焊接操作区 | 配件仓库 | 检测设备区 | 客户接待区',
        '电路检测与诊断；元件焊接更换；主板级维修；通电测试与功能验证；完工交付'],
      ['instrument_repair', '仪器维修', 'Instrument repair',
        '故障诊断工位 | 校准测试区 | 配件仓库 | 精密维修区 | 客户接待区',
        '仪器精度检测；精密零件更换；校准与功能测试；数据记录与归档；完工交付'],
    ].map(child),
  },
  {
    key: 'construction_hardware',
    name: '建筑与五金',
    en: 'Construction and Hardware',
    children: [
      ['construction_company', '建筑公司', 'Construction Company',
        '材料堆放区 | 加工区 | 成品展示区 | 图纸审核区 | 工地现场',
        '材料验收与入库；按图施工放样；质量自检；成品交付；现场协调与监理'],
      ['electrical_installation', '电气安装', 'Electrical Installation',
        '材料堆放区 | 配电箱装配区 | 线路铺设区 | 检测调试区 | 客户工地',
        '材料验收与入库；配电箱装配；线路铺设与接线；通电测试与验收；现场协调'],
      ['electrician', '电工', 'Electrician',
        '材料堆放区 | 线路施工区 | 配电箱装配区 | 检测调试区 | 客户现场',
        '材料验收与入库；按图布线；配电箱安装；通电测试与验收；现场协调'],
      ['hardware_store', '五金店', 'Hardware Store',
        '货架陈列区 | 工具体验区 | 配件销售区 | 客户咨询区 | 仓库补货区',
        '五金分类陈列；工具使用讲解；配件搭配推荐；施工方案咨询；订单配送'],
      ['house_painter', '房屋油漆工', 'House Painter',
        '材料堆放区 | 基层处理区 | 涂刷作业区 | 现场清洁区 | 客户验收区',
        '涂料与工具准备；墙面基层处理；底漆面漆涂刷；现场清洁与成品保护；客户验收'],
      ['woodworking_workshop', '木工车间', 'Woodworking Workshop',
        '材料堆放区 | 板材开料区 | 精雕细作区 | 喷漆打磨区 | 成品装配区',
        '板材开料与选料；精雕细作与榫卯加工；砂磨与表面处理；喷漆与上色；成品装配与质检'],
    ].map(child),
  },
  {
    key: 'food_processing',
    name: '食品加工',
    en: 'Food Processing',
    children: [
      ['agriculture_farm', '农业农场（ 小型）', 'Agriculture farm',
        '田间种植区 | 采收分拣区 | 清洗加工区 | 冷藏保鲜区 | 包装发货区',
        '田间管理与采收；蔬果分拣与质检；清洗与初加工；冷藏保鲜储存；包装贴标与发货'],
      ['food_beverage_agricultural_processing', '食品 、饮料和农产品加工', 'Food, Beverage & Agricultural Processing',
        '原料储存区 | 加工生产线 | 杀菌消毒区 | 包装区 | 质检入库区',
        '原料分拣清洗；加工切割成型；高温灭菌消毒；真空包装贴标；质检入库与发货'],
    ].map(child),
  },
];

function child([key, name, en, workstation, workDetail]) {
  return { key, name, en, workstation, workDetail };
}

function flattenAtlasSubcategories() {
  return ATLAS_CATEGORIES.flatMap(category => category.children.map(subcategory => ({
    ...subcategory,
    categoryKey: category.key,
    categoryName: category.name,
    categoryEn: category.en,
  })));
}

function findAtlasCategory(categoryKey, subcategoryKey) {
  const category = ATLAS_CATEGORIES.find(item => item.key === categoryKey);
  const subcategory = category?.children.find(item => item.key === subcategoryKey);
  return { category, subcategory };
}

function validateAtlasReportPayload(payload = {}) {
  const errors = [];
  const sceneName = String(payload.sceneName || '').trim();
  const contactName = String(payload.contactName || '').trim();
  const phone = String(payload.phone || '').trim();
  const longitude = Number(payload.longitude);
  const latitude = Number(payload.latitude);
  const { category, subcategory } = findAtlasCategory(payload.categoryKey, payload.subcategoryKey);

  if (!category || !subcategory) errors.push('category');
  if (sceneName.length < 2 || sceneName.length > 30 || /^\d+$/.test(sceneName)) errors.push('sceneName');
  if (contactName.length < 2 || contactName.length > 20 || !/^[一-龥A-Za-z\s]+$/.test(contactName)) errors.push('contactName');
  if (!/^1\d{10}$/.test(phone)) errors.push('phone');
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) errors.push('location');
  if (!String(payload.deviceBarcode || '').trim()) errors.push('deviceBarcode');

  return errors;
}

function normalizeAtlasReportPayload(payload, user) {
  const { category, subcategory } = findAtlasCategory(payload.categoryKey, payload.subcategoryKey);
  const photos = Array.isArray(payload.photos) ? payload.photos.filter(Boolean).slice(0, 5) : [];
  const sceneName = String(payload.sceneName || '').trim();
  const deviceBarcode = String(payload.deviceBarcode || '').trim();
  const now = new Date();
  const sdCardCode = payload.sdCardCode || generateSdCardCode(now);

  return {
    id: payload.id || `atlas-report-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    submitter_id: user.id,
    submitter_name: user.username,
    category_key: category.key,
    category_name: category.name,
    subcategory_key: subcategory.key,
    subcategory_name: subcategory.name,
    subcategory_en: subcategory.en,
    scene_name: sceneName,
    address: String(payload.address || '').trim(),
    longitude: Number(payload.longitude),
    latitude: Number(payload.latitude),
    location_accuracy: Number(payload.locationAccuracy || 0),
    contact_name: String(payload.contactName || '').trim(),
    phone: String(payload.phone || '').trim(),
    device_type: String(payload.deviceType || 'multicam').trim(),
    device_barcode: deviceBarcode,
    sd_card_code: sdCardCode,
    binding_tuple: generateBindingTuple(user.username, deviceBarcode, sceneName, now),
    photos_json: JSON.stringify(photos),
    status: 'pending_review',
    notes: String(payload.notes || '').trim(),
    updated_at: now.toISOString(),
  };
}

function generateSdCardCode(date = new Date()) {
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, '');
  return `SD-${ymd}-ATL-${String(date.getTime()).slice(-3)}`;
}

function generateBindingTuple(submitterName, deviceBarcode, sceneName, date = new Date()) {
  return `${submitterName}-${deviceBarcode}-${sceneName}-${date.toISOString().slice(0, 10)}`;
}

function atlasReportFromRow(row) {
  return {
    id: row.id,
    submitterId: row.submitter_id,
    submitterName: row.submitter_name,
    categoryKey: row.category_key,
    categoryName: row.category_name,
    subcategoryKey: row.subcategory_key,
    subcategoryName: row.subcategory_name,
    subcategoryEn: row.subcategory_en,
    sceneName: row.scene_name,
    address: row.address,
    longitude: row.longitude,
    latitude: row.latitude,
    locationAccuracy: row.location_accuracy,
    contactName: row.contact_name,
    phone: row.phone,
    deviceType: row.device_type,
    deviceBarcode: row.device_barcode,
    sdCardCode: row.sd_card_code,
    bindingTuple: row.binding_tuple,
    photos: JSON.parse(row.photos_json || '[]'),
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

module.exports = {
  ATLAS_CATEGORIES,
  flattenAtlasSubcategories,
  findAtlasCategory,
  validateAtlasReportPayload,
  normalizeAtlasReportPayload,
  atlasReportFromRow,
  generateSdCardCode,
  generateBindingTuple,
};
