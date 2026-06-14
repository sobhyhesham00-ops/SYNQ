const { execSync } = require('child_process');
try {
  execSync('git checkout src/App.tsx');
  console.log('Restored App.tsx correctly!');
} catch (e) {
  console.error('Failed', e.toString());
}
