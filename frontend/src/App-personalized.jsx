import { useEffect, useState, useMemo } from "react";
import API from "./services/api";
import "./App.css";

function App() {
  // State management
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "Food",
    date: new Date().toISOString().split("T")[0],
  });
  const [activeFilter, setActiveFilter] = useState("all");
  const [budget, setBudget] = useState(10000);
  const [showSettings, setShowSettings] = useState(false);
  const [sortBy, setSortBy] = useState("date"); // date, amount, category
  const [viewMode, setViewMode] = useState("grid"); // grid or list

  // My custom categories with unique color scheme
  const myCategories = {
    Food: { icon: "🍕", color: "#ff6b6b", light: "#ffe0e0" },
    Transport: { icon: "🚗", color: "#4dabf7", light: "#d0ebff" },
    Shopping: { icon: "🛒", color: "#a78bfa", light: "#ede9fe" },
    Entertainment: { icon: "🎮", color: "#ffa94d", light: "#ffe8cc" },
    Healthcare: { icon: "⚕️", color: "#51cf66", light: "#d3f9d8" },
    Utilities: { icon: "⚡", color: "#5c7cfa", light: "#dbe4ff" },
    Learning: { icon: "📖", color: "#ff6b9d", light: "#ffdeeb" },
    Misc: { icon: "📌", color: "#868e96", light: "#f1f3f5" },
  };

  // Load expenses on mount
  useEffect(() => {
    loadExpenses();
    // Load budget from localStorage
    const savedBudget = localStorage.getItem("monthlyBudget");
    if (savedBudget) setBudget(Number(savedBudget));
  }, []);

  // API Calls
  const loadExpenses = async () => {
    try {
      const response = await API.get("/");
      setExpenses(response.data);
    } catch (err) {
      console.error("Failed to load expenses:", err);
    }
  };

  const addNewExpense = async (e) => {
    e.preventDefault();

    if (!form.title.trim() || !form.amount) {
      alert("Please fill in title and amount");
      return;
    }

    try {
      await API.post("/", {
        ...form,
        amount: parseFloat(form.amount),
      });

      // Reset form
      setForm({
        title: "",
        amount: "",
        category: "Food",
        date: new Date().toISOString().split("T")[0],
      });

      loadExpenses();
    } catch (err) {
      console.error("Error adding expense:", err);
      alert("Couldn't add expense. Try again!");
    }
  };

  const removeExpense = async (id) => {
    if (!confirm("Delete this expense?")) return;

    try {
      await API.delete(`/${id}`);
      loadExpenses();
    } catch (err) {
      console.error("Error deleting:", err);
    }
  };

  // My custom calculations using useMemo for performance
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = expenses.filter((exp) => {
      const expDate = new Date(exp.date);
      return (
        expDate.getMonth() === now.getMonth() &&
        expDate.getFullYear() === now.getFullYear()
      );
    });

    const monthlySpent = thisMonth.reduce((sum, exp) => sum + exp.amount, 0);
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Calculate category breakdown
    const byCategory = {};
    expenses.forEach((exp) => {
      const cat = exp.category || "Misc";
      byCategory[cat] = (byCategory[cat] || 0) + exp.amount;
    });

    const topSpending = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];

    return {
      monthlySpent,
      totalSpent,
      remaining: budget - monthlySpent,
      percentage: budget > 0 ? (monthlySpent / budget) * 100 : 0,
      topCategory: topSpending ? topSpending[0] : "None",
      topAmount: topSpending ? topSpending[1] : 0,
      count: expenses.length,
      monthlyCount: thisMonth.length,
      avgExpense: expenses.length > 0 ? totalSpent / expenses.length : 0,
    };
  }, [expenses, budget]);

  // Filter and sort logic
  const displayedExpenses = useMemo(() => {
    let filtered =
      activeFilter === "all"
        ? expenses
        : expenses.filter((exp) => exp.category === activeFilter);

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "date") return new Date(b.date) - new Date(a.date);
      if (sortBy === "amount") return b.amount - a.amount;
      if (sortBy === "category") return a.category.localeCompare(b.category);
      return 0;
    });

    return sorted;
  }, [expenses, activeFilter, sortBy]);

  // Save budget to localStorage
  const updateBudget = (newBudget) => {
    setBudget(newBudget);
    localStorage.setItem("monthlyBudget", newBudget);
  };

  // Get status color based on budget usage
  const getBudgetStatus = () => {
    if (stats.percentage < 50) return "safe";
    if (stats.percentage < 80) return "warning";
    return "danger";
  };

  return (
    <div className="app-container">
      {/* Custom Header */}
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon">₹</div>
          <div className="brand-text">
            <h1>MyExpenseLog</h1>
            <p>Smart Finance Tracker</p>
          </div>
        </div>
        <button 
          className="settings-btn" 
          onClick={() => setShowSettings(!showSettings)}
          title="Settings"
        >
          ⚙️
        </button>
      </header>

      <div className="main-content">
        {/* Budget Settings Modal */}
        {showSettings && (
          <div className="modal-overlay" onClick={() => setShowSettings(false)}>
            <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
              <h3>⚙️ Settings</h3>
              <div className="setting-item">
                <label>Monthly Budget (₹)</label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => updateBudget(Number(e.target.value))}
                  min="0"
                />
              </div>
              <button onClick={() => setShowSettings(false)}>Done</button>
            </div>
          </div>
        )}

        {/* Budget Overview Card */}
        <div className={`budget-card ${getBudgetStatus()}`}>
          <div className="budget-info">
            <h3>Monthly Budget</h3>
            <div className="budget-amounts">
              <div>
                <span className="label">Spent</span>
                <span className="value">₹{stats.monthlySpent.toLocaleString()}</span>
              </div>
              <div>
                <span className="label">Budget</span>
                <span className="value">₹{budget.toLocaleString()}</span>
              </div>
              <div>
                <span className="label">Left</span>
                <span className="value">₹{stats.remaining.toLocaleString()}</span>
              </div>
            </div>
            <div className="budget-bar">
              <div
                className="budget-progress"
                style={{ width: `${Math.min(stats.percentage, 100)}%` }}
              />
            </div>
            <p className="budget-text">
              {stats.percentage.toFixed(1)}% of budget used
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="quick-stats">
          <div className="stat-box">
            <div className="stat-icon">💰</div>
            <div className="stat-details">
              <span className="stat-value">₹{stats.totalSpent.toLocaleString()}</span>
              <span className="stat-label">Total Spent</span>
            </div>
          </div>

          <div className="stat-box">
            <div className="stat-icon">📝</div>
            <div className="stat-details">
              <span className="stat-value">{stats.count}</span>
              <span className="stat-label">Expenses</span>
            </div>
          </div>

          <div className="stat-box">
            <div className="stat-icon">{myCategories[stats.topCategory]?.icon || "📌"}</div>
            <div className="stat-details">
              <span className="stat-value">{stats.topCategory}</span>
              <span className="stat-label">Top Spending</span>
            </div>
          </div>

          <div className="stat-box">
            <div className="stat-icon">📊</div>
            <div className="stat-details">
              <span className="stat-value">₹{stats.avgExpense.toFixed(0)}</span>
              <span className="stat-label">Avg Expense</span>
            </div>
          </div>
        </div>

        {/* Add Expense Form */}
        <div className="expense-form-card">
          <h2>➕ Add Expense</h2>
          <form onSubmit={addNewExpense}>
            <div className="form-row">
              <div className="input-group">
                <label>What did you spend on?</label>
                <input
                  type="text"
                  placeholder="e.g., Coffee at Starbucks"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  maxLength="50"
                />
              </div>

              <div className="input-group">
                <label>Amount</label>
                <input
                  type="number"
                  placeholder="₹ 0.00"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="input-group">
                <label>Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {Object.keys(myCategories).map((cat) => (
                    <option key={cat} value={cat}>
                      {myCategories[cat].icon} {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>

            <button type="submit" className="add-btn">
              Add Expense
            </button>
          </form>
        </div>

        {/* Expenses Section */}
        <div className="expenses-section">
          <div className="section-header">
            <h2>My Expenses</h2>
            <div className="controls">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="date">Sort by Date</option>
                <option value="amount">Sort by Amount</option>
                <option value="category">Sort by Category</option>
              </select>

              <div className="view-toggle">
                <button
                  className={viewMode === "grid" ? "active" : ""}
                  onClick={() => setViewMode("grid")}
                  title="Grid view"
                >
                  ⊞
                </button>
                <button
                  className={viewMode === "list" ? "active" : ""}
                  onClick={() => setViewMode("list")}
                  title="List view"
                >
                  ☰
                </button>
              </div>
            </div>
          </div>

          {/* Category Filters */}
          <div className="category-filters">
            <button
              className={`filter-chip ${activeFilter === "all" ? "active" : ""}`}
              onClick={() => setActiveFilter("all")}
            >
              All ({expenses.length})
            </button>
            {Object.keys(myCategories).map((cat) => {
              const count = expenses.filter((e) => e.category === cat).length;
              if (count === 0) return null;
              return (
                <button
                  key={cat}
                  className={`filter-chip ${activeFilter === cat ? "active" : ""}`}
                  onClick={() => setActiveFilter(cat)}
                  style={{
                    backgroundColor:
                      activeFilter === cat ? myCategories[cat].light : "transparent",
                    color: activeFilter === cat ? myCategories[cat].color : "#666",
                  }}
                >
                  {myCategories[cat].icon} {cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Expense List */}
          {displayedExpenses.length === 0 ? (
            <div className="empty-message">
              <div className="empty-icon">📭</div>
              <p>No expenses yet!</p>
              <p className="empty-hint">
                {activeFilter === "all"
                  ? "Add your first expense above"
                  : `No expenses in ${activeFilter} category`}
              </p>
            </div>
          ) : (
            <div className={`expense-list ${viewMode}`}>
              {displayedExpenses.map((expense) => {
                const catInfo = myCategories[expense.category] || myCategories.Misc;
                return (
                  <div key={expense._id} className="expense-item">
                    <div
                      className="expense-icon"
                      style={{ backgroundColor: catInfo.light, color: catInfo.color }}
                    >
                      {catInfo.icon}
                    </div>
                    <div className="expense-details">
                      <h4>{expense.title}</h4>
                      <div className="expense-meta">
                        <span
                          className="category-tag"
                          style={{
                            backgroundColor: catInfo.light,
                            color: catInfo.color,
                          }}
                        >
                          {expense.category}
                        </span>
                        <span className="expense-date">
                          {new Date(expense.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="expense-actions">
                      <span className="expense-amount">
                        ₹{expense.amount.toLocaleString()}
                      </span>
                      <button
                        className="delete-btn"
                        onClick={() => removeExpense(expense._id)}
                        title="Delete"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="app-footer">
        <p>© 2024 MyExpenseLog • Manage your finances wisely</p>
      </footer>
    </div>
  );
}

export default App;
