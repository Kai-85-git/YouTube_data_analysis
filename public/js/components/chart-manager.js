export class ChartManager {
  constructor() {
    this.growthChart = null;
  }

  createGrowthChart(channel) {
    const ctx = document.getElementById('growthChart').getContext('2d');
    
    // Generate mock growth data (since historical data isn't available from API)
    const currentSubs = channel.statistics.subscriberCount;
    const chartData = this.generateMockGrowthData(currentSubs);

    // Destroy existing chart if it exists
    if (this.growthChart) {
      this.growthChart.destroy();
    }

    this.growthChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartData.labels,
        datasets: [{
          label: '登録者数',
          data: chartData.data,
          borderColor: '#FF4500',
          backgroundColor: 'rgba(255, 69, 0, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#FF4500',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#FF4500',
            borderWidth: 1,
            callbacks: {
              label: function(context) {
                return `登録者数: ${context.parsed.y.toLocaleString()}人`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              color: '#666'
            }
          },
          y: {
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              color: '#666',
              callback: function(value) {
                return value.toLocaleString();
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    });
  }

  generateMockGrowthData(currentSubs) {
    const months = ['6ヶ月前', '5ヶ月前', '4ヶ月前', '3ヶ月前', '2ヶ月前', '1ヶ月前', '現在'];
    const data = [];
    
    // Generate past data with growth rate consideration
    const growthRate = 0.85; // Monthly growth rate
    let prevValue = currentSubs;
    
    for (let i = months.length - 1; i >= 0; i--) {
      if (i === months.length - 1) {
        data.unshift(currentSubs);
      } else {
        prevValue = Math.round(prevValue * growthRate);
        data.unshift(prevValue);
      }
    }
    
    return {
      labels: months,
      data: data
    };
  }

  destroy() {
    if (this.growthChart) {
      this.growthChart.destroy();
      this.growthChart = null;
    }
  }
}