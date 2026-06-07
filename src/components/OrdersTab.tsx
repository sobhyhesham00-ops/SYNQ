import React, { useState, useEffect } from 'react';
import { Order, OrderMember, User } from '../types';
import { ShoppingBag, Plus, Calculator, Timer, CheckCircle, BellRing, Settings2, Trash2 } from 'lucide-react';
import { doc } from 'firebase/firestore';
import { db, wrappedSetDoc as setDoc, wrappedDeleteDoc as deleteDoc } from '../firebase';
import { toast } from 'sonner';

export function OrdersTab({
  currentUser,
  orders,
  users,
  addSystemNotification
}: {
  currentUser: User;
  orders: Order[];
  users: User[];
  addSystemNotification: (title: string, message: string, type: 'schedule' | 'compliance' | 'inquiry' | 'general' | 'incident' | 'absence' | 'feedback', targetAgent: string) => void;
}) {
  const [restaurantName, setRestaurantName] = useState('');
  const [timerMinutes, setTimerMinutes] = useState(30);

  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  // New item inputs
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState<number | ''>('');
  const [selectedMember, setSelectedMember] = useState<string>(currentUser.name);

  const getMyActiveOrders = () => {
    return orders.filter(o => o.status === 'open' || o.status === 'ordered').sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const getMonthlyStats = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const thisMonthOrders = orders.filter(o => {
      const dt = new Date(o.createdAt);
      return dt.getMonth() === currentMonth && dt.getFullYear() === currentYear;
    });

    const makerCount: Record<string, number> = {};
    const spenderAmount: Record<string, number> = {};

    thisMonthOrders.forEach(o => {
      makerCount[o.makerName] = (makerCount[o.makerName] || 0) + 1;
      o.members.forEach(m => {
        spenderAmount[m.name] = (spenderAmount[m.name] || 0) + m.finalAmount;
      });
    });

    const topMaker = Object.keys(makerCount).sort((a,b) => makerCount[b] - makerCount[a])[0];
    const topSpender = Object.keys(spenderAmount).sort((a,b) => spenderAmount[b] - spenderAmount[a])[0];
    
    return { topMaker, makerCount: topMaker ? makerCount[topMaker] : 0, topSpender, spenderAmount: topSpender ? spenderAmount[topSpender] : 0 };
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantName) return;

    const newOrder: Order = {
      id: `ord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      makerName: currentUser.name,
      restaurantName,
      status: 'open',
      createdAt: new Date().toISOString(),
      timerMinutes,
      members: [],
      deliveryFee: 0,
      tax: 0,
      discount: 0
    };

    try {
      await setDoc(doc(db, "orders", newOrder.id), newOrder);
      toast.success("Order room created!");
      setRestaurantName('');
      setActiveOrderId(newOrder.id);
      
      addSystemNotification(
        "🍔 New Food Order Created!",
        `${currentUser.name} is making an order from ${restaurantName}. Join now!`,
        "general",
        "all"
      );
    } catch(err) {
      toast.error("Failed to create order");
    }
  };

  const activeOrder = orders.find(o => o.id === activeOrderId);

  const calculateSplits = (order: Order): OrderMember[] => {
    const totalBase = order.members.reduce((sum, m) => sum + m.baseAmount, 0);
    if (totalBase === 0) return order.members;

    return order.members.map(m => {
      const ratio = m.baseAmount / totalBase;
      const memberShareTax = order.tax * ratio;
      const memberShareDelivery = order.deliveryFee * ratio;
      const memberShareDiscount = order.discount * ratio;
      const finalAmt = m.baseAmount + memberShareTax + memberShareDelivery - memberShareDiscount;
      return { ...m, finalAmount: Math.max(0, finalAmt) };
    });
  };

  const updateOrderInDb = async (updated: Order) => {
    try {
      await setDoc(doc(db, "orders", updated.id), updated);
    } catch(err) {
      toast.error("Database update failed");
    }
  };

  const handleAddItem = async () => {
    if (!activeOrder || !newItemName || !newItemAmount || newItemAmount <= 0) return;

    const newMember: OrderMember = {
      id: `mbr_${Date.now()}`,
      name: selectedMember,
      itemsName: newItemName,
      baseAmount: Number(newItemAmount),
      finalAmount: Number(newItemAmount),
      paid: false
    };

    const tempMembers = [...activeOrder.members, newMember];
    
    // Recalculate
    const updatedOrder = { ...activeOrder, members: tempMembers };
    updatedOrder.members = calculateSplits(updatedOrder);

    await updateOrderInDb(updatedOrder);
    setNewItemName('');
    setNewItemAmount('');
    toast.success("Item added successfully");
  };

  const handleRemoveItem = async (memId: string) => {
    if (!activeOrder) return;
    const filtered = activeOrder.members.filter(m => m.id !== memId);
    let updatedOrder = { ...activeOrder, members: filtered };
    updatedOrder.members = calculateSplits(updatedOrder);
    await updateOrderInDb(updatedOrder);
  };

  const handleUpdateFees = async (field: 'deliveryFee' | 'tax' | 'discount', val: number) => {
    if (!activeOrder) return;
    let updatedOrder = { ...activeOrder, [field]: val };
    updatedOrder.members = calculateSplits(updatedOrder);
    await updateOrderInDb(updatedOrder);
  };
  
  const handleCheckout = async () => {
    if (!activeOrder) return;
    let up = { ...activeOrder, status: 'ordered' as const, orderedAt: new Date().toISOString() };
    await updateOrderInDb(up);
    toast.success("Order moved to ordered status!");
  };

  const handleArrived = async () => {
    if (!activeOrder) return;
    let up = { ...activeOrder, status: 'arrived' as const, arrivedAt: new Date().toISOString() };
    await updateOrderInDb(up);
    toast.success("Order arrived! Notifying members.");

    const uniqueMembers = Array.from(new Set(activeOrder.members.map(m => m.name)));
    uniqueMembers.forEach(mem => {
      addSystemNotification(
        "🛎️ Your Food Has Arrived!",
        `${activeOrder.restaurantName} order placed by ${activeOrder.makerName} is here.`,
        "general",
        mem
      );
    });
  };

  const markPaid = async (memId: string, paid: boolean) => {
     if (!activeOrder) return;
     let updatedOrder = { 
       ...activeOrder, 
       members: activeOrder.members.map(m => m.id === memId ? { ...m, paid } : m) 
     };
     await updateOrderInDb(updatedOrder);
  };

  const stats = getMonthlyStats();

  return (
    <div className="space-y-6">
       <div>
         <h2 className="text-3xl font-bold text-slate-100 font-display flex items-center gap-2">
           <ShoppingBag className="w-8 h-8 text-fuchsia-500" />
           Team Orders Mini-App
         </h2>
         <p className="text-slate-400 text-sm">Coordinate group food / coffee orders with built-in split bill calculator.</p>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Left col - List and Stats */}
         <div className="lg:col-span-1 space-y-6">
            <div className="bg-fuchsia-950/20 border border-fuchsia-500/20 rounded-3xl p-5 backdrop-blur-xl shadow-xl">
               <h3 className="font-bold text-fuchsia-300 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                 <Calculator className="w-4 h-4" /> Start New Order
               </h3>
               <form onSubmit={handleCreateOrder} className="space-y-3">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block mb-1">Restaurant / Cafe Name</label>
                    <input 
                      required
                      value={restaurantName}
                      onChange={e => setRestaurantName(e.target.value)}
                      placeholder="e.g. Starbucks, KFC..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-fuchsia-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block mb-1">Timer (Minutes)</label>
                    <input 
                      type="number"
                      required min={5}
                      value={timerMinutes}
                      onChange={e => setTimerMinutes(Number(e.target.value))}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-fuchsia-500"
                    />
                  </div>
                  <button type="submit" className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold py-2 rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Open Order Room
                  </button>
               </form>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-xl shadow-xl space-y-3">
              <h3 className="font-bold text-slate-300 text-sm uppercase tracking-wider">Active Orders</h3>
              {getMyActiveOrders().length === 0 ? (
                <p className="text-slate-500 text-xs italic">No active orders right now.</p>
              ) : (
                <div className="space-y-2">
                  {getMyActiveOrders().map(o => (
                    <button 
                      key={o.id}
                      onClick={() => setActiveOrderId(o.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${activeOrderId === o.id ? 'bg-fuchsia-500/20 border-fuchsia-500/50' : 'bg-black/30 border-white/5 hover:border-white/20'}`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-200 text-sm">{o.restaurantName}</span>
                        <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-slate-300 uppercase">{o.status}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Maker: {o.makerName}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-indigo-900/50 to-fuchsia-900/50 border border-indigo-500/30 rounded-3xl p-5 shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/20 blur-3xl" />
               <h3 className="font-bold text-indigo-300 text-sm uppercase tracking-wider mb-2">Monthly Top Orders</h3>
               <div className="space-y-2 text-xs">
                 <div className="flex justify-between items-center bg-black/30 p-2 rounded-lg border border-white/5">
                   <span className="text-slate-400">Most Orders Made:</span>
                   <span className="font-bold text-fuchsia-400">{stats.topMaker || 'N/A'} <span className="text-slate-500 text-[10px]">({stats.makerCount})</span></span>
                 </div>
                 <div className="flex justify-between items-center bg-black/30 p-2 rounded-lg border border-white/5">
                   <span className="text-slate-400">Top Spender:</span>
                   <span className="font-bold text-emerald-400">{stats.topSpender || 'N/A'} <span className="text-slate-500 text-[10px]">({!isNaN(stats.spenderAmount) ? stats.spenderAmount.toFixed(0) : 0} AED)</span></span>
                 </div>
               </div>
            </div>
         </div>

         {/* Right col - Active Order Details */}
         <div className="lg:col-span-2">
            {!activeOrder ? (
               <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
                  <ShoppingBag className="w-16 h-16 text-slate-700 mb-4" />
                  <p className="text-slate-400 font-bold">Select or create an order to manage.</p>
               </div>
            ) : (
               <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-2xl relative">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4 mb-4">
                     <div>
                       <h3 className="text-2xl font-black text-slate-100 flex items-center gap-2">
                         {activeOrder.restaurantName}
                       </h3>
                       <p className="text-xs text-slate-400 mt-1">Created by {activeOrder.makerName} • Timer: {activeOrder.timerMinutes} mins</p>
                     </div>
                     <div className="flex items-center gap-2">
                        {activeOrder.status === 'open' && activeOrder.makerName === currentUser.name && (
                           <button onClick={handleCheckout} className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors">
                             Confirm Details (Checkout)
                           </button>
                        )}
                        {activeOrder.status === 'ordered' && activeOrder.makerName === currentUser.name && (
                           <button onClick={handleArrived} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 animate-pulse">
                             <BellRing className="w-4 h-4" /> Mark Arrived
                           </button>
                        )}
                        <span className="px-3 py-1 font-bold text-[10px] uppercase tracking-widest rounded-lg border bg-black/40 text-slate-300 border-white/10">
                          Status: {activeOrder.status}
                        </span>
                     </div>
                  </div>

                  {/* Calculator & Fees configs - visible to maker mostly, but let's let anyone see it */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-black/40 border border-white/10 p-3 rounded-xl flex items-center justify-between">
                       <span className="text-[10px] text-slate-400 font-bold uppercase">Delivery</span>
                       {activeOrder.status === 'open' && activeOrder.makerName === currentUser.name ? (
                         <input type="number" value={activeOrder.deliveryFee} onChange={e=>handleUpdateFees('deliveryFee', Number(e.target.value))} className="w-16 bg-slate-800 text-right text-sm px-2 py-1 rounded text-slate-200 outline-none" min={0}/>
                       ) : (
                         <span className="text-sm text-slate-200 font-mono">{activeOrder.deliveryFee}</span>
                       )}
                    </div>
                    <div className="bg-black/40 border border-white/10 p-3 rounded-xl flex items-center justify-between">
                       <span className="text-[10px] text-slate-400 font-bold uppercase">Tax</span>
                       {activeOrder.status === 'open' && activeOrder.makerName === currentUser.name ? (
                         <input type="number" value={activeOrder.tax} onChange={e=>handleUpdateFees('tax', Number(e.target.value))} className="w-16 bg-slate-800 text-right text-sm px-2 py-1 rounded text-slate-200 outline-none" min={0}/>
                       ) : (
                         <span className="text-sm text-slate-200 font-mono">{activeOrder.tax}</span>
                       )}
                    </div>
                    <div className="bg-black/40 border border-white/10 p-3 rounded-xl flex items-center justify-between">
                       <span className="text-[10px] text-fuchsia-400 font-bold uppercase">Discount</span>
                       {activeOrder.status === 'open' && activeOrder.makerName === currentUser.name ? (
                         <input type="number" value={activeOrder.discount} onChange={e=>handleUpdateFees('discount', Number(e.target.value))} className="w-16 bg-slate-800 text-right text-sm px-2 py-1 rounded text-fuchsia-300 outline-none" min={0}/>
                       ) : (
                         <span className="text-sm text-fuchsia-300 font-mono">{activeOrder.discount}</span>
                       )}
                    </div>
                  </div>

                  {/* Add Item form */}
                  {activeOrder.status === 'open' && (
                    <div className="bg-indigo-950/20 border border-indigo-500/20 p-4 rounded-2xl mb-6 flex flex-col sm:flex-row gap-3 items-end">
                      <div className="flex-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Agent / Member</label>
                        <select value={selectedMember} onChange={e=>setSelectedMember(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none">
                          <option value={currentUser.name}>Me ({currentUser.name})</option>
                          {users.filter(u => u.name !== currentUser.name).map(u => <option key={u.id || u.name} value={u.name}>{u.name}</option>)}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Item Details</label>
                        <input value={newItemName} onChange={e=>setNewItemName(e.target.value)} placeholder="e.g. Latte large" className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none" />
                      </div>
                      <div className="w-24">
                        <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Cost</label>
                        <input type="number" value={newItemAmount} onChange={e=>setNewItemAmount(Number(e.target.value))} placeholder="0.00" className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none" />
                      </div>
                      <button onClick={handleAddItem} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center h-[34px]">
                        Add
                      </button>
                    </div>
                  )}

                  {/* Members List Matrix */}
                  <div className="space-y-3">
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/10 pb-2">Order Matrix & Splits (Total: {!isNaN(activeOrder.members.reduce((acc, m) => acc + m.finalAmount, 0)) ? activeOrder.members.reduce((acc, m) => acc + m.finalAmount, 0).toFixed(2) : 0} AED)</p>
                     
                     {activeOrder.members.length === 0 ? (
                       <p className="text-slate-500 text-sm italic">No items added yet.</p>
                     ) : (
                       activeOrder.members.map(m => (
                         <div key={m.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-black/40 border border-white/5 rounded-xl gap-2 hover:border-white/10 transition-colors">
                           <div className="flex-1">
                              <p className="font-bold text-slate-200 text-sm">{m.name}</p>
                              <p className="text-xs text-slate-400">{m.itemsName}</p>
                           </div>
                           <div className="text-right sm:text-left min-w-[100px]">
                              <p className="text-xs text-slate-500 line-through">Base: {m.baseAmount.toFixed(2)}</p>
                              <p className="text-sm font-black text-emerald-400 font-mono">{m.finalAmount.toFixed(2)} AED</p>
                           </div>
                           <div className="flex items-center gap-2">
                             <button
                               onClick={() => markPaid(m.id, !m.paid)}
                               className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg border transition-all flex items-center gap-1 ${m.paid ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-red-500/10 text-red-300 border-red-500/20'}`}
                             >
                               {m.paid ? <CheckCircle className="w-3 h-3" /> : <Timer className="w-3 h-3" />}
                               {m.paid ? 'Paid' : 'Unpaid'}
                             </button>
                             {activeOrder.status === 'open' && (activeOrder.makerName === currentUser.name || m.name === currentUser.name) && (
                               <button onClick={() => handleRemoveItem(m.id)} className="p-1 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors">
                                 <Trash2 className="w-4 h-4" />
                               </button>
                             )}
                           </div>
                         </div>
                       ))
                     )}
                  </div>
               </div>
            )}
         </div>
       </div>
    </div>
  );
}
