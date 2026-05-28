import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import * as XLSX from 'xlsx';

export interface ScheduleUploadProps {
  onUploadSuccess: (data: any[]) => void;
  onClose: () => void;
}

export function ScheduleUpload({ onUploadSuccess, onClose }: ScheduleUploadProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(true);
  };

  const handleDragLeave = () => {
    setIsHovering(false);
  };

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setLoading(true);

    try {
      const extension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (!extension || !['csv', 'xlsx', 'xls'].includes(extension)) {
        throw new Error('Please upload a valid CSV or Excel file.');
      }

      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);

      if (json.length === 0) {
        throw new Error('The uploaded file is empty.');
      }

      onUploadSuccess(json);
    } catch (err: any) {
      setError(err.message || 'Failed to process file.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-fade-in relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 p-1 rounded-full cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 border border-indigo-500/20">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">Upload Schedule</h2>
              <p className="text-xs text-slate-400">Support formats: CSV, XLSX, XLS</p>
            </div>
          </div>

          <div 
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer relative ${
              isHovering ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 hover:border-slate-500 bg-slate-950/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              accept=".csv, .xlsx, .xls"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            {loading ? (
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
            ) : file && !error ? (
              <div className="flex flex-col items-center text-emerald-400">
                <CheckCircle2 className="w-12 h-12 mb-3" />
                <span className="font-semibold">{file.name}</span>
                <span className="text-xs opacity-75 mt-1">Processed successfully</span>
              </div>
            ) : (
              <>
                <FileText className={`w-12 h-12 mb-4 ${isHovering ? 'text-indigo-400' : 'text-slate-500'}`} />
                <p className="font-semibold text-slate-200 mb-1">Drag and drop file here</p>
                <p className="text-xs text-slate-400">or click to browse from your computer</p>
              </>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-950/50 border border-red-500/20 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-300 font-medium">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
