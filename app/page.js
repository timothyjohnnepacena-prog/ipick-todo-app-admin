"use client";
import { useState, useEffect } from "react";

export default function AdminDashboard() {
  const [collections, setCollections] = useState([]);
  const [activeCol, setActiveCol] = useState("");
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/db")
      .then(res => res.json())
      .then(data => {
        setCollections(data.collections || []);
        setLoading(false);
      });
  }, []);

  const selectCollection = async (name) => {
    setLoading(true);
    setActiveCol(name);
    const res = await fetch(`/api/admin/db?collection=${name}`);
    const data = await res.json();
    setDocs(data.data || []);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this document? This action is permanent.")) return;
    await fetch("/api/admin/db", {
      method: "DELETE",
      body: JSON.stringify({ collection: activeCol, id }),
    });
    selectCollection(activeCol);
  };

  return (
    <div className="flex h-screen bg-[#061621] text-gray-300 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-[#11232e] border-r border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-white font-bold text-xl flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            iPick Admin
          </h1>
        </div>
        <nav className="flex-1 p-4 overflow-y-auto">
          <p className="text-xs font-bold text-gray-500 uppercase mb-4">Collections</p>
          {collections.map(col => (
            <button
              key={col}
              onClick={() => selectCollection(col)}
              className={`w-full text-left px-3 py-2 rounded mb-1 transition ${
                activeCol === col ? "bg-[#00684a] text-white" : "hover:bg-[#1e2f3a]"
              }`}
            >
              {col}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-gray-700 flex items-center px-8 bg-[#11232e]">
          <h2 className="text-lg text-white font-medium">
            {activeCol ? `Browse > ${activeCol}` : "Select a collection from the sidebar"}
          </h2>
        </header>
        <main className="flex-1 overflow-auto p-8 bg-[#061621]">
          {loading ? (
            <div className="text-green-500 font-mono">Connecting to Cluster...</div>
          ) : docs.length > 0 ? (
            <div className="space-y-4">
              {docs.map(doc => (
                <div key={doc._id} className="bg-[#1e2f3a] border border-gray-700 rounded p-4 relative group">
                  <button 
                    onClick={() => handleDelete(doc._id)}
                    className="absolute top-4 right-4 text-red-400 opacity-0 group-hover:opacity-100 transition hover:underline"
                  >
                    Delete Document
                  </button>
                  <pre className="text-sm overflow-x-auto text-blue-300 font-mono">
                    {JSON.stringify(doc, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 italic">No documents found in this collection.</div>
          )}
        </main>
      </div>
    </div>
  );
}