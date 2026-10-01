import React from "react";
// import CardBox from "./CardBox";
import { Container, Row } from "react-bootstrap";
import CircularProgressBar from "../../components/CircularProgressBar";
import LineProgressBar from "../../components/LineProgressBar";
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
// import MovingIcon from '@mui/icons-material/Moving';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';


const Analytics = ({ transactions }) => {
  // Handle empty or undefined transactions
  if (!transactions || transactions.length === 0) {
    return (
      <Container className="mt-5">
        <div className="text-center text-white">
          <h3>No transactions found</h3>
          <p>Add some transactions to see analytics</p>
        </div>
      </Container>
    );
  }

  const TotalTransactions = transactions.length;
  const totalIncomeTransactions = transactions.filter(
    (item) => item.transactionType === "credit"
  );
  const totalExpenseTransactions = transactions.filter(
    (item) => item.transactionType === "expense"
  );

  // Prevent division by zero
  let totalIncomePercent =
    TotalTransactions > 0
      ? (totalIncomeTransactions.length / TotalTransactions) * 100
      : 0;
  let totalExpensePercent =
    TotalTransactions > 0
      ? (totalExpenseTransactions.length / TotalTransactions) * 100
      : 0;

  // Convert amount to number and calculate totals
  const totalTurnOver = transactions.reduce(
    (acc, transaction) => acc + Number(transaction.amount || 0),
    0
  );
  const totalTurnOverIncome = transactions
    .filter((item) => item.transactionType === "credit")
    .reduce((acc, transaction) => acc + Number(transaction.amount || 0), 0);
  const totalTurnOverExpense = transactions
    .filter((item) => item.transactionType === "expense")
    .reduce((acc, transaction) => acc + Number(transaction.amount || 0), 0);

  // Prevent division by zero
  const TurnOverIncomePercent =
    totalTurnOver > 0 ? (totalTurnOverIncome / totalTurnOver) * 100 : 0;
  const TurnOverExpensePercent =
    totalTurnOver > 0 ? (totalTurnOverExpense / totalTurnOver) * 100 : 0;

  const categories = [
    "Groceries",
    "Rent",
    "Salary",
    "Tip",
    "Food",
    "Medical",
    "Utilities",
    "Entertainment",
    "Transportation",
    "Other",
  ];

  const colors = {
    "Groceries": '#FF6384',
    "Rent": '#36A2EB',
    "Salary": '#FFCE56',
    "Tip": '#4BC0C0',
    "Food": '#9966FF',
    "Medical": '#FF9F40',
    "Utilities": '#8AC926',
    "Entertainment": '#6A4C93',
    "Transportation": '#1982C4',
    "Other": '#F45B69',
  };
  
  

  return (
    <>
      <Container className="mt-5 ">
        <Row>
          <div className="col-lg-3 col-md-6 mb-4">
            <div className="card h-100">
              <div className="card-header bg-black text-white">
                <span style={{ fontWeight: "bold" }}>Total Transactions:</span>{" "}
                {TotalTransactions}
              </div>
              <div className="card-body">
                <h5 className="card-title " style={{color: "green"}}>
                  Income: <ArrowDropUpIcon/>{totalIncomeTransactions.length}
                </h5>
                <h5 className="card-title" style={{color: "red"}}>
                  Expense: <ArrowDropDownIcon />{totalExpenseTransactions.length}
                </h5>

                <div className="d-flex justify-content-center mt-3">
                  <CircularProgressBar
                    percentage={
                      isNaN(totalIncomePercent)
                        ? 0
                        : totalIncomePercent.toFixed(0)
                    }
                    color="green"
                  />
                </div>

                <div className="d-flex justify-content-center mt-4 mb-2">
                  <CircularProgressBar
                    percentage={
                      isNaN(totalExpensePercent)
                        ? 0
                        : totalExpensePercent.toFixed(0)
                    }
                    color="red"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-4">
            <div className="card h-100">
              <div className="card-header bg-black text-white ">
                <span style={{ fontWeight: "bold" }}>Total TurnOver:</span>{" "}
                {totalTurnOver}
              </div>
              <div className="card-body">
                <h5 className="card-title" style={{color: "green"}}>Income: <ArrowDropUpIcon /> {totalTurnOverIncome} <CurrencyRupeeIcon /></h5>
                <h5 className="card-title" style={{color: "red"}}>Expense: <ArrowDropDownIcon />{totalTurnOverExpense} <CurrencyRupeeIcon /></h5>
                <div className="d-flex justify-content-center mt-3">
                  <CircularProgressBar
                    percentage={
                      isNaN(TurnOverIncomePercent)
                        ? 0
                        : TurnOverIncomePercent.toFixed(0)
                    }
                    color="green"
                  />
                </div>

                <div className="d-flex justify-content-center mt-4 mb-4">
                  <CircularProgressBar
                    percentage={
                      isNaN(TurnOverExpensePercent)
                        ? 0
                        : TurnOverExpensePercent.toFixed(0)
                    }
                    color="red"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-4">
            <div className="card h-100">
              <div className="card-header  bg-black text-white">
                <span style={{ fontWeight: "bold" }}>Categorywise Income</span>{" "}
              </div>
              <div className="card-body">
                {categories.map((category, index) => {
                  const income = transactions
                    .filter(
                      (transaction) =>
                        transaction.transactionType === "credit" &&
                        transaction.category === category
                    )
                    .reduce(
                      (acc, transaction) =>
                        acc + Number(transaction.amount || 0),
                      0
                    );

                  // Prevent division by zero
                  const incomePercent =
                    totalTurnOver > 0 ? (income / totalTurnOver) * 100 : 0;

                  return (
                    <div key={`income-${category}-${index}`}>
                      {income > 0 && (
                        <LineProgressBar
                          label={category}
                          percentage={incomePercent.toFixed(0)}
                          lineColor={colors[category]}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-4">
            <div className="card h-100">
              <div className="card-header  bg-black text-white">
                <span style={{ fontWeight: "bold" }}>Categorywise Expense</span>{" "}
              </div>
              <div className="card-body">
                {categories.map((category, index) => {
                  const expenses = transactions
                    .filter(
                      (transaction) =>
                        transaction.transactionType === "expense" &&
                        transaction.category === category
                    )
                    .reduce(
                      (acc, transaction) =>
                        acc + Number(transaction.amount || 0),
                      0
                    );

                  // Prevent division by zero
                  const expensePercent =
                    totalTurnOver > 0 ? (expenses / totalTurnOver) * 100 : 0;

                  return (
                    <div key={`expense-${category}-${index}`}>
                      {expenses > 0 && (
                        <LineProgressBar
                          label={category}
                          percentage={expensePercent.toFixed(0)}
                          lineColor={colors[category]}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Row>
      </Container>
    </>
  );
};

export default Analytics;
