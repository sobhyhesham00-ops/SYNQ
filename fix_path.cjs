const fs = require('fs');
let content = fs.readFileSync('src/components/crm/CaseDetailDrawer.tsx', 'utf8');
content = content.replace(/import \{ getClinicLabel \} from "\.\.\/utils";/, 'import { getClinicLabel } from "../../utils";');
fs.writeFileSync('src/components/crm/CaseDetailDrawer.tsx', content, 'utf8');
