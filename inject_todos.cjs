const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('const [todos, setTodos]')) {
  code = code.replace(
    /const \[dashboardSearchTeam, setDashboardSearchTeam\] = useState<string>\(''\);/,
    `const [dashboardSearchTeam, setDashboardSearchTeam] = useState<string>('');
  const [todos, setTodos] = useState<any[]>(() => getStorageItem('agent_todos', []));`
  );

  code = code.replace(
    /import \{[^}]*\} from '\.\/types';/,
    match => match.replace('Inquiry,', 'TodoItem, Inquiry,')
  );

  code = code.replace(
    /useEffect\(\(\) => \{[^}]*const checkBreakExceedances/,
    match => `useEffect(() => {
    // Check Reminders
    if (currentUser) {
      setTodos(prev => {
        let changed = false;
        const nowMs = Date.now();
        const next = prev.map(t => {
          if (!t.isCompleted && !t.notified && t.reminderTimeMs && t.reminderTimeMs <= nowMs) {
            changed = true;
            addSystemNotification(
              '⏰ To-Do Reminder! 🔔',
              \`It's time to: \${t.text}\`,
              'general',
              'team'
            );
            return { ...t, notified: true };
          }
          return t;
        });
        if (changed) setStorageItem('agent_todos', next);
        return changed ? next : prev;
      });
    }

` + match
  );
  
  fs.writeFileSync('src/App.tsx', code);
  console.log('Injected todos state');
} else {
  console.log('Already injected todos state');
}
