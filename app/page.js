"use client";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { User, Mail, ShieldCheck, Trash2 } from "lucide-react";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      fetchUsers();
    }
  }, [status, router]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Specifically fetching the users collection
      const res = await fetch(`/api/admin/db?collection=users`);
      const data = await res.json();
      setUsers(data.data || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") return (
    <div className="min-h-screen flex items-center justify-center bg-[#F1F3F6] text-[#12A55C] font-black uppercase tracking-widest">
      Loading Admin Access...
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F1F3F6] text-slate-800">
      {/* Sidebar - Simplified for User Management */}
      <div className="w-72 bg-white border-r border-slate-200 flex flex-col m-4 rounded-[2.5rem] shadow-xl overflow-hidden">
        <div className="p-8 flex justify-center border-b border-slate-50">
          <img src="/ipick-logo-navbar.png" alt="iPick" className="h-12 object-contain" />
        </div>
        
        <nav className="flex-1 p-6 overflow-y-auto">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-[0.2em] px-2">Management</p>
          <button 
            className="w-full text-left px-5 py-4 rounded-2xl mb-2 font-bold transition-all text-sm bg-[#12A55C] text-white shadow-lg shadow-[#12A55C]/20 flex items-center gap-3"
          >
            <User size={18} /> User Accounts
          </button>
        </nav>

        <div className="p-6 border-t border-slate-50">
          <button 
            onClick={() => signOut()} 
            className="w-full py-4 text-xs text-[#9E2A2B] bg-[#9E2A2B]/5 rounded-2xl hover:bg-[#9E2A2B]/10 transition-colors font-black uppercase tracking-widest"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col py-4 pr-4">
        <header className="h-20 bg-white rounded-[2rem] shadow-sm border border-white flex items-center justify-between px-10 mb-4">
          <div>
            <h2 className="text-xl font-black text-[#12A55C] tracking-tight">User Account Management</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Users: {users.length}</p>
          </div>
          <div className="flex items-center gap-3 text-right">
             <span className="text-xs font-black text-slate-400 hidden md:block uppercase">{session?.user?.username}</span>
             <div className="w-10 h-10 rounded-full bg-[#12A55C]/10 flex items-center justify-center text-[#12A55C] font-black text-sm">
                {session?.user?.username?.charAt(0).toUpperCase()}
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-white rounded-[2.5rem] shadow-sm border border-white p-8">
          {loading ? (
            <div className="flex items-center justify-center h-full text-slate-400 font-medium italic">
              Loading user database...
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {users.map(user => (
                <div key={user._id} className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] hover:border-[#12A55C]/30 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#F37A22]">
                        <User size={24} />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-700 leading-none mb-1">{user.name}</h4>
                        <p className="text-xs text-[#12A55C] font-bold">@{user.username}</p>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-white rounded-full border border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      User ID: ...{user._id.slice(-5)}
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <Mail size={16} className="text-slate-300" />
                      {user.email}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <ShieldCheck size={16} className="text-slate-300" />
                      Nickname: <span className="font-bold text-slate-600">{user.nickname || "N/A"}</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-200/50 flex justify-end">
                    <button className="text-[10px] font-black uppercase text-[#9E2A2B] hover:bg-[#9E2A2B]/10 px-4 py-2 rounded-xl transition-colors flex items-center gap-2">
                      <Trash2 size={14} /> Remove Access
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}