const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const XLSX = require('xlsx');

const H = {
  reportId: ['\u62a5\u5907\u7f16\u53f7'],
  category: ['\u4e00\u7ea7\u5206\u7c7b'],
  subcategory: ['\u7ec6\u5206\u4e1a\u6001'],
  sceneName: ['\u573a\u666f\u540d\u79f0'],
  summary: ['\u91c7\u96c6\u5185\u5bb9\u6982\u8ff0'],
  workstation: ['\u5de5\u4f4d\u6e05\u5355'],
  workDetail: ['\u5de5\u4f5c\u5185\u5bb9\u660e\u7ec6'],
  workstationCount: ['\u5de5\u4f4d\u6570\u91cf'],
  imageCount: ['\u56fe\u7247\u6570\u91cf'],
  status: ['\u62a5\u5907\u72b6\u6001'],
  collector: ['\u91c7\u96c6\u4eba'],
  reportDate: ['\u62a5\u5907\u65e5\u671f'],
  approval: ['\u5ba1\u6279\u610f\u89c1'],
  notes: ['\u5907\u6ce8'],
  images: ['\u5de5\u4f4d\u56fe\u7247'],
  location: ['\u91c7\u96c6\u4f4d\u7f6e'],
};

function createAtlasWorkbench(config = {}) {
  const dataRoot = config.dataRoot || process.env.ATLAS_DATA_ROOT || path.join(process.cwd(), 'data', 'atlas');
  const outputDir = config.outputDir || process.env.ATLAS_OUTPUT_DIR || path.join(dataRoot, 'output');
  const imagesDir = config.imagesDir || process.env.ATLAS_IMAGES_DIR || path.join(dataRoot, 'images');
  const reportExcel = config.reportExcel || process.env.ATLAS_REPORT_EXCEL || '';
  const categoryExcel = config.categoryExcel || process.env.ATLAS_CATEGORY_EXCEL || '';
  const generatorScript = config.generatorScript || process.env.ATLAS_GENERATOR_SCRIPT || '';
  const pythonBin = config.pythonBin || process.env.ATLAS_PYTHON_BIN || 'python';
  const editsFile = config.editsFile || process.env.ATLAS_EDITS_FILE || path.join(dataRoot, 'edits.json');

  function getSummary() {
    const recordsData = getRecords();
    const records = recordsData.records;
    const scenes = groupByScene(records);
    const units = groupByUnit(records);
    return {
      ok: !recordsData.error,
      error: recordsData.error,
      source: recordsData.source,
      cards: {
        sceneCount: scenes.length,
        recordCount: records.length,
        imageCount: records.reduce((sum, record) => sum + record.imageList.length, 0),
        collectorCount: new Set(records.map(record => record.collector).filter(Boolean)).size,
        unitCount: units.length,
      },
      byStatus: countBy(records, 'status'),
      byCollector: countBy(records, 'collector'),
      byCategory: countBy(records, 'category'),
    };
  }

  function getRecords() {
    const excelPath = resolveReportExcel();
    if (!excelPath) return { source: '', records: [], error: 'atlas_report_excel_missing' };
    const workbook = XLSX.readFile(excelPath, { cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    const header = rows[0] || [];
    const records = rows.slice(1)
      .map((row, index) => normalizeReportRow(header, row, index))
      .filter(record => record.sceneName)
      .map(applyRecordEdit)
      .map(applySceneEdit);
    return { source: path.basename(excelPath), records };
  }

  function getScenes() {
    const recordsData = getRecords();
    return {
      source: recordsData.source,
      error: recordsData.error,
      scenes: groupByScene(recordsData.records),
    };
  }

  function getScene(name) {
    const scene = groupByScene(getRecords().records).find(item => item.name === name);
    if (!scene) {
      const error = new Error('atlas_scene_not_found');
      error.status = 404;
      throw error;
    }
    return scene;
  }

  function getUnits() {
    const recordsData = getRecords();
    return {
      source: recordsData.source,
      error: recordsData.error,
      units: groupByUnit(recordsData.records),
    };
  }

  function getCategories() {
    const excelPath = resolveCategoryExcel();
    if (!excelPath) {
      return { categories: [], businessTypes: [], totalCategories: 0, totalBusinessTypes: 0, error: 'atlas_category_excel_missing' };
    }
    const workbook = XLSX.readFile(excelPath, { cellDates: true });
    const categorySheet = workbook.Sheets[workbook.SheetNames[0]];
    const businessSheet = workbook.Sheets[workbook.SheetNames[1]];
    const categoryRows = XLSX.utils.sheet_to_json(categorySheet, { header: 1, defval: '' });
    const categories = categoryRows.slice(1).map((row, index) => ({
      index: row[0] || index + 1,
      category: String(row[1] || '').trim(),
      subcategories: splitList(row[2]),
    })).filter(item => item.category);
    const businessRows = businessSheet ? XLSX.utils.sheet_to_json(businessSheet, { header: 1, defval: '' }) : [];
    const headers = businessRows[1] || businessRows[0] || [];
    const businessTypes = businessRows.slice(2)
      .map(row => Object.fromEntries(headers.map((header, index) => [String(header || `field_${index}`).trim(), String(row[index] || '').trim()])))
      .filter(row => Object.values(row).some(Boolean));
    return {
      categories,
      businessTypes,
      totalCategories: categories.length,
      totalBusinessTypes: businessTypes.length,
      source: path.basename(excelPath),
    };
  }

  function getOutput() {
    if (!fs.existsSync(outputDir)) return { outputDir, files: [] };
    const files = fs.readdirSync(outputDir)
      .filter(file => file.endsWith('.docx'))
      .map(file => {
        const fullPath = path.join(outputDir, file);
        const stat = fs.statSync(fullPath);
        return {
          name: file,
          size: stat.size,
          mtime: stat.mtimeMs,
          downloadUrl: `/static/atlas-output/${encodeURIComponent(file)}`,
        };
      })
      .sort((a, b) => b.mtime - a.mtime);
    return { outputDir, files };
  }

  function generate({ scenes = [], units = [], byUnit = false, outputDir: requestedOutputDir = '' } = {}) {
    const names = byUnit ? units : scenes;
    if (!Array.isArray(names) || names.length === 0) {
      return Promise.resolve({ ok: false, reason: byUnit ? 'units_required' : 'scenes_required' });
    }
    if (!generatorScript || !fs.existsSync(generatorScript)) {
      return Promise.resolve({ ok: false, reason: 'generator_not_configured' });
    }
    const targetOutput = requestedOutputDir ? path.resolve(requestedOutputDir) : outputDir;
    fs.mkdirSync(targetOutput, { recursive: true });
    return new Promise(resolve => {
      const args = [generatorScript, '--out', targetOutput];
      const excelPath = resolveReportExcel();
      if (excelPath) args.push('--excel', excelPath);
      if (imagesDir) args.push('--images', imagesDir);
      if (byUnit) args.push('--by-unit');
      names.forEach(name => args.push('--name', name));
      const child = spawn(pythonBin, args, { stdio: ['ignore', 'pipe', 'pipe'] });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', chunk => stdout += chunk.toString());
      child.stderr.on('data', chunk => stderr += chunk.toString());
      child.on('close', code => resolve({ ok: code === 0, code, stdout, stderr, output: getOutput() }));
    });
  }

  function setRecordEdit(id, fields) {
    const edits = loadEdits();
    edits.recordEdits[id] = { ...(edits.recordEdits[id] || {}), ...fields };
    saveEdits(edits);
    return edits.recordEdits[id];
  }

  function setSceneEdit(name, fields) {
    const edits = loadEdits();
    edits.sceneEdits[name] = { ...(edits.sceneEdits[name] || {}), ...fields };
    saveEdits(edits);
    return edits.sceneEdits[name];
  }

  function clearEdits() {
    saveEdits({ recordEdits: {}, sceneEdits: {}, meta: {} });
    return { ok: true };
  }

  function resolveReportExcel() {
    if (reportExcel && fs.existsSync(reportExcel)) return reportExcel;
    return findLatestExcel(dataRoot, file => file.endsWith('.xlsx') && !file.startsWith('~$') && !file.toLowerCase().includes('category'));
  }

  function resolveCategoryExcel() {
    if (categoryExcel && fs.existsSync(categoryExcel)) return categoryExcel;
    return findLatestExcel(dataRoot, file => file.endsWith('.xlsx') && file.toLowerCase().includes('category'));
  }

  function applyRecordEdit(record) {
    const edits = loadEdits();
    return { ...record, ...(edits.recordEdits[record.reportId] || {}) };
  }

  function applySceneEdit(record) {
    const edits = loadEdits();
    return { ...record, ...(edits.sceneEdits[record.sceneName] || {}) };
  }

  function loadEdits() {
    if (!fs.existsSync(editsFile)) return { recordEdits: {}, sceneEdits: {}, meta: {} };
    try {
      const data = JSON.parse(fs.readFileSync(editsFile, 'utf8'));
      return {
        recordEdits: data.recordEdits || data.record_overrides || {},
        sceneEdits: data.sceneEdits || data.scene_overrides || {},
        meta: data.meta || {},
      };
    } catch {
      return { recordEdits: {}, sceneEdits: {}, meta: {} };
    }
  }

  function saveEdits(edits) {
    fs.mkdirSync(path.dirname(editsFile), { recursive: true });
    fs.writeFileSync(editsFile, JSON.stringify({ ...edits, meta: { updatedAt: new Date().toISOString() } }, null, 2));
  }

  return {
    getSummary,
    getRecords,
    getScenes,
    getScene,
    getUnits,
    getCategories,
    getOutput,
    generate,
    setRecordEdit,
    setSceneEdit,
    clearEdits,
    outputDir,
    imagesDir,
  };
}

function normalizeReportRow(header, row, index) {
  const raw = Object.fromEntries(header.map((key, columnIndex) => [String(key || '').trim(), row[columnIndex]]));
  const record = { rowNumber: index + 2 };
  Object.entries(H).forEach(([field, aliases]) => {
    record[field] = valueFor(raw, aliases);
  });
  record.reportId = String(record.reportId || `atlas-row-${index + 1}`).trim();
  record.sceneName = String(record.sceneName || '').trim();
  record.imageList = splitList(record.images);
  record.workstationCount = Number(record.workstationCount || 0);
  record.imageCount = Number(record.imageCount || record.imageList.length || 0);
  return record;
}

function valueFor(raw, aliases) {
  for (const alias of aliases) {
    if (raw[alias] !== undefined) return raw[alias];
  }
  return '';
}

function groupByScene(records) {
  const buckets = new Map();
  records.forEach(record => {
    if (!buckets.has(record.sceneName)) buckets.set(record.sceneName, []);
    buckets.get(record.sceneName).push(record);
  });
  return Array.from(buckets.entries()).map(([name, items]) => ({
    name,
    category: items[0].category,
    subcategory: items[0].subcategory,
    summary: items[0].summary,
    status: items[0].status,
    reportDate: items[0].reportDate,
    location: items[0].location,
    collectors: [...new Set(items.map(item => item.collector).filter(Boolean))],
    recordCount: items.length,
    imageCount: items.reduce((sum, item) => sum + item.imageList.length, 0),
    previewImage: items.flatMap(item => item.imageList)[0] || '',
    records: items,
  }));
}

function groupByUnit(records) {
  const buckets = new Map();
  records.forEach(record => {
    const unitName = extractUnitName(record.sceneName);
    if (!buckets.has(unitName)) buckets.set(unitName, []);
    buckets.get(unitName).push(record);
  });
  return Array.from(buckets.entries()).map(([unitName, items]) => ({
    unitName,
    category: items[0].category,
    subcategory: items[0].subcategory,
    scenes: [...new Set(items.map(item => item.sceneName))],
    recordCount: items.length,
    imageCount: items.reduce((sum, item) => sum + item.imageList.length, 0),
    collectors: [...new Set(items.map(item => item.collector).filter(Boolean))],
    location: items[0].location,
  }));
}

function extractUnitName(sceneName) {
  return String(sceneName || '')
    .replace(/(\u540e\u53a8|\u524d\u5385|\u5427\u53f0|\u6536\u94f6\u533a|\u5927\u5385|\u6d17\u8f66\u533a|\u7ef4\u4fee\u533a|\u7f8e\u5bb9\u533a|\u53a8\u623f|\u4ed3\u5e93|\u95e8\u53e3)$/u, '')
    .trim() || String(sceneName || '').trim();
}

function countBy(records, field) {
  return records.reduce((result, record) => {
    const key = record[field] || '\u672a\u8bbe\u7f6e';
    result[key] = (result[key] || 0) + 1;
    return result;
  }, {});
}

function splitList(value) {
  return String(value || '').split(/[\u3001,\uff0c]/u).map(item => item.trim()).filter(Boolean);
}

function findLatestExcel(root, predicate) {
  if (!root || !fs.existsSync(root)) return '';
  const files = fs.readdirSync(root)
    .filter(predicate)
    .map(file => ({ file, mtime: fs.statSync(path.join(root, file)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  return files[0] ? path.join(root, files[0].file) : '';
}

module.exports = { createAtlasWorkbench };
