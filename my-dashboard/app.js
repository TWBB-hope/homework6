// 自主实践：校园自习室数据看板
const state = {
  data: null,       // 完整数据
  building: '全部'  // 当前筛选的楼栋
};
let barChart = null;
let usageChart = null;

// 数据加载：加载中 / HTTP失败 / 解析失败 / 空数据 / 成功 五种情况统一处理
const loadData = async () => {
  $('#status').text('加载中...').show();
  try {
    const response = await fetch('data/studyrooms.json');
    if (!response.ok) {
      throw new Error('HTTP ' + response.status);
    }
    const data = await response.json();
    if (data.rooms.length === 0) {
      $('#status').text('暂无数据').show();
      return;
    }
    state.data = data;
    $('#status').hide();
    render();
  } catch (error) {
    $('#status').text('加载失败：' + error.message).show();
  }
};

// 根据当前筛选条件聚合出楼栋级数据，再统一重绘所有区块
const render = () => {
  const rooms = state.data.rooms.filter(r =>
    state.building === '全部' || r.building === state.building
  );
  renderCards(rooms);
  renderTable(rooms);
  renderBarChart(rooms);
  renderUsageChart(rooms);
};

const renderCards = (rooms) => {
  const totalSeats = rooms.reduce((s, r) => s + r.seats, 0);
  const occupied = rooms.reduce((s, r) => s + r.occupied, 0);
  const openRooms = rooms.filter(r => r.status === '开放').length;
  $('#cards').empty().append(`
    <div class="col-md-3"><div class="card text-center"><div class="card-body">
      <h3 class="card-title h6">自习室总数</h3><p class="card-text fs-4">${rooms.length}</p>
      <p class="card-text small text-muted">间（开放 ${openRooms} 间）</p>
    </div></div></div>
    <div class="col-md-3"><div class="card text-center"><div class="card-body">
      <h3 class="card-title h6">总座位数</h3><p class="card-text fs-4">${totalSeats}</p>
      <p class="card-text small text-muted">个</p>
    </div></div></div>
    <div class="col-md-3"><div class="card text-center"><div class="card-body">
      <h3 class="card-title h6">当前在座</h3><p class="card-text fs-4">${occupied}</p>
      <p class="card-text small text-muted">人</p>
    </div></div></div>
    <div class="col-md-3"><div class="card text-center"><div class="card-body">
      <h3 class="card-title h6">整体使用率</h3><p class="card-text fs-4">${(occupied / totalSeats * 100).toFixed(1)}%</p>
      <p class="card-text small text-muted">在座 / 总座位</p>
    </div></div></div>
  `);
};

const renderTable = (rooms) => {
  $('#room-table').empty();
  rooms.forEach(r => {
    const rate = (r.occupied / r.seats * 100).toFixed(1);
    const badge = r.status === '开放' ? 'success' : 'secondary';
    $('#room-table').append(`
      <tr class="room-row">
        <td>${r.name}</td><td>${r.building}</td><td>${r.seats}</td>
        <td>${r.occupied}</td><td>${rate}%</td>
        <td><span class="badge bg-${badge}">${r.status}</span></td>
        <td>${r.hours}</td>
      </tr>
    `);
  });
};

// 柱状图：回答"哪个楼栋座位多、坐了多少"——分类比较用柱状图
const renderBarChart = (rooms) => {
  if (barChart === null) {
    barChart = echarts.init(document.querySelector('#bar-chart'));
  }
  const buildings = [...new Set(rooms.map(r => r.building))];
  const seats = buildings.map(b =>
    rooms.filter(r => r.building === b).reduce((s, r) => s + r.seats, 0));
  const occupied = buildings.map(b =>
    rooms.filter(r => r.building === b).reduce((s, r) => s + r.occupied, 0));
  barChart.setOption({
    title: { text: '各楼栋座位与在座人数（单位：个）', left: 'center' },
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0 },
    xAxis: { data: buildings },
    yAxis: { name: '个' },
    series: [
      { name: '总座位', type: 'bar', data: seats },
      { name: '在座人数', type: 'bar', data: occupied }
    ]
  }, true);
};

// 条形图：回答"哪个楼栋挤不挤"——比率比较用横向条形图，y轴从0开始不截断
const renderUsageChart = (rooms) => {
  const buildings = [...new Set(rooms.map(r => r.building))];
  const rates = buildings.map(b => {
    const list = rooms.filter(r => r.building === b);
    const seats = list.reduce((s, r) => s + r.seats, 0);
    const occ = list.reduce((s, r) => s + r.occupied, 0);
    return +(occ / seats * 100).toFixed(1);
  });
  if (usageChart !== null) {
    usageChart.destroy(); // 防止重复初始化
  }
  usageChart = new Chart(document.querySelector('#usage-chart'), {
    type: 'bar',
    data: {
      labels: buildings,
      datasets: [{
        label: '使用率',
        data: rates,
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: '各楼栋自习室使用率（单位：%）· 数据来源：课程统一数据集'
        }
      },
      scales: {
        x: { beginAtZero: true, max: 100, title: { display: true, text: '%' } }
      }
    }
  });
};

window.addEventListener('resize', () => {
  if (barChart) barChart.resize();
});

// jQuery交互一：事件委托，点击明细行高亮
$('#room-table').on('click', 'tr', function () {
  $(this).toggleClass('active');
});

// jQuery交互二：按楼栋筛选（事件委托 + val/attr读取data属性）
$('#filter').on('click', '.filter-btn', function () {
  $('.filter-btn').removeClass('active');
  $(this).addClass('active');
  state.building = $(this).data('building');
  if (state.data !== null) {
    render();
  }
});

loadData();
