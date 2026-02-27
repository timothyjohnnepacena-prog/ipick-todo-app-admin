"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await signIn("credentials", {
      username: form.username,
      password: form.password,
      redirect: false,
    });

    if (res.error) {
      setError("Invalid admin credentials");
    } else {
      router.push("/");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#061621]">
      <div className="w-full max-w-md bg-[#11232e] p-8 rounded-lg border border-gray-700 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white uppercase tracking-widest">Admin Portal</h1>
          <p className="text-gray-400 text-sm mt-2">Manage kanban_db Collections</p>
        </div>
        
        {error && <p className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4 text-sm text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Username</label>
            <input
              type="text"
              className="w-full bg-[#061621] border border-gray-700 rounded p-3 text-white focus:border-green-500 outline-none"
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Password</label>
            <input
              type="password"
              className="w-full bg-[#061621] border border-gray-700 rounded p-3 text-white focus:border-green-500 outline-none"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="w-full bg-[#00684a] hover:bg-[#005c41] text-white font-bold py-3 rounded transition uppercase text-sm tracking-widest">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}