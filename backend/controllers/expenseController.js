const Expense = require("../models/Expense");

// ➕ Add Expense
const addExpense = async (req, res) => {
  try {
    const { title, amount, category, date } = req.body;

    if (!title || !amount || !category) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const expense = new Expense({
      title,
      amount,
      category,
      date,
    });

    await expense.save();

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📥 Get All Expenses
const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ createdAt: -1 });
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ❌ Delete Expense
const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    await Expense.findByIdAndDelete(id);
    res.status(200).json({ message: "Expense deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addExpense,
  getExpenses,
  deleteExpense,
};
