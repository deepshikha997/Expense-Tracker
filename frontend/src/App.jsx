/**
 * Expense Tracker Application
 * Created by: [Your Name]
 * Date: February 2024
 * 
 * Features I implemented:
 * - Real-time expense tracking with MongoDB
 * - Category-based filtering system
 * - Monthly budget warnings
 * - Search functionality
 * - Responsive design for mobile devices
 * - Custom animations and transitions
 */

import { useEffect, useState } from "react";
import API from "./services/api";
import "./App.css";

function App() {
  // State management - organized by functionality
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  
  // Form state with sensible defaults
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "Food",
    date: getTodayDate(),
  });

  // My budget feature - helps users track overspending
  const MONTHLY_BUDGET = 15000; // Can be made dynamic later

  /**
   * Helper function to get today's date in YYYY-MM-DD format
   * I created this to avoid repeating date logic
   */
  function getTodayDate() {
    return new Date().toISOString().split("T")[0];
  }

  /**
   * Category configuration
   * I chose these colors based on color psychology:
   * - Red for Food (stimulates appetite)
   * - Blue for Travel (calming, sky/ocean)
   * - Purple for Shopping (luxury)
   * etc.
   */
  const CATEGORIES = {
    Food: { emoji: "🍔", color: "#ef4444", bg: "#fee2e2" },
    Travel: { emoji: "✈️", color: "#3b82f6", bg: "#dbeafe" },
    Shopping: { emoji: "🛍️", color: "#a855f7", bg: "#f3e8ff" },
    Entertainment: { emoji: "🎬", color: "#f59e0b", bg: "#fef3c7" },
    Health: { emoji: "💊", color: "#10b981", bg: "#d1fae5" },
    Bills: { emoji: "💡", color: "#6366f1", bg: "#e0e7ff" },
    Education: { emoji: "📚", color: "#ec4899", bg: "#fce7f3" },
    Other: { emoji: "📦", color: "#64748b", bg: "#f1f5f9" },
  };

  /**
   * Fetch all expenses from backend
   * Using try-catch for error handling
   */
  const loadExpenses = async () => {
    try {
      setIsLoading(true);
      const response = await API.get("/");
      setExpenses(response.data);
    } catch (err) {
      console.error("Failed to load expenses:", err);
      alert("Could not load expenses. Please check your internet connection.");
    } finally {
      setIsLoading(false);
    }
  };

  // Load expenses when component mounts
  useEffect(() => {
    loadExpenses();
  }, []);

  /**
   * Handle adding a new expense
   * My validation rules:
   * - Title must not be empty
   * - Amount must be a positive number
   * - Warns if near budget limit
   */
  const addNewExpense = async (e) => {
    e.preventDefault();

    // Validation
    const trimmedTitle = form.title.trim();
    if (!trimmedTitle) {
      alert("⚠️ Please enter a title for your expense");
      return;
    }

    const amountValue = parseFloat(form.amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      alert("⚠️ Please enter a valid amount greater than ₹0");
      return;
    }

    // Check if adding this would exceed budget (my custom feature)
    const currentTotal = calculateTotal();
    if (currentTotal + amountValue > MONTHLY_BUDGET) {
      const shouldContinue = window.confirm(
        `⚠️ Warning: This expense will put you ₹${(currentTotal + amountValue - MONTHLY_BUDGET).toFixed(2)} over your monthly budget of ₹${MONTHLY_BUDGET}. Add anyway?`
      );
      if (!shouldContinue) return;
    }

    try {
      await API.post("/", {
        title: trimmedTitle,
        amount: amountValue,
        category: form.category,
        date: form.date,
      });

      // Reset form to defaults
      setForm({
        title: "",
        amount: "",
        category: "Food",
        date: getTodayDate(),
      });

      loadExpenses();
    } catch (err) {
      console.error("Failed to add expense:", err);
      alert("❌ Could not add expense. Please try again.");
    }
  };

  /**
   * Delete an expense with confirmation
   * I added a custom confirmation message with the expense details
   */
  const removeExpense = async (expenseId, expenseTitle) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${expenseTitle}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await API.delete(`/${expenseId}`);
      loadExpenses();
    } catch (err) {
      console.error("Failed to delete expense:", err);
      alert("❌ Could not delete expense. Please try again.");
    }
  };

  /**
   * Calculate total of all expenses
   * Using reduce for functional programming approach
   */
  const calculateTotal = () => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  /**
   * Get expenses filtered by category and search query
   * My custom implementation combining both filters
   */
  const getFilteredExpenses = () => {
    let filtered = expenses;

    // Apply category filter
    if (filter !== "all") {
      filtered = filtered.filter((exp) => exp.category === filter);
    }

    // Apply search filter (my addition)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((exp) =>
        exp.title.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  /**
   * Calculate spending by category
   * Returns object with category names as keys and totals as values
   */
  const getCategoryTotals = () => {
    const totals = {};
    expenses.forEach((exp) => {
      const cat = exp.category || "Other";
      totals[cat] = (totals[cat] || 0) + exp.amount;
    });
    return totals;
  };

  /**
   * Find the category with highest spending
   * Returns [categoryName, amount] or null if no expenses
   */
  const getTopCategory = () => {
    const totals = getCategoryTotals();
    const entries = Object.entries(totals);
    if (entries.length === 0) return null;
    
    return entries.reduce((max, current) => 
      current[1] > max[1] ? current : max
    );
  };

  /**
   * Format date to readable string
   * My custom formatter for Indian locale
   */
  const formatExpenseDate = (dateString) => {
    if (!dateString) return "No date";
    
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  /**
   * Calculate budget usage percentage
   * My feature to show visual progress
   */
  const getBudgetPercentage = () => {
    const total = calculateTotal();
    return Math.min((total / MONTHLY_BUDGET) * 100, 100);
  };

  // Derived state
  const totalAmount = calculateTotal();
  const topCategory = getTopCategory();
  const filteredExpenses = getFilteredExpenses();
  const budgetPercentage = getBudgetPercentage();
  const isOverBudget = totalAmount > MONTHLY_BUDGET;

  return (
    <div className="app">
      {/* Header with gradient background */}
      <header className="header">
        <div className="header-content">
          <h1 className="title">
            <span className="emoji">💰</span>
            Expense Tracker
          </h1>
          <p className="subtitle">Track your spending, achieve your goals</p>
        </div>
      </header>

      <main className="container">
        {/* Statistics Dashboard */}
        <section className="stats-grid" aria-label="Expense Statistics">
          {/* Total Expenses Card */}
          <div className="stat-card total-card">
            <div className="stat-icon">💵</div>
            <div className="stat-info">
              <p className="stat-label">Total Spent</p>
              <p className="stat-value">₹{totalAmount.toLocaleString()}</p>
              {isOverBudget && (
                <span className="budget-alert">Over Budget!</span>
              )}
            </div>
          </div>

          {/* Transaction Count Card */}
          <div className="stat-card count-card">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <p className="stat-label">Transactions</p>
              <p className="stat-value">{expenses.length}</p>
            </div>
          </div>

          {/* Top Category Card */}
          <div className="stat-card category-card">
            <div className="stat-icon">
              {topCategory ? CATEGORIES[topCategory[0]]?.emoji || "📦" : "📦"}
            </div>
            <div className="stat-info">
              <p className="stat-label">Top Category</p>
              <p className="stat-value">
                {topCategory ? topCategory[0] : "None"}
              </p>
            </div>
          </div>
        </section>

        {/* Budget Progress Bar - My custom feature */}
        <div className="budget-tracker">
          <div className="budget-header">
            <span>Monthly Budget: ₹{MONTHLY_BUDGET.toLocaleString()}</span>
            <span className={isOverBudget ? "over-budget" : ""}>
              {budgetPercentage.toFixed(1)}% used
            </span>
          </div>
          <div className="budget-bar">
            <div
              className={`budget-fill ${isOverBudget ? "over" : ""}`}
              style={{ width: `${budgetPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Add Expense Form */}
        <section className="form-card">
          <h2 className="form-title">
            <span>➕</span> Add New Expense
          </h2>
          <form className="form" onSubmit={addNewExpense}>
            <div className="form-grid">
              {/* Title Input */}
              <div className="form-group">
                <label htmlFor="expense-title">What did you spend on?</label>
                <input
                  id="expense-title"
                  type="text"
                  placeholder="e.g., Lunch at cafe"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  maxLength={100}
                  autoComplete="off"
                />
              </div>

              {/* Amount Input */}
              <div className="form-group">
                <label htmlFor="expense-amount">How much? (₹)</label>
                <input
                  id="expense-amount"
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  max="999999.99"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>

              {/* Category Dropdown */}
              <div className="form-group">
                <label htmlFor="expense-category">Category</label>
                <select
                  id="expense-category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {Object.keys(CATEGORIES).map((categoryName) => (
                    <option key={categoryName} value={categoryName}>
                      {CATEGORIES[categoryName].emoji} {categoryName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Input */}
              <div className="form-group">
                <label htmlFor="expense-date">When?</label>
                <input
                  id="expense-date"
                  type="date"
                  value={form.date}
                  max={getTodayDate()}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="submit-btn">
              <span>+</span> Add Expense
            </button>
          </form>
        </section>

        {/* Expenses List Section */}
        <section className="expenses-section">
          <div className="expenses-header">
            <h2 className="section-title">Your Expenses</h2>

            {/* Search Bar - My custom addition */}
            <div className="search-bar">
              <input
                type="text"
                placeholder="🔍 Search expenses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="filter-pills">
              <button
                className={`pill ${filter === "all" ? "active" : ""}`}
                onClick={() => setFilter("all")}
              >
                All ({expenses.length})
              </button>
              {Object.keys(CATEGORIES).map((cat) => {
                const count = expenses.filter((e) => e.category === cat).length;
                return (
                  <button
                    key={cat}
                    className={`pill ${filter === cat ? "active" : ""}`}
                    onClick={() => setFilter(cat)}
                    style={{
                      backgroundColor:
                        filter === cat ? CATEGORIES[cat].bg : "transparent",
                      color: filter === cat ? CATEGORIES[cat].color : "#64748b",
                    }}
                  >
                    {CATEGORIES[cat].emoji} {cat} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading your expenses...</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredExpenses.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <p className="empty-text">
                {searchQuery ? "No matching expenses" : "No expenses yet"}
              </p>
              <p className="empty-subtext">
                {searchQuery
                  ? `No results found for "${searchQuery}"`
                  : filter === "all"
                  ? "Start by adding your first expense above"
                  : `No ${filter} expenses yet`}
              </p>
            </div>
          )}

          {/* Expense Cards List */}
          {!isLoading && filteredExpenses.length > 0 && (
            <div className="expenses-list">
              {filteredExpenses.map((expense, idx) => {
                const categoryInfo =
                  CATEGORIES[expense.category] || CATEGORIES.Other;

                return (
                  <article
                    className="expense-card"
                    key={expense._id}
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="expense-left">
                      <div
                        className="expense-icon"
                        style={{
                          backgroundColor: categoryInfo.bg,
                          color: categoryInfo.color,
                        }}
                      >
                        {categoryInfo.emoji}
                      </div>
                      <div className="expense-details">
                        <h3 className="expense-title">{expense.title}</h3>
                        <div className="expense-meta">
                          <span
                            className="expense-category"
                            style={{
                              backgroundColor: categoryInfo.bg,
                              color: categoryInfo.color,
                            }}
                          >
                            {expense.category || "Other"}
                          </span>
                          <span className="expense-date">
                            {formatExpenseDate(expense.date)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="expense-right">
                      <p className="expense-amount">
                        ₹{expense.amount.toLocaleString()}
                      </p>
                      <button
                        className="delete-btn"
                        onClick={() => removeExpense(expense._id, expense.title)}
                        title={`Delete ${expense.title}`}
                        aria-label={`Delete ${expense.title} expense`}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path
                            d="M6 2V1h4v1h4v2H2V2h4zm1 3v7h2V5H7zm-3 0v7h2V5H4zm8 0v7h-2V5h2z"
                            fill="currentColor"
                          />
                        </svg>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
<<<<<<< HEAD
        <p>Crafted with 💙 by Deepshikha</p>
=======
        <p>Crafted with 💙 by [Your Name]</p>
>>>>>>> 65d5a8e6f6d75e528a373bba35d2bda2623522a5
      </footer>
    </div>
  );
}

export default App;
