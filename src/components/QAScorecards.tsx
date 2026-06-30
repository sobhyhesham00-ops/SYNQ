import React, { useState } from 'react';
import { QAScore, User, QAQuestion } from '../types';
import { CheckCircle, AlertTriangle, User as UserIcon, PlusCircle, Search, LogOut, XCircle } from 'lucide-react';

interface QAScorecardProps {
  currentUser: User;
  qaScores: QAScore[];
  agentsList: string[];
  qaTemplate: QAQuestion[];
  onUpdateQATemplate: (newTemplate: QAQuestion[]) => void;
  addSystemNotification: (title: string, message: string, type: any, target: string) => void;
  onSubmitScore: (score: QAScore) => void;
}

export const QAScorecards: React.FC<QAScorecardProps> = ({ currentUser, qaScores, agentsList, qaTemplate, onUpdateQATemplate, addSystemNotification, onSubmitScore }) => {
  const [view, setView] = useState<'list' | 'create'>('list');
  const [targetAgent, setTargetAgent] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [chatOrCallId, setChatOrCallId] = useState('');
  const [notes, setNotes] = useState('');
  
  const [expandedScoreId, setExpandedScoreId] = useState<string | null>(null);
  const [isEditingQuestions, setIsEditingQuestions] = useState(false);

  // Local state for editing questions
  const [localQuestions, setLocalQuestions] = useState<QAQuestion[]>(qaTemplate);
  
  // Re-sync if template updates from server while not editing
  React.useEffect(() => {
    if (!isEditingQuestions) {
      setLocalQuestions(qaTemplate);
    }
  }, [qaTemplate, isEditingQuestions]);

  const handleSaveQuestions = () => {
    onUpdateQATemplate(localQuestions);
    setIsEditingQuestions(false);
  };

  const handleUpdateQuestion = (idx: number, field: 'text' | 'maxScore', val: any) => {
    const updated = [...localQuestions];
    updated[idx] = { ...updated[idx], [field]: field === 'maxScore' ? Number(val) : val };
    setLocalQuestions(updated);
  };

  const handleAddQuestion = () => {
    setLocalQuestions([...localQuestions, { id: `q${Date.now()}`, text: 'New Criteria', maxScore: 10 }]);
  };

  const handleRemoveQuestion = (idx: number) => {
    const updated = [...localQuestions];
    updated.splice(idx, 1);
    setLocalQuestions(updated);
  };

  const [scores, setScores] = useState<Record<string, number>>({});

  const isEditor = currentUser.role === 'qa' || currentUser.name.toLowerCase() === 'hesham sobhy';

  const handleScoreChange = (qId: string, val: string) => {
    setScores(prev => ({ ...prev, [qId]: Number(val) }));
  };

  const calculateTotal = (): number => {
    return (Object.values(scores) as number[]).reduce((a: number, b: number) => a + (b || 0), 0);
  };
  const calculateMax = () => qaTemplate.reduce((a, b) => a + b.maxScore, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAgent || !clinicName || !chatOrCallId) {
      alert("Please fill all mandatory fields.");
      return;
    }

    const total = calculateTotal();
    const max = calculateMax();

    const newScore: QAScore = {
      id: `qa_${Date.now()}`,
      qaName: currentUser.name,
      agentName: targetAgent,
      clinicName,
      chatOrCallId,
      notes,
      scores,
      questionsSnapshot: qaTemplate,
      totalScore: total,
      maxTotalScore: max,
      createdAt: new Date().toISOString()
    };

    onSubmitScore(newScore);

    // Notify agent
    addSystemNotification(
      "📝 Quality Assurance Scorecard",
      `A new QA scorecard has been submitted for you on Chat/Call ID ${chatOrCallId} (Clinic: ${clinicName}). Your score: ${total}/${max}`,
      "feedback",
      targetAgent
    );
    
    // Attempt to notify TL. Without knowing their specific TL, we could send to 'tl' role or specific. Here we use 'tl' as target group.
    addSystemNotification(
      "📊 QA Scorecard Submitted",
      `QA evaluated ${targetAgent} (Call/Chat: ${chatOrCallId}). Score: ${total}/${max}`,
      "feedback",
      "tl"
    );

    // Reset
    setTargetAgent('');
    setClinicName('');
    setChatOrCallId('');
    setNotes('');
    setScores({});
    setView('list');
  };

  const myScores = ['agent', 'sme'].includes(currentUser.role as string) 
    ? qaScores.filter(s => s.agentName.toLowerCase() === currentUser.name.toLowerCase())
    : qaScores;

  return (
    <div className="flex flex-col gap-6 animate-fade-in w-full">
      <div className="flex items-center justify-between bg-white/5 border border-white/10 p-5 rounded-2xl shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            QA & Quality Assurance
          </h2>
          <p className="text-sm text-slate-400">View and manage interaction scorecards.</p>
        </div>
        {isEditor && view === 'list' && (
          <div className="flex gap-2">
            <button 
              onClick={() => setIsEditingQuestions(true)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl flex items-center gap-2 transition border border-white/10"
            >
              <PlusCircle className="w-4 h-4" />
              Manage Criteria
            </button>
            <button 
              onClick={() => setView('create')}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl flex items-center gap-2 transition"
            >
              <PlusCircle className="w-4 h-4" />
              New Scorecard
            </button>
          </div>
        )}
        {view === 'create' && (
          <button 
            onClick={() => setView('list')}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl flex items-center gap-2 transition"
          >
            Back to List
          </button>
        )}
      </div>

      {isEditingQuestions ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 w-full max-w-4xl mx-auto space-y-6">
          <h3 className="text-lg font-bold text-slate-100 pb-4 border-b border-white/10">Manage QA Criteria</h3>
          <p className="text-sm text-slate-400">Configure the questions and maximum scores that will be used for all new scorecards.</p>
          <div className="space-y-4">
            {localQuestions.map((q, idx) => (
              <div key={q.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-transparent p-4 rounded-xl border border-white/5">
                <input
                  type="text"
                  value={q.text}
                  onChange={(e) => handleUpdateQuestion(idx, 'text', e.target.value)}
                  className="flex-1 bg-white/[0.04] border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-green-500"
                  placeholder="e.g. Greeting & Opening"
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Max Score</span>
                  <input
                    type="number"
                    min={1}
                    value={q.maxScore}
                    onChange={(e) => handleUpdateQuestion(idx, 'maxScore', e.target.value)}
                    className="w-20 text-center bg-white/[0.04] border border-slate-700 rounded-xl px-2 py-2 text-green-400 font-bold outline-none focus:border-green-500"
                  />
                  <button onClick={() => handleRemoveQuestion(idx)} className="ml-2 text-red-500 hover:text-red-400 p-2">
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={handleAddQuestion} className="w-full py-3 border border-dashed border-white/20 hover:border-white/40 text-slate-400 hover:text-slate-200 rounded-xl transition flex items-center justify-center gap-2 font-bold text-sm">
            <PlusCircle className="w-4 h-4" /> Add New Criterion
          </button>
          <div className="flex justify-end pt-6 border-t border-white/10 gap-2">
            <button onClick={() => setIsEditingQuestions(false)} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition">Cancel</button>
            <button onClick={handleSaveQuestions} className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition">Save Criteria</button>
          </div>
        </div>
      ) : view === 'list' ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col min-h-0">
          <h3 className="text-lg font-bold text-slate-100 mb-4 pb-4 border-b border-white/10">Recent Evaluations</h3>
          {myScores.length === 0 ? (
            <div className="text-slate-400 text-center py-8">No QA scorecards found.</div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {myScores.map((score) => {
                const percentage = (score.totalScore / score.maxTotalScore) * 100;
                let pctColor = "text-green-400";
                if (percentage < 70) pctColor = "text-red-400";
                else if (percentage < 85) pctColor = "text-amber-400";
                const isExpanded = expandedScoreId === score.id;

                return (
                  <div key={score.id} className="bg-transparent border border-white/10 rounded-2xl flex flex-col transition-all hover:border-white/20 overflow-hidden">
                    <div 
                      className="p-4 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between cursor-pointer"
                      onClick={() => setExpandedScoreId(isExpanded ? null : score.id)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-slate-100 uppercase text-sm tracking-wider">{score.agentName}</span>
                          <span className="text-slate-500 text-xs">• Eval By: {score.qaName}</span>
                          <span className="text-slate-500 text-xs">• {new Date(score.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="text-slate-300 text-sm">
                          Clinic: <span className="font-semibold text-white">{score.clinicName}</span> | Ref: <span className="font-mono text-indigo-300">{score.chatOrCallId}</span>
                        </div>
                        {score.notes && !isExpanded && (
                          <div className="mt-2 text-xs text-slate-400 italic bg-white/5 p-2 rounded-xl inline-block">
                            "{score.notes.substring(0, 60)}{score.notes.length > 60 ? '...' : ''}"
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2 flex flex-col items-center min-w-[100px]">
                          <div className={`text-xl font-bold ${pctColor}`}>{!isNaN(Number(score.totalScore)) ? Number(score.totalScore) : 0}<span className="text-xs text-slate-500">/{!isNaN(Number(score.maxTotalScore)) ? Number(score.maxTotalScore) : 0}</span></div>
                        </div>
                        <Search className={`w-5 h-5 text-slate-500 transition-transform ${isExpanded ? 'rotate-90 text-slate-300' : ''}`} />
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="p-4 border-t border-white/5 bg-transparent">
                        <h4 className="text-sm font-bold text-slate-200 mb-3">Detailed Scorecard</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                          {(score.questionsSnapshot || qaTemplate).map(q => (
                            <div key={q.id} className="flex justify-between items-center p-3 rounded-xl bg-white/[0.04] border border-slate-800">
                              <span className="text-xs font-semibold text-slate-300 flex-1 pr-2">{q.text}</span>
                              <div className="font-sans bg-white/[0.03] px-2 py-1 rounded text-sm whitespace-nowrap">
                                <span className={score.scores[q.id] < q.maxScore ? 'text-amber-400' : 'text-green-400'}>
                                  {score.scores[q.id] ?? 0}
                                </span>
                                <span className="text-slate-600"> / {q.maxScore}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {score.notes && (
                          <div className="mb-2">
                            <h4 className="text-xs uppercase font-bold tracking-widest text-slate-500 mb-2">Coaching & Feedback</h4>
                            <div className="text-sm text-slate-300 whitespace-pre-wrap bg-white/[0.04] p-4 rounded-xl border border-slate-800">
                              {score.notes}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-6 w-full max-w-4xl mx-auto space-y-6">
          <h3 className="text-lg font-bold text-slate-100 pb-4 border-b border-white/10">Evaluate Interaction</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Agent Name</label>
              <select
                value={targetAgent}
                onChange={(e) => setTargetAgent(e.target.value)}
                required
                className="w-full bg-white/[0.04] border border-slate-700 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-green-500 transition-colors"
              >
                <option value="">-- Select Agent --</option>
                {agentsList.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Clinic Name</label>
              <input
                type="text"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                required
                placeholder="e.g. HealthCare Plus"
                className="w-full bg-white/[0.04] border border-slate-700 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-green-500 transition-colors"
                autoComplete="off"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Chat / Call ID</label>
              <input
                type="text"
                value={chatOrCallId}
                onChange={(e) => setChatOrCallId(e.target.value)}
                required
                placeholder="Reference ID"
                className="w-full bg-white/[0.04] border border-slate-700 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-green-500 transition-colors"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="pt-4 mt-6 border-t border-white/10">
            <h4 className="text-sm font-bold tracking-wide text-slate-200 mb-4">Scorecard Criteria</h4>
            <div className="space-y-4">
              {qaTemplate.map((q) => (
                <div key={q.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-transparent p-4 rounded-xl border border-white/5">
                  <div className="flex-1">
                    <span className="font-semibold text-slate-200">{q.text}</span>
                    <p className="text-xs text-slate-500 mt-1">Max Score: {q.maxScore}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={q.maxScore}
                      value={scores[q.id] ?? ''}
                      onChange={(e) => handleScoreChange(q.id, e.target.value)}
                      required
                      placeholder="0"
                      className="w-20 text-center bg-white/[0.04] border border-slate-700 rounded-xl px-2 py-2 text-green-400 font-bold outline-none focus:border-green-500 transition-colors"
                    />
                    <span className="text-slate-500 font-bold">/ {q.maxScore}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Coaching & Additional Feedback</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Good tone of voice, but missed some account verifications..."
              className="w-full bg-white/[0.04] border border-slate-700 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-green-500 transition-colors min-h-[100px] resize-y"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-white/10">
            <div className="mb-4 sm:mb-0">
              <span className="text-sm text-slate-400">Calculated Final Score: </span>
              <span className="text-xl font-bold text-green-400 ml-2">
                {!isNaN(Number(calculateTotal())) ? Number(calculateTotal()) : 0} <span className="text-sm text-slate-500">/ {!isNaN(Number(calculateMax())) ? Number(calculateMax()) : 0}</span>
              </span>
            </div>
            
            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3 bg-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-sm text-white rounded-xl font-bold tracking-wide transition-all"
            >
              Submit Evaluation
            </button>
          </div>

        </form>
      )}
    </div>
  );
};
