import React, { useEffect, useState } from "react";
import Header from "../../components/Header";
import { useNavigate } from "react-router-dom";
import { Button, Modal, Form, Container } from "react-bootstrap";
// import loading from "../../assets/loader.gif";
import "./home.css";
import { addTransaction, getTransactions } from "../../utils/ApiRequest";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Spinner from "../../components/Spinner";
import TableData from "./TableData";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import BarChartIcon from "@mui/icons-material/BarChart";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import Analytics from "./Analytics";
import AIInsights from "./AIInsights";

const Home = () => {
  const navigate = useNavigate();

  const toastOptions = {
    position: "bottom-right",
    autoClose: 2000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: false,
    draggable: true,
    progress: undefined,
    theme: "dark",
  };
  const [cUser, setcUser] = useState();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const [frequency, setFrequency] = useState("7");
  const [type, setType] = useState("all");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [view, setView] = useState("table");

  const handleStartChange = (date) => {
    setStartDate(date);
  };

  const handleEndChange = (date) => {
    setEndDate(date);
  };

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  useEffect(() => {
    const avatarFunc = async () => {
      if (localStorage.getItem("user") && localStorage.getItem("token")) {
        const user = JSON.parse(localStorage.getItem("user"));
        console.log(user);

        if (user.isAvatarImageSet === false || user.avatarImage === "") {
          navigate("/setAvatar");
        }
        setcUser(user);
        setRefresh(true);
      } else {
        navigate("/login");
      }
    };

    avatarFunc();
  }, [navigate]);

  const [values, setValues] = useState({
    title: "",
    amount: "",
    description: "",
    category: "",
    date: "",
    transactionType: "",
  });

  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const handleChangeFrequency = (e) => {
    setFrequency(e.target.value);
  };

  const handleSetType = (e) => {
    setType(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { title, amount, description, category, date, transactionType } =
      values;

    // Frontend validation
    if (
      !title ||
      !amount ||
      !description ||
      !category ||
      !date ||
      !transactionType
    ) {
      toast.error("Please enter all the fields", toastOptions);
      return;
    }

    if (title.trim() === "") {
      toast.error("Title cannot be empty", toastOptions);
      return;
    }

    if (amount <= 0) {
      toast.error("Amount must be greater than 0", toastOptions);
      return;
    }

    if (description.trim() === "") {
      toast.error("Description cannot be empty", toastOptions);
      return;
    }

    setLoading(true);

    try {
      const { data } = await axios.post(addTransaction, {
        title: title,
        amount: amount,
        description: description,
        category: category,
        date: date,
        transactionType: transactionType,
        userId: cUser._id,
      });

      if (data.success === true) {
        toast.success(data.message, toastOptions);
        handleClose();
        // Reset form
        setValues({
          title: "",
          amount: "",
          description: "",
          category: "",
          date: "",
          transactionType: "",
        });
        setRefresh(!refresh);
      } else {
        toast.error(data.message, toastOptions);
      }
    } catch (error) {
      // Handle network errors and API errors
      const errorMessage = error.response?.data?.message || error.message || "Failed to add transaction. Please try again.";
      toast.error(errorMessage, toastOptions);
    }

    setLoading(false);
  };

  const handleReset = () => {
    setType("all");
    setStartDate(null);
    setEndDate(null);
    setFrequency("7");
  };


  


  useEffect(() => {
    const userId = cUser?._id;
    if (!userId) {
      return;
    }

    const fetchAllTransactions = async () => {
      try {
        setLoading(true);
        console.log(userId, frequency, startDate, endDate, type);
        const { data } = await axios.post(getTransactions, {
          userId: userId,
          frequency: frequency,
          startDate: startDate,
          endDate: endDate,
          type: type,
        });
        console.log(data);
  
        setTransactions(data.transactions);
  
        setLoading(false);
      } catch (err) {
        // toast.error("Error please Try again...", toastOptions);
        setLoading(false);
      }
    };

    fetchAllTransactions();
  }, [cUser?._id, refresh, frequency, endDate, type, startDate]);

  const handleTableClick = (e) => {
    setView("table");
  };

  const handleChartClick = (e) => {
    setView("chart");
  };

  const totalIncome = transactions
    .filter((item) => item.transactionType === "credit")
    .reduce((total, item) => total + Number(item.amount || 0), 0);
  const totalExpenses = transactions
    .filter((item) => item.transactionType === "expense")
    .reduce((total, item) => total + Number(item.amount || 0), 0);
  const netBalance = totalIncome - totalExpenses;
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <>
      <div className="app-layout">
        <Header view={view} onChangeView={setView} />
        <main className="app-main">
          {loading ? (
            <Spinner />
          ) : (
            <Container fluid className="dashboard-content">
              <div className="page-topline">
                <div>
                  <p className="eyebrow">YOUR MONEY, IN GOOD SHAPE</p>
                  <h1>Good to see you, {cUser?.name || "there"} <span aria-hidden="true">✳</span></h1>
                  <p className="page-subtitle">Here’s what’s happening with your finances.</p>
                </div>
                <Button onClick={handleShow} className="primary-action">
                  <AddRoundedIcon /> <span>Add transaction</span>
                </Button>
              </div>

              <section className="summary-grid" aria-label="Transaction summary">
                <article className="summary-card summary-balance">
                  <div className="summary-card-top">
                    <span className="summary-icon"><AccountBalanceWalletRoundedIcon /></span>
                    <span className="summary-tag">NET OVERVIEW</span>
                  </div>
                  <p className="summary-label">Net balance</p>
                  <strong className="summary-value">{formatCurrency(netBalance)}</strong>
                  <span className="summary-note">For the selected period</span>
                </article>
                <article className="summary-card summary-income">
                  <div className="summary-card-top">
                    <span className="summary-icon"><ArrowDownwardRoundedIcon /></span>
                    <span className="summary-tag">MONEY IN</span>
                  </div>
                  <p className="summary-label">Total income</p>
                  <strong className="summary-value">{formatCurrency(totalIncome)}</strong>
                  <span className="summary-note">Across {transactions.filter((item) => item.transactionType === "credit").length} transactions</span>
                </article>
                <article className="summary-card summary-expense">
                  <div className="summary-card-top">
                    <span className="summary-icon"><ArrowUpwardRoundedIcon /></span>
                    <span className="summary-tag">MONEY OUT</span>
                  </div>
                  <p className="summary-label">Total expenses</p>
                  <strong className="summary-value">{formatCurrency(totalExpenses)}</strong>
                  <span className="summary-note">Across {transactions.filter((item) => item.transactionType === "expense").length} transactions</span>
                </article>
                <article className="summary-card summary-count">
                  <div className="summary-card-top">
                    <span className="summary-icon"><ReceiptLongRoundedIcon /></span>
                    <span className="summary-tag">ACTIVITY</span>
                  </div>
                  <p className="summary-label">Transactions</p>
                  <strong className="summary-value">{transactions.length}</strong>
                  <span className="summary-note">In the selected period</span>
                </article>
              </section>

              <AIInsights
                frequency={frequency}
                startDate={startDate}
                endDate={endDate}
                dataRevision={refresh}
                onAddTransaction={handleShow}
              />

              <section className="activity-panel" id="transactions">
                <div className="activity-heading">
                  <div>
                    <p className="eyebrow">YOUR ACTIVITY</p>
                    <h2>{view === "table" ? "Transactions" : "Spending analytics"}</h2>
                    <p className="panel-subtitle">
                      {view === "table" ? "A clear view of where your money goes." : "Explore your income and spending breakdown."}
                    </p>
                  </div>
                  <div className="activity-actions">
                    <div className="view-switch" role="group" aria-label="Choose data view">
                      <button
                        type="button"
                        className={view === "table" ? "selected" : ""}
                        aria-label="Show transactions as a list"
                        aria-pressed={view === "table"}
                        onClick={handleTableClick}
                      >
                        <FormatListBulletedIcon />
                      </button>
                      <button
                        type="button"
                        className={view === "chart" ? "selected" : ""}
                        aria-label="Show transaction analytics"
                        aria-pressed={view === "chart"}
                        onClick={handleChartClick}
                      >
                        <BarChartIcon />
                      </button>
                    </div>
                    <Modal show={show} onHide={handleClose} centered>
                      <Modal.Header closeButton>
                        <Modal.Title>Add Transaction Details</Modal.Title>
                      </Modal.Header>
                      <Modal.Body>
                        <Form onSubmit={handleSubmit}>
                          <Form.Group className="mb-3" controlId="formName">
                            <Form.Label>Title</Form.Label>
                            <Form.Control name="title" type="text" placeholder="Enter Transaction Name" value={values.title} onChange={handleChange} />
                          </Form.Group>
                          <Form.Group className="mb-3" controlId="formAmount">
                            <Form.Label>Amount</Form.Label>
                            <Form.Control name="amount" type="number" placeholder="Enter your Amount" value={values.amount} onChange={handleChange} />
                          </Form.Group>
                          <Form.Group className="mb-3" controlId="formSelect">
                            <Form.Label>Category</Form.Label>
                            <Form.Select name="category" value={values.category} onChange={handleChange}>
                              <option value="">Choose...</option>
                              <option value="Groceries">Groceries</option>
                              <option value="Rent">Rent</option>
                              <option value="Salary">Salary</option>
                              <option value="Tip">Tip</option>
                              <option value="Food">Food</option>
                              <option value="Medical">Medical</option>
                              <option value="Utilities">Utilities</option>
                              <option value="Entertainment">Entertainment</option>
                              <option value="Transportation">Transportation</option>
                              <option value="Other">Other</option>
                            </Form.Select>
                          </Form.Group>
                          <Form.Group className="mb-3" controlId="formDescription">
                            <Form.Label>Description</Form.Label>
                            <Form.Control type="text" name="description" placeholder="Enter Description" value={values.description} onChange={handleChange} />
                          </Form.Group>
                          <Form.Group className="mb-3" controlId="formSelect1">
                            <Form.Label>Transaction Type</Form.Label>
                            <Form.Select name="transactionType" value={values.transactionType} onChange={handleChange}>
                              <option value="">Choose...</option>
                              <option value="credit">Credit</option>
                              <option value="expense">Expense</option>
                            </Form.Select>
                          </Form.Group>
                          <Form.Group className="mb-3" controlId="formDate">
                            <Form.Label>Date</Form.Label>
                            <Form.Control type="date" name="date" value={values.date} onChange={handleChange} />
                          </Form.Group>
                        </Form>
                      </Modal.Body>
                      <Modal.Footer>
                        <Button variant="secondary" onClick={handleClose}>Close</Button>
                        <Button variant="primary" onClick={handleSubmit} disabled={loading}>
                          {loading ? "Adding..." : "Submit"}
                        </Button>
                      </Modal.Footer>
                    </Modal>
                  </div>
                </div>

                <div className="filter-panel">
                  <Form.Group controlId="formSelectFrequency">
                    <Form.Label>Date range</Form.Label>
                    <Form.Select name="frequency" value={frequency} onChange={handleChangeFrequency}>
                      <option value="7">Last week</option>
                      <option value="30">Last month</option>
                      <option value="365">Last year</option>
                      <option value="custom">Custom range</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group controlId="formSelectType">
                    <Form.Label>Transaction type</Form.Label>
                    <Form.Select name="type" value={type} onChange={handleSetType}>
                      <option value="all">All transactions</option>
                      <option value="expense">Expenses</option>
                      <option value="credit">Income</option>
                    </Form.Select>
                  </Form.Group>
                  <Button variant="outline-secondary" className="reset-filter" onClick={handleReset}>Reset filters</Button>
                </div>

                {frequency === "custom" && (
                  <div className="date">
                    <div className="form-group">
                      <label htmlFor="startDate">Start date</label>
                      <DatePicker
                        id="startDate"
                        selected={startDate}
                        onChange={handleStartChange}
                        selectsStart
                        startDate={startDate}
                        endDate={endDate}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="endDate">End date</label>
                      <DatePicker
                        id="endDate"
                        selected={endDate}
                        onChange={handleEndChange}
                        selectsEnd
                        startDate={startDate}
                        endDate={endDate}
                        minDate={startDate}
                      />
                    </div>
                  </div>
                )}

                <div className="data-view">
                  {view === "table" ? (
                    <TableData data={transactions} user={cUser} />
                  ) : (
                    <Analytics transactions={transactions} user={cUser} />
                  )}
                </div>
              </section>
              <ToastContainer />
            </Container>
          )}
        </main>
      </div>
    </>
  );
};

export default Home;
