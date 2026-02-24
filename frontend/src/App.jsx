import { useEffect, useMemo, useState } from "react";
import API from "./services/api";
import "./App.css";

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
  if (!dateValue) {
    return getTodayDate();
  }

  return new Date(dateValue).toISOString().split("T")[0];
}

function getApiErrorMessage(error, fallbackMessage) {
  const response = error?.response?.data;
  if (response?.errors?.length) {
    return response.errors.join(", ");
  }

  if (typeof response === "string" && response.trim()) {
    return response.trim().slice(0, 180);
  }

  if (response?.message) {
    return response.message;
  }

  if (response && typeof response === "object") {
    try {
      const serialized = JSON.stringify(response);
      if (serialized && serialized !== "{}") {
        return serialized.slice(0, 180);
      }
    } catch {
      // fall through
    }
  }

  const status = error?.response?.status;
  const statusText = error?.response?.statusText;
  if (status) {
    return `Request failed (${status}${statusText ? ` ${statusText}` : ""}).`;
  }

  if (error?.message) {
    return error.message;
  }

  return fallbackMessage;
}

function App({ onLogout }) {
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
    setForm({
      title: "",
      amount: "",
      category: "Food",
      date: getTodayDate(),
    });
    setEditingExpenseId(null);
  };

  const loadExpenses = async () => {
    try {
      setIsLoading(true);
      const response = await API.get("/");
      setExpenses(response.data.data ?? response.data);
    } catch (error) {
      console.error("Failed to load expenses:", error);
      alert("Could not load expenses. Check backend connection.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedBudget = localStorage.getItem("monthlyBudget");
    if (savedBudget) {
      setMonthlyBudget(Number(savedBudget));
    }

    loadExpenses();
  }, []);

  const onBudgetChange = (value) => {
    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed < 0) {
      return;
    }

    setMonthlyBudget(parsed);
    localStorage.setItem("monthlyBudget", String(parsed));
  };

  const saveExpense = async (event) => {
    event.preventDefault();

    const trimmedTitle = form.title.trim();
    const amountValue = Number(form.amount);

    if (!trimmedTitle) {
      alert("Title is required.");
      return;
    }

    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      alert("Amount must be a number greater than 0.");
      return;
    }

    const payload = {
      title: trimmedTitle,
      amount: amountValue,
      category: form.category,
      date: form.date,
    };

    try {
      if (editingExpenseId) {
        await API.put(`/${editingExpenseId}`, payload);
      } else {
        await API.post("/", payload);
      }

      resetForm();
      loadExpenses();
    } catch (error) {
      const message = getApiErrorMessage(error, "Could not save expense. Try again.");
      console.error("Failed to save expense:", {
        message,
        method: editingExpenseId ? "PUT" : "POST",
        requestPath: editingExpenseId ? `/${editingExpenseId}` : "/",
        status: error?.response?.status,
        responseData: error?.response?.data,
      });
      alert(message);
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
    if (!confirmed) {
      return;
    }

    try {
      await API.delete(`/${expenseId}`);
      if (editingExpenseId === expenseId) {
        resetForm();
      }
      loadExpenses();
    } catch (error) {
      console.error("Failed to delete expense:", error);
      alert(getApiErrorMessage(error, "Could not delete expense. Try again."));
    }
  };

  const filteredExpenses = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return expenses.filter((expense) => {
      const categoryMatches =
        categoryFilter === "all" || expense.category === categoryFilter;

      const titleMatches =
        normalizedQuery.length === 0 || expense.title.toLowerCase().includes(normalizedQuery);

      return categoryMatches && titleMatches;
    });
  }, [expenses, categoryFilter, searchQuery]);

  const totalSpent = useMemo(
    () => expenses.reduce((sum, expense) => sum + expense.amount, 0),
    [expenses]
  );

  const topCategory = useMemo(() => {
    if (expenses.length === 0) {
      return "None";
    }

    const totalsByCategory = expenses.reduce((acc, expense) => {
      const key = expense.category || "Other";
      acc[key] = (acc[key] || 0) + expense.amount;
      return acc;
    }, {});

    return Object.entries(totalsByCategory).sort((a, b) => b[1] - a[1])[0][0];
  }, [expenses]);

  const budgetUsedPercent =
    monthlyBudget > 0 ? Math.min((totalSpent / monthlyBudget) * 100, 100) : 0;

  const isOverBudget = monthlyBudget > 0 && totalSpent > monthlyBudget;
  const availableCategories = useMemo(() => {
    const dynamicCategories = expenses
      .map((expense) => expense.category)
      .filter((value) => typeof value === "string" && value.trim().length > 0);

    return Array.from(new Set([...CATEGORY_OPTIONS, ...dynamicCategories]));
  }, [expenses]);

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div>
            <p className="eyebrow">Personal Finance</p>
            <h1>Expense Tracker</h1>
            <p>Track expenses with a focused monthly overview</p>
          </div>
          {/* <button type="button" className="logout-btn" onClick={onLogout}>
            Log out
          </button> */}
        </div>
      </header>

      <main className="container">
        <section className="stats-grid" aria-label="Statistics">
          <article className="stat-card">
            <p className="stat-label">Total Spent</p>
            <p className="stat-value">₹{totalSpent.toLocaleString()}</p>
          </article>

          <article className="stat-card">
            <p className="stat-label">Transactions</p>
            <p className="stat-value">{expenses.length}</p>
          </article>

          <article className="stat-card">
            <p className="stat-label">Top Category</p>
            <p className="stat-value">{topCategory}</p>
          </article>
        </section>

        <section className="top-panels">
          <article className="budget-panel">
            <div className="budget-top-row">
              <div>
                <p className="section-title">Monthly Budget</p>
                <p className="budget-caption">
                  {budgetUsedPercent.toFixed(1)}% used
                  {isOverBudget ? " (Over budget)" : ""}
                </p>
              </div>

              <label className="budget-input-wrap" htmlFor="monthly-budget">
                Budget (₹)
                <input
                  id="monthly-budget"
                  type="number"
                  min="0"
                  step="100"
                  value={monthlyBudget}
                  onChange={(e) => onBudgetChange(e.target.value)}
                />
              </label>
            </div>

            <div className="budget-track" role="progressbar" aria-valuenow={budgetUsedPercent}>
              <div
                className={`budget-fill ${isOverBudget ? "over" : ""}`}
                style={{ width: `${budgetUsedPercent}%` }}
              />
            </div>
          </article>

          <article className="form-card">
            <h2 className="section-title">{editingExpenseId ? "Edit Expense" : "Add Expense"}</h2>

            <form className="form-grid" onSubmit={saveExpense}>
              <label>
                Title
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Groceries"
                  maxLength={100}
                />
              </label>

              <label>
                Amount (₹)
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                />
              </label>

              <label>
                Category
                <input
                  type="text"
                  list="category-options"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="e.g. Utilities"
                  maxLength={40}
                />
                <datalist id="category-options">
                  {availableCategories.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              </label>

              <label>
                Date
                <input
                  type="date"
                  value={form.date}
                  max={getTodayDate()}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </label>

              <div className="form-actions">
                <button type="submit" className="primary-btn">
                  {editingExpenseId ? "Update Expense" : "Save Expense"}
                </button>

                {editingExpenseId && (
                  <button type="button" className="secondary-btn" onClick={resetForm}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </article>
        </section>

        <section className="list-card">
          <div className="list-controls">
            <h2 className="section-title">Expenses</h2>

            <div className="control-row">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title"
              />

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
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

          {isLoading && <p className="state-text">Loading expenses...</p>}

          {!isLoading && filteredExpenses.length === 0 && (
            <p className="state-text">No expenses found.</p>
          )}

          {!isLoading && filteredExpenses.length > 0 && (
            <>
              <div className="table-head">
                <span>Expense</span>
                <span>Category / Date</span>
                <span>Amount</span>
                <span>Actions</span>
              </div>
              <ul className="expense-list">
                {filteredExpenses.map((expense) => (
                  <li key={expense._id} className="expense-row">
                    <p className="expense-title">{expense.title}</p>
                    <p className="expense-meta">
                      {expense.category || "Other"} | {new Date(expense.date).toLocaleDateString("en-IN")}
                    </p>
                    <p className="expense-amount">₹{expense.amount.toLocaleString()}</p>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="link-btn edit"
                        onClick={() => startEditingExpense(expense)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="link-btn delete"
                        onClick={() => removeExpense(expense._id, expense.title)}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
