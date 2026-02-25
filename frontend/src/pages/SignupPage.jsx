import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import Typewriter from "typewriter-effect";



const TYPEWRITER_LINES = [
  "Easily manage your money.",
  "Track control of finances.",
  "Track your income and expenses.",
];

function SignupPage() {
  const { signup, parseApiError } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await signup(form.name, form.email, form.password);
      toast.success("Account created successfully");
      navigate("/");
    } catch (error) {
      toast.error(parseApiError(error, "Signup failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-amber-50 via-rose-50 to-orange-100 px-4">
      <div className="pointer-events-none absolute -left-20 top-20 h-64 w-64 rounded-full bg-amber-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-rose-300/30 blur-3xl" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-amber-200 bg-white p-8 shadow-xl">
        <h2 className="mb-1 text-5xl font-extrabold tracking-tight text-neutral-900">Expense Tracker</h2>

        {/* <div className="mt-3 overflow-hidden rounded-md border border-amber-200 bg-amber-50 py-1">
          <p className="whitespace-nowrap px-3 text-xs font-medium text-amber-700">
            Easily manage your money. Track control of finances. Manage your daily expense in one place.
          </p>
        </div> */}
        <div className="mt-2 text-sm text-center text-neutral-500 min-h-6">
                  <Typewriter
                  options={{
                    strings: [
                      "Easily manage your money.",
                      "Track control of finances.",
                      "Track your income and expenses.",
                    ],
                    autoStart: true,
                    loop: true,
                    delay: 55,
                    deleteSpeed: 35,
                    pauseFor: 1100,
                    cursor: "|",
                  }}
                  />
                </div>

        <h1 className="mt-5 text-3xl text-center font-bold text-slate-900">Create Account</h1>
        <p className="mt-2 text-sm text-center text-slate-500">Start tracking your expenses</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-orange-400 focus:outline-none"
              type="text"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-orange-400 focus:outline-none"
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-orange-400 focus:outline-none"
              type="password"
              minLength={6}
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Creating..." : "Sign up"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-orange-700 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default SignupPage;
