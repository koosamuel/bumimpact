const fmt = new Intl.NumberFormat('ko-KR', {maximumFractionDigits: 1});
const REQUEST_TIMEOUT_MS = 10000;
const HEALTH_RETRY_DELAYS_MS = [0, 400, 1000];
let apiBase = '';
let demoData = null;
let connectionMode = 'checking';

const titles = {dashboard:'프로젝트 대시보드',materials:'자재 분석',scenarios:'대안 비교',method:'산정 방법'};
document.querySelectorAll('.nav').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.nav,.view').forEach(node => node.classList.remove('active'));
  button.classList.add('active');
  document.getElementById(button.dataset.view).classList.add('active');
  document.getElementById('view-title').textContent = titles[button.dataset.view];
}));

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {...options, signal: controller.signal});
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      const error = new Error(payload.detail || `HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return await response.json();
  } finally { clearTimeout(timer); }
}

function wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function fetchHealth(url) {
  let lastError;
  for (const delay of HEALTH_RETRY_DELAYS_MS) {
    if (delay) await wait(delay);
    try { return await fetchJson(url); }
    catch (error) { lastError = error; }
  }
  throw lastError;
}

function showLiveError(error) {
  const status = error && error.status;
  const message = status === 429
    ? '요청이 많습니다. 잠시 후 다시 시도해 주세요.'
    : status === 503
      ? '다른 계산을 처리 중입니다. 잠시 후 다시 시도해 주세요.'
      : status === 504
        ? '계산 제한시간을 초과했습니다.'
        : 'Mac 계산 서버와 통신하지 못했습니다. 기존 결과는 유지됩니다.';
  document.getElementById('mode-notice').innerHTML = `<strong>API 오류</strong> ${message}`;
}

function setMode(mode) {
  connectionMode = mode;
  document.getElementById('connection-mode').textContent = mode === 'live' ? '실제 계산 엔진 연결' : '정적 데모 모드';
  document.getElementById('mode-notice').innerHTML = mode === 'live'
    ? '<strong>실제 계산 모드</strong> 본 화면은 공개·예시 데이터를 활용한 시범 분석 결과입니다.'
    : '<strong>백엔드 미연결</strong> 본 화면은 공개·예시 데이터를 활용한 시범 분석 결과입니다.';
}

function renderMaterials(materials) {
  const calculated = materials.filter(item => item.carbon !== null);
  document.getElementById('material-rows').innerHTML = materials.map(item => `<tr><td>${item.name}</td><td>${item.quantity}</td><td>${item.cost===null?'—':fmt.format(item.cost)+'원'}</td><td>${item.carbon===null?'—':fmt.format(item.carbon)+' kgCO₂e'}</td><td><b class="status ${item.carbon===null?'review':''}">${item.status}</b></td></tr>`).join('');
  const max = Math.max(...calculated.map(item => item.carbon), 1);
  document.getElementById('hotspots').innerHTML = calculated.map(item => `<div class="hotspot"><span>${item.name}</span><i><em style="width:${item.carbon/max*100}%"></em></i><strong>${fmt.format(item.carbon)}</strong></div>`).join('');
}

function renderScenarios(items) {
  document.getElementById('scenario-cards').innerHTML = items.map(item => `<article class="scenario ${item.recommended?'recommended':''}">${item.recommended?'<span class="badge">추천 예시</span>':''}<h3>${item.name}</h3><dl><dt>예상 자재비</dt><dd>${fmt.format(item.cost)}원</dd><dt>탄소배출량</dt><dd>${fmt.format(item.carbon)} kgCO₂e</dd><dt>비용 변화</dt><dd>${item.costChange}%</dd><dt>탄소 변화</dt><dd>${item.carbonChange}%</dd></dl><footer>${item.note}</footer></article>`).join('');
}

function renderStatic(data) {
  const calculated = data.materials.filter(item => item.carbon !== null);
  const total = calculated.reduce((sum,item) => sum + item.carbon, 0);
  document.getElementById('total-carbon').textContent = fmt.format(total);
  document.getElementById('carbon-budget').textContent = fmt.format(data.budgetKg);
  document.getElementById('review-count').textContent = data.materials.length - calculated.length;
  document.getElementById('budget-percent').textContent = `${fmt.format(total/data.budgetKg*100)}%`;
  renderMaterials(data.materials);
  renderScenarios(data.scenarios);
}

function liveRowsToMaterials(result) {
  return result.rows.map(row => ({name:row.normalized_name||row.item_name,quantity:`${fmt.format(row.quantity)} ${row.unit}`,cost:null,carbon:row.emission_kgco2e,status:row.status==='calculated'?'계산 완료':'검토 필요'}));
}

async function runDemo() {
  const button = document.getElementById('run-demo');
  button.disabled = true;
  button.textContent = connectionMode === 'live' ? 'Mac에서 계산 중…' : '시범 분석 중…';
  try {
    if (connectionMode === 'live') {
      const result = await fetchJson(`${apiBase}/api/public/demo`, {method:'POST'});
      document.getElementById('total-carbon').textContent = fmt.format(result.total_kg);
      document.getElementById('carbon-budget').textContent = fmt.format(result.budget_kg);
      document.getElementById('review-count').textContent = result.review_count;
      document.getElementById('budget-percent').textContent = `${fmt.format(result.total_kg/result.budget_kg*100)}%`;
      renderMaterials(liveRowsToMaterials(result));
      renderScenarios(demoData.scenarios);
    } else renderStatic(demoData);
  } catch (error) {
    if (connectionMode === 'live') showLiveError(error);
    else renderStatic(demoData);
  } finally {
    button.disabled = false;
    button.textContent = '시범 분석 실행';
  }
}

async function initialize() {
  demoData = await fetchJson('data/demo.json');
  renderScenarios(demoData.scenarios);
  try {
    const config = await fetchJson(`data/api-config.json?ts=${Date.now()}`, {cache:'no-store'});
    apiBase = (config.apiBase || '').replace(/\/$/, '');
    if (!apiBase) throw new Error('API not configured');
    const apiUrl = new URL(apiBase);
    if (apiUrl.protocol !== 'https:' || apiUrl.username || apiUrl.password || apiUrl.pathname !== '/' || apiUrl.search || apiUrl.hash) {
      throw new Error('Unsafe API URL');
    }
    const health = await fetchHealth(`${apiBase}/api/public/health`);
    if (health.status !== 'ok' || health.data_classification !== 'demo_synthetic') throw new Error('Unsafe API response');
    setMode('live');
  } catch (error) { setMode('static'); }
}

document.getElementById('run-demo').addEventListener('click', runDemo);
initialize().catch(() => setMode('static'));
