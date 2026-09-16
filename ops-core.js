(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.OpsCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function normalizeText(value) {
    return String(value || '').trim().toLowerCase();
  }

  function calculateCooperationMonths(startDate, today) {
    if (!startDate) return 0;
    const start = new Date(startDate + 'T00:00:00');
    const end = today ? new Date(today) : new Date();
    if (Number.isNaN(start.getTime()) || start > end) return 0;

    let months = (end.getFullYear() - start.getFullYear()) * 12;
    months += end.getMonth() - start.getMonth();
    if (end.getDate() < start.getDate()) months -= 1;
    return Math.max(0, months);
  }

  function buildStats(staff, today) {
    const list = Array.isArray(staff) ? staff : [];
    const cooperationMonths = list.map(item => calculateCooperationMonths(item.cooperationStart, today));
    const totalMonths = cooperationMonths.reduce((sum, value) => sum + value, 0);

    return {
      totalStaff: list.length,
      activeStaff: list.filter(item => item.status !== 'inactive').length,
      visitedStores: list.reduce((sum, item) => sum + Number(item.visitedStores || 0), 0),
      signedStores: list.reduce((sum, item) => sum + Number(item.signedStores || 0), 0),
      averageCooperationMonths: list.length ? Math.round(totalMonths / list.length) : 0,
    };
  }

  function calculateDurationHours(startTime, endTime) {
    if (!startTime || !endTime) return 0;
    const startParts = String(startTime).split(':').map(Number);
    const endParts = String(endTime).split(':').map(Number);
    if (startParts.length < 2 || endParts.length < 2) return 0;
    const startMinutes = startParts[0] * 60 + startParts[1];
    const endMinutes = endParts[0] * 60 + endParts[1];
    if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes) || endMinutes <= startMinutes) return 0;
    return Math.round(((endMinutes - startMinutes) / 60) * 100) / 100;
  }

  function calculateCollectorSettlement(record) {
    const hours = calculateDurationHours(record && record.startTime, record && record.endTime);
    const rate = Number(record && record.hourlyRate || 0);
    return Math.round(hours * rate * 100) / 100;
  }

  function buildCollectionStats(records) {
    const list = Array.isArray(records) ? records : [];
    const totalHours = list.reduce((sum, item) => {
      return sum + calculateDurationHours(item.startTime, item.endTime);
    }, 0);
    const totalSettlement = list.reduce((sum, item) => {
      return sum + calculateCollectorSettlement(item);
    }, 0);

    return {
      totalCollectors: list.length,
      totalHours: Math.round(totalHours * 100) / 100,
      totalSettlement: Math.round(totalSettlement * 100) / 100,
    };
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let cell = '';
    let inQuotes = false;
    const input = String(text || '').replace(/^\uFEFF/, '');

    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      const next = input[i + 1];
      if (char === '"' && inQuotes && next === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(cell);
        cell = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && next === '\n') i++;
        row.push(cell);
        if (row.some(value => String(value).trim() !== '')) rows.push(row);
        row = [];
        cell = '';
      } else {
        cell += char;
      }
    }

    row.push(cell);
    if (row.some(value => String(value).trim() !== '')) rows.push(row);
    if (rows.length === 0) return [];

    const headers = rows[0].map(value => String(value || '').trim());
    return rows.slice(1).map(values => {
      const record = {};
      headers.forEach((header, index) => {
        record[header] = values[index] === undefined ? '' : values[index].trim();
      });
      return record;
    });
  }

  function mapCsvRowsToRecords(rows, fields, idPrefix) {
    const fieldList = Array.isArray(fields) ? fields : [];
    const prefix = idPrefix || 'import';
    return (Array.isArray(rows) ? rows : []).map((row, index) => {
      const record = { id: `${prefix}-${index + 1}` };
      fieldList.forEach(field => {
        const raw = row[field.name] !== undefined ? row[field.name] : row[field.label];
        record[field.name] = field.type === 'number' ? Number(raw || 0) : String(raw || '').trim();
      });
      return record;
    });
  }

  function clampMapPoint(point) {
    const x = Number(point && point.x);
    const y = Number(point && point.y);
    return {
      x: Math.max(0, Math.min(100, Number.isFinite(x) ? x : 50)),
      y: Math.max(0, Math.min(100, Number.isFinite(y) ? y : 50)),
    };
  }

  function buildStoreMapStats(records) {
    const list = Array.isArray(records) ? records : [];
    return {
      totalStores: list.length,
      activeStores: list.filter(item => item.status === 'active').length,
      settledStores: list.filter(item => item.settlementStatus === 'settled').length,
      unsettledStores: list.filter(item => item.settlementStatus === 'unsettled').length,
    };
  }

  function calculatePartnerFinance(record) {
    const approved = Number(record && record.approvedHours);
    const confirmed = Number(record && record.confirmedHours || 0);
    const hours = Number.isFinite(approved) && approved > 0 ? approved : confirmed;
    const income = hours * Number(record && record.maxPrice || 0);
    const payable = hours * Number(record && record.partnerRate || 0);
    return {
      hours: Math.round(hours * 100) / 100,
      income: Math.round(income * 100) / 100,
      payable: Math.round(payable * 100) / 100,
      profit: Math.round((income - payable) * 100) / 100,
    };
  }

  function buildIssueStats(records, today) {
    const list = Array.isArray(records) ? records : [];
    const current = today ? new Date(today) : new Date();
    current.setHours(0, 0, 0, 0);
    return {
      totalIssues: list.length,
      unresolvedIssues: list.filter(item => item.status !== 'resolved').length,
      highPriorityIssues: list.filter(item => item.priority === 'high').length,
      overdueIssues: list.filter(item => {
        if (!item.dueDate || item.status === 'resolved') return false;
        const due = new Date(item.dueDate + 'T00:00:00');
        return !Number.isNaN(due.getTime()) && due < current;
      }).length,
    };
  }

  function buildBusinessStats(records) {
    const list = Array.isArray(records) ? records : [];
    return {
      totalBusiness: list.length,
      activeBusiness: list.filter(item => ['lead', 'contacted', 'negotiating'].includes(item.stage)).length,
      wonBusiness: list.filter(item => item.stage === 'won').length,
      expectedAmount: list.reduce((sum, item) => sum + Number(item.expectedAmount || 0), 0),
      dealAmount: list.reduce((sum, item) => sum + Number(item.dealAmount || 0), 0),
    };
  }

  function filterStaff(staff, filters) {
    const list = Array.isArray(staff) ? staff : [];
    const status = filters && filters.status ? filters.status : 'all';
    const query = normalizeText(filters && filters.query);

    return list.filter(item => {
      const matchesStatus = status === 'all' || item.status === status;
      const haystack = [
        item.name,
        item.phone,
        item.area,
        item.role,
        item.notes,
      ].map(normalizeText).join(' ');
      return matchesStatus && (!query || haystack.includes(query));
    });
  }

  return {
    calculateCooperationMonths,
    calculateDurationHours,
    calculateCollectorSettlement,
    parseCsv,
    mapCsvRowsToRecords,
    clampMapPoint,
    buildStoreMapStats,
    calculatePartnerFinance,
    buildIssueStats,
    buildBusinessStats,
    buildStats,
    buildCollectionStats,
    filterStaff,
  };
});
