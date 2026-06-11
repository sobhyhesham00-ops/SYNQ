import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  XCircle, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { parseScheduleCSV } from '../utils';

export interface ScheduledShift {
  id: string;
  agentName: string;
  date: string;
  shiftLabel: string;
}

interface ScheduleUploadProps {
  onSchedulesImported: (schedules: ScheduledShift[]) => void;
  agentsList?: string[];
}

export const ScheduleUpload: React.FC<ScheduleUploadProps> = ({ 
  onSchedulesImported, 
  agentsList = [] 
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [tempSchedules, setTempSchedules] = useState<ScheduledShift[]>([]);
  const [fileName, setFileName] = useState<string>('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
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
    setWarnings([]);
    setTempSchedules([]);
    setFileName(file.name);
    setCurrentPage(1);
    
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const validExts = ['.xlsx', '.xls', '.csv', '.tsv', '.txt'];
    
    if (!validExts.includes(ext)) {
      setUploadError(`Invalid file format: ${ext}. Supported formats are .xlsx, .xls, .csv, .tsv, .txt.`);
      setIsProcessing(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        let csvText = '';
        
        if (ext === '.xlsx' || ext === '.xls') {
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          csvText = XLSX.utils.sheet_to_csv(worksheet);
        } else {
          // csv, tsv, txt can be read as text
          const textContent = data as string;
          try {
            const workbook = XLSX.read(textContent, { type: 'string' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            csvText = XLSX.utils.sheet_to_csv(worksheet);
          } catch (xlsxErr) {
            console.warn("XLSX parsing failed for text format, falling back to raw text reading", xlsxErr);
            csvText = textContent;
          }
        }

        // TSV / TXT delimiter support fallback if XLSX didn't process tab delimiter:
        if (ext === '.tsv' || (ext === '.txt' && csvText.includes('\t') && !csvText.includes(','))) {
          csvText = csvText.replace(/\t/g, ',');
        }

        if (!csvText || csvText.trim() === '') {
          throw new Error("No data found in the file.");
        }

        // Call parseScheduleCSV from utils
        const result = parseScheduleCSV(csvText, agentsList);
        
        if (result.errors && result.errors.length > 0) {
          setWarnings(result.errors);
        }

        if (!result.schedules || result.schedules.length === 0) {
          throw new Error("Could not parse schedule format or no valid shifts were found. Please check columns.");
        }

        setTempSchedules(result.schedules);
        setUploadSuccess(`Successfully parsed ${result.schedules.length} shift rows from "${file.name}".`);
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
    
    if (ext === '.xlsx' || ext === '.xls') {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleConfirm = () => {
    if (tempSchedules.length > 0) {
      onSchedulesImported(tempSchedules);
      // Clean up local temp schedules and reset on success
      setTempSchedules([]);
      setUploadSuccess(`Schedule roster (${fileName}) confirmed and sent to workspace.`);
    }
  };

  const handleClear = () => {
    setTempSchedules([]);
    setWarnings([]);
    setUploadSuccess(null);
    setUploadError(null);
    setFileName('');
    setCurrentPage(1);
    onSchedulesImported([]); // clear parent temp changes as well
  };

  // Pagination Math
  const totalPages = Math.ceil(tempSchedules.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedShifts = tempSchedules.slice(startIndex, startIndex + itemsPerPage);

  const getShiftBadge = (label: string) => {
    const norm = label.toLowerCase();
    if (norm.includes('07:00') || norm.includes('morning')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {label}
        </span>
      );
    }
    if (norm.includes('13:00') || norm.includes('afternoon')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          {label}
        </span>
      );
    }
    if (norm.includes('22:00') || norm.includes('night')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          {label}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-500/15 text-slate-400 border border-slate-500/20 font-mono text-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        {label}
      </span>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl text-left space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-100 flex items-center gap-2.5 font-display">
            <CalendarIcon className="w-6 h-6 text-indigo-400" />
            Import Schedule Roster
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">
            Supported formats: Excel (.xlsx, .xls) and Plain/Delimited (.csv, .tsv, .txt)
          </p>
        </div>
      </div>

      {/* File Dropzone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all ${
          dragActive 
            ? 'border-indigo-400 bg-indigo-500/5' 
            : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
        }`}
      >
        <input
          type="file"
          accept=".xlsx,.xls,.csv,.tsv,.txt"
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        
        {isProcessing ? (
          <div className="flex flex-col items-center py-4">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
            <h4 className="text-slate-200 font-semibold text-sm">Processing uploaded roster...</h4>
          </div>
        ) : (
          <>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-transform ${dragActive ? 'bg-indigo-500 text-white scale-110' : 'bg-slate-800 text-slate-400'}`}>
              <Upload className="w-5 h-5" />
            </div>
            <h4 className="text-slate-200 font-bold text-sm mb-0.5">Drag & drop your roster file here</h4>
            <p className="text-slate-500 text-xs mb-3">or click to browse from your device</p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {['.XLSX', '.XLS', '.CSV', '.TSV', '.TXT'].map(fType => (
                <span key={fType} className="px-2 py-0.5 bg-slate-900 rounded text-[9px] font-mono text-slate-400 border border-slate-800">
                  {fType}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Status Messages & Warnings */}
      {(uploadSuccess || uploadError || warnings.length > 0) && (
        <div className="space-y-3.5">
          {uploadError && (
            <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-rose-300">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <h5 className="font-bold text-xs text-rose-400 uppercase tracking-wide">Import Failed</h5>
                <p className="text-xs mt-0.5 text-rose-300/95">{uploadError}</p>
              </div>
            </div>
          )}

          {uploadSuccess && (
            <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-emerald-300">
              <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
              <div>
                <h5 className="font-bold text-xs text-emerald-400 uppercase tracking-wide">Import Successful</h5>
                <p className="text-xs mt-0.5 text-emerald-300/95">{uploadSuccess}</p>
              </div>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="flex flex-col gap-1.5 bg-amber-500/10 border border-amber-500/25 p-4 rounded-xl text-amber-300">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                Parsing Warnings ({warnings.length})
              </div>
              <ul className="list-disc pl-5 space-y-1 text-[11px] text-amber-200/90 max-h-[140px] overflow-y-auto">
                {warnings.map((w, idx) => (
                  <li key={idx} className="leading-normal">{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Preview Section */}
      {tempSchedules.length > 0 && (
        <div className="bg-slate-950/60 rounded-2xl border border-slate-800 overflow-hidden shadow-inner">
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <h5 className="font-bold text-xs text-slate-200 uppercase tracking-wider">
                Shift Preview ({tempSchedules.length} rows found)
              </h5>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleConfirm}
                className="px-3.5 py-1.5 bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white rounded-lg text-xs font-black tracking-wide uppercase transition-colors shadow-lg shadow-indigo-500/15 cursor-pointer"
              >
                Confirm & Use These Shifts
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-300 rounded-lg text-xs font-black tracking-wide uppercase transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-905 bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Agent Name</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Shift Label</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedShifts.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-200">{s.agentName}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">{s.date}</td>
                    <td className="px-4 py-3">{getShiftBadge(s.shiftLabel)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-4">
              <span className="text-[11px] text-slate-500 font-mono">
                Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, tempSchedules.length)} of {tempSchedules.length} rows
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded text-xs flex items-center gap-1 transition-colors font-semibold cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Prev
                </button>
                <span className="text-[11px] font-mono text-slate-400 px-1">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded text-xs flex items-center gap-1 transition-colors font-semibold cursor-pointer"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
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
