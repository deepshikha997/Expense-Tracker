const mongoose = require("mongoose");
const Expense = require("../models/Expense");

const getValidationErrors = (error) => {
  if (!error || !error.errors) {
    return [];
  }

  return Object.values(error.errors).map((item) => item.message);
};

const validateExpensePayload = ({ title, amount, category, date }) => {
  const normalizedTitle = typeof title === "string" ? title.trim() : "";
  const numericAmount = Number(amount);
  const normalizedCategory = typeof category === "string" ? category.trim() : "";

  if (!normalizedTitle) {
    return { errors: ["Title is required"] };
  }

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return { errors: ["Amount must be greater than 0"] };
  }

  if (!normalizedCategory) {
    return { errors: ["Category is invalid"] };
  }

  const parsedDate = date ? new Date(date) : new Date();
  if (Number.isNaN(parsedDate.getTime())) {
    return { errors: ["Date is invalid"] };
  }

  return {
    data: {
      title: normalizedTitle,
      amount: numericAmount,
      category: normalizedCategory,
      date: parsedDate,
    },
  };
};

const addExpense = async (req, res) => {
  try {
    const validation = validateExpensePayload(req.body);
    if (validation.errors) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    const expense = new Expense({
      ...validation.data,
      user: req.user._id,
    });
    await expense.save();

    return res.status(201).json({
      message: "Expense created",
      data: expense,
    });
  } catch (error) {
    console.error("Failed to create expense:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation failed",
        errors: getValidationErrors(error),
      });
    }

    return res.status(500).json({
      message: "Failed to create expense",
      details: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
};

const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({
      message: "Expenses fetched",
      data: expenses,
    });
  } catch (error) {
    console.error("Failed to fetch expenses:", error);
    return res.status(500).json({
      message: "Failed to fetch expenses",
      details: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
};

const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid expense id",
      });
    }

    const validation = validateExpensePayload(req.body);
    if (validation.errors) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    const updatedExpense = await Expense.findOneAndUpdate(
      { _id: id, user: req.user._id },
      validation.data,
      { new: true, runValidators: true }
    );

    if (!updatedExpense) {
      return res.status(404).json({
        message: "Expense not found",
      });
    }

    return res.status(200).json({
      message: "Expense updated",
      data: updatedExpense,
    });
  } catch (error) {
    console.error("Failed to update expense:", {
      id: req.params?.id,
      body: req.body,
      error,
    });

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation failed",
        errors: getValidationErrors(error),
      });
    }

    return res.status(500).json({
      message: "Failed to update expense",
      details: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid expense id",
      });
    }

    const deletedExpense = await Expense.findOneAndDelete({ _id: id, user: req.user._id });

    if (!deletedExpense) {
      return res.status(404).json({
        message: "Expense not found",
      });
    }

    return res.status(200).json({
      message: "Expense deleted",
      data: deletedExpense,
    });
  } catch (error) {
    console.error("Failed to delete expense:", {
      id: req.params?.id,
      error,
    });
    return res.status(500).json({
      message: "Failed to delete expense",
      details: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
};

module.exports = {
  addExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
};
