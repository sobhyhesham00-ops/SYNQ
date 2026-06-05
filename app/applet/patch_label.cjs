const fs = require('fs');
let code = fs.readFileSync('src/components/TabbyTamaraCard.tsx', 'utf8');

const target = `  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(\`\${label} copied!\`, { icon: '📋' });
    setTimeout(() => setCopied(false), 2000);
  };`;

const replacement = `  const handleCopy = () => {
    const isPhone = label === 'Phone' || /^(\\+971|0)\\d{9}/.test(value);
    const copyValue = isPhone ? value.replace(/^0+/, '').replace(/^\\+971\\s?/, '') : value;
    navigator.clipboard.writeText(copyValue);
    setCopied(true);
    if (isPhone) {
        toast.success('Phone copied (starts from 5)', { icon: '📋' });
    } else {
        toast.success(\`\${label} copied!\`, { icon: '📋' });
    }
    setTimeout(() => setCopied(false), 2000);
  };`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/components/TabbyTamaraCard.tsx', code);
    console.log('Successfully patched CopyableField');
} else {
    console.log('Could not find handleCopy function to patch');
}
