// 案例复现：双库数据看板
const state = { data: null };
let barChart = null;
let lineChart = null;

const loadData = async () => {
  $('#status').text('加载中...').show();
  try {
    const response = await fetch('data/books.json');
    if (!response.ok) {
      throw new Error('HTTP ' + response.status);
    }
    const data = await response.json();
    if (data.series.length === 0) {
      $('#status').text('暂无数据').show();
      return;
    }
    state.data = data;
    $('#sub-title').text(data.title + ' · ' + data.period + ' · 数据来源：课程统一数据集');
    $('#status').hide();
    renderCards(data);
    renderBarChart(data);
    renderLineChart(data);
  } catch (error) {
    $('#status').text('加载失败：' + error.message).show();
  }
};

const renderCards = (data) => {
  const months = data.months;
  data.series.forEach(s => {
    const total = s.counts.reduce((sum, n) => sum + n, 0);
    $('#cards').append(`
      <div class="col-md-2">
        <div class="card text-center">
          <div class="card-body">
            <h3 class="card-title h6">${s.category}</h3>
            <p class="card-text fs-4">${total}</p>
            <p class="card-text small text-muted">册（${months.length}个月累计）</p>
          </div>
        </div>
      </div>
    `);
  });
};

const renderBarChart = (data) => {
  if (barChart === null) {
    barChart = echarts.init(document.querySelector('#bar-chart'));
  }
  barChart.setOption({
    title: { text: '各月各品类借阅量（单位：册）', left: 'center' },
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0 },
    xAxis: { data: data.months },
    yAxis: { name: '册' },
    series: data.series.map(s => ({
      name: s.category,
      type: 'bar',
      data: s.counts
    }))
  });
};

const renderLineChart = (data) => {
  if (lineChart !== null) {
    lineChart.destroy(); // 防止重复初始化叠加
  }
  const ctx = document.querySelector('#line-chart');
  lineChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.months,
      datasets: data.series.map(s => ({
        label: s.category,
        data: s.counts,
        borderWidth: 1
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: '借阅趋势（单位：册）· 数据来源：课程统一数据集'
        }
      },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: '册' } }
      }
    }
  });
};

window.addEventListener('resize', () => {
  if (barChart) barChart.resize();
});

// 案例复现进阶：jQuery事件委托——点击卡片高亮
$('#cards').on('click', '.card', function () {
  $(this).toggleClass('border-primary shadow');
});

loadData();
