import { useEffect, useState } from "react";
import "../../styles/collections.css";
import {
  getCollectionsReportApi
} from "../../api/reports"; 

function Collections() {

  console.log("NEW COLLECTIONS FILE LOADED");
  
  const [filters, setFilters] = useState({
    associates: "All Associates",
    clinic: "All Clinics",
    laboratory: "All Laboratories",
    paymentType: "All Payment Types",
    from: "",
    to: "",
    patient: "",
  });

  // backend-ready state stubs
  const [rows, setRows] =
  useState([]);

const [totalAmount, setTotalAmount] =
  useState("₱0.00");

const [rowsCount, setRowsCount] =
  useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(rowsCount / 20) || 1;

  const renderPagination = () => {
    const pages = [];
    const range = [];

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        range.push(i);
      }
    }

    let prev = null;
    for (const page of range) {
      if (prev !== null && page - prev > 1) {
        pages.push(<span key={`e-${page}`} className="page-ellipsis">…</span>);
      }
      pages.push(
        <button
          key={page}
          className={`page-btn ${currentPage === page ? "active" : ""}`}
          onClick={() => setCurrentPage(page)}
        >
          {page}
        </button>
      );
      prev = page;
    }

    return pages;
  };

  useEffect(() =>
{
  loadCollections();
}, []);

async function loadCollections()
{
  try
  {
    const response =
      await getCollectionsReportApi(
        filters
      );

      console.log(
  "FILTERS:",
  filters
);

console.log(
  "RESPONSE:",
  response
);

    setRows(
      response.collections || []
    );

    setTotalAmount(
      `₱ ${Number(
        response.totalAmount || 0
      ).toLocaleString()}`
    );

    setRowsCount(
      response.rowsCount || 0
    );

    setCurrentPage(1);
  }
  catch(error)
  {
    console.error(error);
  }
}
    return (
  <div className="dashboard-content">
    <div className="collections-container">

            {/* TITLE */}
            <div className="page-title-row">
              <h2 className="page-main-title">Collections Report</h2>
              <p className="page-subtitle">Detailed clinics and laboratories collection reports.</p>
            </div>

            {/* FILTERS ROW 1 */}
            <div className="reports-filters">
              <div className="filter-item wide">
                <label>Associates</label>
                <select
                  value={filters.associates}
                  onChange={(e) => setFilters({ ...filters, associates: e.target.value })}
                >
                  <option>All Associates</option>
                </select>
              </div>
              <div className="filter-item wide">
                <label>Clinic</label>
                <select
                  value={filters.clinic}
                  onChange={(e) => setFilters({ ...filters, clinic: e.target.value })}
                >
                  <option>All Clinics</option>
                  <option>Hagonoy</option>
                  <option>Paombong</option>
                </select>
              </div>
              <div className="filter-item wide">
                <label>Laboratory</label>
                <select
                  value={filters.laboratory}
                  onChange={(e) => setFilters({ ...filters, laboratory: e.target.value })}
                >
                  <option>All Laboratories</option>
                </select>
              </div>
              <div className="filter-item wide">
                <label>Payment Type</label>
                <select
                  value={filters.paymentType}
                  onChange={(e) => setFilters({ ...filters, paymentType: e.target.value })}
                >
                  <option>
  All Payment Types
</option>

<option value="cash">
  Cash
</option>

<option value="gcash">
  GCash
</option>

<option value="visa">
  Visa
</option>

<option value="mastercard">
  Mastercard
</option>
                </select>
              </div>
            </div>

            {/* FILTERS ROW 2 */}
            <div className="reports-filters" style={{ marginTop: "-8px" }}>
              <div className="filter-item">
                <label>Date From</label>
                <input
                  type="date"
                  value={filters.from}
                  onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                />
              </div>
              <div className="filter-item">
                <label>Date To</label>
                <input
                  type="date"
                  value={filters.to}
                  onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                />
              </div>
              <div className="filter-item search-item">
                <label>Patient</label>
                <input
                  type="text"
                  placeholder="Search here"
                  value={filters.patient}
                  onChange={(e) => setFilters({ ...filters, patient: e.target.value })}
                />
              </div>
              <button
  className="btn-show"
  onClick={loadCollections}
>
  Show Report
</button>
              <button className="btn-export">Export Report ▾</button>
            </div>

            {/* META ROW */}
            <div className="report-meta-row">
              <p className="total-amount">
                Total Amount: <span>{totalAmount}</span>
              </p>
              <p className="rows-count">
                Rows Count: <span>{rowsCount}</span>
              </p>
            </div>

            {/* TABLE */}
            <div className="report-table-wrap">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Patient</th>
                    <th>Clinic</th>
                    <th>Payment Type</th>
                    <th>Reference #</th>
                    <th>Amount</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", color: "#bbb", fontStyle: "italic", padding: "20px" }}>
                        No records found
                      </td>
                    </tr>
                  ) : (
                    rows.map((row, i) => (
                      <tr key={i}>
                        <td>{row.date}</td>
                        <td>{row.patient}</td>
                        <td>{row.clinic}</td>
                        <td>{row.paymentType}</td>
                        <td>{row.referenceNo}</td>
                        <td>
                          ₱ {Number(
                            row.amount || 0
                            ).toLocaleString()}
                            </td>
<td>{row.remarks ?? "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            <div className="report-pagination">
              <button
                className="page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                « Previous
              </button>
              {renderPagination()}
              <button
                className="page-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next »
              </button>
            </div>

          </div>
        </div>
  );
}

export default Collections;