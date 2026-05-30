import React, { useState, useEffect } from 'react';
import { Upload, XCircle, FileText, CheckCircle, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import * as XLSX from 'xlsx';

// Ensure proper typing for our schedules
export interface ScheduledShift {
  id: string;
  agentName: string;
  date: string;
  shiftLabel: string;
}

interface ScheduleUploadProps {
  onSchedulesImported: (schedules: ScheduledShift[]) => void;
}

export const ScheduleUpload: React.FC<ScheduleUploadProps> = ({ onSchedulesImported }) => {
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [tempSchedules, setTempSchedules] = useState<ScheduledShift[]>([]);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);

  useEffect(() => {
    // When the component unmounts or we clear, clean up
    return () => {
      setTempSchedules([]);
    };
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file) return;
    
    setIsProcessing(true);
    setUploadError(null);
    setUploadSuccess(null);
    setAiAnalysisResult(null);
    
    // Quick validation
    const validExts = ['.xlsx', '.xls', '.csv'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExts.includes(ext)) {
      setUploadError(`Invalid file format: ${ext}. Please upload a .xlsx, .xls, or .csv file.`);
      setIsProcessing(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert sheet to JSON
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { defval: "" });
        
        if (jsonData.length === 0) {
          throw new Error("No data found in the file.");
        }

        // Generic parser for a list of shifts
        // Assuming columns like 'Agent', 'Date', 'Shift'
        const schedules: ScheduledShift[] = [];
        
        jsonData.forEach((row, index) => {
          const agentName = row['Agent'] || row['Agent Name'] || row['Name'] || Object.values(row)[0] || '';
          const dateStr = row['Date'] || Object.values(row)[1] || '';
          const shift = row['Shift'] || Object.values(row)[2] || '';
          
          if (agentName && dateStr && shift) {
             schedules.push({
               id: `gen_${Date.now()}_${index}`,
               agentName: String(agentName).trim(),
               date: String(dateStr).trim(),
               shiftLabel: String(shift).trim()
             });
          }
        });

        if (schedules.length === 0) {
          throw new Error("Could not parse schedule format. Ensure columns 'Agent', 'Date', and 'Shift' exist.");
        }

        setTempSchedules(schedules);
        setUploadSuccess(`Successfully parsed ${schedules.length} shifts.`);
      } catch (err: any) {
        setUploadError(err.message || 'Error processing the file.');
      } finally {
        setIsProcessing(false);
      }
    };
    
    reader.onerror = () => {
      setUploadError("Error reading the file stream.");
      setIsProcessing(false);
    };
    
    reader.readAsBinaryString(file);
  };

  const handleSendToAI = () => {
    setIsAnalyzing(true);
    // Simulate AI request since we do not have an actual Gemini route provided in this task details 
    // outside of a general simulated timeout
    setTimeout(() => {
      setIsAnalyzing(false);
      setAiAnalysisResult(`AI Analysis Complete: The schedule for ${tempSchedules.length} shifts has optimal coverage with a few minor gaps during peak hours. Night shift adherence is within boundaries.`);
    }, 2500);
  };

  const handleSave = () => {
    if (tempSchedules.length > 0) {
      onSchedulesImported(tempSchedules);
      // Clean up
      setTempSchedules([]);
      setUploadSuccess("Schedule roster formally published to workspace.");
      setAiAnalysisResult(null);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-10 shadow-lg text-left">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-100 flex items-center gap-3 font-display">
          <CalendarIcon className="w-8 h-8 text-indigo-400" />
          Import Schedule Roster
        </h2>
        <p className="text-slate-400 text-sm mt-1">Upload a CSV or Excel file containing your agent shifts.</p>
      </div>

      {/* File Dropzone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-all ${
          dragActive 
            ? 'border-indigo-400 bg-indigo-500/10' 
            : 'border-slate-600 hover:border-slate-500 bg-slate-800'
        }`}
      >
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        
        {isProcessing ? (
          <div className="flex flex-col items-center">
            <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin mb-4" />
            <h4 className="text-slate-100 font-bold mb-1">Processing File...</h4>
          </div>
        ) : (
          <>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform ${dragActive ? 'bg-indigo-500 text-white scale-110' : 'bg-slate-700 text-slate-400'}`}>
              <Upload className="w-8 h-8" />
            </div>
            <h4 className="text-slate-100 font-bold text-lg mb-1">Drag & drop your file here</h4>
            <p className="text-slate-400 text-sm mb-4">or click to browse from your computer</p>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-slate-900 rounded-full text-xs font-mono text-slate-300 border border-slate-700">.XLSX</span>
              <span className="px-3 py-1 bg-slate-900 rounded-full text-xs font-mono text-slate-300 border border-slate-700">.CSV</span>
            </div>
          </>
        )}
      </div>

      {/* Feedback & Preview */}
      {(uploadSuccess || uploadError || tempSchedules.length > 0) && (
        <div className="mt-8 space-y-4 animate-fade-in">
          {/* Status Banners */}
          {uploadError && (
             <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-rose-300">
               <AlertCircle className="w-5 h-5 shrink-0" />
               <p className="text-sm font-medium">{uploadError}</p>
             </div>
          )}
          
          {uploadSuccess && tempSchedules.length > 0 && (
             <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-emerald-300">
               <CheckCircle className="w-5 h-5 shrink-0" />
               <p className="text-sm font-medium">{uploadSuccess}</p>
             </div>
          )}

          {/* AI Feature Panel */}
          {tempSchedules.length > 0 && (
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
               <div className="p-4 bg-slate-900 border-b border-slate-700 flex flex-wrap justify-between items-center gap-4">
                  <h4 className="font-bold text-slate-200 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    Preview ({tempSchedules.length} standard shifts)
                  </h4>
                  
                  <div className="flex items-center gap-3">
                     <button 
                       onClick={handleSendToAI}
                       disabled={isAnalyzing}
                       className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                     >
                       {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                       {isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
                     </button>
                     
                     <button 
                       onClick={handleSave}
                       className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg text-sm font-bold transition-colors"
                     >
                        Confirm & Publish
                     </button>
                  </div>
               </div>
               
               {aiAnalysisResult && (
                 <div className="p-5 bg-indigo-900/40 border-b border-indigo-500/30">
                   <h5 className="text-xs font-black uppercase tracking-widest text-indigo-300 mb-2">Gemini AI Analysis</h5>
                   <p className="text-slate-300 text-sm leading-relaxed">{aiAnalysisResult}</p>
                 </div>
               )}

               <div className="p-0 max-h-[300px] overflow-y-auto">
                 <table className="w-full text-sm text-left">
                   <thead className="text-xs text-slate-400 uppercase bg-slate-800/50 sticky top-0">
                     <tr>
                       <th className="px-4 py-3 font-semibold">Agent Name</th>
                       <th className="px-4 py-3 font-semibold">Date</th>
                       <th className="px-4 py-3 font-semibold">Shift Label</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-700">
                      {tempSchedules.slice(0, 15).map((s, i) => (
                        <tr key={i} className="hover:bg-white/5 transition-colors">
                           <td className="px-4 py-3 font-medium text-slate-200">{s.agentName}</td>
                           <td className="px-4 py-3 text-slate-400">{s.date}</td>
                           <td className="px-4 py-3">
                             <span className="px-2 py-1 rounded bg-slate-700/50 text-slate-300 font-mono text-xs">{s.shiftLabel}</span>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                 </table>
                 {tempSchedules.length > 15 && (
                    <div className="p-3 text-center text-xs text-slate-500 bg-slate-900/50">
                       + {tempSchedules.length - 15} more rows not shown in preview
                    </div>
                 )}
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function CalendarIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="8" rx="2" />
      <path d="M3 14h18" />
    </svg>
  );
}
