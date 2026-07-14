import "../../styles/daily.css";
import { useEffect, useState } from "react";

import {
  getDailyReportApi,
  getMonthlySummaryApi
} from "../../api/reports";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";


function Daily() 
{
  const [stats, setStats] =
  useState({
    appointments: 0,
    recalls: 0,
    patients: 0
  });

const [appointments,
  setAppointments] =
  useState([]);

const [procedures,
  setProcedures] =
  useState([]);

const [collections,
  setCollections] =
  useState([]);

const [expenses,
  setExpenses] =
  useState([]);

const [income, setIncome] =
useState({
  netIncome: 0,
  billingAmount: 0,
  billingCount: 0,
  collectionAmount: 0,
  expenseAmount: 0,
  expenseCount: 0,
  billAmount: 0,
  billCount: 0
});
const [financialMonth,
setFinancialMonth] =
useState(
  new Date().getMonth() + 1
);

const [financialYear,
setFinancialYear] =
useState(
  new Date().getFullYear()
);

const [monthlySummary,
setMonthlySummary] =
useState({
  billingAmount: 0,
  collectionAmount: 0,
  expenseAmount: 0,
  billAmount: 0,
  expenseCount: 0,
  billCount: 0,
  operatingCost: 0,
  netIncome: 0
});
  const [filters, setFilters] =
  useState({
    clinic: "All Clinics",
    from: "",
    to: ""
  });
  const [
  outstandingBalances,
  setOutstandingBalances
] = useState([]);

const [showAllAppointments,
  setShowAllAppointments] =
  useState(false);

const [showAllProcedures,
  setShowAllProcedures] =
  useState(false);

const [showAllBalances,
  setShowAllBalances] =
  useState(false);

const [showAllCollections,
  setShowAllCollections] =
  useState(false);

const [showAllExpenses,
  setShowAllExpenses] =
  useState(false);

const [expandedTable,
  setExpandedTable] =
  useState(null);
  

 useEffect(() =>
{
  loadReport();
  loadMonthlySummary();
}, []);

async function loadReport()
{
  try
  {
    const response =
      await getDailyReportApi(
        filters
      );

      console.log(
  "FULL DAILY RESPONSE:",
  response
);

console.log(
  "INCOME OBJECT:",
  response.income
);

    setStats(
      response.stats || {}
    );

    setAppointments(
      response.appointments || []
    );

    setProcedures(
      response.procedures || []
    );

    setCollections(
      response.collections || []
    );

    setOutstandingBalances(
    response.outstandingBalances || []
    );

    setExpenses(
      response.expenses || []
    );

    setIncome(
      response.income || {}
    );
  }
  catch(error)
  {
    console.error(
      error
    );
  }
}

async function
loadMonthlySummary()
{
  try
  {
    const response =
      await getMonthlySummaryApi(
  financialMonth,
  financialYear,
  filters.clinic
);

setMonthlySummary(response);
  }
  catch(error)
  {
    console.error(error);
  }
}

const visibleAppointments =
  showAllAppointments
    ? appointments
    : appointments.slice(0, 5);

const visibleProcedures =
  showAllProcedures
    ? procedures
    : procedures.slice(0, 5);

const visibleBalances =
  showAllBalances
    ? outstandingBalances
    : outstandingBalances.slice(0, 5);

const visibleCollections =
  showAllCollections
    ? collections
    : collections.slice(0, 5);

const visibleExpenses =
  showAllExpenses
    ? expenses
    : expenses.slice(0, 5);

const salesComparisonData =
[
  {
    name: "Net Income",
    amount:
      Number(
        monthlySummary.netIncome || 0
      ),
    color: "#FA1377"
  },

  {
    name: "Billing",
    amount:
      Number(
        monthlySummary.billingAmount || 0
      ),
    color: "#534AB7"
  },

  {
    name: "Collections",
    amount:
      Number(
        monthlySummary.collectionAmount || 0
      ),
    color: "#F59E0B"
  },

  {
    name: "Operating Costs",
    amount:
      Number(
        monthlySummary.operatingCost || 0
      ),
    color: "#2E7D32"
  }
];

  return (
    <div className="users-content">
      <div className="users-page-header">
        <h2>Operational & Financial Report</h2>
      </div>

      <div className="users-page-container">
        <div className="users-filter-container">
          <div className="filter-row">
            <span className="filter-label">Clinic</span>
<select
  value={filters.clinic}
  onChange={(e) =>
    setFilters({
      ...filters,
      clinic: e.target.value
    })
  }
>
  <option>All Clinics</option>
  <option>Hagonoy</option>
  <option>Paombong</option>
</select>
            <span className="filter-label">Date From</span>
            <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })}/>
            <span className="filter-label">Date To</span>
            <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })}/>
            <button
  className="btn-go"
  onClick={loadReport}
>
  Show
</button>
          </div>
        </div>

        <div className="daily-stat-cards">
          <div className="daily-stat-card daily-stat-pink">
            <div className="daily-stat-icon">🦷</div>
            <div className="daily-stat-info">
              <div className="daily-stat-value">{stats.appointments}</div>
              <div className="daily-stat-label">Appointments</div>
            </div>
          </div>

          <div className="daily-stat-card daily-stat-purple">
            <div className="daily-stat-icon">🔁</div>
            <div className="daily-stat-info">
              <div className="daily-stat-value">{stats.recalls}</div>
              <div className="daily-stat-label">Rebooked</div>
            </div>
          </div>

          <div className="daily-stat-card daily-stat-navy">
            <div className="daily-stat-icon">👤</div>
            <div className="daily-stat-info">
              <div className="daily-stat-value">{stats.patients}</div>
              <div className="daily-stat-label">Patient Invoices</div>
            </div>
          </div>
        </div>

        <div className="daily-tables-grid">
          <div className="daily-table-card full-width">
            <div className="daily-table-title">Patient Appointments</div>
            <div className="users-table">
              <div className="daily-th daily-cols-appointments">
                <span>Date</span><span>Patient Name</span><span>Clinic</span>
                <span>Associate</span><span>Reason</span><span>Status</span>
              </div>
              {appointments.length === 0
                ? <div className="users-empty">No data available</div>
                : visibleAppointments.map((r, i) => (
                    <div
  key={i}
  className={`daily-td daily-cols-appointments ${
    r.status === "rejected"
      ? "daily-row-rejected"
      : ""
  }`}
>
                      <span>{r.date}</span>
                      <span>{r.patientName}</span>
                      <span>{r.clinic}</span>
                      <span>{r.associate}</span>
                      <span>{r.reason}</span>
                      <span>{r.status}</span>
                    </div>
                  ))
              }
            </div>
            <div
  className="daily-show-more"
  onClick={() =>
    setExpandedTable(
      "appointments"
    )
  }
>
  Show More
</div>
          </div>

          <div className="daily-table-card">
            <div className="daily-table-title">Patient Procedures</div>
            <div className="users-table">
              <div className="daily-th daily-cols-procedures">
                <span>Date</span><span>Patient Name</span><span>Clinic</span>
                <span>Procedure</span><span>Total Bill</span><span>Total Paid</span>
              </div>
              {procedures.length === 0
                ? <div className="users-empty">No data available</div>
                : visibleProcedures.map((r, i) => (
                    <div key={i} className="daily-td daily-cols-procedures">
                      <span>{r.date}</span>
                      <span>{r.patientName}</span>
                      <span>{r.clinic}</span>
                      <span>{r.procedure}</span>
                      <span>{r.totalBill}</span>
                      <span>{r.totalPaid}</span>
                    </div>
                  ))
              }
            </div>
            <div
  className="daily-show-more"
  onClick={() =>
    setExpandedTable(
      "procedures"
    )
  }
>
  Show More
</div>
          </div>

          <div className="daily-table-card">
            <div className="daily-table-title">Outstanding Balances</div>
            <div className="users-table">
              <div className="daily-th daily-cols-6-even">
                <span>Date</span>
                <span>Patient</span>
                <span>Total Bill</span>
                <span>Amount Paid</span>
                <span>Balance</span>
                <span>Status</span>
              </div>
              {
  outstandingBalances.length === 0
  ? (
      <div className="daily-empty">
        No outstanding balances
      </div>
    )
  : (
      visibleBalances.map(
        (r, i) => (
          <div
            key={i}
            className="daily-td daily-cols-overpayment"
          >
            <span>{r.date}</span>

            <span>{r.patient}</span>

            <span>
              ₱ {Number(
                r.totalBill || 0
              ).toLocaleString()}
            </span>

            <span>
              ₱ {Number(
                r.amountPaid || 0
              ).toLocaleString()}
            </span>

            <span
              style={{
                color: "#dc2626",
                fontWeight: 700
              }}
            >
              ₱ {Number(
                r.balance || 0
              ).toLocaleString()}
            </span>

          <span
  style={{
    color: "#f59e0b",
    fontWeight: 600
  }}
>
  {r.status}
</span>
          </div>
        )
      )
    )
}
            </div>
            <div
  className="daily-show-more"
  onClick={() =>
    setExpandedTable(
      "balances"
    )
  }
>
  Show More
</div>
          </div>

          <div className="daily-table-card">
            <div className="daily-table-title">Collections</div>
            <div className="users-table">
              <div className="daily-th daily-cols-6-even">
                <span>Date</span>
                <span>Patient</span>
                <span>Clinic</span>
                <span>Payment Type</span>
                <span>Amount</span>
                <span>Remarks</span>
              </div>
              {collections.length === 0
                ? <div className="users-empty">No data available</div>
                : visibleCollections.map((r, i) => (
                    <div key={i} className="daily-td daily-cols-6-even">
                      <span>{r.date}</span>
                      <span>{r.patient}</span>
                      <span>{r.clinic}</span>
                      <span>{r.paymentType}</span>
                      <span>{r.amount}</span>
                      <span>{r.remarks}</span>
                    </div>
                  ))
              }
            </div>
            <div
  className="daily-show-more"
  onClick={() =>
    setExpandedTable(
      "collections"
    )
  }
>
  Show More
</div>
          </div>

          <div className="daily-table-card">
            <div className="daily-table-title">Expenses and Bills</div>
            <div className="users-table">
              <div className="daily-th daily-cols-expenses">
  <span>Date</span>
  <span>Clinic</span>
  <span>Description</span>
  <span>Type</span>
  <span>Category</span>
  <span>Amount</span>
</div>
              {expenses.length === 0
                ? <div className="users-empty">No data available</div>
                : visibleExpenses.map((r, i) => (
                    <div key={i} className="daily-td daily-cols-expenses">
                      <span>{r.date}</span>
                      <span>{r.clinic}</span>
                      <span>{r.description}</span>
                      <span>{r.type}</span>
                      <span>{r.category}</span>
                      <span>{r.amount}</span>
                    </div>
                  ))
              }
            </div>
            <div
  className="daily-show-more"
  onClick={() =>
    setExpandedTable(
      "expenses"
    )
  }
>
  Show More
</div>
          </div>
        </div>

        <div className="daily-chart-card">
          <div
  className="financial-filter-row"
>

  <select
  value={filters.clinic}
  onChange={(e) =>
    setFilters({
      ...filters,
      clinic: e.target.value
    })
  }
>
  <option>All Clinics</option>
  <option>Hagonoy</option>
  <option>Paombong</option>
</select>

  <select
    value={financialMonth}
    onChange={(e) =>
      setFinancialMonth(
        Number(
          e.target.value
        )
      )
    }
  >
    <option value={1}>January</option>
    <option value={2}>February</option>
    <option value={3}>March</option>
    <option value={4}>April</option>
    <option value={5}>May</option>
    <option value={6}>June</option>
    <option value={7}>July</option>
    <option value={8}>August</option>
    <option value={9}>September</option>
    <option value={10}>October</option>
    <option value={11}>November</option>
    <option value={12}>December</option>
  </select>

  <select
    value={financialYear}
    onChange={(e) =>
      setFinancialYear(
        Number(
          e.target.value
        )
      )
    }
  >
    <option value={2025}>2025</option>
    <option value={2026}>2026</option>
    <option value={2027}>2027</option>
  </select>

  <button
    className="btn-go"
    onClick={
      loadMonthlySummary
    }
  >
    Show Financials
  </button>
</div>
          <div className="daily-income-card daily-income-card-mb">
            <div className="daily-income-title">Net Income</div>
            <div className="daily-income-value">
  ₱ {Number(
    monthlySummary.netIncome || 0
  ).toLocaleString(
    undefined,
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  )}
</div>
            <div className="daily-income-divider"/>
            <div>

  <div className="daily-income-section-label collection">
    Billing
  </div>

  <div className="daily-income-row">
    <span>Total Amount</span>
    <strong>
      ₱ {Number(
        monthlySummary.billingAmount || 0
      ).toLocaleString()}
    </strong>
  </div>

  <div className="daily-income-row">
    <span>Transactions</span>
    <strong>
      {income.billingCount}
    </strong>
  </div>

</div>

<div>

  <div className="daily-income-section-label collection">
    Collections
  </div>

  <div className="daily-income-row">
    <span>Total Amount</span>
    <strong>
      ₱ {Number(
  monthlySummary.collectionAmount || 0
).toLocaleString()}
    </strong>
  </div>

  <div className="daily-income-row">
    <span>Transactions</span>
    <strong>
      {income.billingCount}
    </strong>
  </div>

</div>

<div>

  <div className="daily-income-section-label expenses">
    Operating Costs
  </div>

  <div className="daily-income-row">
    <span>Total Amount</span>

    <strong>
      ₱ {(
        Number(
          monthlySummary.operatingCost || 0
        )
      ).toLocaleString()}
    </strong>
  </div>

  <div className="daily-income-row">
    <span>Expenses</span>

    <strong>
      {monthlySummary.expenseCount}
    </strong>
  </div>

  <div className="daily-income-row">
    <span>Bills</span>

    <strong>
      {monthlySummary.billCount}
    </strong>
  </div>

</div>
          </div>
          <div className="daily-chart-title">Sales Comparison</div>
          <div className="daily-chart-legend">
            <span className="daily-legend-item"><span className="daily-legend-dot daily-legend-pink"></span>Net Income</span>
            <span className="daily-legend-item"><span className="daily-legend-dot daily-legend-purple"></span>Billing</span>
            <span className="daily-legend-item"><span className="daily-legend-dot daily-legend-orange"></span>Collection</span>
            <span className="daily-legend-item"><span className="daily-legend-dot daily-legend-green"></span>Operating Costs</span>
          </div>
          <ResponsiveContainer
  width="100%"
  height={280}
>
  <BarChart
    data={
      salesComparisonData
    }
  >
    <XAxis
      dataKey="name"
    />

    <YAxis />

    <Tooltip
      formatter={
        value =>
          `₱ ${Number(
            value
          ).toLocaleString()}`
      }
    />

    <Bar
  dataKey="amount"
  radius={[8,8,0,0]}
>
  {
    salesComparisonData.map(
      (entry, index) => (
        <Cell
          key={index}
          fill={entry.color}
        />
      )
    )
  }
</Bar>
  </BarChart>
</ResponsiveContainer>
        </div>

        <div className="reports-footer">
          <button className="btn-print">🖨️ Print</button>
        </div>
        {
  expandedTable && (
    <div
      className="daily-modal-overlay"
      onClick={() =>
        setExpandedTable(null)
      }
    >
      <div
        className="daily-modal"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <div className="daily-modal-header">

          <h3>
            {expandedTable
              === "appointments"
                ? "Patient Appointments"
              : expandedTable
              === "procedures"
                ? "Patient Procedures"
              : expandedTable
              === "balances"
                ? "Outstanding Balances"
              : expandedTable
              === "collections"
                ? "Collections"
              : "Expenses & Bills"}
          </h3>

          <button
            className="daily-modal-close"
            onClick={() =>
              setExpandedTable(null)
            }
          >
            ✕
          </button>

        </div>

        <div className="daily-modal-body">

  {expandedTable === "appointments" && (

    <div className="users-table">

      <div className="daily-th daily-cols-appointments">
        <span>Date</span>
        <span>Patient Name</span>
        <span>Clinic</span>
        <span>Associate</span>
        <span>Reason</span>
        <span>Status</span>
      </div>

      {appointments.map((r, i) => (

        <div
          key={i}
          className={`daily-td daily-cols-appointments ${
            r.status === "rejected"
              ? "daily-row-rejected"
              : ""
          }`}
        >
          <span>{r.date}</span>
          <span>{r.patientName}</span>
          <span>{r.clinic}</span>
          <span>{r.associate}</span>
          <span>{r.reason}</span>
          <span>{r.status}</span>
        </div>

      ))}

    </div>

  )}

  {expandedTable === "procedures" && (

    <div className="users-table">

      <div className="daily-th daily-cols-procedures">
        <span>Date</span>
        <span>Patient Name</span>
        <span>Clinic</span>
        <span>Procedure</span>
        <span>Total Bill</span>
        <span>Total Paid</span>
      </div>

      {procedures.map((r, i) => (

        <div
          key={i}
          className="daily-td daily-cols-procedures"
        >
          <span>{r.date}</span>
          <span>{r.patientName}</span>
          <span>{r.clinic}</span>
          <span>{r.procedure}</span>
          <span>{r.totalBill}</span>
          <span>{r.totalPaid}</span>
        </div>

      ))}

    </div>

  )}

  {expandedTable === "balances" && (

  <div className="users-table">

    <div className="daily-th daily-cols-overpayment">
      <span>Date</span>
      <span>Patient</span>
      <span>Total Bill</span>
      <span>Amount Paid</span>
      <span>Balance</span>
      <span>Status</span>
    </div>

    {outstandingBalances.map((r, i) => (

      <div
        key={i}
        className="daily-td daily-cols-overpayment"
      >
        <span>{r.date}</span>

        <span>{r.patient}</span>

        <span>
          ₱ {Number(
            r.totalBill || 0
          ).toLocaleString()}
        </span>

        <span>
          ₱ {Number(
            r.amountPaid || 0
          ).toLocaleString()}
        </span>

        <span
          style={{
            color: "#dc2626",
            fontWeight: 700
          }}
        >
          ₱ {Number(
            r.balance || 0
          ).toLocaleString()}
        </span>

        <span>{r.status}</span>

      </div>

    ))}

  </div>

)}

{expandedTable === "expenses" && (

  <div className="users-table">

    <div className="daily-th daily-cols-expenses">
  <span>Date</span>
  <span>Clinic</span>
  <span>Description</span>
  <span>Type</span>
  <span>Category</span>
  <span>Amount</span>
</div>

    {expenses.map((r, i) => (

      <div
        key={i}
        className="daily-td daily-cols-expenses"
      >
        <span>{r.date}</span>
        <span>{r.clinic}</span>
        <span>{r.description}</span>
        <span>{r.type}</span>
        <span>{r.category}</span>
        <span>
          ₱ {Number(
            r.amount || 0
          ).toLocaleString()}
        </span>
      </div>

    ))}

  </div>

)}

  {expandedTable === "collections" && (

    <div className="users-table">

      <div className="daily-th daily-cols-6-even">
        <span>Date</span>
        <span>Patient</span>
        <span>Clinic</span>
        <span>Payment Type</span>
        <span>Amount</span>
        <span>Remarks</span>
      </div>

      {collections.map((r, i) => (

        <div
          key={i}
          className="daily-td daily-cols-6-even"
        >
          <span>{r.date}</span>
          <span>{r.patient}</span>
          <span>{r.clinic}</span>
          <span>{r.paymentType}</span>
          <span>{r.amount}</span>
          <span>{r.remarks}</span>
        </div>

      ))}

    </div>

  )}

</div>

      </div>
    </div>
  )
}
      </div>
    </div>
  );
}

export default Daily;