function ExpenseList({ expenses, onDelete }) {
  return (
    <ul>
      {expenses.map((exp) => (
        <li key={exp._id}>
          {exp.title} - ₹{exp.amount} ({exp.category})
          <button onClick={() => onDelete(exp._id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}

export default ExpenseList;

