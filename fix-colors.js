const fs = require('fs');
const path = require('path');

// Color mappings
const colorMappings = {
  'text-primary-': 'text-blue-',
  'bg-primary-': 'bg-blue-',
  'border-primary-': 'border-blue-',
  'text-success-': 'text-green-',
  'bg-success-': 'bg-green-',
  'border-success-': 'border-green-',
  'text-warning-': 'text-yellow-',
  'bg-warning-': 'bg-yellow-',
  'border-warning-': 'border-yellow-',
  'text-error-': 'text-red-',
  'bg-error-': 'bg-red-',
  'border-error-': 'border-red-',
};

function fixColorsInFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  for (const [oldColor, newColor] of Object.entries(colorMappings)) {
    const regex = new RegExp(oldColor, 'g');
    if (content.includes(oldColor)) {
      content = content.replace(regex, newColor);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed colors in: ${filePath}`);
  }
}

// Files to fix
const filesToFix = [
  'frontend/components/EnvConfigPanel.tsx',
  'frontend/components/DeploymentPanel.tsx',
  'frontend/components/MonitoringPanel.tsx',
  'frontend/components/LogsPanel.tsx',
  'frontend/pages/index.tsx'
];

console.log('Fixing color references...');
filesToFix.forEach(fixColorsInFile);
console.log('Done!');