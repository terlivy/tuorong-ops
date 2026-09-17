const form = document.querySelector('#atlasReportForm');
const panels = [...document.querySelectorAll('.form-step')];
const stepButtons = [...document.querySelectorAll('.step-button')];
const categorySelect = document.querySelector('#categorySelect');
const subcategorySelect = document.querySelector('#subcategorySelect');
const subcategoryEn = document.querySelector('#subcategoryEn');
const formError = document.querySelector('#formError');
const prevBtn = document.querySelector('#prevBtn');
const nextBtn = document.querySelector('#nextBtn');
const submitBtn = document.querySelector('#submitBtn');
const locateBtn = document.querySelector('#locateBtn');
const longitudeInput = document.querySelector('#longitudeInput');
const latitudeInput = document.querySelector('#latitudeInput');
const locationAccuracyInput = document.querySelector('#locationAccuracyInput');
const photoInput = document.querySelector('#photoInput');
const photoList = document.querySelector('#photoList');
const scanDeviceBtn = document.querySelector('#scanDeviceBtn');
const deviceBarcodeInput = document.querySelector('#deviceBarcodeInput');
const sdCardCodeInput = document.querySelector('#sdCardCodeInput');
const bindingTuplePreview = document.querySelector('#bindingTuplePreview');
const successCard = document.querySelector('#successCard');
const successTitle = document.querySelector('#successTitle');
const successTuple = document.querySelector('#successTuple');
const newReportBtn = document.querySelector('#newReportBtn');

const state = {
  step: 0,
  categories: [],
};

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (response.status === 401) {
    window.location.href = '/';
    throw new Error('unauthorized');
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'request_failed');
  return body;
}

async function boot() {
  await loadCategories();
  await loadReportStats();
  fillSdCardCode();
  renderStep();
}

async function loadCategories() {
  const result = await api('/api/atlas/categories');
  state.categories = result.categories || [];
  document.querySelector('#categoryMeta').textContent = `${state.categories.length} 大类 / ${result.subcategoryCount || 0} 子类目`;
  categorySelect.innerHTML = state.categories.map(category => `<option value="${escapeHtml(category.key)}">${escapeHtml(category.name)}</option>`).join('');
  renderSubcategories();
}

async function loadReportStats() {
  const result = await api('/api/atlas/reports');
  const reports = result.reports || [];
  const today = new Date().toISOString().slice(0, 10);
  document.querySelector('#todayCount').textContent = reports.filter(report => String(report.createdAt || '').startsWith(today)).length;
  document.querySelector('#pendingCount').textContent = reports.filter(report => report.status === 'pending_review').length;
}

function renderSubcategories() {
  const category = state.categories.find(item => item.key === categorySelect.value) || state.categories[0];
  const children = category?.children || [];
  subcategorySelect.innerHTML = children.map(child => `<option value="${escapeHtml(child.key)}">${escapeHtml(child.name)}</option>`).join('');
  renderSubcategoryEn();
}

function renderSubcategoryEn() {
  const category = state.categories.find(item => item.key === categorySelect.value);
  const child = category?.children.find(item => item.key === subcategorySelect.value);
  subcategoryEn.textContent = child ? `${child.en} / ${child.name}` : '-';
}

function renderStep() {
  panels.forEach((panel, index) => panel.classList.toggle('active', index === state.step));
  stepButtons.forEach((button, index) => button.classList.toggle('active', index === state.step));
  prevBtn.hidden = state.step === 0;
  nextBtn.hidden = state.step === panels.length - 1;
  submitBtn.hidden = state.step !== panels.length - 1;
  formError.textContent = '';
  updateBindingPreview();
}

function goToStep(nextStep) {
  if (nextStep > state.step && !validateCurrentStep()) return;
  state.step = Math.max(0, Math.min(panels.length - 1, nextStep));
  renderStep();
}

function validateCurrentStep() {
  const required = [...panels[state.step].querySelectorAll('[required]')];
  const empty = required.find(input => !String(input.value || '').trim());
  if (empty) {
    formError.textContent = '请补全当前步骤的必填信息';
    empty.focus();
    return false;
  }
  if (state.step === 1 && !validSceneName(form.sceneName.value)) {
    formError.textContent = '场景中文名需为 2-30 字，且不能为纯数字';
    form.sceneName.focus();
    return false;
  }
  if (state.step === 2 && !/^1\d{10}$/.test(form.phone.value.trim())) {
    formError.textContent = '请输入 11 位手机号';
    form.phone.focus();
    return false;
  }
  return true;
}

function validSceneName(value) {
  const text = String(value || '').trim();
  return text.length >= 2 && text.length <= 30 && !/^\d+$/.test(text);
}

function fillSdCardCode() {
  const now = new Date();
  const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
  sdCardCodeInput.value = `SD-${ymd}-ATL-${String(now.getTime()).slice(-3)}`;
}

function updateBindingPreview() {
  const device = deviceBarcodeInput.value.trim() || '设备编号';
  const scene = form.sceneName.value.trim() || '场景';
  bindingTuplePreview.textContent = `当前账号-${device}-${scene}-${new Date().toISOString().slice(0, 10)}`;
}

function selectedPhotoNames() {
  return [...(photoInput.files || [])].slice(0, 5).map(file => file.name);
}

function renderPhotoList() {
  const names = selectedPhotoNames();
  photoList.textContent = names.length ? names.join('、') : '未选择照片';
}

function locate() {
  if (!navigator.geolocation) {
    formError.textContent = '当前浏览器不支持定位，请手动填写经纬度';
    return;
  }
  locateBtn.disabled = true;
  locateBtn.textContent = '定位中';
  navigator.geolocation.getCurrentPosition(position => {
    longitudeInput.value = position.coords.longitude.toFixed(6);
    latitudeInput.value = position.coords.latitude.toFixed(6);
    locationAccuracyInput.value = Math.round(position.coords.accuracy || 0);
    locateBtn.disabled = false;
    locateBtn.textContent = '重新定位';
  }, () => {
    formError.textContent = '定位失败，请手动填写经纬度';
    locateBtn.disabled = false;
    locateBtn.textContent = '获取当前位置';
  }, { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 });
}

function scanDevice() {
  const value = window.prompt('请输入或粘贴设备条形码');
  if (!value) return;
  deviceBarcodeInput.value = value.trim();
  updateBindingPreview();
}

function payloadFromForm() {
  const data = Object.fromEntries(new FormData(form).entries());
  return {
    ...data,
    longitude: Number(data.longitude),
    latitude: Number(data.latitude),
    locationAccuracy: Number(data.locationAccuracy || 0),
    photos: selectedPhotoNames(),
  };
}

async function submitReport(event) {
  event.preventDefault();
  if (!validateCurrentStep()) return;
  submitBtn.disabled = true;
  submitBtn.textContent = '提交中';
  try {
    const result = await api('/api/atlas/reports', {
      method: 'POST',
      body: JSON.stringify(payloadFromForm()),
    });
    form.hidden = true;
    successCard.hidden = false;
    successTitle.textContent = result.report.sceneName;
    successTuple.textContent = result.report.bindingTuple;
    await loadReportStats();
  } catch (error) {
    formError.textContent = error.message === 'invalid_atlas_report' ? '报备信息未通过校验' : '提交失败，请稍后重试';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '提交报备';
  }
}

function resetReport() {
  form.reset();
  fillSdCardCode();
  renderSubcategories();
  renderPhotoList();
  state.step = 0;
  form.hidden = false;
  successCard.hidden = true;
  renderStep();
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

categorySelect.addEventListener('change', renderSubcategories);
subcategorySelect.addEventListener('change', renderSubcategoryEn);
prevBtn.addEventListener('click', () => goToStep(state.step - 1));
nextBtn.addEventListener('click', () => goToStep(state.step + 1));
stepButtons.forEach(button => button.addEventListener('click', () => goToStep(Number(button.dataset.step))));
locateBtn.addEventListener('click', locate);
scanDeviceBtn.addEventListener('click', scanDevice);
photoInput.addEventListener('change', renderPhotoList);
form.sceneName.addEventListener('input', updateBindingPreview);
deviceBarcodeInput.addEventListener('input', updateBindingPreview);
form.addEventListener('submit', submitReport);
newReportBtn.addEventListener('click', resetReport);

boot().catch(error => {
  formError.textContent = error.message === 'unauthorized' ? '' : '页面初始化失败';
});
