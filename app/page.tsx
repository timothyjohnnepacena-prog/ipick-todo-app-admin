"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { User, Mail, ShieldCheck, Trash2, CheckCircle, XCircle, List, ClipboardList, Edit3, Search } from "lucide-react";

interface UserData {
    _id: string;
    name: string;
    nickname: string;
    username: string;
    email: string;
    isAdmin: boolean;
    isVerifiedByAdmin: boolean;
    createdAt: string | null;
}

interface ListData {
    _id: string;
    name: string;
    ownerName: string;
    taskCount: number;
    completedCount: number;
}

interface TaskData {
    _id: string;
    text: string;
    listId: string;
    listName: string;
    displayName: string;
    completed: boolean;
    createdAt: string | null;
    completedAt: string | null;
    order: number;
}

type TabKey = "users" | "lists" | "tasks";

export default function AdminDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabKey>("users");
    const [users, setUsers] = useState<UserData[]>([]);
    const [lists, setLists] = useState<ListData[]>([]);
    const [tasks, setTasks] = useState<TaskData[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [taskFilter, setTaskFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    const [editingListId, setEditingListId] = useState<string | null>(null);
    const [editingListName, setEditingListName] = useState("");
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editingTaskText, setEditingTaskText] = useState("");

    useEffect(() => {
        if (status === "unauthenticated") router.push("/login");
        if (status === "authenticated") {
            fetchData();
        }
    }, [status, router]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [usersRes, listsRes, tasksRes] = await Promise.all([
                fetch("/api/admin/users"),
                fetch("/api/admin/lists"),
                fetch("/api/admin/tasks"),
            ]);
            const [usersData, listsData, tasksData] = await Promise.all([
                usersRes.json(),
                listsRes.json(),
                tasksRes.json(),
            ]);
            setUsers(usersData.data || []);
            setLists(listsData.data || []);
            setTasks(tasksData.data || []);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleApproveUser = async (userId: string) => {
        if (!confirm("Approve this user? They will be able to log in to the kanban board.")) return;
        setActionLoading(userId);
        try {
            await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, action: "approve" }),
            });
            setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, isVerifiedByAdmin: true } : u)));
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleRejectUser = async (userId: string) => {
        if (!confirm("Reject this user? They will be unable to log in.")) return;
        setActionLoading(userId);
        try {
            await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, action: "reject" }),
            });
            setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, isVerifiedByAdmin: false } : u)));
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteUser = async (userId: string, name: string) => {
        if (!confirm(`Permanently delete "${name}"? This will also remove all their tasks, lists, and activity logs.`)) return;
        setActionLoading(userId);
        try {
            const res = await fetch("/api/admin/users", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });
            if (res.ok) {
                setUsers((prev) => prev.filter((u) => u._id !== userId));
            } else {
                const data = await res.json();
                alert(data.error || "Failed to delete user");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleRenameList = async (listId: string) => {
        if (!editingListName.trim()) return;
        setActionLoading(listId);
        try {
            await fetch("/api/admin/lists", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ listId, newName: editingListName }),
            });
            setLists((prev) => prev.map((l) => (l._id === listId ? { ...l, name: editingListName } : l)));
            setEditingListId(null);
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteList = async (listId: string, name: string) => {
        if (!confirm(`Delete list "${name}" and all its tasks? This cannot be undone.`)) return;
        setActionLoading(listId);
        try {
            await fetch("/api/admin/lists", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ listId }),
            });
            setLists((prev) => prev.filter((l) => l._id !== listId));
            setTasks((prev) => prev.filter((t) => t.listId !== listId));
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleEditTask = async (taskId: string) => {
        if (!editingTaskText.trim()) return;
        setActionLoading(taskId);
        try {
            await fetch("/api/admin/tasks", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ taskId, newText: editingTaskText }),
            });
            setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, text: editingTaskText } : t)));
            setEditingTaskId(null);
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteTask = async (taskId: string, text: string) => {
        if (!confirm(`Delete task "${text}"?`)) return;
        setActionLoading(taskId);
        try {
            await fetch("/api/admin/tasks", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ taskId }),
            });
            setTasks((prev) => prev.filter((t) => t._id !== taskId));
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    const pendingUsers = users.filter((u) => !u.isVerifiedByAdmin && !u.isAdmin);
    const approvedUsers = users.filter((u) => u.isVerifiedByAdmin && !u.isAdmin);
    const adminUsers = users.filter((u) => u.isAdmin);

    const filteredTasks = tasks.filter((t) => {
        const matchesFilter = taskFilter === "all" || (taskFilter === "pending" && !t.completed) || (taskFilter === "completed" && t.completed);
        const matchesSearch = !searchQuery || t.text.toLowerCase().includes(searchQuery.toLowerCase()) || t.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || t.listName.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    if (status === "loading")
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F1F3F6] text-[#12A55C] font-black uppercase tracking-widest">
                Loading Admin Access...
            </div>
        );

    const sidebarItems: { key: TabKey; label: string; icon: typeof User; count: number }[] = [
        { key: "users", label: "User Accounts", icon: User, count: users.length },
        { key: "lists", label: "Todo Lists", icon: List, count: lists.length },
        { key: "tasks", label: "Todo Tasks", icon: ClipboardList, count: tasks.length },
    ];

    return (
        <div className="flex h-screen bg-[#F1F3F6] text-slate-800">
            {/* Sidebar */}
            <div className="w-72 bg-white border-r border-slate-200 flex flex-col m-4 rounded-[2.5rem] shadow-xl overflow-hidden">
                <div className="p-8 flex justify-center border-b border-slate-50">
                    <img src="/ipick-logo-navbar.png" alt="iPick" className="h-12 object-contain" />
                </div>

                <nav className="flex-1 p-6 overflow-y-auto">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-[0.2em] px-2">Management</p>
                    {sidebarItems.map((item) => (
                        <button
                            key={item.key}
                            onClick={() => setActiveTab(item.key)}
                            className={`w-full text-left px-5 py-4 rounded-2xl mb-2 font-bold transition-all text-sm flex items-center gap-3 ${activeTab === item.key
                                ? "bg-[#12A55C] text-white shadow-lg shadow-[#12A55C]/20"
                                : "text-slate-500 hover:bg-slate-50 hover:text-[#12A55C]"
                                }`}
                        >
                            <item.icon size={18} />
                            {item.label}
                            <span
                                className={`ml-auto text-[10px] font-black px-2 py-0.5 rounded-full ${activeTab === item.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
                                    }`}
                            >
                                {item.count}
                            </span>
                        </button>
                    ))}
                </nav>

                <div className="p-6 border-t border-slate-50">
                    <div className="px-2 mb-3">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Logged in as</p>
                        <p className="text-sm font-bold text-slate-700 truncate">{session?.user?.username}</p>
                    </div>
                    <button
                        onClick={() => signOut()}
                        className="w-full py-4 text-xs text-[#9E2A2B] bg-[#9E2A2B]/5 rounded-2xl hover:bg-[#9E2A2B]/10 transition-colors font-black uppercase tracking-widest"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col py-4 pr-4 overflow-hidden">
                <header className="h-20 bg-white rounded-[2rem] shadow-sm border border-white flex items-center justify-between px-10 mb-4 shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-[#12A55C] tracking-tight">
                            {activeTab === "users" && "User Account Management"}
                            {activeTab === "lists" && "Todo List Management"}
                            {activeTab === "tasks" && "Todo Task Management"}
                        </h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                            {activeTab === "users" && `${pendingUsers.length} pending · ${approvedUsers.length} approved · ${adminUsers.length} admin`}
                            {activeTab === "lists" && `${lists.length} total lists`}
                            {activeTab === "tasks" && `${tasks.filter((t) => !t.completed).length} pending · ${tasks.filter((t) => t.completed).length} completed`}
                        </p>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                        <button
                            onClick={fetchData}
                            disabled={loading}
                            className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#12A55C] bg-[#12A55C]/10 hover:bg-[#12A55C]/20 rounded-xl transition-colors disabled:opacity-50"
                        >
                            {loading ? "Refreshing..." : "Refresh"}
                        </button>
                        <div className="w-10 h-10 rounded-full bg-[#12A55C]/10 flex items-center justify-center text-[#12A55C] font-black text-sm">
                            {session?.user?.username?.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-auto bg-white rounded-[2.5rem] shadow-sm border border-white p-8">
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-slate-400 font-medium italic">Loading data...</div>
                    ) : (
                        <>
                            {/* ════════ USERS TAB ════════ */}
                            {activeTab === "users" && (
                                <div className="space-y-8">
                                    {/* Pending Users */}
                                    {pendingUsers.length > 0 && (
                                        <section>
                                            <div className="flex items-center gap-3 mb-4">
                                                <h3 className="text-sm font-black text-[#F37A22] uppercase tracking-wider">Pending Approval</h3>
                                                <span className="px-3 py-1 bg-[#F37A22]/10 text-[#F37A22] text-[10px] font-black rounded-full">
                                                    {pendingUsers.length}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                {pendingUsers.map((user) => (
                                                    <div key={user._id} className="p-6 bg-amber-50/50 border-2 border-[#F37A22]/20 rounded-[2rem] transition-all hover:shadow-md">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-2xl bg-[#F37A22]/10 flex items-center justify-center text-[#F37A22]">
                                                                    <User size={24} />
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-black text-slate-700 leading-none mb-1">{user.name}</h4>
                                                                    <p className="text-xs text-[#F37A22] font-bold">@{user.username}</p>
                                                                </div>
                                                            </div>
                                                            <span className="px-3 py-1 bg-amber-100 text-amber-600 text-[9px] font-black uppercase tracking-widest rounded-full animate-pulse">
                                                                Pending
                                                            </span>
                                                        </div>
                                                        <div className="space-y-1.5 mt-3">
                                                            <div className="flex items-center gap-3 text-sm text-slate-500">
                                                                <Mail size={14} className="text-slate-300" /> {user.email}
                                                            </div>
                                                            <div className="flex items-center gap-3 text-sm text-slate-500">
                                                                <ShieldCheck size={14} className="text-slate-300" /> Nickname:{" "}
                                                                <span className="font-bold text-slate-600">{user.nickname || "N/A"}</span>
                                                            </div>
                                                        </div>
                                                        <div className="mt-5 pt-4 border-t border-amber-200/50 flex justify-end gap-2">
                                                            <button
                                                                onClick={() => handleApproveUser(user._id)}
                                                                disabled={actionLoading === user._id}
                                                                className="text-[10px] font-black uppercase text-[#12A55C] bg-[#12A55C]/10 hover:bg-[#12A55C]/20 px-4 py-2 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                                                            >
                                                                <CheckCircle size={14} /> Approve
                                                            </button>
                                                            <button
                                                                onClick={() => handleRejectUser(user._id)}
                                                                disabled={actionLoading === user._id}
                                                                className="text-[10px] font-black uppercase text-[#9E2A2B] bg-[#9E2A2B]/10 hover:bg-[#9E2A2B]/20 px-4 py-2 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                                                            >
                                                                <XCircle size={14} /> Reject
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {/* Approved Users */}
                                    <section>
                                        <div className="flex items-center gap-3 mb-4">
                                            <h3 className="text-sm font-black text-[#12A55C] uppercase tracking-wider">Approved Users</h3>
                                            <span className="px-3 py-1 bg-[#12A55C]/10 text-[#12A55C] text-[10px] font-black rounded-full">
                                                {approvedUsers.length}
                                            </span>
                                        </div>
                                        {approvedUsers.length === 0 ? (
                                            <div className="text-center py-12 text-slate-400 italic text-sm">No approved users yet.</div>
                                        ) : (
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                {approvedUsers.map((user) => (
                                                    <div key={user._id} className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] hover:border-[#12A55C]/30 transition-all group">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#12A55C]">
                                                                    <User size={24} />
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-black text-slate-700 leading-none mb-1">{user.name}</h4>
                                                                    <p className="text-xs text-[#12A55C] font-bold">@{user.username}</p>
                                                                </div>
                                                            </div>
                                                            <span className="px-3 py-1 bg-[#12A55C]/10 text-[#12A55C] text-[9px] font-black uppercase tracking-widest rounded-full">
                                                                Approved
                                                            </span>
                                                        </div>
                                                        <div className="space-y-1.5 mt-3">
                                                            <div className="flex items-center gap-3 text-sm text-slate-500">
                                                                <Mail size={14} className="text-slate-300" /> {user.email}
                                                            </div>
                                                            <div className="flex items-center gap-3 text-sm text-slate-500">
                                                                <ShieldCheck size={14} className="text-slate-300" /> Nickname:{" "}
                                                                <span className="font-bold text-slate-600">{user.nickname || "N/A"}</span>
                                                            </div>
                                                        </div>
                                                        <div className="mt-5 pt-4 border-t border-slate-200/50 flex justify-end gap-2">
                                                            <button
                                                                onClick={() => handleRejectUser(user._id)}
                                                                disabled={actionLoading === user._id}
                                                                className="text-[10px] font-black uppercase text-slate-400 hover:text-[#9E2A2B] hover:bg-[#9E2A2B]/10 px-4 py-2 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                                                            >
                                                                <XCircle size={14} /> Revoke
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteUser(user._id, user.name)}
                                                                disabled={actionLoading === user._id}
                                                                className="text-[10px] font-black uppercase text-[#9E2A2B] hover:bg-[#9E2A2B]/10 px-4 py-2 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                                                            >
                                                                <Trash2 size={14} /> Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </section>

                                    {/* Admin Users */}
                                    {adminUsers.length > 0 && (
                                        <section>
                                            <div className="flex items-center gap-3 mb-4">
                                                <h3 className="text-sm font-black text-slate-600 uppercase tracking-wider">Admin Accounts</h3>
                                                <span className="px-3 py-1 bg-slate-100 text-slate-400 text-[10px] font-black rounded-full">
                                                    {adminUsers.length}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                {adminUsers.map((user) => (
                                                    <div key={user._id} className="p-6 bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200 rounded-[2rem]">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-2xl bg-slate-600 flex items-center justify-center text-white">
                                                                <ShieldCheck size={24} />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-black text-slate-700 leading-none mb-1">{user.name}</h4>
                                                                <p className="text-xs text-slate-400 font-bold">@{user.username} · Admin</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}
                                </div>
                            )}

                            {/* ════════ LISTS TAB ════════ */}
                            {activeTab === "lists" && (
                                <div>
                                    {lists.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                                            <List size={48} className="mb-4 opacity-30" />
                                            <p className="font-bold">No todo lists found</p>
                                            <p className="text-sm">Lists created in the kanban board will appear here.</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="border-b-2 border-slate-200">
                                                        <th className="py-3 px-4 text-[10px] font-black uppercase tracking-wider text-slate-400">List Name</th>
                                                        <th className="py-3 px-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Owner</th>
                                                        <th className="py-3 px-4 text-[10px] font-black uppercase tracking-wider text-slate-400 text-center">Tasks</th>
                                                        <th className="py-3 px-4 text-[10px] font-black uppercase tracking-wider text-slate-400 text-center">Completed</th>
                                                        <th className="py-3 px-4 text-[10px] font-black uppercase tracking-wider text-slate-400 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {lists.map((list) => (
                                                        <tr key={list._id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors group">
                                                            <td className="py-4 px-4">
                                                                {editingListId === list._id ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <input
                                                                            value={editingListName}
                                                                            onChange={(e) => setEditingListName(e.target.value)}
                                                                            onKeyDown={(e) => e.key === "Enter" && handleRenameList(list._id)}
                                                                            className="px-3 py-1.5 border border-[#12A55C] rounded-xl text-sm outline-none w-48"
                                                                            autoFocus
                                                                        />
                                                                        <button onClick={() => handleRenameList(list._id)} className="text-[#12A55C] text-xs font-black uppercase hover:underline">
                                                                            Save
                                                                        </button>
                                                                        <button onClick={() => setEditingListId(null)} className="text-slate-400 text-xs font-black uppercase hover:underline">
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-sm font-bold text-slate-700">{list.name}</span>
                                                                )}
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <span className="text-xs font-bold text-[#F37A22] bg-[#F37A22]/10 px-2.5 py-1 rounded-lg">{list.ownerName}</span>
                                                            </td>
                                                            <td className="py-4 px-4 text-center">
                                                                <span className="text-sm font-bold text-slate-600">{list.taskCount}</span>
                                                            </td>
                                                            <td className="py-4 px-4 text-center">
                                                                <span className="text-sm font-bold text-[#12A55C]">{list.completedCount}</span>
                                                            </td>
                                                            <td className="py-4 px-4 text-right">
                                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditingListId(list._id);
                                                                            setEditingListName(list.name);
                                                                        }}
                                                                        className="text-[10px] font-black uppercase text-blue-500 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                                                    >
                                                                        <Edit3 size={12} /> Rename
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteList(list._id, list.name)}
                                                                        disabled={actionLoading === list._id}
                                                                        className="text-[10px] font-black uppercase text-[#9E2A2B] hover:bg-[#9E2A2B]/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                                                                    >
                                                                        <Trash2 size={12} /> Delete
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ════════ TASKS TAB ════════ */}
                            {activeTab === "tasks" && (
                                <div>
                                    {/* Filter Bar */}
                                    <div className="flex flex-wrap gap-3 items-center mb-6 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                        <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-3 py-2 flex-1 max-w-sm">
                                            <Search size={16} className="text-slate-300" />
                                            <input
                                                type="text"
                                                placeholder="Search tasks, users, lists..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="flex-1 outline-none text-sm text-slate-700 placeholder:text-slate-300"
                                            />
                                        </div>
                                        <div className="flex gap-1">
                                            {[
                                                { key: "all", label: "All" },
                                                { key: "pending", label: "Pending" },
                                                { key: "completed", label: "Completed" },
                                            ].map((f) => (
                                                <button
                                                    key={f.key}
                                                    onClick={() => setTaskFilter(f.key)}
                                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors ${taskFilter === f.key
                                                        ? "bg-[#12A55C] text-white"
                                                        : "bg-white text-slate-400 border border-slate-200 hover:bg-slate-100"
                                                        }`}
                                                >
                                                    {f.label}
                                                </button>
                                            ))}
                                        </div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-auto">
                                            {filteredTasks.length} result{filteredTasks.length !== 1 ? "s" : ""}
                                        </span>
                                    </div>

                                    {filteredTasks.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                                            <ClipboardList size={48} className="mb-4 opacity-30" />
                                            <p className="font-bold">No tasks found</p>
                                            <p className="text-sm">Try adjusting your filters or search query.</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="border-b-2 border-slate-200">
                                                        <th className="py-3 px-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Task</th>
                                                        <th className="py-3 px-4 text-[10px] font-black uppercase tracking-wider text-slate-400">List</th>
                                                        <th className="py-3 px-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Owner</th>
                                                        <th className="py-3 px-4 text-[10px] font-black uppercase tracking-wider text-slate-400 text-center">Status</th>
                                                        <th className="py-3 px-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Created</th>
                                                        <th className="py-3 px-4 text-[10px] font-black uppercase tracking-wider text-slate-400 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredTasks.map((task) => (
                                                        <tr key={task._id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors group">
                                                            <td className="py-3 px-4 max-w-xs">
                                                                {editingTaskId === task._id ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <input
                                                                            value={editingTaskText}
                                                                            onChange={(e) => setEditingTaskText(e.target.value)}
                                                                            onKeyDown={(e) => e.key === "Enter" && handleEditTask(task._id)}
                                                                            className="px-3 py-1.5 border border-[#12A55C] rounded-xl text-sm outline-none w-full"
                                                                            autoFocus
                                                                        />
                                                                        <button onClick={() => handleEditTask(task._id)} className="text-[#12A55C] text-xs font-black uppercase hover:underline shrink-0">
                                                                            Save
                                                                        </button>
                                                                        <button onClick={() => setEditingTaskId(null)} className="text-slate-400 text-xs font-black uppercase hover:underline shrink-0">
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <span className={`text-sm font-semibold ${task.completed ? "text-slate-400 line-through" : "text-slate-700"}`}>
                                                                        {task.text}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <span className="text-xs font-bold text-[#12A55C] bg-[#12A55C]/10 px-2.5 py-1 rounded-lg">{task.listName}</span>
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <span className="text-xs font-bold text-[#F37A22] bg-[#F37A22]/10 px-2.5 py-1 rounded-lg">{task.displayName}</span>
                                                            </td>
                                                            <td className="py-3 px-4 text-center">
                                                                {task.completed ? (
                                                                    <span className="text-[9px] font-black uppercase tracking-widest bg-[#12A55C]/10 text-[#12A55C] px-2.5 py-1 rounded-full">
                                                                        Done
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-600 px-2.5 py-1 rounded-full">
                                                                        Pending
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="py-3 px-4 text-xs text-slate-500 font-medium whitespace-nowrap">
                                                                {task.createdAt
                                                                    ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(
                                                                        new Date(task.createdAt)
                                                                    )
                                                                    : "—"}
                                                            </td>
                                                            <td className="py-3 px-4 text-right">
                                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditingTaskId(task._id);
                                                                            setEditingTaskText(task.text);
                                                                        }}
                                                                        className="text-[10px] font-black uppercase text-blue-500 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                                                    >
                                                                        <Edit3 size={12} /> Edit
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteTask(task._id, task.text)}
                                                                        disabled={actionLoading === task._id}
                                                                        className="text-[10px] font-black uppercase text-[#9E2A2B] hover:bg-[#9E2A2B]/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                                                                    >
                                                                        <Trash2 size={12} /> Delete
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}
