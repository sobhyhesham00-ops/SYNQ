import fs from 'fs';
const mainPath = 'src/main.tsx';
let main = fs.readFileSync(mainPath, 'utf8');

if (!main.includes('console.error = function')) {
  main = main.replace(
    'import App from \'./App.tsx\'',
    \`import App from './App.tsx'

const originalConsoleError = console.error;
console.error = function() {
  const args = Array.from(arguments);
  if (typeof args[0] === 'string' && args[0].includes('Received NaN')) {
     originalConsoleError('FOUND THE NAN ERROR:', new Error().stack);
  }
  originalConsoleError.apply(console, args);
};
\`
  );
  fs.writeFileSync(mainPath, main);
  console.log("Hooked into console.error in main.tsx");
} else {
  console.log("Already hooked");
}
