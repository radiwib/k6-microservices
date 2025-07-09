import { check } from 'k6';

// Simple progress bar for k6 tests
export class ProgressBar {
  constructor(testName = 'K6 Test', stages = []) {
    this.testName = testName;
    this.stages = stages;
    this.startTime = new Date();
    this.iterations = 0;
    this.passedChecks = 0;
    this.failedChecks = 0;
    this.httpRequests = 0;
    
    // Calculate total duration
    this.totalDuration = stages.reduce((sum, stage) => {
      return sum + this.parseDuration(stage.duration);
    }, 0);
    
    this.showHeader();
  }
  
  parseDuration(duration) {
    const match = duration.match(/^(\d+)([smh])$/);
    if (!match) return 0;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      default: return 0;
    }
  }
  
  showHeader() {
    console.log('\n' + '='.repeat(50));
    console.log(`🚀 ${this.testName} - Starting`);
    console.log('='.repeat(50));
  }
  
  updateProgress() {
    this.iterations++;
    const elapsed = (new Date() - this.startTime) / 1000;
    const progress = Math.min((elapsed / this.totalDuration) * 100, 100);
    
    // Show progress every 10 iterations to avoid spam
    if (this.iterations % 10 === 0) {
      const bar = this.createProgressBar(progress);
      console.log(`📊 Progress: ${bar} ${progress.toFixed(1)}% | Iterations: ${this.iterations}`);
    }
  }
  
  createProgressBar(percentage, width = 20) {
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    return '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']';
  }
  
  recordCheck(result) {
    if (result) {
      this.passedChecks++;
    } else {
      this.failedChecks++;
    }
  }
  
  showCompletion() {
    const totalTime = (new Date() - this.startTime) / 1000;
    console.log('\n' + '='.repeat(50));
    console.log(`✅ ${this.testName} - COMPLETED!`);
    console.log(`⏱️  Total Time: ${Math.round(totalTime)}s`);
    console.log(`🔄 Iterations: ${this.iterations}`);
    console.log(`📊 Checks: ${this.passedChecks} passed, ${this.failedChecks} failed`);
    console.log('='.repeat(50));
  }
}

// Global progress bar
let globalProgressBar = null;

export function initProgress(testName, stages) {
  globalProgressBar = new ProgressBar(testName, stages);
  return globalProgressBar;
}

export function updateProgress() {
  if (globalProgressBar) {
    globalProgressBar.updateProgress();
  }
}

export function recordCheck(result) {
  if (globalProgressBar) {
    globalProgressBar.recordCheck(result);
  }
}

export function showCompletion() {
  if (globalProgressBar) {
    globalProgressBar.showCompletion();
  }
}

// Enhanced check function with progress tracking
export function progressCheck(value, condition, tags = {}) {
  const result = check(value, condition, tags);
  recordCheck(result);
  return result;
}

