import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import Typewriter  from "typewriter-effect";


const TYPEWRITER_LINES = [
  "Easily manage your money.",
  "Track control of finances.",
  "Track your income and expenses.",
];

function LoginPage() {
  const { login, parseApiError } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  const [lineIndex, setLineIndex] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const activeLine = TYPEWRITER_LINES[lineIndex];
    const doneTyping = typedText === activeLine;
    const doneDeleting = typedText === "";

    const timeout = setTimeout(
      () => {
        if (!isDeleting && !doneTyping) {
          setTypedText(activeLine.slice(0, typedText.length + 1));
          return;
        }

        if (!isDeleting && doneTyping) {
          setIsDeleting(true);
          return;
        }

        if (isDeleting && !doneDeleting) {
          setTypedText(activeLine.slice(0, typedText.length - 1));
          return;
        }

        setIsDeleting(false);
        setLineIndex((prev) => (prev + 1) % TYPEWRITER_LINES.length);
      },
      !isDeleting && doneTyping ? 1100 : isDeleting ? 35 : 55
    );

    return () => clearTimeout(timeout);
  }, [typedText, isDeleting, lineIndex]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await login(form.email, form.password);
      toast.success("Logged in successfully");
      navigate("/");
    } catch (error) {
      toast.error(parseApiError(error, "Login failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 px-4">
      <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl">
        <h1 className="mb-1 text-5xl font-extrabold tracking-tight text-neutral-900">Expense Tracker</h1>

        <div className="mt-2 text-sm text-neutral-500 min-h-6">
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

        <h3 className="mt-5 text-2xl text-center font-bold text-slate-900">Login</h3>
        <p className=" text-sm text-center text-neutral-500">Access your expense dashboard securely</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-sky-500 focus:outline-none"
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              required/>
          </div>
          
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-sky-500 focus:outline-none"
              type="password"
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
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          No account?{" "}
          <Link to="/signup" className="font-medium text-sky-700 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
