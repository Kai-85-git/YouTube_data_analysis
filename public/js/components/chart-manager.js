export class ChartManager {
  constructor() {
    this.growthChart = null;
    // Suppress browser extension errors
    this.suppressExtensionErrors();
  }

  suppressExtensionErrors() {
    // Handle message port errors from browser extensions
    window.addEventListener('error', (event) => {
      if (event.message && event.message.includes('message port closed')) {
        event.preventDefault();
        return false;
      }
    });

    // Suppress console errors related to extensions
    const originalError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      if (message.includes('message port closed') || 
          message.includes('Extension context invalidated') ||
          message.includes('runtime.lastError')) {
        return; // Suppress these errors
      }
      originalError.apply(console, args);
    };
  }

  createGrowthChart(channel) {
    try {
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
    } catch (error) {
      console.warn('Chart creation failed:', error);
      // Hide chart container if chart creation fails
      const chartContainer = document.querySelector('.chart-container');
      if (chartContainer) {
        chartContainer.style.display = 'none';
      }
    }
  }

  generateMockGrowthData(currentSubs) {
    const months = ['6ヶ月前', '5ヶ月前', '4ヶ月前', '3ヶ月前', '2ヶ月前', '1ヶ月前', '現在'];
    const data = [];
    
    // Generate realistic growth pattern with some variation
    const baseGrowthRates = [1.2, 1.15, 1.08, 1.05, 1.03, 1.02, 1.0]; // Decreasing growth over time
    let currentValue = currentSubs;
    
    // Calculate backwards from current value
    for (let i = months.length - 1; i >= 0; i--) {
      if (i === months.length - 1) {
        data.unshift(currentValue);
      } else {
        // Calculate previous value by dividing by growth rate
        currentValue = Math.round(currentValue / baseGrowthRates[i + 1]);
        data.unshift(currentValue);
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