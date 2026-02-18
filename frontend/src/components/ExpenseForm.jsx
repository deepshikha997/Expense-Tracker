import { useState } from "react";
import axios from "axios";

function ExpenseForm({ onAdd }) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !amount || !category) {
      alert("All fields required");
      return;
    }

    const expense = { title, amount, category };

    const res = await axios.post(
      "http://localhost:5000/api/expenses",
      expense
    );

    onAdd(res.data);

    setTitle("");
    setAmount("");
    setCategory("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <input
        type="text"
        placeholder="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      />
      <button type="submit">Add Expense</button>
    </form>
  );
}

export default ExpenseForm;
