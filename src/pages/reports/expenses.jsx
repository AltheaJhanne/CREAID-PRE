import { useEffect, useState } from "react";
import "../../styles/expenses.css";
import {
  getExpensesApi,
  createExpenseApi,
  updateExpenseApi,
  deleteExpenseApi,
  archiveExpenseApi
} from "../../api/expenses";


function Expenses()
{
  const [clinicFilter, setClinicFilter] =
  useState("All");
  const [expenses, setExpenses] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const today = new Date();

const [selectedMonth, setSelectedMonth] =
  useState(
    today.getMonth() + 1
  );

const [selectedYear, setSelectedYear] =
  useState(
    today.getFullYear()
  );

  const [showModal, setShowModal] =
    useState(false);

  const [editingExpense,
  setEditingExpense] =
  useState(null);

  const [form, setForm] =
useState({
  expense_name: "",
  expense_type: "expense",
  frequency: "one_time",
  category: "Supplies",
  amount: "",
  branch_id: "Hagonoy",
  expense_date:
    new Date()
      .toISOString()
      .split("T")[0],
  notes: ""
});

  useEffect(() =>
  {
    loadExpenses();
  }, []);

  async function loadExpenses()
  {
    try
    {
      const response =
        await getExpensesApi();

      setExpenses(
        response.expenses || []
      );
    }
    catch(error)
    {
      console.error(error);
    }
  }

  async function handleAdd()
{
  try
  {
    if(editingExpense)
    {
      await updateExpenseApi(
        editingExpense.id,
        form
      );
    }
    else
    {
      await createExpenseApi(
        form
      );
    }

    setShowModal(false);

    setEditingExpense(null);

    setForm({
      expense_name: "",
      expense_type: "expense",
      frequency: "one_time",
      category: "Supplies",
      amount: "",
      branch_id: "Hagonoy",
      expense_date:
        new Date()
          .toISOString()
          .split("T")[0],
      notes: ""
    });

    loadExpenses();
  }
  catch(error)
  {
    console.error(error);
  }
}

async function
handleArchive(id)
{
  if(
    !window.confirm(
      "Archive this record?"
    )
  )
  {
    return;
  }

  try
  {
    await archiveExpenseApi(
      id
    );

    loadExpenses();
  }
  catch(error)
  {
    console.error(error);
  }
}

  async function handleDelete(id)
  {
    if(
      !window.confirm(
        "Delete expense?"
      )
    )
    {
      return;
    }

    try
    {
      await deleteExpenseApi(id);

      loadExpenses();
    }
    catch(error)
    {
      console.error(error);
    }
  }

  const filteredExpenses =
  expenses.filter(expense =>
  {

    const matchesClinic =
    clinicFilter === "All" ||
    expense.branch_id === clinicFilter;

    const expenseDate =
      new Date(
        expense.expense_date
      );

    const matchesMonth =
      expenseDate.getMonth() + 1 ===
      Number(selectedMonth);

    const matchesYear =
      expenseDate.getFullYear() ===
      Number(selectedYear);

    const matchesSearch =
      expense.expense_name
        ?.toLowerCase()
        .includes(
          search.toLowerCase()
        );

    return (
  matchesMonth &&
  matchesYear &&
  matchesSearch &&
  matchesClinic
);
  });

  const totalExpenses =
  filteredExpenses
    .filter(
      expense =>
        expense.expense_type ===
        "expense"
    )
    .reduce(
      (sum, expense) =>
        sum +
        Number(
          expense.amount || 0
        ),
      0
    );

const totalBills =
  filteredExpenses
    .filter(
      expense =>
        expense.expense_type ===
        "bill"
    )
    .reduce(
      (sum, expense) =>
        sum +
        Number(
          expense.amount || 0
        ),
      0
    );

const operatingCost =
  totalExpenses +
  totalBills;

  return (
    <div className="users-content">

      <div className="users-page-header">
        <h2>Expenses & Bills</h2>
      </div>

      <div className="users-page-container">

        <div className="expenses-toolbar">

          <select
  value={clinicFilter}
  onChange={(e) =>
    setClinicFilter(e.target.value)
  }
>
  <option value="All">All Clinics</option>
  <option value="Hagonoy">Hagonoy</option>
  <option value="Paombong">Paombong</option>
</select>

          <select
  value={selectedMonth}
  onChange={(e) =>
    setSelectedMonth(
      e.target.value
    )
  }
>
  <option value="1">January</option>
  <option value="2">February</option>
  <option value="3">March</option>
  <option value="4">April</option>
  <option value="5">May</option>
  <option value="6">June</option>
  <option value="7">July</option>
  <option value="8">August</option>
  <option value="9">September</option>
  <option value="10">October</option>
  <option value="11">November</option>
  <option value="12">December</option>
</select>

<select
  value={selectedYear}
  onChange={(e) =>
    setSelectedYear(
      e.target.value
    )
  }
>
  <option value="2025">2025</option>
  <option value="2026">2026</option>
  <option value="2027">2027</option>
</select>

          <input
            className="expenses-search"
            placeholder="Search expense..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

          <button
  className="btn-go"
  onClick={() =>
  {
        setShowModal(true);
  }}
>
  + Add Expense
</button>

        </div>

        <div className="reports-kpi-grid">

  <div className="reports-kpi-card">
    <div className="reports-kpi-label">
      Total Expenses
    </div>

    <div className="reports-kpi-value">
      ₱ {totalExpenses.toLocaleString()}
    </div>
  </div>

  <div className="reports-kpi-card">
    <div className="reports-kpi-label">
      Total Bills
    </div>

    <div className="reports-kpi-value">
      ₱ {totalBills.toLocaleString()}
    </div>
  </div>

  <div className="reports-kpi-card">
    <div className="reports-kpi-label">
      Operating Cost
    </div>

    <div className="reports-kpi-value">
      ₱ {operatingCost.toLocaleString()}
    </div>
  </div>

</div>

        <table className="users-table">

          <thead>
<tr>
  <th>Name</th>
  <th>Type</th>
  <th>Frequency</th>
  <th>Category</th>
  <th>Branch</th>
  <th>Date</th>
  <th>Amount</th>
  <th>Action</th>
</tr>
          </thead>

          <tbody>

            {filteredExpenses.map(
              expense => (
                <tr key={expense.id}>
                  <td>
                    {expense.expense_name}
                  </td>

                  <td>
                  {expense.expense_type}
                  </td>

                  <td>
                  {expense.frequency}
                  </td>

<td>
  {expense.category}
</td>

                  <td>
                    {expense.branch_id}
                  </td>

                  <td>
                    {expense.expense_date}
                  </td>

                  <td>
                    ₱ {Number(
                      expense.amount
                    ).toLocaleString()}
                  </td>

                  <td>
  <div className="action-buttons">

  <button
    className="btn-edit"
    title="Edit"
    onClick={() =>
    {
      setEditingExpense(
        expense
      );

      setForm({
        ...expense
      });

      setShowModal(true);
    }}
  >
    ✏️
  </button>

  <button
    className="btn-archive"
    title="Archive"
    onClick={() =>
      handleArchive(
        expense.id
      )
    }
  >
    📦
  </button>

</div>
</td>
                </tr>
              )
            )}

          </tbody>

        </table>

      </div>

{showModal && (
  <div
    className="expense-modal-overlay"
    onClick={() =>
{
  setShowModal(false);
  setEditingExpense(null);
}}
  >
    <div
      className="expense-modal"
      onClick={(e) => e.stopPropagation()}
    >
      <h3>
{
  editingExpense
    ? "Edit Expense / Bill"
    : "Add Expense / Bill"
}
</h3>

      <div className="form-group">
        <label>Expense / Bill Name</label>
        <input
          placeholder="e.g. Electric Bill June"
          value={form.expense_name}
          onChange={(e) =>
            setForm({
              ...form,
              expense_name: e.target.value
            })
          }
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Type</label>
          <select
            value={form.expense_type}
            onChange={(e) =>
              setForm({
                ...form,
                expense_type: e.target.value
              })
            }
          >
            <option value="expense">Expense</option>
            <option value="bill">Bill</option>
          </select>
        </div>

        <div className="form-group">
          <label>Frequency</label>
          <select
            value={form.frequency}
            onChange={(e) =>
              setForm({
                ...form,
                frequency: e.target.value
              })
            }
          >
            <option value="one_time">One Time</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Category</label>
          <select
            value={form.category}
            onChange={(e) =>
              setForm({
                ...form,
                category: e.target.value
              })
            }
          >
            <option>Supplies</option>
            <option>Utilities</option>
            <option>Equipment</option>
            <option>Maintenance</option>
            <option>Payroll</option>
            <option>Marketing</option>
            <option>Others</option>
          </select>
        </div>

        <div className="form-group">
          <label>Branch</label>
          <select
            value={form.branch_id}
            onChange={(e) =>
              setForm({
                ...form,
                branch_id: e.target.value
              })
            }
          >
            <option value="Hagonoy">Hagonoy</option>
            <option value="Paombong">Paombong</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Amount</label>
          <input
            type="number"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) =>
              setForm({
                ...form,
                amount: e.target.value
              })
            }
          />
        </div>

        <div className="form-group">
          <label>Date Recorded</label>
          <input
            type="date"
            value={form.expense_date}
            onChange={(e) =>
              setForm({
                ...form,
                expense_date: e.target.value
              })
            }
          />
        </div>
      </div>

      <div className="form-group">
        <label>Notes</label>
        <textarea
          placeholder="Optional notes..."
          value={form.notes}
          onChange={(e) =>
            setForm({
              ...form,
              notes: e.target.value
            })
          }
        />
      </div>

      <div className="modal-actions">
        <button
          className="btn-cancel"
          onClick={() =>
{
  setShowModal(false);
  setEditingExpense(null);
}}
        >
          Cancel
        </button>

        <button
          className="btn-submit"
          onClick={handleAdd}
        >
          {
  editingExpense
    ? "Update"
    : "Save"
}
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}

export default Expenses;