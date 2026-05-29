import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, AlertCircle, CheckCircle, FileText, Loader2, Send } from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import Markdown from 'react-markdown';

// Define the interface for Schedule Item
interface ScheduleItem {
  [key: string]: any;
}

export const ScheduleUpload: React.FC = () => {
  const [fileData, setFileData] = useState<ScheduleItem[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileLoadProgress, setFileLoadProgress] = useState<number>(0);
  const [isParsing, setIsParsing] = useState(false);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const simulateProgress = () => {
    setFileLoadProgress(0);
    const interval = setInterval(() => {
      setFileLoadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 20;
      });
    }, 100);
    return interval;
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFileName(file.name);
    setFileData(null);
    setAnalysisResult(null);
    setError(null);
    setIsParsing(true);
    
    simulateProgress(); // Mock progress

    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setTimeout(() => {
            setFileData(results.data as ScheduleItem[]);
            setIsParsing(false);
            setFileLoadProgress(100);
          }, 500); // give progress bar time to complete visually
        },
        error: (err: any) => {
          setError(`CSV Parse Error: ${err.message}`);
          setIsParsing(false);
          setFileLoadProgress(0);
        }
      });
    } else if (file.name.endsWith('.xlsx')) {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          setTimeout(() => {
            setFileData(jsonData as ScheduleItem[]);
            setIsParsing(false);
            setFileLoadProgress(100);
          }, 500);
        } catch (err: any) {
          setError(`Excel Parse Error: ${err.message}`);
          setIsParsing(false);
          setFileLoadProgress(0);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setError('Unsupported file type. Please upload CSV or XLSX.');
      setIsParsing(false);
      setFileLoadProgress(0);
      setFileName(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1
  });

  const sendToAI = async () => {
    if (!fileData || fileData.length === 0) return;
    
    try {
      setIsAnalyzing(true);
      setError(null);
      setAnalysisResult(null);
      
      const payload = { schedules: fileData };

      const res = await fetch('/api/analyze-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to analyze schedule');
      }

      const data = await res.json();
      setAnalysisResult(data.analysis);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while analyzing');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Prepare table headers safely
  const previewHeaders = fileData && fileData.length > 0 ? Object.keys(fileData[0]).slice(0, 5) : [];

  return (
    <div className="flex flex-col space-y-8 animate-fade-in w-full">
      <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Upload Schedule</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Upload your team's schedule as a CSV or Excel file to analyze coverage and balance.</p>
        
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 group
            ${isDragActive ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'}
          `}
        >
          <input {...getInputProps()} />
          <Upload className={`mx-auto h-12 w-12 mb-4 transition-colors duration-200 ${isDragActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-blue-500'}`} />
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
            {isDragActive ? 'Drop the file here' : 'Click or drag & drop to upload'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            CSV or XLSX (Excel) formats accepted
          </p>
        </div>

        {/* Progress Bar during parsing */}
        {isParsing && (
          <div className="mt-6 w-full space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-gray-700 dark:text-gray-300">Reading {fileName}...</span>
              <span className="text-gray-500 dark:text-gray-400">{fileLoadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-200 ease-out" 
                style={{ width: `${fileLoadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Error Messages */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* File Preview and Action */}
        {fileData && !isParsing && (
          <div className="mt-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white line-clamp-1">{fileName}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{fileData.length} records loaded</p>
                </div>
              </div>
              
              <button
                onClick={sendToAI}
                disabled={isAnalyzing}
                className="flex items-center justify-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 dark:disabled:bg-blue-800 text-white font-medium rounded-lg transition-colors shadow-sm w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-gray-900 shadow-blue-500/20"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send to AI
                  </>
                )}
              </button>
            </div>

            {/* Data Preview Table */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                  <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-200 font-medium border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      {previewHeaders.map((header) => (
                        <th key={header} className="px-6 py-3 whitespace-nowrap">{header}</th>
                      ))}
                      {Object.keys(fileData[0] || {}).length > 5 && (
                        <th className="px-6 py-3 text-gray-400 italic font-normal">...more columns</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700/50">
                    {fileData.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                        {previewHeaders.map((header) => (
                          <td key={header} className="px-6 py-3 whitespace-nowrap max-w-[200px] truncate">
                            {String(row[header] ?? '')}
                          </td>
                        ))}
                        {Object.keys(fileData[0] || {}).length > 5 && (
                          <td className="px-6 py-3"></td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {fileData.length > 5 && (
                <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/30 text-xs text-center text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
                  Showing first 5 of {fileData.length} records
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Analysis Result */}
      {analysisResult && (
        <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 border border-blue-200 dark:border-blue-900/50 rounded-xl shadow-sm animate-fade-in mb-8 w-full block">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center shadow-md">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              AI Analysis Complete
            </h2>
          </div>
          
          <div className="prose prose-blue dark:prose-invert max-w-none 
                          prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-white
                          prose-p:text-gray-700 dark:prose-p:text-gray-300
                          prose-strong:text-gray-900 dark:prose-strong:text-white
                          prose-li:text-gray-700 dark:prose-li:text-gray-300
                          prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-900/20 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:text-gray-700 dark:prose-blockquote:text-gray-300">
            <Markdown>{analysisResult}</Markdown>
          </div>
        </div>
      )}
    </div>
  );
};
