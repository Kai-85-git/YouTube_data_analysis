import { formatNumber } from '../utils/formatters.js';

export class StatisticsRenderer {
  constructor() {
    this.animationTimers = [];
  }

  populateStatistics(stats) {
    this.animateNumber('subscriberCount', stats.subscriberCount);
    this.animateNumber('viewCount', stats.viewCount);
    this.animateNumber('videoCount', stats.videoCount);
  }

  animateNumber(elementId, targetValue) {
    const element = document.getElementById(elementId);
    const duration = 2000;
    const steps = 60;
    const stepValue = targetValue / steps;
    let currentValue = 0;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      currentValue += stepValue;
      
      if (currentStep >= steps) {
        currentValue = targetValue;
        clearInterval(timer);
      }
      
      element.textContent = formatNumber(Math.floor(currentValue));
    }, duration / steps);

    this.animationTimers.push(timer);
  }

  populateAnalytics(analytics) {
    if (!analytics) {
      document.getElementById('averageViews').textContent = '-';
      document.getElementById('totalLikes').textContent = '-';
      document.getElementById('totalComments').textContent = '-';
      document.getElementById('popularDay').textContent = '-';
      document.getElementById('uploadFrequency').textContent = '-';
      return;
    }

    document.getElementById('averageViews').textContent = formatNumber(analytics.averageViews);
    document.getElementById('totalLikes').textContent = formatNumber(analytics.totalLikes);
    document.getElementById('totalComments').textContent = formatNumber(analytics.totalComments);
    document.getElementById('popularDay').textContent = analytics.mostPopularDay || '-';
    
    const frequency = analytics.uploadFrequency ? `約${analytics.uploadFrequency}日に1回` : '-';
    document.getElementById('uploadFrequency').textContent = frequency;
  }

  clearAnimations() {
    this.animationTimers.forEach(timer => clearInterval(timer));
    this.animationTimers = [];
  }
}