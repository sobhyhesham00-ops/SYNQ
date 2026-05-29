import { useState } from 'react';
import { FileText, AlertCircle } from 'lucide-react';
import Markdown from 'react-markdown';

export function AnalysisDashboard() {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const demoAnalyze = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/analyze-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedules: [ { agentName: 'John Doe', shiftLabel: 'Morning 08:00 - 16:00', date: '2023-10-01' } ] })
      });
      if (!res.ok) throw new Error('API request failed');
      const data = await res.json();
      setAnalysis(data.analysis);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Schedule Analysis</h1>
      
      {!analysis && !loading && !error && (
         <div className="text-center p-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
           <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
           <p className="text-gray-600 dark:text-gray-300">Upload a schedule first, or retrieve recent analysis.</p>
           <button onClick={demoAnalyze} className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
              Test Analysis Endpoint
           </button>
         </div>
      )}

      {loading && (
        <div className="flex justify-center my-12">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
         <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-md flex items-start">
           <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3" />
           <p className="text-red-700 dark:text-red-400">{error}</p>
         </div>
      )}

      {analysis && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 md:p-8">
            <div className="prose prose-blue dark:prose-invert max-w-none markdown-body">
              <Markdown>{analysis}</Markdown>
            </div>
        </div>
      )}
    </div>
  );
}
