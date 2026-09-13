const fmt = new Intl.NumberFormat('ko-KR', {maximumFractionDigits: 1});

const materials = [
  {name:'레디믹스 콘크리트', quantity:'120 m³', cost:14880000, carbon:38400, status:'계산 완료'},
  {name:'철근', quantity:'18 t', cost:17640000, carbon:37800, status:'계산 완료'},
  {name:'구조용 강재', quantity:'4 t', cost:6120000, carbon:8400, status:'계산 완료'},
  {name:'석고보드', quantity:'340 m²', cost:3910000, carbon:1428, status:'계산 완료'},
  {name:'단열재', quantity:'80 m', cost:null, carbon:null, status:'검토 필요'}
];

const scenarios = [
  {name:'기준안', cost:52550000, carbon:86028, costChange:0, carbonChange:0, note:'현재 물량내역서 기준'},
  {name:'비용 우선안', cost:48700000, carbon:82400, costChange:-7.3, carbonChange:-4.2, note:'비용 절감 중심'},
  {name:'균형안', cost:50100000, carbon:73100, costChange:-4.7, carbonChange:-15.0, note:'비용·탄소 동시 개선', recommended:true}
];

const titles = {dashboard:'프로젝트 대시보드',materials:'자재 분석',scenarios:'대안 비교',method:'산정 방법'};
document.querySelectorAll('.nav').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.nav,.view').forEach(node => node.classList.remove('active'));
  button.classList.add('active');
  document.getElementById(button.dataset.view).classList.add('active');
  document.getElementById('view-title').textContent = titles[button.dataset.view];
}));

function renderDemo(){
  const calculated = materials.filter(item => item.carbon !== null);
  const total = calculated.reduce((sum,item) => sum + item.carbon, 0);
  const budget = 100000;
  document.getElementById('total-carbon').textContent = fmt.format(total);
  document.getElementById('carbon-budget').textContent = fmt.format(budget);
  document.getElementById('review-count').textContent = materials.length - calculated.length;
  document.getElementById('budget-percent').textContent = `${fmt.format(total / budget * 100)}%`;
  const max = Math.max(...calculated.map(item => item.carbon));
  document.getElementById('hotspots').innerHTML = calculated.map(item => `<div class="hotspot"><span>${item.name}</span><i><em style="width:${item.carbon/max*100}%"></em></i><strong>${fmt.format(item.carbon)}</strong></div>`).join('');
  document.getElementById('material-rows').innerHTML = materials.map(item => `<tr><td>${item.name}</td><td>${item.quantity}</td><td>${item.cost===null?'—':fmt.format(item.cost)+'원'}</td><td>${item.carbon===null?'—':fmt.format(item.carbon)+' kgCO₂e'}</td><td><b class="status ${item.carbon===null?'review':''}">${item.status}</b></td></tr>`).join('');
}

document.getElementById('scenario-cards').innerHTML = scenarios.map(item => `<article class="scenario ${item.recommended?'recommended':''}">${item.recommended?'<span class="badge">추천 예시</span>':''}<h3>${item.name}</h3><dl><dt>예상 자재비</dt><dd>${fmt.format(item.cost)}원</dd><dt>탄소배출량</dt><dd>${fmt.format(item.carbon)} kgCO₂e</dd><dt>비용 변화</dt><dd>${item.costChange}%</dd><dt>탄소 변화</dt><dd>${item.carbonChange}%</dd></dl><footer>${item.note}</footer></article>`).join('');
document.getElementById('run-demo').addEventListener('click', renderDemo);
