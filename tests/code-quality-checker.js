/**
 * Code Quality Checker
 * 
 * This script scans the codebase for common issues and potential bugs.
 * It looks for patterns that might indicate problems in the code.
 * 
 * Usage:
 * node tests/code-quality-checker.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Patterns to look for
const patterns = [
  {
    name: 'Console logs',
    pattern: /console\.log\(/g,
    description: 'Console.log statements should be removed in production',
    severity: 'low',
    ignorePatterns: ['.test.', 'tests/', '.spec.']
  },
  {
    name: 'Hardcoded credentials',
    pattern: /(password|secret|key|token|auth).*['"`]([^'"`\s]{8,})['"`]/gi,
    description: 'Potential hardcoded credentials found',
    severity: 'high',
    ignorePatterns: ['tests/', 'package.json', 'example', '.md']
  },
  {
    name: 'TODO comments',
    pattern: /\/\/\s*TODO/g,
    description: 'TODO comments should be addressed before production',
    severity: 'low',
    ignorePatterns: []
  },
  {
    name: 'Missing error handling',
    pattern: /catch\s*\([^)]*\)\s*{(?!\s*[\w.$]+|\/\/)/g,
    description: 'Empty catch blocks should include error handling',
    severity: 'medium',
    ignorePatterns: ['.test.', 'tests/', '.spec.']
  },
  {
    name: 'Potential security issues',
    pattern: /eval\(|Function\(|new Function\(|document\.write\(|innerHTML.*=(?!\s*['"`]<)/g,
    description: 'Potentially unsafe JavaScript patterns',
    severity: 'high',
    ignorePatterns: ['.test.', 'tests/', '.spec.']
  },
  {
    name: 'Direct DOM manipulation', 
    pattern: /document\.getElementById\(|document\.querySelector\(/g,
    description: 'Direct DOM manipulation may be used outside of React flow',
    severity: 'medium',
    ignorePatterns: ['.test.', 'tests/', '.spec.']
  },
  {
    name: 'Use of setState in useEffect without dependencies',
    pattern: /useEffect\(\s*\(\)\s*=>\s*{[^}]*setStatename[^}]*}\s*\)/g,
    description: 'Using setState in useEffect without dependencies may cause infinite loops',
    severity: 'high',
    ignorePatterns: ['.test.', 'tests/', '.spec.']
  },
  {
    name: 'Commented out code blocks',
    pattern: /\/\*[\s\S]*?\*\/|\/\/\s*[a-zA-Z0-9_.$]+.*\n/g,
    description: 'Large commented code blocks should be removed',
    severity: 'low',
    ignorePatterns: ['.test.', 'tests/', '.spec.']
  },
  {
    name: 'Database connection strings',
    pattern: /mongodb:\/\/|postgres:\/\/|mysql:\/\//g,
    description: 'Database connection strings should not be hardcoded',
    severity: 'high',
    ignorePatterns: ['.test.', 'tests/', '.env']
  },
  {
    name: 'setTimeout without cleanup',
    pattern: /setTimeout\([^)]+\)/g,
    description: 'setTimeout may need cleanup in useEffect return function',
    severity: 'medium',
    ignorePatterns: ['.test.', 'tests/', '.spec.']
  }
];

// File extensions to check
const extensions = ['.js', '.jsx', '.ts', '.tsx'];

// Directories to ignore
const ignoreDirs = ['node_modules', '.git', 'dist', 'build', 'coverage'];

// Find all relevant files
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    
    // Skip ignored directories
    if (fs.statSync(filePath).isDirectory()) {
      if (!ignoreDirs.includes(file)) {
        findFiles(filePath, fileList);
      }
      return;
    }
    
    // Only check files with specified extensions
    const ext = path.extname(file).toLowerCase();
    if (extensions.includes(ext)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Check a file for patterns
function checkFile(filePath, patterns) {
  const issues = [];
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check each pattern
  patterns.forEach(pattern => {
    // Skip if this file matches ignore patterns
    if (pattern.ignorePatterns.some(ignore => filePath.includes(ignore))) {
      return;
    }
    
    // Find all matches
    const matches = content.match(pattern.pattern);
    if (matches && matches.length > 0) {
      issues.push({
        file: filePath,
        pattern: pattern.name,
        description: pattern.description,
        count: matches.length,
        severity: pattern.severity
      });
    }
  });
  
  return issues;
}

// Entry point
function runCodeQualityCheck() {
  console.log(`${colors.magenta}=== GrantiFuel Code Quality Check ===${colors.reset}`);
  console.log(`${colors.blue}Scanning for potential issues...${colors.reset}`);
  
  // Find all files to check
  const allFiles = findFiles('.');
  console.log(`Found ${allFiles.length} files to analyze.`);
  
  // Check each file
  let allIssues = [];
  allFiles.forEach(file => {
    const issues = checkFile(file, patterns);
    allIssues = [...allIssues, ...issues];
  });
  
  // Group issues by pattern
  const groupedIssues = {};
  allIssues.forEach(issue => {
    if (!groupedIssues[issue.pattern]) {
      groupedIssues[issue.pattern] = [];
    }
    groupedIssues[issue.pattern].push(issue);
  });
  
  // Report results
  console.log(`${colors.magenta}=== Issues Found ===${colors.reset}`);
  
  if (Object.keys(groupedIssues).length === 0) {
    console.log(`${colors.green}No issues found! 🎉${colors.reset}`);
    return;
  }
  
  // Report by severity
  ['high', 'medium', 'low'].forEach(severity => {
    const severityIssues = allIssues.filter(issue => issue.severity === severity);
    
    if (severityIssues.length > 0) {
      const color = 
        severity === 'high' ? colors.red :
        severity === 'medium' ? colors.yellow :
        colors.blue;
      
      console.log(`\n${color}${severity.toUpperCase()} severity issues: ${severityIssues.length}${colors.reset}`);
      
      // Group by pattern for this severity
      const patterns = [...new Set(severityIssues.map(issue => issue.pattern))];
      patterns.forEach(patternName => {
        const patternIssues = severityIssues.filter(issue => issue.pattern === patternName);
        const issueCount = patternIssues.reduce((sum, issue) => sum + issue.count, 0);
        
        console.log(`\n${color}${patternName}${colors.reset} (${patternIssues.length} files, ${issueCount} instances)`);
        console.log(`  ${patternIssues[0].description}`);
        
        // List affected files (limited to 5)
        patternIssues.slice(0, 5).forEach(issue => {
          console.log(`  - ${issue.file} (${issue.count} instances)`);
        });
        
        if (patternIssues.length > 5) {
          console.log(`  ... and ${patternIssues.length - 5} more files`);
        }
      });
    }
  });
  
  // Print summary
  console.log(`\n${colors.magenta}=== Summary ===${colors.reset}`);
  console.log(`Total issues found: ${allIssues.length} in ${Object.keys(groupedIssues).length} categories`);
  console.log(`High severity: ${allIssues.filter(i => i.severity === 'high').length}`);
  console.log(`Medium severity: ${allIssues.filter(i => i.severity === 'medium').length}`);
  console.log(`Low severity: ${allIssues.filter(i => i.severity === 'low').length}`);
}

// Run the check
try {
  runCodeQualityCheck();
} catch (error) {
  console.error(`${colors.red}Error running code quality check:${colors.reset}`, error);
}