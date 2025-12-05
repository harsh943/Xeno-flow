"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Lock } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";
      const response = await axios.post(`${API_URL}/api/auth/login`, { email });
      const { tenantId, name } = response.data;
      
      localStorage.setItem("tenantId", tenantId);
      localStorage.setItem("tenantName", name);
      
      router.push("/dashboard");
    } catch (err) {
      setError("Invalid email or tenant not found.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-blue-600/20 rounded-full">
            <Lock className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center mb-2">Welcome Back</h1>
        <p className="text-gray-400 text-center mb-8">Enter your owner email to access insights</p>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none text-white transition-colors"
              placeholder="owner@example.com"
              required
            />
          </div>
          
          {error && (
            <div className="text-red-400 text-sm text-center bg-red-500/10 p-2 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 font-semibold transition-all transform hover:scale-[1.02]"
          >
            Access Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}
