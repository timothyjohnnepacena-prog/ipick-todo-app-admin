"use client";
import { signIn } from "next-auth/react";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [form, setForm] = useState({ username: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const res = await signIn("credentials", {
            username: form.username,
            password: form.password,
            redirect: false,
        });

        if (res?.error) {
            setError("Invalid admin credentials");
            setLoading(false);
        } else {
            router.push("/");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F1F3F6] p-4 text-slate-800">
            <div className="bg-white p-10 md:p-12 rounded-[3rem] shadow-2xl w-full max-w-md border border-white">
                <div className="flex justify-center mb-6">
                    <img src="/ipick-logo-navbar.png" alt="iPick Admin" className="h-20 object-contain" />
                </div>

                <h1 className="text-3xl font-black mb-2 text-[#12A55C] uppercase text-center tracking-tighter">Admin Portal</h1>
                <p className="text-slate-400 mb-8 text-center text-sm font-medium">Manage team database and collections</p>

                {error && (
                    <div className="mb-6 bg-[#9E2A2B]/10 text-[#9E2A2B] text-xs font-bold py-3 px-4 rounded-xl text-center border border-[#9E2A2B]/20">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <input
                            type="text"
                            placeholder="Admin Username"
                            className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:border-[#12A55C] border-2 border-transparent transition-colors"
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:border-[#12A55C] border-2 border-transparent transition-colors"
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            required
                        />
                    </div>

                    <button
                        disabled={loading}
                        type="submit"
                        className="w-full bg-[#12A55C] text-white font-black py-5 rounded-[2rem] hover:bg-[#0e8549] transition-all uppercase tracking-widest text-sm shadow-xl shadow-[#12A55C]/20 disabled:bg-slate-300"
                    >
                        {loading ? "Authenticating..." : "Sign In to Dashboard"}
                    </button>
                </form>
            </div>
        </div>
    );
}
