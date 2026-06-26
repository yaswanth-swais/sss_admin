'use client';
import { useEffect, useReducer, useState } from 'react';

function dashboardReducer(state, action) {
  switch (action.type) {
    case 'loading': return { data: null, error: null };
    case 'success': return { data: action.payload, error: null };
    case 'error':   return { data: null, error: action.payload };
    default: return state;
  }
}

export default function WarehouseDashboard() {
  const [{ data, error }, dispatch] = useReducer(dashboardReducer, { data: null, error: null });
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    dispatch({ type: 'loading' });
    fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api/warehouse-data', {
      credentials: 'include'
    })
      .then(res => {
        if (!res.ok) throw new Error(`Server responded with ${res.status}`);
        return res.json();
      })
      .then(d => { if (!cancelled) dispatch({ type: 'success', payload: d }); })
      .catch(err => {
        console.error(err);
        if (!cancelled) dispatch({ type: 'error', payload: err.message || 'Failed to load dashboard data' });
      });
    return () => { cancelled = true; };
  }, [retryKey]);

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-400 font-medium mb-2">Unable to load dashboard data</p>
        <p className="text-slate-500 text-sm mb-4">{error}</p>
        <button onClick={() => setRetryKey(k => k + 1)} className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg text-sm hover:from-cyan-400 hover:to-purple-400 transition-all">
          Retry
        </button>
      </div>
    );
  }

  if (!data) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading Dashboard Data...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Warehouse Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-xl">
          <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider">Weekly Revenue</h3>
          <p className="text-3xl font-bold text-gradient mt-2">${data.analytics.weeklyRevenue.toLocaleString()}</p>
        </div>
        <div className="glass-card p-6 rounded-xl">
          <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider">Active Workers</h3>
          <p className="text-3xl font-bold text-gradient mt-2">{data.analytics.activeWorkers}</p>
        </div>
        <div className="glass-card p-6 rounded-xl">
          <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider">Total Orders</h3>
          <p className="text-3xl font-bold text-gradient mt-2">{data.orders.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Inventory Overview</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className="text-slate-500 border-b border-white/5">
                  <th className="pb-3 text-sm font-medium">Item</th>
                  <th className="pb-3 text-sm font-medium">Quantity</th>
                  <th className="pb-3 text-sm font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {data.inventory.map(item => (
                  <tr key={item.id} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                    <td className="py-3 font-medium">{item.item}</td>
                    <td className="py-3">{item.quantity}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${item.status === 'In Stock' ? 'bg-emerald-500/10 text-emerald-400' : item.status === 'Low Stock' ? 'bg-orange-500/10 text-orange-400' : 'bg-white/5 text-slate-400'}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Recent Orders</h3>
          <div className="space-y-4">
            {data.orders.map(order => (
              <div key={order.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-white/5 rounded-lg bg-white/[0.02]">
                <div>
                  <p className="font-semibold text-white">{order.id}</p>
                  <p className="text-sm text-slate-500">{order.customer}</p>
                </div>
                <div className="sm:text-right mt-2 sm:mt-0">
                  <span className={`px-3 py-1 text-xs rounded-full font-medium ${order.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                    {order.status}
                  </span>
                  <p className="text-xs text-slate-600 mt-1">{order.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
