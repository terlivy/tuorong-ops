const STORAGE_KEYS = {
  session: 'ops_session_v2',
  staff: 'ops_staff_records_v2',
  collectors: 'ops_collector_records_v1',
  channels: 'ops_channel_records_v1',
  partners: 'ops_partner_records_v1',
  storeMap: 'ops_store_map_records_v1',
  issues: 'ops_issue_records_v1',
  business: 'ops_business_records_v1',
};

const STATUS_LABELS = {
  active: '合作中',
  trial: '试跑中',
  inactive: '已停用',
  normal: '正常',
  pending: '待确认',
  settled: '已结算',
  unsettled: '未结算',
  open: '未处理',
  doing: '处理中',
  resolved: '已解决',
  high: '高',
  medium: '中',
  low: '低',
  lead: '线索',
  contacted: '已联系',
  negotiating: '洽谈中',
  won: '已成交',
  lost: '已流失',
};

const DEFAULT_DATA = {
  staff: [
    { id: 's-001', name: '张明', phone: '13800001234', area: '城东片区', role: '招商主管', status: 'active', visitedStores: 42, signedStores: 13, cooperationStart: '2025-12-10', lastFollowUp: '2026-09-12', notes: '重点维护餐饮街和社区便利店。' },
    { id: 's-002', name: '李娜', phone: '13900005678', area: '城西片区', role: '商务经理', status: 'trial', visitedStores: 26, signedStores: 5, cooperationStart: '2026-07-01', lastFollowUp: '2026-09-15', notes: '新区域试跑中。' },
  ],
  collectors: [
    { id: 'c-001', collectorName: '赵敏', storeName: '星光门店', phone: '13600001234', collectDate: '2026-09-15', startTime: '09:00', endTime: '13:30', hourlyRate: 35, notes: '上午场数据采集。' },
    { id: 'c-002', collectorName: '钱磊', storeName: '优选便利', phone: '13500005678', collectDate: '2026-09-15', startTime: '14:00', endTime: '18:00', hourlyRate: 40, notes: '下午场数据采集。' },
  ],
  channels: [
    { id: 'ch-001', projectCode: 'TR-001', projectName: '蚂蚁数据采集', upstream: '世纪恒通科技股份有限公司', unitPrice: '每周采集有效时长a，单价说明：a大于等于500H：35元/H；a小于500H：40元/H', minPrice: 35, maxPrice: 40, status: 'normal' },
    { id: 'ch-002', projectCode: 'TR-002', projectName: 'ATI数据采集', upstream: '世纪恒通科技股份有限公司', unitPrice: '每周采集有效时长a，单价说明：a大于等于1000H：28元/H；a小于1000H：31元/H。有可能有涨幅了。', minPrice: 28, maxPrice: 31, status: 'pending' },
  ],
  partners: [
    { id: 'p-001', projectCode: 'TR-001', projectName: '蚂蚁数据采集', partnerName: '星光门店', assetContact: '周经理', assetPhone: '13800008888', assetWechat: 'zg-13800008888', collectorName: '赵敏', sceneCount: 3, workContent: '门店客流数据采集、照片核验、日报提交', minPrice: 35, maxPrice: 40, reportedHours: 4.5, confirmedHours: 4.5, approvedHours: 4.5, partnerRate: 35, upstreamStatus: 'settled', downstreamStatus: 'unsettled' },
    { id: 'p-002', projectCode: 'TR-002', projectName: 'ATI数据采集', partnerName: '优选便利', assetContact: '刘店长', assetPhone: '13900009999', assetWechat: 'youxuan-store', collectorName: '钱磊', sceneCount: 2, workContent: '设备巡检、商品陈列数据采集', minPrice: 28, maxPrice: 31, reportedHours: 4, confirmedHours: 4, approvedHours: 3.5, partnerRate: 31, upstreamStatus: 'pending', downstreamStatus: 'unsettled' },
  ],
  storeMap: [
    { id: 'm-001', storeName: '星光门店', companyName: '星光餐饮管理有限公司', projectCode: 'TR-001', projectName: '蚂蚁数据采集', contactName: '赵敏', phone: '13600001234', address: '中山路 88 号', status: 'active', settlementStatus: 'unsettled', cooperationStart: '2026-08-20', x: 18, y: 24, notes: '稳定合作门店，上午采集效率较高。' },
    { id: 'm-002', storeName: '优选便利', companyName: '优选便利店', projectCode: 'TR-002', projectName: 'ATI数据采集', contactName: '钱磊', phone: '13500005678', address: '建设路 204 号', status: 'trial', settlementStatus: 'pending', cooperationStart: '2026-09-01', x: 58, y: 36, notes: '试跑中，需确认设备排班。' },
    { id: 'm-003', storeName: '云顶书店', companyName: '云顶文化传播有限公司', projectCode: 'TR-001', projectName: '蚂蚁数据采集', contactName: '许店长', phone: '18200009911', address: '学府路 158 号', status: 'active', settlementStatus: 'settled', cooperationStart: '2026-07-15', x: 78, y: 72, notes: '已完成上期结算。' },
  ],
  issues: [
    { id: 'i-001', title: '优选便利审批工时未确认', sourceModule: '合作商管理', relatedObject: '优选便利 / TR-002', owner: '李娜', priority: 'high', status: 'doing', foundDate: '2026-09-14', dueDate: '2026-09-17', resolvedDate: '', description: '甲方确认时长和合作商日报存在 0.5 小时差异。', result: '已联系上游核对。' },
    { id: 'i-002', title: '星光门店下游结算待处理', sourceModule: '合作门店地图', relatedObject: '星光门店', owner: '张明', priority: 'medium', status: 'open', foundDate: '2026-09-15', dueDate: '2026-09-20', resolvedDate: '', description: '合作商应付金额已生成，但下游尚未结算。', result: '' },
  ],
  business: [
    { id: 'b-001', businessName: '星光门店采集合作扩量', customerName: '星光门店', businessType: '采集合作', owner: '张明', stage: 'negotiating', expectedAmount: 12000, dealAmount: 0, startDate: '2026-09-10', expectedCloseDate: '2026-09-25', source: '合作门店地图', notes: '计划增加晚间采集场次。' },
    { id: 'b-002', businessName: '优选便利 ATI 项目', customerName: '优选便利', businessType: '数据采集', owner: '李娜', stage: 'won', expectedAmount: 8000, dealAmount: 7600, startDate: '2026-09-01', expectedCloseDate: '2026-09-12', source: '合作商管理', notes: '已成交，等待下游结算。' },
  ],
};

const MODULES = {
  staff: {
    title: '业务人员管理',
    desc: '记录跑业务人员、跑店数量、合作时长和转化情况。',
    idPrefix: 's',
    searchPlaceholder: '搜索姓名、电话、区域、岗位、备注',
    primaryField: 'name',
    secondary: item => `${item.area || '未填区域'} · 跑店 ${Number(item.visitedStores || 0)} 家`,
    filters: [
      ['all', '全部'],
      ['active', '合作中'],
      ['trial', '试跑中'],
      ['inactive', '已停用'],
    ],
    columns: [
      ['业务人员', item => `<strong>${escapeHtml(item.name)}</strong><br><span class="subtle">${escapeHtml(item.phone)}</span>`],
      ['区域', 'area'],
      ['状态', item => statusPill(item.status)],
      ['跑店数', item => `${Number(item.visitedStores || 0)} 家`],
      ['签约店数', item => `${Number(item.signedStores || 0)} 家`],
      ['转化率', item => conversionCell(item)],
      ['合作时长', item => formatMonths(OpsCore.calculateCooperationMonths(item.cooperationStart))],
      ['最近跟进', item => item.lastFollowUp || '未记录'],
    ],
    fields: [
      field('name', '姓名', 'text', { required: true, placeholder: '例如：张明' }),
      field('phone', '电话', 'text'),
      field('area', '负责区域', 'text', { required: true }),
      field('role', '岗位', 'text'),
      field('status', '合作状态', 'select', { options: [['active', '合作中'], ['trial', '试跑中'], ['inactive', '已停用']] }),
      field('cooperationStart', '合作开始', 'date'),
      field('visitedStores', '跑店数量', 'number', { required: true, min: 0 }),
      field('signedStores', '签约店铺', 'number', { required: true, min: 0 }),
      field('lastFollowUp', '最近跟进', 'date'),
      field('notes', '备注', 'textarea'),
    ],
    stats: records => {
      const stats = OpsCore.buildStats(records);
      return [['业务人员', stats.totalStaff], ['合作中人员', stats.activeStaff], ['累计跑店', stats.visitedStores], ['签约店铺', stats.signedStores]];
    },
    matchesStatus: (item, status) => status === 'all' || item.status === status,
    queryFields: ['name', 'phone', 'area', 'role', 'notes'],
    hint: item => item.cooperationStart ? `当前合作时长：${formatMonths(OpsCore.calculateCooperationMonths(item.cooperationStart))}` : '选择合作开始日期后，系统会自动计算合作时长。',
  },
  collectors: {
    title: '采集人员信息管理',
    desc: '记录采集人姓名、所属门店、采集日期、有效时长和结算金额。',
    idPrefix: 'c',
    searchPlaceholder: '搜索采集人、门店、电话、备注',
    primaryField: 'collectorName',
    secondary: item => `${item.storeName || '未填门店'} · ${item.collectDate || '未填日期'}`,
    filters: [
      ['all', '全部'],
      ['today', '今日采集'],
      ['settled', '有结算金额'],
    ],
    columns: [
      ['采集人姓名', 'collectorName'],
      ['所属门店', 'storeName'],
      ['电话', 'phone'],
      ['采集日期', 'collectDate'],
      ['开始时间', 'startTime'],
      ['结束时间', 'endTime'],
      ['有效时长（小时）', item => OpsCore.calculateDurationHours(item.startTime, item.endTime)],
      ['结算金额（元/小时）', item => `${Number(item.hourlyRate || 0)} 元/H`],
      ['应结算金额', item => money(OpsCore.calculateCollectorSettlement(item))],
    ],
    fields: [
      field('collectorName', '采集人姓名', 'text', { required: true }),
      field('storeName', '所属门店', 'text', { required: true }),
      field('phone', '电话', 'text'),
      field('collectDate', '采集日期', 'date', { required: true }),
      field('startTime', '开始时间', 'time', { required: true }),
      field('endTime', '结束时间', 'time', { required: true }),
      field('hourlyRate', '结算金额（元/小时）', 'number', { required: true, min: 0 }),
      field('notes', '备注', 'textarea'),
    ],
    stats: records => {
      const stats = OpsCore.buildCollectionStats(records);
      return [['采集记录', stats.totalCollectors], ['有效时长', `${stats.totalHours} 小时`], ['应结算', money(stats.totalSettlement)], ['平均时薪', stats.totalHours ? money(stats.totalSettlement / stats.totalHours) : '0']];
    },
    matchesStatus: (item, status) => {
      if (status === 'all') return true;
      if (status === 'today') return item.collectDate === new Date().toISOString().slice(0, 10);
      if (status === 'settled') return OpsCore.calculateCollectorSettlement(item) > 0;
      return true;
    },
    queryFields: ['collectorName', 'storeName', 'phone', 'notes'],
    hint: item => `有效时长：${OpsCore.calculateDurationHours(item.startTime, item.endTime)} 小时，应结算：${money(OpsCore.calculateCollectorSettlement(item))}`,
  },
  channels: {
    title: '合作渠道信息',
    desc: '维护项目编号、上游甲方、甲方单价和渠道协议单价。',
    idPrefix: 'ch',
    searchPlaceholder: '搜索项目编号、项目名称、上游甲方',
    primaryField: 'projectName',
    secondary: item => `${item.projectCode || '未填编号'} · ${item.upstream || '未填上游甲方'}`,
    filters: [['all', '全部'], ['normal', '正常'], ['pending', '待确认']],
    columns: [
      ['项目编号/项目名称', item => `${escapeHtml(item.projectCode)}<br>${escapeHtml(item.projectName)}`],
      ['上游甲方', 'upstream'],
      ['甲方单价', item => `<span>${escapeHtml(item.unitPrice)}</span>`],
      ['最低渠道协议单价（元/小时）', 'minPrice'],
      ['最高渠道协议单价（元/小时）', 'maxPrice'],
      ['状态', item => statusPill(item.status)],
    ],
    fields: [
      field('projectCode', '项目编号', 'text', { required: true }),
      field('projectName', '项目名称', 'text', { required: true }),
      field('upstream', '上游甲方', 'text', { required: true }),
      field('unitPrice', '甲方单价说明', 'textarea', { required: true }),
      field('minPrice', '最低渠道协议单价（元/小时）', 'number', { required: true, min: 0 }),
      field('maxPrice', '最高渠道协议单价（元/小时）', 'number', { required: true, min: 0 }),
      field('status', '状态', 'select', { options: [['normal', '正常'], ['pending', '待确认']] }),
    ],
    stats: records => {
      const avgMin = avg(records, 'minPrice');
      const avgMax = avg(records, 'maxPrice');
      return [['渠道项目', records.length], ['正常项目', records.filter(x => x.status === 'normal').length], ['平均最低价', money(avgMin)], ['平均最高价', money(avgMax)]];
    },
    matchesStatus: (item, status) => status === 'all' || item.status === status,
    queryFields: ['projectCode', 'projectName', 'upstream', 'unitPrice'],
    hint: item => item.minPrice && item.maxPrice ? `渠道协议单价区间：${item.minPrice} - ${item.maxPrice} 元/小时` : '按图片模板维护渠道协议单价。',
  },
  partners: {
    title: '合作商管理',
    desc: '按项目和合作商记录采集时长、应付金额、毛利润和结款状态。',
    idPrefix: 'p',
    searchPlaceholder: '搜索项目、合作商、采集员',
    primaryField: 'partnerName',
    secondary: item => `${item.projectCode || '未填项目'} · ${item.collectorName || '未填采集员'}`,
    filters: [['all', '全部'], ['settled', '上游已结'], ['unsettled', '下游未结'], ['pending', '待确认']],
    columns: [
      ['项目编号/项目名称', item => `${escapeHtml(item.projectCode)}<br>${escapeHtml(item.projectName)}`],
      ['合作商名称（门店/公司）', 'partnerName'],
      ['联系人', 'assetContact'],
      ['联系电话', 'assetPhone'],
      ['微信号', 'assetWechat'],
      ['采集员姓名（店员/工人）', 'collectorName'],
      ['场景数量', 'sceneCount'],
      ['工作内容', 'workContent'],
      ['最低渠道协议单价（元/小时）', 'minPrice'],
      ['最高渠道协议单价（元/小时）', 'maxPrice'],
      ['合作商日报总时长（时）', 'reportedHours'],
      ['甲方官方确认有效时长（时）', 'confirmedHours'],
      ['审批通过工时', 'approvedHours'],
      ['拓融总收入（审批工时×甲方单价）', item => money(OpsCore.calculatePartnerFinance(item).income)],
      ['应付合作商（审批工时×渠道单价）', item => money(OpsCore.calculatePartnerFinance(item).payable)],
      ['拓融毛利润（收入-应付）', item => money(OpsCore.calculatePartnerFinance(item).profit)],
      ['上游结款状态', item => statusPill(item.upstreamStatus)],
      ['下游结算状态', item => statusPill(item.downstreamStatus)],
    ],
    fields: [
      field('projectCode', '项目编号', 'text', { required: true }),
      field('projectName', '项目名称', 'text', { required: true }),
      field('partnerName', '合作商名称（门店/公司）', 'text', { required: true }),
      field('assetContact', '联系人', 'text'),
      field('assetPhone', '联系电话', 'text'),
      field('assetWechat', '微信号', 'text'),
      field('collectorName', '采集员姓名（店员/工人）', 'text', { required: true }),
      field('sceneCount', '场景数量', 'number', { required: true, min: 0 }),
      field('workContent', '工作内容', 'textarea'),
      field('minPrice', '最低渠道协议单价（元/小时）', 'number', { required: true, min: 0 }),
      field('maxPrice', '最高渠道协议单价（元/小时）', 'number', { required: true, min: 0 }),
      field('reportedHours', '合作商日报总时长（时）', 'number', { required: true, min: 0 }),
      field('confirmedHours', '甲方官方确认有效时长（时）', 'number', { required: true, min: 0 }),
      field('approvedHours', '审批通过工时', 'number', { required: true, min: 0 }),
      field('partnerRate', '渠道单价（元/小时）', 'number', { required: true, min: 0 }),
      field('upstreamStatus', '上游结款状态', 'select', { options: [['pending', '待确认'], ['settled', '已结算'], ['unsettled', '未结算']] }),
      field('downstreamStatus', '下游结算状态', 'select', { options: [['unsettled', '未结算'], ['settled', '已结算'], ['pending', '待确认']] }),
    ],
    stats: records => {
      const income = records.reduce((sum, item) => sum + OpsCore.calculatePartnerFinance(item).income, 0);
      const payable = records.reduce((sum, item) => sum + OpsCore.calculatePartnerFinance(item).payable, 0);
      return [['合作商', records.length], ['总收入', money(income)], ['应付合作商', money(payable)], ['毛利润', money(income - payable)]];
    },
    matchesStatus: (item, status) => {
      if (status === 'all') return true;
      if (status === 'settled') return item.upstreamStatus === 'settled';
      if (status === 'unsettled') return item.downstreamStatus === 'unsettled';
      if (status === 'pending') return item.upstreamStatus === 'pending' || item.downstreamStatus === 'pending';
      return true;
    },
    queryFields: ['projectCode', 'projectName', 'partnerName', 'assetContact', 'assetPhone', 'assetWechat', 'collectorName', 'workContent'],
    hint: item => {
      const finance = OpsCore.calculatePartnerFinance(item);
      return `计费工时：${finance.hours}，收入：${money(finance.income)}，应付：${money(finance.payable)}，毛利润：${money(finance.profit)}`;
    },
  },
  storeMap: {
    title: '合作门店地图',
    desc: '以地图点位方式查看合作门店、合作状态和结算状态。',
    idPrefix: 'm',
    view: 'map',
    searchPlaceholder: '搜索门店、公司、项目、联系人、地址',
    primaryField: 'storeName',
    secondary: item => `${item.projectCode || '未填项目'} · ${item.address || '未填地址'}`,
    filters: [['all', '全部'], ['active', '合作中'], ['trial', '试跑中'], ['inactive', '已停用'], ['unsettled', '未结算']],
    columns: [
      ['合作门店', item => `<strong>${escapeHtml(item.storeName)}</strong><br><span class="subtle">${escapeHtml(item.companyName)}</span>`],
      ['项目编号/名称', item => `${escapeHtml(item.projectCode)}<br>${escapeHtml(item.projectName)}`],
      ['联系人', 'contactName'],
      ['电话', 'phone'],
      ['地址', 'address'],
      ['合作状态', item => statusPill(item.status)],
      ['结算状态', item => statusPill(item.settlementStatus)],
    ],
    fields: [
      field('storeName', '合作门店名称', 'text', { required: true }),
      field('companyName', '合作商公司', 'text'),
      field('projectCode', '项目编号', 'text', { required: true }),
      field('projectName', '项目名称', 'text', { required: true }),
      field('contactName', '联系人', 'text'),
      field('phone', '电话', 'text'),
      field('address', '地址', 'text', { required: true }),
      field('status', '合作状态', 'select', { options: [['active', '合作中'], ['trial', '试跑中'], ['inactive', '已停用']] }),
      field('settlementStatus', '结算状态', 'select', { options: [['unsettled', '未结算'], ['settled', '已结算'], ['pending', '待确认']] }),
      field('cooperationStart', '合作开始', 'date'),
      field('x', '地图横向位置 0-100', 'number', { required: true, min: 0 }),
      field('y', '地图纵向位置 0-100', 'number', { required: true, min: 0 }),
      field('notes', '备注', 'textarea'),
    ],
    stats: records => {
      const stats = OpsCore.buildStoreMapStats(records);
      return [['合作门店', stats.totalStores], ['合作中', stats.activeStores], ['已结算', stats.settledStores], ['未结算', stats.unsettledStores]];
    },
    matchesStatus: (item, status) => {
      if (status === 'all') return true;
      if (status === 'unsettled') return item.settlementStatus === 'unsettled';
      return item.status === status;
    },
    queryFields: ['storeName', 'companyName', 'projectCode', 'projectName', 'contactName', 'phone', 'address', 'notes'],
    hint: item => {
      const point = OpsCore.clampMapPoint(item);
      return `地图位置：横向 ${point.x}，纵向 ${point.y}。坐标范围为 0-100。`;
    },
  },
  issues: {
    title: '问题管理',
    desc: '跟踪运营过程中的异常、待办、结算差异和处理结果。',
    idPrefix: 'i',
    searchPlaceholder: '搜索问题标题、关联对象、负责人、描述',
    primaryField: 'title',
    secondary: item => `${item.sourceModule || '未填来源'} · ${item.owner || '未填负责人'}`,
    filters: [['all', '全部'], ['open', '未处理'], ['doing', '处理中'], ['resolved', '已解决'], ['high', '高优先级']],
    columns: [
      ['问题标题', item => `<strong>${escapeHtml(item.title)}</strong><br><span class="subtle">${escapeHtml(item.relatedObject)}</span>`],
      ['来源模块', 'sourceModule'],
      ['负责人', 'owner'],
      ['优先级', item => statusPill(item.priority)],
      ['状态', item => statusPill(item.status)],
      ['发现日期', 'foundDate'],
      ['截止日期', 'dueDate'],
      ['解决日期', item => item.resolvedDate || '未解决'],
      ['处理结果', 'result'],
    ],
    fields: [
      field('title', '问题标题', 'text', { required: true }),
      field('sourceModule', '来源模块', 'select', { options: [['业务人员管理', '业务人员管理'], ['采集人员信息管理', '采集人员信息管理'], ['合作渠道信息', '合作渠道信息'], ['合作商管理', '合作商管理'], ['合作门店地图', '合作门店地图'], ['其他', '其他']] }),
      field('relatedObject', '关联对象', 'text', { placeholder: '例如：优选便利 / TR-002' }),
      field('owner', '负责人', 'text'),
      field('priority', '优先级', 'select', { options: [['high', '高'], ['medium', '中'], ['low', '低']] }),
      field('status', '处理状态', 'select', { options: [['open', '未处理'], ['doing', '处理中'], ['resolved', '已解决']] }),
      field('foundDate', '发现日期', 'date'),
      field('dueDate', '截止日期', 'date'),
      field('resolvedDate', '解决日期', 'date'),
      field('description', '问题描述', 'textarea'),
      field('result', '处理结果', 'textarea'),
    ],
    stats: records => {
      const stats = OpsCore.buildIssueStats(records);
      return [['问题总数', stats.totalIssues], ['未解决', stats.unresolvedIssues], ['高优先级', stats.highPriorityIssues], ['已逾期', stats.overdueIssues]];
    },
    matchesStatus: (item, status) => {
      if (status === 'all') return true;
      if (status === 'high') return item.priority === 'high';
      return item.status === status;
    },
    queryFields: ['title', 'sourceModule', 'relatedObject', 'owner', 'description', 'result'],
    hint: item => {
      if (item.status === 'resolved') return item.resolvedDate ? `已于 ${item.resolvedDate} 解决。` : '问题已标记解决，请补充解决日期。';
      return item.dueDate ? `截止日期：${item.dueDate}，请及时推进处理。` : '填写截止日期后，系统会统计逾期问题。';
    },
  },
  business: {
    title: '业务管理',
    desc: '管理业务机会、客户门店、跟进阶段、预计金额和成交金额。',
    idPrefix: 'b',
    searchPlaceholder: '搜索业务名称、客户、类型、负责人、来源',
    primaryField: 'businessName',
    secondary: item => `${item.customerName || '未填客户'} · ${STATUS_LABELS[item.stage] || item.stage || '未填阶段'}`,
    filters: [['all', '全部'], ['lead', '线索'], ['contacted', '已联系'], ['negotiating', '洽谈中'], ['won', '已成交'], ['lost', '已流失']],
    columns: [
      ['业务名称', item => `<strong>${escapeHtml(item.businessName)}</strong><br><span class="subtle">${escapeHtml(item.customerName)}</span>`],
      ['业务类型', 'businessType'],
      ['负责人', 'owner'],
      ['阶段', item => statusPill(item.stage)],
      ['预计金额', item => money(item.expectedAmount)],
      ['成交金额', item => money(item.dealAmount)],
      ['开始日期', 'startDate'],
      ['预计成交', 'expectedCloseDate'],
      ['来源', 'source'],
    ],
    fields: [
      field('businessName', '业务名称', 'text', { required: true }),
      field('customerName', '客户/门店', 'text', { required: true }),
      field('businessType', '业务类型', 'text', { placeholder: '例如：数据采集、渠道合作' }),
      field('owner', '负责人', 'text'),
      field('stage', '业务阶段', 'select', { options: [['lead', '线索'], ['contacted', '已联系'], ['negotiating', '洽谈中'], ['won', '已成交'], ['lost', '已流失']] }),
      field('expectedAmount', '预计金额', 'number', { min: 0 }),
      field('dealAmount', '成交金额', 'number', { min: 0 }),
      field('startDate', '开始日期', 'date'),
      field('expectedCloseDate', '预计成交日期', 'date'),
      field('source', '业务来源', 'text', { placeholder: '例如：合作门店地图' }),
      field('notes', '备注', 'textarea'),
    ],
    stats: records => {
      const stats = OpsCore.buildBusinessStats(records);
      return [['业务总数', stats.totalBusiness], ['推进中', stats.activeBusiness], ['已成交', stats.wonBusiness], ['成交金额', money(stats.dealAmount)]];
    },
    matchesStatus: (item, status) => status === 'all' || item.stage === status,
    queryFields: ['businessName', 'customerName', 'businessType', 'owner', 'source', 'notes'],
    hint: item => {
      const expected = Number(item.expectedAmount || 0);
      const deal = Number(item.dealAmount || 0);
      return item.stage === 'won'
        ? `已成交：${money(deal)}。`
        : `预计金额：${money(expected)}，当前阶段：${STATUS_LABELS[item.stage] || '未设置'}。`;
    },
  },
};

const $ = selector => document.querySelector(selector);
const loginPage = $('#loginPage');
const appShell = $('#appShell');
const moduleTabs = $('#moduleTabs');
const searchInput = $('#searchInput');
const filtersEl = $('#filters');
const miniListEl = $('#miniList');
const tableHead = $('#tableHead');
const tableBody = $('#tableBody');
const emptyState = $('#emptyState');
const recordForm = $('#recordForm');
const importFile = $('#importFile');
const mapView = $('#mapView');

let currentModule = 'staff';
let currentFilter = 'all';
let currentQuery = '';
let selectedId = '';
let data = {
  staff: loadList('staff'),
  collectors: loadList('collectors'),
  channels: loadList('channels'),
  partners: loadList('partners'),
  storeMap: loadList('storeMap'),
  issues: loadList('issues'),
  business: loadList('business'),
};

function field(name, label, type, options = {}) {
  return { name, label, type, ...options };
}

function loadList(key) {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS[key]);
    if (!stored) return DEFAULT_DATA[key];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : DEFAULT_DATA[key];
  } catch {
    return DEFAULT_DATA[key];
  }
}

function saveList(key) {
  localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(data[key]));
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);
}

function money(value) {
  const n = Number(value || 0);
  return `¥ ${Math.round(n * 100) / 100}`;
}

function avg(records, key) {
  if (!records.length) return 0;
  return records.reduce((sum, item) => sum + Number(item[key] || 0), 0) / records.length;
}

function formatMonths(months) {
  if (!months) return '未开始';
  if (months < 12) return `${months} 个月`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest ? `${years} 年 ${rest} 个月` : `${years} 年`;
}

function statusPill(status) {
  return `<span class="status ${escapeHtml(status)}">${STATUS_LABELS[status] || status || '未设置'}</span>`;
}

function getConversionRate(item) {
  const visited = Number(item.visitedStores || 0);
  if (!visited) return 0;
  return Math.round((Number(item.signedStores || 0) / visited) * 100);
}

function conversionCell(item) {
  const rate = getConversionRate(item);
  return `<div>${rate}%</div><div class="progress" aria-hidden="true"><i style="width:${Math.min(rate, 100)}%"></i></div>`;
}

function isLoggedIn() {
  return localStorage.getItem(STORAGE_KEYS.session) === 'yes';
}

function showApp() {
  loginPage.hidden = true;
  appShell.hidden = false;
  renderTabs();
  switchModule(currentModule);
}

function showLogin() {
  loginPage.hidden = false;
  appShell.hidden = true;
}

function renderTabs() {
  moduleTabs.innerHTML = Object.entries(MODULES).map(([key, mod]) => `
    <button class="tab${key === currentModule ? ' active' : ''}" type="button" data-module="${key}">
      ${mod.title}
    </button>
  `).join('');
  moduleTabs.querySelectorAll('.tab').forEach(button => {
    button.addEventListener('click', () => switchModule(button.dataset.module));
  });
}

function switchModule(key) {
  currentModule = key;
  currentFilter = 'all';
  currentQuery = '';
  selectedId = data[key][0] ? data[key][0].id : '';
  searchInput.value = '';
  render();
}

function currentConfig() {
  return MODULES[currentModule];
}

function getVisibleRecords() {
  const mod = currentConfig();
  const q = currentQuery.trim().toLowerCase();
  return data[currentModule].filter(item => {
    const statusOk = mod.matchesStatus(item, currentFilter);
    const haystack = mod.queryFields.map(key => String(item[key] || '').toLowerCase()).join(' ');
    return statusOk && (!q || haystack.includes(q));
  });
}

function render() {
  const mod = currentConfig();
  $('#moduleTitle').textContent = mod.title;
  $('#moduleDesc').textContent = mod.desc;
  searchInput.placeholder = mod.searchPlaceholder;
  renderTabs();
  renderFilters();
  renderStats();
  renderTable();
  renderMiniList();
  renderForm();
}

function renderFilters() {
  const mod = currentConfig();
  filtersEl.innerHTML = mod.filters.map(([key, label]) => {
    const count = data[currentModule].filter(item => mod.matchesStatus(item, key)).length;
    return `
      <button class="filter${currentFilter === key ? ' active' : ''}" type="button" data-filter="${key}">
        <span>${label}</span>
        <span>${count}</span>
      </button>
    `;
  }).join('');
  filtersEl.querySelectorAll('.filter').forEach(button => {
    button.addEventListener('click', () => {
      currentFilter = button.dataset.filter;
      render();
    });
  });
}

function renderStats() {
  const rows = currentConfig().stats(data[currentModule]);
  $('#stats').innerHTML = rows.map(([label, value]) => `
    <div class="stat"><span>${label}</span><b>${value}</b></div>
  `).join('');
}

function renderTable() {
  const mod = currentConfig();
  const visible = getVisibleRecords();
  if (mod.view === 'map') {
    tableHead.closest('table').hidden = true;
    mapView.hidden = false;
    renderMapView(visible);
    emptyState.hidden = visible.length > 0;
    return;
  }

  tableHead.closest('table').hidden = false;
  mapView.hidden = true;
  tableHead.innerHTML = `<tr>${mod.columns.map(([label]) => `<th>${label}</th>`).join('')}</tr>`;
  tableBody.innerHTML = visible.map(item => `
    <tr class="${item.id === selectedId ? 'selected' : ''}" data-id="${item.id}">
      ${mod.columns.map(([, renderer]) => `<td>${renderValue(item, renderer)}</td>`).join('')}
    </tr>
  `).join('');
  tableBody.querySelectorAll('tr').forEach(row => row.addEventListener('click', () => selectRecord(row.dataset.id)));
  emptyState.hidden = visible.length > 0;
}

function renderMapView(records) {
  const selected = records.find(item => item.id === selectedId) || records[0];
  if (selected && !selectedId) selectedId = selected.id;
  const nodes = records.map(item => {
    const point = OpsCore.clampMapPoint(item);
    const color = item.status === 'active' ? '#0f9f6e' : item.status === 'trial' ? '#d97706' : '#dc2626';
    return `
      <button class="map-node${item.id === selectedId ? ' active' : ''}" type="button" data-id="${item.id}" style="left:${point.x}%;top:${point.y}%;--pin:${color}">
        <span class="map-pin">${escapeHtml(String(item.storeName || '?').slice(0, 1))}</span>
        <span class="map-label">${escapeHtml(item.storeName)}</span>
      </button>
    `;
  }).join('');

  mapView.innerHTML = `
    <div class="map-canvas">
      ${buildMapBackground()}
      ${nodes}
    </div>
    ${selected ? buildMapCard(selected) : ''}
  `;

  mapView.querySelectorAll('.map-node').forEach(node => {
    node.addEventListener('click', () => selectRecord(node.dataset.id));
  });
}

function buildMapBackground() {
  const blocks = [];
  const xEdges = [0, 14, 28, 43, 57, 72, 86, 100];
  const yEdges = [0, 15, 31, 47, 63, 79, 100];
  for (let i = 0; i < xEdges.length - 1; i++) {
    for (let j = 0; j < yEdges.length - 1; j++) {
      blocks.push(`<rect x="${xEdges[i] + 1.3}" y="${yEdges[j] + 1.3}" width="${xEdges[i + 1] - xEdges[i] - 2.6}" height="${yEdges[j + 1] - yEdges[j] - 2.6}" rx="1.1" fill="#e3e8f1"/>`);
    }
  }
  return `
    <svg class="map-bg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      ${blocks.join('')}
      <rect x="57.5" y="64" width="13" height="8.5" rx="1.2" fill="#d9ebd9"/>
      <path d="M-5,74 L105,28" stroke="#eef1f7" stroke-width="17" fill="none" vector-effect="non-scaling-stroke"/>
      <path d="M-5,74 L105,28" stroke="#d6deeb" stroke-width="1.2" stroke-dasharray="7 9" fill="none" vector-effect="non-scaling-stroke"/>
    </svg>
  `;
}

function buildMapCard(item) {
  return `
    <aside class="map-card">
      <h3>${escapeHtml(item.storeName)}</h3>
      <p class="subtle">${escapeHtml(item.companyName || item.projectName || '')}</p>
      <dl>
        <dt>项目</dt><dd>${escapeHtml(item.projectCode)} ${escapeHtml(item.projectName)}</dd>
        <dt>联系人</dt><dd>${escapeHtml(item.contactName || '未填写')}</dd>
        <dt>电话</dt><dd>${escapeHtml(item.phone || '未填写')}</dd>
        <dt>地址</dt><dd>${escapeHtml(item.address || '未填写')}</dd>
        <dt>合作状态</dt><dd>${statusPill(item.status)}</dd>
        <dt>结算状态</dt><dd>${statusPill(item.settlementStatus)}</dd>
      </dl>
    </aside>
  `;
}

function renderValue(item, renderer) {
  if (typeof renderer === 'function') return renderer(item);
  return escapeHtml(item[renderer]);
}

function renderMiniList() {
  const mod = currentConfig();
  miniListEl.innerHTML = getVisibleRecords().map(item => `
    <button class="person-card${item.id === selectedId ? ' active' : ''}" type="button" data-id="${item.id}">
      <b>${escapeHtml(item[mod.primaryField])}</b>
      <p class="subtle">${escapeHtml(mod.secondary(item))}</p>
    </button>
  `).join('');
  miniListEl.querySelectorAll('.person-card').forEach(button => button.addEventListener('click', () => selectRecord(button.dataset.id)));
}

function renderForm() {
  const mod = currentConfig();
  const selected = data[currentModule].find(item => item.id === selectedId) || {};
  $('#formTitle').textContent = selected.id ? `编辑：${selected[mod.primaryField] || mod.title}` : `新增${mod.title.replace('管理', '')}`;
  $('#formSubtitle').textContent = selected.id ? mod.secondary(selected) : '填写后点击保存记录';

  const fieldHtml = renderFieldGroups(mod.fields, selected);

  recordForm.innerHTML = `
    <input type="hidden" name="id" value="${escapeHtml(selected.id || '')}">
    ${fieldHtml}
    <div class="hint" id="liveHint">${mod.hint(selected)}</div>
    <div class="actions">
      <button class="btn primary" type="submit">保存记录</button>
      <button class="btn" id="clearBtn" type="button">清空表单</button>
      <button class="btn danger" id="deleteBtn" type="button" ${selected.id ? '' : 'disabled'}>删除</button>
    </div>
  `;
  recordForm.querySelectorAll('input, select, textarea').forEach(input => input.addEventListener('input', updateLiveHint));
  $('#clearBtn').addEventListener('click', clearForm);
  $('#deleteBtn').addEventListener('click', deleteSelected);
}

function renderFieldGroups(fields, selected) {
  const parts = [];
  let pair = [];

  fields.forEach(item => {
    const value = selected[item.name] ?? defaultValue(item);
    const html = `<label>${item.label}${buildInput(item, value)}</label>`;
    if (item.type === 'textarea') {
      if (pair.length) {
        parts.push(`<div class="two">${pair.join('')}</div>`);
        pair = [];
      }
      parts.push(html);
      return;
    }

    pair.push(html);
    if (pair.length === 2) {
      parts.push(`<div class="two">${pair.join('')}</div>`);
      pair = [];
    }
  });

  if (pair.length) parts.push(`<div class="two">${pair.join('')}</div>`);
  return parts.join('');
}

function buildInput(item, value) {
  const required = item.required ? ' required' : '';
  const min = item.min !== undefined ? ` min="${item.min}"` : '';
  const placeholder = item.placeholder ? ` placeholder="${escapeHtml(item.placeholder)}"` : '';
  if (item.type === 'select') {
    return `<select name="${item.name}"${required}>${item.options.map(([valueKey, label]) => `
      <option value="${valueKey}"${value === valueKey ? ' selected' : ''}>${label}</option>
    `).join('')}</select>`;
  }
  if (item.type === 'textarea') {
    return `<textarea name="${item.name}"${required}${placeholder}>${escapeHtml(value)}</textarea>`;
  }
  return `<input name="${item.name}" type="${item.type}" value="${escapeHtml(value)}"${required}${min}${placeholder}>`;
}

function defaultValue(item) {
  if (item.type === 'number') return 0;
  if (item.name === 'x' || item.name === 'y') return 50;
  if (item.options && item.options.length) return item.options[0][0];
  if (item.name === 'status') return 'active';
  if (item.name === 'upstreamStatus') return 'pending';
  if (item.name === 'downstreamStatus') return 'unsettled';
  if (item.name === 'settlementStatus') return 'unsettled';
  return '';
}

function readFormRecord() {
  const values = Object.fromEntries(new FormData(recordForm).entries());
  const mod = currentConfig();
  const record = { id: values.id || `${mod.idPrefix}-${Date.now()}` };
  mod.fields.forEach(item => {
    const raw = values[item.name] ?? '';
    record[item.name] = item.type === 'number' ? Number(raw || 0) : String(raw).trim();
  });
  if (mod.view === 'map') {
    Object.assign(record, OpsCore.clampMapPoint(record));
  }
  return record;
}

function updateLiveHint() {
  const hint = $('#liveHint');
  if (!hint) return;
  hint.textContent = currentConfig().hint(readFormRecord());
}

function selectRecord(id) {
  selectedId = id;
  render();
}

function clearForm() {
  selectedId = '';
  renderForm();
  renderTable();
  renderMiniList();
}

function deleteSelected() {
  if (!selectedId) return;
  data[currentModule] = data[currentModule].filter(item => item.id !== selectedId);
  saveList(currentModule);
  selectedId = data[currentModule][0] ? data[currentModule][0].id : '';
  render();
}

function exportCsv() {
  const mod = currentConfig();
  const headers = mod.fields.map(field => field.label);
  const rows = data[currentModule].map(item => mod.fields.map(field => item[field.name] ?? ''));
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${mod.title}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function importCsvFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const mod = currentConfig();
      const rows = OpsCore.parseCsv(reader.result);
      const imported = OpsCore.mapCsvRowsToRecords(rows, mod.fields, `${mod.idPrefix}-import-${Date.now()}`)
        .map(record => mod.view === 'map' ? { ...record, ...OpsCore.clampMapPoint(record) } : record)
        .filter(record => hasUsefulImportData(record, mod.fields));
      if (!imported.length) {
        alert('没有识别到可导入的数据，请检查 CSV 表头是否和当前模块字段一致。');
        return;
      }
      data[currentModule] = [...imported, ...data[currentModule]];
      selectedId = imported[0].id;
      saveList(currentModule);
      render();
      alert(`已导入 ${imported.length} 条记录`);
    } catch (error) {
      alert(`导入失败：${error.message || 'CSV 格式无法解析'}`);
    } finally {
      importFile.value = '';
    }
  };
  reader.readAsText(file, 'utf-8');
}

function hasUsefulImportData(record, fields) {
  return fields.some(field => field.type !== 'number' && String(record[field.name] || '').trim() !== '');
}

recordForm.addEventListener('submit', event => {
  event.preventDefault();
  const record = readFormRecord();
  const index = data[currentModule].findIndex(item => item.id === record.id);
  if (index >= 0) data[currentModule][index] = record;
  else data[currentModule].unshift(record);
  selectedId = record.id;
  saveList(currentModule);
  render();
});

searchInput.addEventListener('input', event => {
  currentQuery = event.target.value;
  renderTable();
  renderMiniList();
});

$('#newBtn').addEventListener('click', clearForm);
$('#importBtn').addEventListener('click', () => importFile.click());
importFile.addEventListener('change', event => importCsvFile(event.target.files[0]));
$('#exportBtn').addEventListener('click', exportCsv);
$('#logoutBtn').addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEYS.session);
  showLogin();
});

$('#loginForm').addEventListener('submit', event => {
  event.preventDefault();
  const user = $('#loginUser').value.trim();
  const pass = $('#loginPass').value;
  if (user === 'admin' && pass === '123456') {
    localStorage.setItem(STORAGE_KEYS.session, 'yes');
    $('#loginError').textContent = '';
    showApp();
  } else {
    $('#loginError').textContent = '账号或密码不正确';
  }
});

if (isLoggedIn()) showApp();
else showLogin();
