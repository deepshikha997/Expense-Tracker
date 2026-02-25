import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import api from "./services/api";
import { useAuth } from "./context/AuthContext";

const MotionArticle = motion.article;

const CATEGORY_OPTIONS = [
  "Food",
  "Travel",
  "Shopping",
  "Entertainment",
  "Health",
  "Bills",
  "Education",
  "Other",
];

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function toInputDate(dateValue) {
  if (!dateValue) return getTodayDate();
  return new Date(dateValue).toISOString().split("T")[0];
}

function App() {
  const { user, logout, parseApiError } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [monthlyBudget, setMonthlyBudget] = useState(15000);
  const [editingExpenseId, setEditingExpenseId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "Food",
    date: getTodayDate(),
  });

  const resetForm = () => {
    setForm({ title: "", amount: "", category: "Food", date: getTodayDate() });
    setEditingExpenseId(null);
  };

  const loadExpenses = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/expenses");
      setExpenses(response.data.data ?? []);
    } catch (error) {
      toast.error(parseApiError(error, "Could not load expenses"));
    } finally {
      setIsLoading(false);
    }
  }, [parseApiError]);

  useEffect(() => {
    const savedBudget = localStorage.getItem("monthlyBudget");
    if (savedBudget) setMonthlyBudget(Number(savedBudget));
    loadExpenses();
  }, [loadExpenses]);

  const onBudgetChange = (value) => {
    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed < 0) return;

    setMonthlyBudget(parsed);
    localStorage.setItem("monthlyBudget", String(parsed));
  };

  const saveExpense = async (event) => {
    event.preventDefault();

    const payload = {
      title: form.title.trim(),
      amount: Number(form.amount),
      category: form.category,
      date: form.date,
    };

    if (!payload.title) {
      toast.error("Title is required");
      return;
    }

    if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    try {
      if (editingExpenseId) {
        await api.put(`/expenses/${editingExpenseId}`, payload);
        toast.success("Expense updated");
      } else {
        await api.post("/expenses", payload);
        toast.success("Expense created");
      }
      resetForm();
      loadExpenses();
    } catch (error) {
      toast.error(parseApiError(error, "Could not save expense"));
    }
  };

  const startEditingExpense = (expense) => {
    setEditingExpenseId(expense._id || expense.id || null);
    setForm({
      title: expense.title || "",
      amount: String(expense.amount ?? ""),
      category: expense.category || "Other",
      date: toInputDate(expense.date),
    });
  };

  const removeExpense = async (expenseId, expenseTitle) => {
    const confirmed = window.confirm(`Delete expense "${expenseTitle}"?`);
    if (!confirmed) return;

    try {
      await api.delete(`/expenses/${expenseId}`);
      if (editingExpenseId === expenseId) resetForm();
      toast.success("Expense deleted");
      loadExpenses();
    } catch (error) {
      toast.error(parseApiError(error, "Could not delete expense"));
    }
  };

  const filteredExpenses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return expenses.filter((expense) => {
      const categoryMatches = categoryFilter === "all" || expense.category === categoryFilter;
      const titleMatches = query.length === 0 || expense.title.toLowerCase().includes(query);
      return categoryMatches && titleMatches;
    });
  }, [expenses, categoryFilter, searchQuery]);

  const totalSpent = useMemo(() => expenses.reduce((sum, exp) => sum + exp.amount, 0), [expenses]);

  const topCategory = useMemo(() => {
    if (expenses.length === 0) return "None";
    const totalsByCategory = expenses.reduce((acc, exp) => {
      const key = exp.category || "Other";
      acc[key] = (acc[key] || 0) + exp.amount;
      return acc;
    }, {});
    return Object.entries(totalsByCategory).sort((a, b) => b[1] - a[1])[0][0];
  }, [expenses]);

  const budgetUsedPercent = monthlyBudget > 0 ? Math.min((totalSpent / monthlyBudget) * 100, 100) : 0;
  const isOverBudget = monthlyBudget > 0 && totalSpent > monthlyBudget;

  const availableCategories = useMemo(() => {
    const dynamicCategories = expenses
      .map((expense) => expense.category)
      .filter((value) => typeof value === "string" && value.trim().length > 0);
    return Array.from(new Set([...CATEGORY_OPTIONS, ...dynamicCategories]));
  }, [expenses]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Expense Tracker</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Welcome, {user?.name || "User"}</h1>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-6 py-6">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MotionArticle initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Total Spent</p>
            <p className="mt-2 text-3xl font-bold">₹{totalSpent.toLocaleString()}</p>
          </MotionArticle>
          <MotionArticle initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Transactions</p>
            <p className="mt-2 text-3xl font-bold">{expenses.length}</p>
          </MotionArticle>
          <MotionArticle initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Top Category</p>
            <p className="mt-2 text-3xl font-bold">{topCategory}</p>
          </MotionArticle>
        </section>

        <section className="grid gap-6 lg:grid-cols-5">
          <article className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Monthly Budget</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {budgetUsedPercent.toFixed(1)}% used {isOverBudget ? "(Over budget)" : ""}
                </p>
              </div>
              <input
                type="number"
                min="0"
                step="100"
                value={monthlyBudget}
                onChange={(event) => onBudgetChange(event.target.value)}
                className="w-36 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div className={`h-2 rounded-full ${isOverBudget ? "bg-rose-500" : "bg-sky-600"}`} style={{ width: `${budgetUsedPercent}%` }} />
            </div>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-3">
            <h2 className="text-lg font-semibold">{editingExpenseId ? "Edit Expense" : "Add Expense"}</h2>
            <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={saveExpense}>
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 focus:border-sky-500 focus:outline-none"
                type="text"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Title"
              />
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 focus:border-sky-500 focus:outline-none"
                type="number"
                value={form.amount}
                onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
                min="0.01"
                step="0.01"
                placeholder="Amount"
              />
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 focus:border-sky-500 focus:outline-none"
                list="category-options"
                value={form.category}
                onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                placeholder="Category"
              />
              <datalist id="category-options">
                {availableCategories.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 focus:border-sky-500 focus:outline-none"
                type="date"
                value={form.date}
                max={getTodayDate()}
                onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
              />
              <div className="flex gap-2">
                <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800" type="submit">
                  {editingExpenseId ? "Update" : "Save"}
                </button>
                {editingExpenseId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </article>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold">Expenses</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search"
              />
              <select
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option value="all">All Categories</option>
                {availableCategories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          {isLoading && <p className="mt-4 text-sm text-slate-500">Loading expenses...</p>}
          {!isLoading && filteredExpenses.length === 0 && <p className="mt-4 text-sm text-slate-500">No expenses found.</p>}

          {!isLoading && filteredExpenses.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-3 py-2">Title</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((expense) => (
                    <tr key={expense._id} className="border-b border-slate-100">
                      <td className="px-3 py-2 font-medium">{expense.title}</td>
                      <td className="px-3 py-2">{expense.category || "Other"}</td>
                      <td className="px-3 py-2">{new Date(expense.date).toLocaleDateString("en-IN")}</td>
                      <td className="px-3 py-2 text-right font-semibold">₹{expense.amount.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right">
                        <button type="button" className="mr-3 text-sky-700 hover:underline" onClick={() => startEditingExpense(expense)}>
                          Edit
                        </button>
                        <button type="button" className="text-rose-700 hover:underline" onClick={() => removeExpense(expense._id, expense.title)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
