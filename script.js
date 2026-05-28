const fs = require('fs');
const code = fs.readFileSync('src/App.tsx', 'utf-8');

// We want to find any line that calls set[A-Z]...() that is NOT inside a function or useEffect or callback.
// This is hard to do with regex.
// Instead, let's use the error stack trace from React!
// If we run the app and it errors, we can see the stack trace in the browser.
