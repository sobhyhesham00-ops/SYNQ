      if (e.key === 'sched_tt_complaints' && e.newValue) setTabbyTamaraComplaints(JSON.parse(e.newValue));
      if (e.key === 'sched_requests' && e.newValue) setRequests(JSON.parse(e.newValue));
      if (e.key === 'sched_time_logs' && e.newValue) setTimeLogs(JSON.parse(e.newValue));
      if (e.key === 'sched_schedules' && e.newValue) setSchedules(JSON.parse(e.newValue));
      if (e.key === 'sched_support_assignments' && e.newValue) setSupportAssignments(JSON.parse(e.newValue));
      if (e.key === 'sched_announcements' && e.newValue) setAnnouncements(JSON.parse(e.newValue));
    };
    window.addEventListener('storage', handleStorage);

    // 2. Real-time Firestore Sync via Collections!
    const unsubInquiries = onSnapshot(collection(db, "inquiries"), snap => {
      const arr = snap.docs.map(d => d.data() as Inquiry);
      arr.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setInquiries(arr);
      localStorage.setItem('sched_inquiries', JSON.stringify(arr));
    });

    const unsubQa = onSnapshot(collection(db, "qa_scores"), snap => {
      const arr = snap.docs.map(d => d.data() as QAScore);
      arr.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setQaScores(arr);
      localStorage.setItem('sched_qa_scores', JSON.stringify(arr));
    });

    const unsubQATemplate = onSnapshot(doc(db, "system", "sched_qa_template"), snap => {
      if (snap.exists()) {
        const data = snap.data().data;
        setQaTemplate(data);
        localStorage.setItem('sched_qa_template', JSON.stringify(data));
      }
    });
    const unsubTT = onSnapshot(collection(db, "tt_requests"), snap => {
      const arr = snap.docs.map(d => d.data() as TabbyTamaraRequest);
      arr.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setTabbyTamaraRequests(arr);
      localStorage.setItem('sched_tabby_tamara', JSON.stringify(arr));
    });
    const unsubComp = onSnapshot(collection(db, "tt_complaints"), snap => {
      const arr = snap.docs.map(d => d.data() as TabbyTamaraComplaint);
      arr.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setTabbyTamaraComplaints(arr);
      localStorage.setItem('sched_tt_complaints', JSON.stringify(arr));
    });
    const unsubComms = onSnapshot(collection(db, "client_comms"), snap => {
      const arr = snap.docs.map(d => d.data() as ClientCommunicationRequest);
      arr.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setClientComms(arr);
      localStorage.setItem('sched_client_comms', JSON.stringify(arr));
    });
    const unsubReq = onSnapshot(collection(db, "scheduling_requests"), snap => {
      const arr = snap.docs.map(d => d.data() as SchedulingRequest);
      arr.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setRequests(arr);
      localStorage.setItem('sched_requests', JSON.stringify(arr));
    });
    const unsubTime = onSnapshot(collection(db, "timelogs"), snap => {
      const arr = snap.docs.map(d => d.data() as TimeLog);
      arr.sort((a, b) => {
        const dateDiff = new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
        if (dateDiff !== 0) return dateDiff;
        const tsA = parseInt((a.id || '').split('_')[1] || '0', 10);
        const tsB = parseInt((b.id || '').split('_')[1] || '0', 10);
        return tsB - tsA;
      });
      setTimeLogs(arr);
      localStorage.setItem('sched_time_logs', JSON.stringify(arr));
    });
    const unsubSched = onSnapshot(collection(db, "schedules"), snap => {
      const arr = snap.docs.map(d => d.data() as ScheduledShift);
      setSchedules(arr);
      localStorage.setItem('sched_schedules', JSON.stringify(arr));
    });
    let isAnnouncementsInitialized = false;
    const unsubAnnouncements = onSnapshot(collection(db, "announcements"), snap => {
      const arr = snap.docs.map(d => d.data() as Announcement);
      arr.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      
      const latest = arr[0];
      if (latest && currentUserRef.current) {
        if (!isAnnouncementsInitialized) {
          isAnnouncementsInitialized = true;
          localStorage.setItem('sched_last_notified_announcement_id', latest.id);
        } else {
          const lastNotifiedId = localStorage.getItem('sched_last_notified_announcement_id');
          if (lastNotifiedId !== latest.id) {
            localStorage.setItem('sched_last_notified_announcement_id', latest.id);
            toast.custom((t) => (
              <div className="bg-slate-900/95 border border-amber-500/40 text-white rounded-2xl p-4 shadow-2xl flex flex-col gap-2 max-w-sm border-l-4 border-l-amber-500 backdrop-blur-md animate-fade-in text-left">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0 border border-amber-500/20">
                    <Bell className="w-5 h-5 animate-bounce" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-amber-400">📢 New Broadcast Posted!</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">By {latest.author || "System"}</p>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed italic">"{latest.message}"</p>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-2 pt-1 border-t border-white/5">
                  <button 
                    onClick={() => {
                      setActiveTab('tl-announcements');
                      toast.dismiss(t);
                    }}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 rounded-lg text-xs font-black uppercase tracking-wider cursor-pointer transition-all shrink-0"
                  >
                    Read Now
                  </button>
                  <button 
                    onClick={() => toast.dismiss(t)}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ), { duration: 15000 });
          }
        }
      }

      setAnnouncements(arr);
      localStorage.setItem('sched_announcements', JSON.stringify(arr));
    });
    const unsubAppStatus = onSnapshot(doc(db, "system", "app_status"), snap => {
      if (snap.exists() && snap.data().isKilled === true) {
        setIsAppKilled(true);
      } else {
        setIsAppKilled(false);
      }
    });

    const unsubSupp = onSnapshot(doc(db, "system", "sched_support_assignments"), snap => {
      if (snap.exists()) {
        const data = snap.data().data;
        setSupportAssignments(data);
        localStorage.setItem('sched_support_assignments', JSON.stringify(data));
      }
    });
    const unsubCases = onSnapshot(collection(db, "cases"), snap => {
      const arr = snap.docs.map(d => d.data() as CaseRecord);
      arr.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setCases(arr);
      localStorage.setItem('sched_cases', JSON.stringify(arr));
    });
    const unsubAgents = onSnapshot(doc(db, "system", "sched_agents_list"), snap => {
      // Intentionally empty or minimal - we prefer the dynamic list from unsubUsers/directory
    });
    const unsubMeta = onSnapshot(doc(db, "system", "sched_agent_meta"), snap => {
      if (snap.exists()) {
        const data = snap.data().data as Record<string, { roleType: string; tlName: string }>;
        setAgentMeta(data);
        localStorage.setItem('sched_agent_meta', JSON.stringify(data));
      }
    });
    const unsubDir = onSnapshot(doc(db, "system", "sched_agent_directory"), snap => {
      if (snap.exists()) {
        const data = snap.data().data as AgentDirectoryRow[];
        setAgentDirectory(data);
        localStorage.setItem('sched_agent_directory', JSON.stringify(data));
      }
    });
    const unsubDirHeaders = onSnapshot(doc(db, "system", "sched_agent_directory_headers"), snap => {
      if (snap.exists()) {
        const data = snap.data().data as string[];
        setDirectoryHeaders(data);
        localStorage.setItem('sched_agent_directory_headers', JSON.stringify(data));
      }
    });

    const unsubRosterPub = onSnapshot(doc(db, "system", "sched_roster_published"), snap => {
      if (snap.exists()) {
        const data = snap.data().data as boolean;
        setIsRosterPublished(data);
        localStorage.setItem('sched_roster_published', JSON.stringify(data));
      }
    });

    const unsubLockedAccounts = onSnapshot(doc(db, "system", "sched_locked_accounts"), snap => {
      if (snap.exists()) {
        const data = snap.data().data || [];
        setLockedAccounts(data);
        localStorage.setItem('sched_locked_accounts', JSON.stringify(data));
      }
    });

    const unsubFailedAttempts = onSnapshot(doc(db, "system", "sched_failed_attempts"), snap => {
      if (snap.exists()) {
        const data = snap.data().data || {};
        setFailedAttempts(data);
        localStorage.setItem('sched_failed_attempts', JSON.stringify(data));
      }
    });

    let isNotifsInitialized = false;
    const unsubNotifs = onSnapshot(collection(db, "notifications"), snap => {
      const arr = snap.docs.map(d => d.data() as SystemNotification);
      arr.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      
      const latest = arr[0];
      if (latest) {
        if (!isNotifsInitialized) {
          isNotifsInitialized = true;
          localStorage.setItem('sched_last_notified_notif_id', latest.id);
        } else if (currentUserRef.current) {
          const lastNotifiedNotifId = localStorage.getItem('sched_last_notified_notif_id') || '';
          if (latest.id !== lastNotifiedNotifId) {
            localStorage.setItem('sched_last_notified_notif_id', latest.id);
            
            let isTargeted = latest.targetAgent === 'all' || 
                               (currentUserRef.current.role === 'tl' && latest.targetAgent === 'tl') ||
                               latest.targetAgent.toLowerCase() === currentUserRef.current.name.toLowerCase();
                               
            if (!isTargeted && latest.targetAgent.toLowerCase().startsWith('team:')) {
              const teamTLName = latest.targetAgent.split(':')[1]?.toLowerCase() || '';
              const curUserTL = getAgentTL(currentUserRef.current.name).toLowerCase();
              const curUserName = currentUserRef.current.name.toLowerCase();
              isTargeted = (curUserName === teamTLName) || (curUserTL === teamTLName);
            }

            const isAnnouncementNotification = latest.title.toLowerCase().includes('announcement') || latest.title.toLowerCase().includes('broadcast');

            if (isTargeted && !isAnnouncementNotification) {
              toast.info(
                <div className="flex flex-col gap-1 text-left">
                  <span className="font-bold text-sm text-indigo-400">🔔 {latest.title}</span>
                  <span className="text-xs text-slate-200 line-clamp-2">{latest.message}</span>
                </div>,
                { duration: 8000 }
              );
            }
          }
        }
      }

      setNotifications(arr);
      localStorage.setItem('sched_notifications', JSON.stringify(arr));
    });

    const unsubFeedbacks = onSnapshot(collection(db, "tl_feedbacks"), snap => {
      const arr = snap.docs.map(d => d.data() as TlFeedback);
      arr.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setTlFeedbacks(arr);
      localStorage.setItem('sched_tl_feedbacks', JSON.stringify(arr));
    });

    const unsubAppVersion = onSnapshot(doc(db, "system", "app_version"), (snap) => {
      if (snap.exists()) {
        const remoteVersion = snap.data().version || 0;
        if (CURRENT_APP_VERSION > remoteVersion) {
