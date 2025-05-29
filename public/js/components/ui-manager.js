export class UIManager {
  constructor() {
    this.initializeElements();
  }

  initializeElements() {
    this.loadingSection = document.getElementById('loadingSection');
    this.resultsSection = document.getElementById('resultsSection');
    this.errorSection = document.getElementById('errorSection');
    this.commentsSection = document.getElementById('commentsSection');
    this.errorMessage = document.getElementById('errorMessage');
  }

  showLoading() {
    this.hideAllSections();
    this.loadingSection.classList.remove('hidden');
  }

  showError(message) {
    this.hideAllSections();
    this.errorMessage.textContent = message;
    this.errorSection.classList.remove('hidden');
  }

  showResults() {
    this.hideAllSections();
    this.resultsSection.classList.remove('hidden');
    
    // Smooth scroll to results
    setTimeout(() => {
      this.resultsSection.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
  }

  showCommentsSection() {
    this.hideAllSections();
    this.commentsSection.classList.remove('hidden');
    
    // Smooth scroll to comments section
    setTimeout(() => {
      this.commentsSection.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
  }

  hideAllSections() {
    this.loadingSection.classList.add('hidden');
    this.resultsSection.classList.add('hidden');
    this.errorSection.classList.add('hidden');
    this.commentsSection.classList.add('hidden');
  }

  showTemporaryMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `temp-message temp-message-${type}`;
    messageDiv.textContent = message;

    document.body.appendChild(messageDiv);

    setTimeout(() => {
      messageDiv.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => {
        document.body.removeChild(messageDiv);
      }, 300);
    }, 3000);
  }

  resetForm() {
    this.hideAllSections();
    const urlInput = document.getElementById('channelUrl');
    urlInput.value = '';
    urlInput.focus();
    
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}