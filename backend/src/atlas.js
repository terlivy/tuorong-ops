const ATLAS_CATEGORIES = [
  {
    key: 'retail_consumer',
    name: '零售与消费品',
    en: 'Retail and Consumer Goods',
    children: [
      ['appliance_store', '家电商店', 'Appliance Store'],
      ['convenience_store', '便利店', 'Convenience Store'],
      ['electronics_store', '电子产品店', 'Electronics Store'],
      ['furniture_store', '家具店', 'Furniture Store'],
      ['garden_center', '花园中心', 'Garden Center'],
      ['gift_shop', '礼品店', 'Gift Shop'],
      ['grocery_store', '杂货店', 'Grocery Store'],
      ['kitchenware_store', '厨具店', 'Kitchenware Store'],
      ['paint_store', '油漆店', 'Paint Store'],
      ['shoe_store', '鞋店', 'Shoe Store'],
      ['stationery_store', '文具店', 'Stationery Store'],
      ['supermarket', '超级市场', 'Supermarket'],
      ['bookstore', '书店', 'Bookstore'],
      ['cosmetics_store', '美妆用品店', 'Cosmetics Store'],
      ['flower_shop', '花店', 'Flower Shop'],
      ['pet_store', '宠物店', 'Pet Store'],
      ['sporting_goods_store', '体育用品店', 'Sporting Goods Store'],
    ].map(child),
  },
  {
    key: 'food_beverage',
    name: '食品与饮料',
    en: 'Food and Beverage',
    children: [
      ['bakery', '面包烘焙店', 'Bakery'],
      ['cake_shop', '蛋糕店', 'Cake Shop'],
      ['commercial_kitchen', '商业厨房', 'Commercial Kitchen'],
      ['ice_cream_shop', '冰激淋', 'Ice Cream Shop'],
      ['pastry_shop', '糕点店', 'Pastry Shop'],
      ['pizza_shop', '披萨', 'Pizza Shop'],
      ['private_kitchen', '私人厨房', 'Private Kitchen'],
      ['restaurant', '餐厅', 'Restaurant'],
      ['street_vendor', '街头小贩', 'Street Vendor'],
      ['takeaway_food', '外卖食品', 'Takeaway Food'],
    ].map(child),
  },
  {
    key: 'auto_transport',
    name: '汽车与运输',
    en: 'Automotive and Transportation',
    children: [
      ['auto_repair', '汽车维修', 'Auto Repair'],
      ['bicycle_repair', '自行车维修', 'Bicycle Repair'],
      ['boat_repair', '船舶维修', 'Boat Repair'],
      ['car_detailing', '汽车美容', 'Car Detailing'],
      ['motorcycle_detailing', '摩托车精细保养', 'Motorcycle Detailing'],
      ['motorcycle_repair', '摩托车维修', 'Motorcycle Repair'],
    ].map(child),
  },
  {
    key: 'repair_service',
    name: '维修服务',
    en: 'Repair Services',
    children: [
      ['appliance_repair', '家电维修', 'Appliance Repair'],
      ['computer_repair', '电脑维修', 'Computer Repair'],
      ['electromechanical_repair', '机电维修', 'Electromechanical Repair'],
      ['electronics_repair', '电子维修', 'Electronics Repair'],
      ['instrument_repair', '仪器维修', 'Instrument Repair'],
    ].map(child),
  },
  {
    key: 'construction_hardware',
    name: '建筑与五金',
    en: 'Construction and Hardware',
    children: [
      ['construction_company', '建筑公司', 'Construction Company'],
      ['electrical_installation', '电气安装', 'Electrical Installation'],
      ['electrician', '电工', 'Electrician'],
      ['hardware_store', '五金店', 'Hardware Store'],
      ['house_painter', '房屋油漆工', 'House Painter'],
      ['carpentry_workshop', '木工车间', 'Carpentry Workshop'],
    ].map(child),
  },
  {
    key: 'food_processing',
    name: '食品加工',
    en: 'Food Processing',
    children: [
      ['agricultural_farm', '农业农场', 'Agricultural Farm'],
      ['food_beverage_agri_processing', '食品饮料与农产品加工', 'Food, Beverage and Agricultural Processing'],
    ].map(child),
  },
];

function child([key, name, en]) {
  return { key, name, en };
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
  if (contactName.length < 2 || contactName.length > 20 || !/^[\u4e00-\u9fa5A-Za-z\s]+$/.test(contactName)) errors.push('contactName');
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
  validateAtlasReportPayload,
  normalizeAtlasReportPayload,
  atlasReportFromRow,
  generateSdCardCode,
  generateBindingTuple,
};
