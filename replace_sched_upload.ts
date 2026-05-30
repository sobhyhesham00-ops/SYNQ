import fs from 'fs';

const appPath = 'src/App.tsx';
let content = fs.readFileSync(appPath, 'utf8');

const startMarker = '{/* Unified Modern Roster Upload Console */}';
const endMarker = '{/* Roster Live Toggle Switch purely for Hesham & Amira */}';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    const before = content.substring(0, startIndex);
    const after = content.substring(endIndex);
    
    // Add the component import at the top
    let importString = "import { ScheduleUpload, ScheduledShift } from './components/ScheduleUpload';\n";
    if (!content.includes('ScheduleUpload')) {
        content = importString + before + 
`{isSuperAdmin && (
   <div className="w-full">
     <ScheduleUpload 
        onSchedulesImported={(parsedSchedules) => {
           setTempSchedules(parsedSchedules as any);
           setUploadSuccess(\`Successfully pulled \${parsedSchedules.length} shifts.\`);
        }} 
     />
     {tempSchedules.length > 0 && (
         <div className="mt-4 flex justify-end">
            <button onClick={commitSchedules} className="px-5 py-2 bg-emerald-600 text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700 rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
                <CheckCircle2 className="w-4 h-4" /> Save & Append Published Schedule ({tempSchedules.length} items)
            </button>
         </div>
     )}
   </div>
)}

` + after;
        fs.writeFileSync(appPath, content);
        console.log("Successfully replaced the Schedule Upload section!");
    } else {
        console.log("ScheduleUpload already imported.");
    }
} else {
    console.log("Could not find markers.");
}
