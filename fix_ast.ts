import * as ts from 'typescript';
import fs from 'fs';

const filePath = 'src/App.tsx';
let sourceCode = fs.readFileSync(filePath, 'utf8');

const sourceFile = ts.createSourceFile(
  filePath,
  sourceCode,
  ts.ScriptTarget.Latest,
  true
);

const replacements: {start: number, end: number, text: string}[] = [];

function visit(node) {
  if (ts.isJsxExpression(node) && node.expression) {
      // Check if it's a binary expression (/ * - +) or Math. operations
      let isMath = false;
      
      const checkInside = (n) => {
          if (ts.isBinaryExpression(n)) {
              if ([ts.SyntaxKind.SlashToken, ts.SyntaxKind.AsteriskToken, ts.SyntaxKind.MinusToken, ts.SyntaxKind.PlusToken, ts.SyntaxKind.PercentToken].includes(n.operatorToken.kind)) {
                  isMath = true;
              }
          }
          if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression)) {
              if (n.expression.expression.getText() === 'Math') {
                  isMath = true;
              }
              if (n.expression.name.getText() === 'toFixed') {
                  isMath = true;
              }
          }
          ts.forEachChild(n, checkInside);
      };
      
      checkInside(node.expression);

      if (isMath && !node.expression.getText().includes('isNaN') && !ts.isJsxAttribute(node.parent)) {
          const text = node.expression.getText();
          if (!text.includes('=>') && !text.includes('?')) {
              replacements.push({
                 start: node.expression.getStart(),
                 end: node.expression.getEnd(),
                 text: `(() => { const _v = ${text}; return (typeof _v === 'number' && isNaN(_v)) ? 0 : _v; })()`
              });
          }
      }
  }
  ts.forEachChild(node, visit);
}

visit(sourceFile);

replacements.sort((a,b) => b.start - a.start);
for (const r of replacements) {
   sourceCode = sourceCode.slice(0, r.start) + r.text + sourceCode.slice(r.end);
}

fs.writeFileSync(filePath, sourceCode);
console.log(`Replaced ${replacements.length} JSX expressions.`);
