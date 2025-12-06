"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { DollarSign, Users, TrendingUp, Activity, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  total_spend: string;
  orders_count: number;
}

interface SalesData {
  date: string;
  sales: number;
}

interface DashboardStats {
  totalRevenue: string;
  activeCustomers: number;
  topCustomers: Customer[];
  salesOverTime: SalesData[];
}

export default function Dashboard() {
  const [tenantId, setTenantId] = useState("");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const router = useRouter();

  useEffect(() => {
    const storedTenantId = localStorage.getItem("tenantId");
    if (!storedTenantId) {
      router.push("/login");
    } else {
      setTenantId(storedTenantId);
      // Initial fetch
      fetchStats(storedTenantId);
    }
  }, []);

  const fetchStats = async (tid: string = tenantId) => {
    if (!tid) return;
    setLoading(true);
    setError("");
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";
      const response = await axios.get(`${API_URL}/api/dashboard/stats`, {
        headers: {
          "x-tenant-id": tid,
        },
        params
      });
      setStats(response.data);
    } catch (err) {
      setError("Failed to fetch data.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("tenantId");
    localStorage.removeItem("tenantName");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans p-8">
      <header className="mb-10 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            Xeno Insights
          </h1>
          <p className="text-gray-400 mt-2">Multi-Tenant Shopify Analytics</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-800 p-2 rounded border border-gray-700">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-sm focus:outline-none text-white"
            />
            <span className="text-gray-500">-</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-sm focus:outline-none text-white"
            />
          </div>
          <button
            onClick={() => fetchStats()}
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 transition-colors font-semibold text-sm"
          >
            Filter
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded border border-gray-600 hover:bg-gray-800 transition-colors text-sm"
          >
            Logout
          </button>
        </div>
      </header>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded mb-8">
          {error}
        </div>
      )}

      {loading && <div className="text-center text-gray-400">Loading metrics...</div>}

      {stats && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Total Revenue"
              value={`$${parseFloat(stats.totalRevenue).toFixed(2)}`}
              icon={<DollarSign className="w-6 h-6 text-green-400" />}
              color="from-green-500/20 to-green-900/20"
            />
            <MetricCard
              title="Active Customers"
              value={stats.activeCustomers.toString()}
              icon={<Users className="w-6 h-6 text-blue-400" />}
              color="from-blue-500/20 to-blue-900/20"
            />
            <MetricCard
              title="Avg. Order Value"
              value={
                stats.activeCustomers > 0
                  ? `$${(parseFloat(stats.totalRevenue) / stats.activeCustomers).toFixed(2)}`
                  : "$0.00"
              }
              icon={<TrendingUp className="w-6 h-6 text-purple-400" />}
              color="from-purple-500/20 to-purple-900/20"
            />
          </div>

          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              Sales Trend
            </h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.salesOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6' }}
                    itemStyle={{ color: '#60A5FA' }}
                  />
                  <Line type="monotone" dataKey="sales" stroke="#60A5FA" strokeWidth={2} dot={{ fill: '#60A5FA' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-700 flex items-center gap-2">
              <Activity className="w-5 h-5 text-yellow-400" />
              <h2 className="text-xl font-semibold">Top Customers by Spend</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Orders</th>
                    <th className="px-6 py-4 text-right">Total Spend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {stats.topCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 font-medium">
                        {customer.first_name} {customer.last_name}
                      </td>
                      <td className="px-6 py-4 text-gray-400">{customer.email}</td>
                      <td className="px-6 py-4">{customer.orders_count}</td>
                      <td className="px-6 py-4 text-right font-mono text-green-400">
                        ${parseFloat(customer.total_spend).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className={`p-6 rounded-xl border border-gray-700 bg-gradient-to-br ${color} backdrop-blur-sm`}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">{title}</h3>
        {icon}
      </div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}
