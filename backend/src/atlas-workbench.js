const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const XLSX = require('xlsx');

const H = {
  reportId: ['\u62a5\u5907\u7f16\u53f7'],
  category: ['\u4e00\u7ea7\u5206\u7c7b/\u7ec6\u5206\u4e1a\u6001', '\u4e00\u7ea7\u5206\u7c7b'],
  subcategory: ['\u4e00\u7ea7\u5206\u7c7b/\u7ec6\u5206\u4e1a\u6001', '\u7ec6\u5206\u4e1a\u6001'],
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
  reviewHours: ['\u5ba1\u6838\u65f6\u957f(H)', '\u5ba1\u6838\u65f6\u957f'],
};

function createAtlasWorkbench(config = {}) {
  const dataRoot = config.dataRoot || process.env.ATLAS_DATA_ROOT || path.join(process.cwd(), 'data', 'atlas');
  const outputDir = config.outputDir || process.env.ATLAS_OUTPUT_DIR || path.join(dataRoot, 'output');
  const imagesDir = config.imagesDir || process.env.ATLAS_IMAGES_DIR || path.join(dataRoot, 'images');
  // 暴露 imagesDir 给顶层 lookupImageDir
  lookupImageDir._root = imagesDir;
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


  function lookupCategoryTemplate(categoryName, sceneName) {
    const excelPath = resolveCategoryExcel();
    if (!excelPath) return { workstation: '', workDetail: '' };
    let workbook;
    try { workbook = XLSX.readFile(excelPath, { cellDates: true }); } catch { return { workstation: '', workDetail: '' }; }
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    const header = rows[0] || [];
    const catIdx = header.findIndex(h => String(h || '').trim() === '一级分类');
    const nameIdx = header.findIndex(h => String(h || '').trim() === '业态中文');
    const wsIdx = header.findIndex(h => String(h || '').trim() === '工位');
    const wdIdx = header.findIndex(h => String(h || '').trim() === '工作内容');
    if (nameIdx < 0) return { workstation: '', workDetail: '' };
    const catWanted = String(categoryName || '').trim();
    const nameWanted = String(sceneName || '').trim();
    let best = null;
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r] || [];
      const rowCat = String(row[catIdx] || '').trim();
      const rowName = String(row[nameIdx] || '').trim();
      if (!rowName) continue;
      if (rowName === nameWanted && (rowCat === catWanted || !catWanted)) {
        best = { workstation: wsIdx >= 0 ? String(row[wsIdx] || '').trim() : '', workDetail: wdIdx >= 0 ? String(row[wdIdx] || '').trim() : '' };
        break;
      }
      if (!best && rowName === nameWanted) {
        best = { workstation: wsIdx >= 0 ? String(row[wsIdx] || '').trim() : '', workDetail: wdIdx >= 0 ? String(row[wdIdx] || '').trim() : '' };
      }
    }
    return best || { workstation: '', workDetail: '' };
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

  function reviewScene(sceneName, newStatus) {
    if (!sceneName || !newStatus) return { ok: false, reason: 'sceneName_and_status_required' };
    return reviewScenes([sceneName], newStatus);
  }

  function reviewScenes(sceneNames, newStatus) {
    if (!Array.isArray(sceneNames) || !sceneNames.length) return { ok: false, reason: 'sceneName_and_status_required' };
    if (!newStatus) return { ok: false, reason: 'status_required' };
    const statusMap = { approved: '已审核', rejected: '已驳回', pending_review: '待审核' };
    const targetStatus = statusMap[String(newStatus).toLowerCase()] || String(newStatus);
    const excelPath = resolveReportExcel();
    if (!excelPath) return { ok: false, reason: 'atlas_report_excel_missing' };
    const ts = new Date();
    const stamp = `${ts.getFullYear()}${String(ts.getMonth() + 1).padStart(2, '0')}${String(ts.getDate()).padStart(2, '0')}_${String(ts.getHours()).padStart(2, '0')}${String(ts.getMinutes()).padStart(2, '0')}${String(ts.getSeconds()).padStart(2, '0')}`;
    const backupFile = path.join(path.dirname(excelPath), `atlas_report.bak.${stamp}.xlsx`);
    try {
      fs.copyFileSync(excelPath, backupFile);
    } catch (err) {
      return { ok: false, reason: 'backup_failed', detail: String(err.message || err) };
    }
    const workbook = XLSX.readFile(excelPath, { cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    const header = rows[0] || [];
    const nameIdx = header.findIndex(h => String(h || '').trim() === '场景名称');
    const statusIdx = header.findIndex(h => String(h || '').trim() === '报备状态');
    const reportDateIdx = header.findIndex(h => String(h || '').trim() === '报备日期');
    let reviewHoursIdx = header.findIndex(h => String(h || '').trim() === '审核时长(H)');
    if (nameIdx < 0 || statusIdx < 0) return { ok: false, reason: 'header_missing' };
    if (reviewHoursIdx < 0) {
      header.push('审核时长(H)');
      const addr = XLSX.utils.encode_cell({ r: 0, c: header.length - 1 });
      sheet[addr] = '审核时长(H)';
      reviewHoursIdx = header.length - 1;
      const newRange = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
      newRange.e.c = Math.max(newRange.e.c, reviewHoursIdx);
      sheet['!ref'] = XLSX.utils.encode_range(newRange);
    }
    const targets = new Set(sceneNames.filter(Boolean));
    const now = new Date();
    let changed = 0;
    let hoursUpdated = 0;
    for (let r = 1; r < rows.length; r++) {
      const rowArr = rows[r] || [];
      const cellName = String(rowArr[nameIdx] || '').trim();
      if (!targets.has(cellName)) continue;
      const statusAddr = XLSX.utils.encode_cell({ r, c: statusIdx });
      sheet[statusAddr] = targetStatus;
      changed += 1;
      const reportDateVal = reportDateIdx >= 0 ? rowArr[reportDateIdx] : '';
      let hours = '';
      if (reportDateVal) {
        try {
          const dt = reportDateVal instanceof Date ? reportDateVal : new Date(reportDateVal);
          if (!isNaN(dt.getTime())) {
            const diffMs = now.getTime() - dt.getTime();
            hours = (diffMs / 3600000).toFixed(1);
            hoursUpdated += 1;
          }
        } catch {}
      }
      const hoursAddr = XLSX.utils.encode_cell({ r, c: reviewHoursIdx });
      sheet[hoursAddr] = hours;
    }
    if (changed === 0) return { ok: false, reason: 'scene_not_found', failed: Array.from(targets) };
    XLSX.writeFile(workbook, excelPath);
    return { ok: true, newStatus: targetStatus, changed, hoursUpdated, backup: path.basename(backupFile) };
  }

  function editScene(sceneName, sceneFields, recordEdits) {
    if (!sceneName) return { ok: false, reason: 'sceneName_required' };
    const sceneTargets = sceneFields || {};
    const recordTargets = recordEdits || {};
    if (Object.keys(sceneTargets).length === 0 && Object.keys(recordTargets).length === 0) {
      return { ok: false, reason: 'no_changes' };
    }
    const excelPath = resolveReportExcel();
    if (!excelPath) return { ok: false, reason: 'atlas_report_excel_missing' };
    const ts = new Date();
    const stamp = `${ts.getFullYear()}${String(ts.getMonth() + 1).padStart(2, '0')}${String(ts.getDate()).padStart(2, '0')}_${String(ts.getHours()).padStart(2, '0')}${String(ts.getMinutes()).padStart(2, '0')}${String(ts.getSeconds()).padStart(2, '0')}`;
    const backupFile = path.join(path.dirname(excelPath), `atlas_report.bak.${stamp}.xlsx`);
    try {
      fs.copyFileSync(excelPath, backupFile);
    } catch (err) {
      return { ok: false, reason: 'backup_failed', detail: String(err.message || err) };
    }
    const workbook = XLSX.readFile(excelPath, { cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const header = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })[0] || [];
    const colIdx = {};
    header.forEach((h, i) => { colIdx[String(h || '').trim()] = i; });
    const nameIdx = colIdx['\u573a\u666f\u540d\u79f0'];
    const idIdx = colIdx['\u62a5\u5907\u7f16\u53f7'];
    if (nameIdx === undefined) return { ok: false, reason: 'header_missing_name' };
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    let changed = 0;
    let cellsModified = 0;
    for (let r = 1; r < rows.length; r++) {
      const rowName = String((rows[r] || [])[nameIdx] || '').trim();
      const rowId = idIdx !== undefined ? String((rows[r] || [])[idIdx] || '').trim() : '';
      const matchByScene = rowName === sceneName;
      const matchByRecord = rowId && Object.prototype.hasOwnProperty.call(recordTargets, rowId);
      if (!matchByScene && !matchByRecord) continue;
      let rowChanged = false;
      if (matchByScene) {
        for (const [col, val] of Object.entries(sceneTargets)) {
          if (val === '' || val === null || val === undefined) continue;
          if (colIdx[col] === undefined) continue;
          const addr = XLSX.utils.encode_cell({ r, c: colIdx[col] });
          sheet[addr] = val;
          cellsModified += 1;
          rowChanged = true;
        }
      }
      if (matchByRecord) {
        const per = recordTargets[rowId] || {};
        for (const [col, val] of Object.entries(per)) {
          if (colIdx[col] === undefined) continue;
          const addr = XLSX.utils.encode_cell({ r, c: colIdx[col] });
          sheet[addr] = val;
          cellsModified += 1;
          rowChanged = true;
        }
      }
      if (rowChanged) changed += 1;
    }
    if (changed === 0) return { ok: false, reason: 'no_rows_matched' };
    XLSX.writeFile(workbook, excelPath);
    return { ok: true, sceneName, changed, cellsModified, backup: path.basename(backupFile) };
  }
  async function exportReport() {
    const excelPath = resolveReportExcel();
    if (!excelPath) return { ok: false, reason: 'atlas_report_excel_missing' };
    try {
      const archiver = require('archiver');
      const xlsxBuf = fs.readFileSync(excelPath);
      const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
      const filename = `atlas_export_${stamp}.zip`;
      const zip = archiver('zip', { zlib: { level: 9 } });
      const chunks = [];
      zip.on('data', c => chunks.push(c));
      const buf = await new Promise((resolve, reject) => {
        zip.on('end', () => resolve(Buffer.concat(chunks)));
        zip.on('error', reject);
        zip.append(xlsxBuf, { name: 'atlas_report.xlsx' });
        if (fs.existsSync(imagesDir)) {
          zip.directory(imagesDir, 'images');
        }
        zip.finalize();
      });
      return { ok: true, filename, buffer: buf };
    } catch (err) {
      return { ok: false, reason: 'export_failed', detail: String(err.message || err) };
    }
  }

  function importReport(zipBuffer) {
    if (!zipBuffer || !Buffer.isBuffer(zipBuffer)) return { ok: false, reason: 'file_required' };
    let AdmZip;
    try { AdmZip = require('adm-zip'); } catch (e) { return { ok: false, reason: 'adm-zip_missing' }; }
    let zipObj;
    try { zipObj = new AdmZip(zipBuffer); } catch (err) { return { ok: false, reason: 'invalid_zip', detail: String(err.message || err) }; }
    const entries = zipObj.getEntries();
    if (!entries.length) return { ok: false, reason: 'empty_zip' };
    const xlsxEntries = entries.filter(e => !e.isDirectory && /\.xlsx?$/i.test(e.entryName));
    if (!xlsxEntries.length) return { ok: false, reason: 'no_xlsx_in_zip' };
    const xlsxEntry = xlsxEntries[0];
    const ts = new Date();
    const stamp = `${ts.getFullYear()}${String(ts.getMonth() + 1).padStart(2, '0')}${String(ts.getDate()).padStart(2, '0')}_${String(ts.getHours()).padStart(2, '0')}${String(ts.getMinutes()).padStart(2, '0')}${String(ts.getSeconds()).padStart(2, '0')}`;
    const excelPath = resolveReportExcel();
    if (!excelPath) return { ok: false, reason: 'atlas_report_excel_missing' };
    const backupFile = path.join(path.dirname(excelPath), `atlas_report.bak.${stamp}.xlsx`);
    try {
      fs.copyFileSync(excelPath, backupFile);
    } catch (err) {
      return { ok: false, reason: 'backup_failed', detail: String(err.message || err) };
    }
    let workbook;
    try {
      workbook = XLSX.read(xlsxEntry.getData(), { cellDates: true });
    } catch (err) {
      return { ok: false, reason: 'invalid_xlsx', detail: String(err.message || err) };
    }
    if (!workbook.SheetNames.length) return { ok: false, reason: 'no_sheet' };
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const allRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    const header = allRows[0] || [];
    const idColIdx = header.findIndex(h => String(h || '').trim() === '报备编号');
    if (idColIdx < 0) return { ok: false, reason: 'header_missing_id_column' };
    const existWorkbook = XLSX.readFile(excelPath, { cellDates: true });
    const existSheet = existWorkbook.Sheets[existWorkbook.SheetNames[0]];
    let existRows = XLSX.utils.sheet_to_json(existSheet, { header: 1, defval: '' });
    const existHeader = existRows[0] || [];
    if (!existHeader.length) existRows = [header.slice()];
    while (existRows[0].length < header.length) existRows[0].push('');
    const existIdIdx = existHeader.findIndex(h => String(h || '').trim() === '报备编号');
    const existById = new Map();
    for (let r = 1; r < existRows.length; r++) {
      const id = String((existRows[r] || [])[existIdIdx] || '').trim();
      if (id) existById.set(id, r);
    }
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    const newRows = [header.slice()];
    for (let r = 1; r < allRows.length; r++) {
      const row = allRows[r] || [];
      const id = String(row[idColIdx] || '').trim();
      if (!id) { skipped += 1; continue; }
      const padded = row.slice();
      while (padded.length < header.length) padded.push('');
      if (existById.has(id)) {
        const rowIdx = existById.get(id);
        const existRow = existRows[rowIdx] || [];
        for (let c = 0; c < padded.length; c++) {
          const v = padded[c];
          if (v !== '' && v !== null && v !== undefined) {
            existRow[c] = v;
            const addr = XLSX.utils.encode_cell({ r: rowIdx, c });
            existSheet[addr] = v;
          }
        }
        existRows[rowIdx] = existRow;
        updated += 1;
      } else {
        const targetRowIdx = existRows.length;
        const existRow = padded.slice();
        for (let c = 0; c < existRow.length; c++) {
          const addr = XLSX.utils.encode_cell({ r: targetRowIdx, c });
          existSheet[addr] = existRow[c];
        }
        existRows.push(existRow);
        existById.set(id, targetRowIdx);
        inserted += 1;
      }
    }
    const maxCols = Math.max(existHeader.length, header.length);
    const range = XLSX.utils.decode_range(existSheet['!ref'] || 'A1');
    range.e.c = Math.max(range.e.c, maxCols - 1);
    existSheet['!ref'] = XLSX.utils.encode_range(range);
    XLSX.writeFile(existWorkbook, excelPath);
    const backupDir = path.join(path.dirname(imagesDir), `images.bak.${stamp}`);
    let imgBackup = '';
    let imgExtracted = 0;
    let imgSkipped = 0;
    const imgFailed = [];
    try {
      if (fs.existsSync(imagesDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
        for (const name of fs.readdirSync(imagesDir)) {
          const src = path.join(imagesDir, name);
          const dst = path.join(backupDir, name);
          try {
            const stat = fs.lstatSync(src);
            if (stat.isSymbolicLink() || stat.isFile()) fs.copyFileSync(src, dst);
            else if (stat.isDirectory()) copyDirShallow(src, dst);
          } catch (innerErr) {
            console.warn(`[atlas] backup skip ${name}: ${innerErr.message}`);
          }
        }
        imgBackup = path.basename(backupDir);
      } else {
        fs.mkdirSync(imagesDir, { recursive: true });
      }
    } catch (err) {
      return { ok: false, reason: 'image_backup_failed', detail: String(err.message || err), inserted, updated, xlsxBackup: path.basename(backupFile) };
    }
    for (const entry of entries) {
      if (entry.isDirectory) continue;
      if (/\.xlsx?$/i.test(entry.entryName)) continue;
      const rawName = entry.entryName;
      const safeName = rawName.replace(/\\/g, '/');
      if (safeName.includes('..') || path.isAbsolute(safeName)) { imgSkipped += 1; continue; }
      const target = path.join(imagesDir, safeName);
      try {
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, entry.getData());
        imgExtracted += 1;
      } catch (innerErr) {
        imgFailed.push({ name: rawName, err: String(innerErr.message || innerErr) });
      }
    }
    return {
      ok: true,
      inserted,
      updated,
      skipped,
      imagesExtracted: imgExtracted,
      imagesSkipped: imgSkipped,
      imagesFailed: imgFailed.length,
      failedList: imgFailed.slice(0, 10),
      xlsxBackup: path.basename(backupFile),
      imageBackup: imgBackup,
    };
  }

  function copyDirShallow(srcDir, dstDir) {
    fs.mkdirSync(dstDir, { recursive: true });
    for (const item of fs.readdirSync(srcDir)) {
      const s = path.join(srcDir, item);
      const d = path.join(dstDir, item);
      try {
        const stat = fs.lstatSync(s);
        if (stat.isSymbolicLink() || stat.isFile()) fs.copyFileSync(s, d);
        else if (stat.isDirectory()) copyDirShallow(s, d);
      } catch (innerErr) {
        console.warn(`[atlas] copy skip ${item}: ${innerErr.message}`);
      }
    }
  }

    function exportImages() {
    if (!fs.existsSync(imagesDir)) return { ok: false, reason: 'images_dir_missing' };
    try {
      const archiver = require('archiver');
      const zip = archiver('zip', { zlib: { level: 9 } });
      const chunks = [];
      zip.on('data', chunk => chunks.push(chunk));
      const done = new Promise((resolve, reject) => {
        zip.on('end', () => resolve(Buffer.concat(chunks)));
        zip.on('error', reject);
        zip.directory(imagesDir, 'images');
        zip.finalize();
      });
      return done.then(buf => ({ ok: true, filename: 'atlas_images.zip', buffer: buf }));
    } catch (err) {
      return Promise.resolve({ ok: false, reason: 'zip_failed', detail: String(err.message || err) });
    }
  }

  function importImages(zipBuffer) {
    if (!zipBuffer || !Buffer.isBuffer(zipBuffer)) return { ok: false, reason: 'file_required' };
    let AdmZip;
    try { AdmZip = require('adm-zip'); } catch (e) { return { ok: false, reason: 'adm-zip_missing' }; }
    let zipObj;
    try { zipObj = new AdmZip(zipBuffer); } catch (err) { return { ok: false, reason: 'unzip_failed', detail: String(err.message || err) }; }
    const entries = zipObj.getEntries();
    if (!entries.length) return { ok: false, reason: 'empty_zip' };
    const ts = new Date();
    const stamp = `${ts.getFullYear()}${String(ts.getMonth() + 1).padStart(2, '0')}${String(ts.getDate()).padStart(2, '0')}_${String(ts.getHours()).padStart(2, '0')}${String(ts.getMinutes()).padStart(2, '0')}${String(ts.getSeconds()).padStart(2, '0')}`;
    const backupDir = path.join(path.dirname(imagesDir), `images.bak.${stamp}`);
    try {
      if (fs.existsSync(imagesDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
        const topLevel = fs.readdirSync(imagesDir);
        for (const name of topLevel) {
          const src = path.join(imagesDir, name);
          const dst = path.join(backupDir, name);
          try {
            const stat = fs.lstatSync(src);
            if (stat.isSymbolicLink() || stat.isFile()) {
              fs.copyFileSync(src, dst);
            } else if (stat.isDirectory()) {
              copyDirShallow(src, dst);
            }
          } catch (innerErr) {
            console.warn(`[atlas] backup skip ${name}: ${innerErr.message}`);
          }
        }
      } else {
        fs.mkdirSync(imagesDir, { recursive: true });
      }
    } catch (err) {
      return { ok: false, reason: 'backup_failed', detail: String(err.message || err) };
    }
    let count = 0;
    let skipped = 0;
    const failed = [];
    try {
      for (const entry of entries) {
        if (entry.isDirectory) continue;
        const rawName = entry.entryName;
        const safeName = rawName.replace(/\\/g, '/');
        if (safeName.includes('..') || path.isAbsolute(safeName)) { skipped += 1; continue; }
        const target = path.join(imagesDir, safeName);
        try {
          fs.mkdirSync(path.dirname(target), { recursive: true });
          const data = entry.getData();
          fs.writeFileSync(target, data);
          count += 1;
        } catch (innerErr) {
          failed.push({ name: rawName, err: String(innerErr.message || innerErr) });
        }
      }
    } catch (err) {
      return { ok: false, reason: 'unzip_failed', detail: String(err.message || err), extracted: count, failed: failed.length };
    }
    return { ok: true, extracted: count, skipped, failed: failed.length, failedList: failed.slice(0, 10), backup: path.basename(backupDir) };
  }

  function copyDirShallow(srcDir, dstDir) {
    fs.mkdirSync(dstDir, { recursive: true });
    for (const item of fs.readdirSync(srcDir)) {
      const s = path.join(srcDir, item);
      const d = path.join(dstDir, item);
      try {
        const stat = fs.lstatSync(s);
        if (stat.isSymbolicLink() || stat.isFile()) {
          fs.copyFileSync(s, d);
        } else if (stat.isDirectory()) {
          copyDirShallow(s, d);
        }
      } catch (innerErr) {
        console.warn(`[atlas] copy skip ${item}: ${innerErr.message}`);
      }
    }
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
    lookupCategoryTemplate,
    getOutput,
    generate,
    setRecordEdit,
    setSceneEdit,
    clearEdits,
    reviewScene,
    reviewScenes,
    editScene,
    exportReport,
    importReport,
    exportImages,
    importImages,
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
  // 处理合并列 "一级分类/细分业态" → 拆分为 category + subcategory
  const mergedCategoryField = String(raw['\u4e00\u7ea7\u5206\u7c7b/\u7ec6\u5206\u4e1a\u6001'] || '').trim();
  if (mergedCategoryField && mergedCategoryField.includes('/')) {
    const parts = mergedCategoryField.split('/').map(p => p.trim());
    if (parts.length >= 2) {
      record.category = parts[0];
      const subRaw = String(raw['\u7ec6\u5206\u4e1a\u6001'] || '').trim();
      if (!subRaw) {
        record.subcategory = parts.slice(1).join('/');
      }
    }
  }
  record.reportId = String(record.reportId || `atlas-row-${index + 1}`).trim();
  record.sceneName = String(record.sceneName || '').trim();
  record.imageList = splitList(record.images);
  record.imageDir = lookupImageDir(record.reportId);
  record.workstationCount = Number(record.workstationCount || 0);
  record.imageCount = Number(record.imageCount || record.imageList.length || 0);
  return record;
}

function lookupImageDir(reportId) {
  if (!reportId) return '';
  // 从 imagesDir（被 createAtlasWorkbench 闭包设置）查找
  const root = lookupImageDir._root || '';
  if (!root || !fs.existsSync(root)) return '';
  try {
    const entries = root && fs.existsSync(root) ? fs.readdirSync(root) : [];
    // 匹配：完全相等 / reportId 前缀 / 目录名包含 reportId（如 BP-0001_BP-0003_xxx 包含 BP-0003）
    const match = entries.find(name =>
        name === reportId ||
        name.startsWith(`${reportId}_`) ||
        name.startsWith(`${reportId}-`) ||
        name.includes(`_${reportId}_`) ||
        name.includes(`-${reportId}-`)
    );
    return match ? `/static/atlas-images/${match}` : '';
  } catch {
    return '';
  }
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
