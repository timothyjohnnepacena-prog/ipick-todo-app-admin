"use client";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [collections, setCollections] = useState([]);
  const [activeCol, setActiveCol] = useState("");
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      fetch("/api/admin/db")
        .then(res => res.json())
        .then(data => {
          setCollections(data.collections || []);
          setLoading(false);
        });
    }
  }, [status]);

  if (status === "loading") return <div className="bg-[#061621] h-screen text-green-500 p-10">Checking Authorization...</div>;

  const selectCollection = async (name) => {
    setLoading(true);
    setActiveCol(name);
    const res = await fetch(`/api/admin/db?collection=${name}`);
    const data = await res.json();
    setDocs(data.data || []);
    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-[#061621] text-gray-300">
      {/* Sidebar */}
      <div className="w-64 bg-[#11232e] border-r border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <h1 className="text-white font-bold text-xl flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span> iPick Admin
          </h1>
        </div>
        <nav className="flex-1 p-4 overflow-y-auto">
          <p className="text-xs font-bold text-gray-500 uppercase mb-4 tracking-wider">Collections</p>
          {collections.map(col => (
            <button key={col} onClick={() => selectCollection(col)} className={`w-full text-left px-3 py-2 rounded mb-1 transition ${activeCol === col ? "bg-[#00684a] text-white" : "hover:bg-[#1e2f3a]"}`}>{col}</button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700">
          <button onClick={() => signOut()} className="w-full text-xs text-red-400 hover:text-red-300 text-left font-bold uppercase">Logout</button>
        </div>
      </div>

      {/* Main content remains the same... */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-gray-700 flex items-center px-8 bg-[#11232e]">
          <h2 className="text-lg text-white font-medium">{activeCol ? `Browse > ${activeCol}` : `Welcome, ${session?.user?.username}`}</h2>
        </header>
        <main className="flex-1 overflow-auto p-8">
           {/* Document list mapping here... */}
           {docs.map(doc => (
              <pre key={doc._id} className="p-4 bg-[#1e2f3a] border border-gray-700 rounded mb-4 text-blue-300 text-xs overflow-x-auto">
                {JSON.stringify(doc, null, 2)}
              </pre>
           ))}
        </main>
      </div>
    </div>
  );
}