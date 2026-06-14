import * as fs from 'fs';

const file = 'src/App.tsx';
const code = fs.readFileSync(file, 'utf8');
const lines = code.split(/\r?\n/);

interface Token {
  type: string;
  line: number;
  text: string;
}

const tagStack: Token[] = [];

// Track JSX Tags: we match <div, </div, <main, </main, <motion.div, </motion.div, <> and </>
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!line) continue;
  
  const cleanLine = line.replace(/\/\/.*$/, '');
  
  // Tag regex that ignores self-closing tags like <div /> or <motion.div />
  const tagsRegex = /<(|div|main|motion\.div|)\s*>|<\/(div|main|motion\.div|)\s*>|<(div|main|motion\.div)(?:\s+[^>]*)?(?!\/)>/g;
  let match;
  while ((match = tagsRegex.exec(cleanLine)) !== null) {
    const rawTag = match[0];
    const isClose = rawTag.startsWith('</');
    
    let tagName = 'fragment';
    if (rawTag.includes('motion.div')) tagName = 'motion.div';
    else if (rawTag.includes('div')) tagName = 'div';
    else if (rawTag.includes('main')) tagName = 'main';
    
    if (isClose) {
      const popped = tagStack.pop();
      if (!popped || popped.text !== tagName) {
        console.log(`Mismatch on line ${i + 1}: onClose </${tagName}>, but popped tag was:`, popped);
      }
    } else {
      tagStack.push({ type: 'tag', line: i + 1, text: tagName });
    }
  }
}

console.log(`Remaining unchecked items in tagStack: ${tagStack.length}`);
console.log(tagStack.slice(-20));
