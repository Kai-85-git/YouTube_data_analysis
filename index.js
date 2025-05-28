import inquirer from 'inquirer';
import { YouTubeAnalyzer } from './src/services/youtube-analyzer.js';
import { validateApiKey } from './src/config/config.js';

// Validate API key
validateApiKey();

async function main() {
  console.log('🎯 YouTube Channel Analyzer');
  console.log('=====================================\n');

  const analyzer = new YouTubeAnalyzer();

  while (true) {
    try {
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            { name: '📊 Analyze a YouTube channel', value: 'analyze' },
            { name: '❌ Exit', value: 'exit' }
          ]
        }
      ]);

      if (action === 'exit') {
        console.log('👋 Goodbye!');
        process.exit(0);
      }

      if (action === 'analyze') {
        const { url } = await inquirer.prompt([
          {
            type: 'input',
            name: 'url',
            message: '🔗 Enter YouTube channel URL:',
            validate: (input) => {
              if (!input.trim()) {
                return 'Please enter a URL';
              }
              if (!input.includes('youtube.com')) {
                return 'Please enter a valid YouTube URL';
              }
              return true;
            }
          }
        ]);

        console.log('\n⏳ Analyzing channel...');
        
        const analysisData = await analyzer.analyzeChannel(url.trim());
        analyzer.formatAnalysis(analysisData);

        const { continueChoice } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'continueChoice',
            message: 'Would you like to analyze another channel?',
            default: true
          }
        ]);

        if (!continueChoice) {
          console.log('👋 Goodbye!');
          process.exit(0);
        }
      }
    } catch (error) {
      console.error(`❌ Error: ${error.message}\n`);
      
      const { retryChoice } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'retryChoice',
          message: 'Would you like to try again?',
          default: true
        }
      ]);

      if (!retryChoice) {
        console.log('👋 Goodbye!');
        process.exit(0);
      }
    }
  }
}

main().catch(console.error);