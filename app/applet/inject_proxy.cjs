const fs = require('fs');
let lines = fs.readFileSync('src/App.tsx', 'utf-8').split('\n');
const appIdx = lines.findIndex(l => l.includes('const proxyHandler: any = '));
if (appIdx !== -1) {
  lines[appIdx] = `  const proxyHandler: any = { get: (target: any, prop: any) => { if (prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf') return () => ''; if (prop === Symbol.iterator) return function*() {}; if (prop === 'length') return 0; if (prop === 'map' || prop === 'filter' || prop === 'slice' || prop === 'join' || prop === 'includes' || prop === 'reduce' || prop === 'some' || prop === 'every' || prop === 'forEach') return () => []; if (typeof prop === 'string' && prop.startsWith('is')) return false; if (prop === 'then') return undefined; if (prop === '$$typeof') return Symbol.for('react.transitional.element'); if (prop === 'type') return () => null; if (prop === 'props') return {}; if (prop === 'key' || prop === 'ref') return null; if (prop === '_owner' || prop === '_store') return null; return new Proxy({}, proxyHandler); } }; const dummyProxy = new Proxy({}, proxyHandler);`;
  fs.writeFileSync('src/App.tsx', lines.join('\n'));
  console.log('Fixed dummyProxy using JS script');
}
