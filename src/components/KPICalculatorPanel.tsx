import React from 'react';

export const KPICalculatorPanel = () => {
  const [totalCalls, setTotalCalls] = React.useState('');
  const [answeredCalls, setAnsweredCalls] = React.useState('');
  const [handledCalls, setHandledCalls] = React.useState('');
  const [totalTalkTime, setTotalTalkTime] = React.useState(''); // minutes
  const [totalAvailTime, setTotalAvailTime] = React.useState(''); // minutes
  const [csat, setCsat] = React.useState('');
  const [fcr, setFcr] = React.useState('');

  const serviceLevel = answeredCalls && totalCalls ? ((Number(answeredCalls) / Number(totalCalls)) * 100).toFixed(1) : null;
  const aht = handledCalls && totalTalkTime ? (Number(totalTalkTime) / Number(handledCalls)).toFixed(1) : null;
  const utilization = totalAvailTime && totalTalkTime ? ((Number(totalTalkTime) / Number(totalAvailTime)) * 100).toFixed(1) : null;
  const abandonRate = totalCalls && answeredCalls ? (((Number(totalCalls) - Number(answeredCalls)) / Number(totalCalls)) * 100).toFixed(1) : null;

  const inputClass = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-mono font-bold';
  const labelClass = 'block text-xs text-slate-400 uppercase tracking-wider font-bold mb-1';

  const KPIResult = ({ label, value, unit, color, target }: any) => (
    <div className={`bg-transparent border ${color} rounded-2xl p-4 flex flex-col gap-1`}>
      <p className='text-xs text-slate-500 uppercase tracking-widest font-bold'>{label}</p>
      <p className='text-3xl font-black text-white font-mono'>{value ?? '—'}{value ? <span className='text-lg text-slate-400 ml-1'>{unit}</span> : null}</p>
      {target && <p className='text-xs text-slate-600'>Target: {target}</p>}
    </div>
  );

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        <div><label className={labelClass}>Total Calls</label><input className={inputClass} type='number' value={totalCalls} onChange={e => setTotalCalls(e.target.value)} placeholder='0' /></div>
        <div><label className={labelClass}>Answered Calls</label><input className={inputClass} type='number' value={answeredCalls} onChange={e => setAnsweredCalls(e.target.value)} placeholder='0' /></div>
        <div><label className={labelClass}>Handled Calls</label><input className={inputClass} type='number' value={handledCalls} onChange={e => setHandledCalls(e.target.value)} placeholder='0' /></div>
        <div><label className={labelClass}>Total Talk Time (min)</label><input className={inputClass} type='number' value={totalTalkTime} onChange={e => setTotalTalkTime(e.target.value)} placeholder='0' /></div>
        <div><label className={labelClass}>Available Time (min)</label><input className={inputClass} type='number' value={totalAvailTime} onChange={e => setTotalAvailTime(e.target.value)} placeholder='0' /></div>
        <div><label className={labelClass}>CSAT Score (%)</label><input className={inputClass} type='number' max='100' value={csat} onChange={e => setCsat(e.target.value)} placeholder='0-100' /></div>
        <div><label className={labelClass}>FCR Rate (%)</label><input className={inputClass} type='number' max='100' value={fcr} onChange={e => setFcr(e.target.value)} placeholder='0-100' /></div>
      </div>

      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        <KPIResult label='Service Level' value={serviceLevel} unit='%' color='border-indigo-500/20' target='≥ 80%' />
        <KPIResult label='Abandon Rate' value={abandonRate} unit='%' color='border-rose-500/20' target='≤ 5%' />
        <KPIResult label='Avg Handle Time' value={aht} unit='min' color='border-amber-500/20' target='≤ 4 min' />
        <KPIResult label='Utilization' value={utilization} unit='%' color='border-emerald-500/20' target='70–85%' />
        {csat && <KPIResult label='CSAT' value={csat} unit='%' color='border-sky-500/20' target='≥ 85%' />}
        {fcr && <KPIResult label='First Contact Resolution' value={fcr} unit='%' color='border-purple-500/20' target='≥ 75%' />}
      </div>
    </div>
  );
};
