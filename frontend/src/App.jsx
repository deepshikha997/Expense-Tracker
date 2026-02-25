import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import api from "./services/api";
import { useAuth } from "./context/AuthContext";

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

  const editingExpense = useMemo(
    () => expenses.find((expense) => (expense._id || expense.id) === editingExpenseId) || null,
    [expenses, editingExpenseId]
  );

  return (
    <div className="min-h-screen bg-slate-100">
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
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Total Spent</p>
            <p className="mt-2 text-3xl font-bold">{totalSpent.toLocaleString()}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Transactions</p>
            <p className="mt-2 text-3xl font-bold">{expenses.length}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-5 sm:col-span-2 xl:col-span-1">
            <p className="text-sm text-slate-500">Top Category</p>
            <p className="mt-2 text-3xl font-bold">{topCategory}</p>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-12">
          <article className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-4 lg:h-fit lg:sticky lg:top-4">
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
              <div
                className={`h-2 rounded-full ${isOverBudget ? "bg-rose-500" : "bg-sky-600"}`}
                style={{ width: `${budgetUsedPercent}%` }}
              />
            </div>

            <div className="mt-6 border-t border-slate-100 pt-6">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold">{editingExpenseId ? "Edit Expense" : "Add Expense"}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {editingExpenseId
                      ? "Update selected expense and click Update Expense."
                      : "Fill details and click Save Expense."}
                  </p>
                </div>
                {editingExpenseId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Clear
                  </button>
                )}
              </div>

              {editingExpense && (
                <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">
                  Editing: <span className="font-semibold">{editingExpense.title}</span>
                </div>
              )}

              <form className="mt-4 grid gap-3" onSubmit={saveExpense}>
                <div className="grid gap-1.5">
                  <label htmlFor="title" className="text-sm font-medium text-slate-700">
                    Title
                  </label>
                  <input
                    id="title"
                    className="rounded-lg border border-slate-300 px-3 py-2 focus:border-sky-500 focus:outline-none"
                    type="text"
                    value={form.title}
                    onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder="Ex: Grocery shopping"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <label htmlFor="amount" className="text-sm font-medium text-slate-700">
                      Amount
                    </label>
                    <input
                      id="amount"
                      className="rounded-lg border border-slate-300 px-3 py-2 focus:border-sky-500 focus:outline-none"
                      type="number"
                      value={form.amount}
                      onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <label htmlFor="date" className="text-sm font-medium text-slate-700">
                      Date
                    </label>
                    <input
                      id="date"
                      className="rounded-lg border border-slate-300 px-3 py-2 focus:border-sky-500 focus:outline-none"
                      type="date"
                      value={form.date}
                      max={getTodayDate()}
                      onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <label htmlFor="category" className="text-sm font-medium text-slate-700">
                    Category
                  </label>
                  <input
                    id="category"
                    className="rounded-lg border border-slate-300 px-3 py-2 focus:border-sky-500 focus:outline-none"
                    list="category-options"
                    value={form.category}
                    onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                    placeholder="Ex: Food"
                  />
                </div>

                <datalist id="category-options">
                  {availableCategories.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>

                <div className="mt-1 flex flex-wrap gap-2">
                  <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800" type="submit">
                    {editingExpenseId ? "Update Expense" : "Save Expense"}
                  </button>
                  {editingExpenseId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </div>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Expenses</h2>
                <p className="text-sm text-slate-500">Click Edit to load any row into the form.</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search title"
                />
                <select
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                >
                  <option value="all">All Categories</option>
                  {availableCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
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
                    {filteredExpenses.map((expense) => {
                      const rowId = expense._id || expense.id;
                      const isEditingRow = editingExpenseId === rowId;

                      return (
                        <tr key={rowId} className={`border-b border-slate-100 ${isEditingRow ? "bg-sky-50" : "hover:bg-slate-50"}`}>
                          <td className="px-3 py-2 font-medium">{expense.title}</td>
                          <td className="px-3 py-2">{expense.category || "Other"}</td>
                          <td className="px-3 py-2">{new Date(expense.date).toLocaleDateString("en-IN")}</td>
                          <td className="px-3 py-2 text-right font-semibold">{expense.amount.toLocaleString()}</td>
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              className="mr-3 text-sky-700 hover:underline"
                              onClick={() => startEditingExpense(expense)}
                            >
                              {isEditingRow ? "Editing" : "Edit"}
                            </button>
                            <button
                              type="button"
                              className="text-rose-700 hover:underline"
                              onClick={() => removeExpense(rowId, expense.title)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </section>
      </main>
    </div>
  );
}

export default App;
