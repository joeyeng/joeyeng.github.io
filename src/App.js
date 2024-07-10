import React, { useState, useEffect } from "react";
import { useCSVReader, readRemoteFile } from "react-papaparse";
import { CheckingAccount } from "./CheckingAccount";
import BitcoinChart from "./BitcoinChart";
import Summary from "./Summary";
import "./App.css";

function App() {
  const [initialBalanceUsd, setInitialBalanceUsd] = useState(5000.0);
  const [initialBalanceBtc, setInitialBalanceBtc] = useState(0.0);
  const [biWeeklyIncomeUsd, setBiWeeklyIncomeUsd] = useState(2100.0);
  const [spendingLimitUsd, setSpendingLimitUsd] = useState(2000.0);
  const [billAmountUsd, setBillAmountUsd] = useState(2000.0);
  const [costBasisMethod, setCostBasisMethod] = useState("hifo");
  const [startDate, setStartDate] = useState("2020-05-11");
  const [endDate, setEndDate] = useState("2024-04-19");
  const [csvData, setCsvData] = useState([]);
  const [btcSim, setBtcSim] = useState(null);
  const [fiatSim, setFiatSim] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleFileLoad = (data) => {
    setCsvData(
      data.map((row) => ({
        date: row.data.Date,
        price: parseFloat(row.data.Price),
      }))
    );
  };

  const handleSubmit = () => {
    readRemoteFile("./bitcoin_price_data.csv", {
      complete: (result) => {
        try {
          setErrorMessage("");

          const dataMap = new Map();
          result.data.forEach((entry) => {
            const high = parseFloat(entry[3]);
            const low = parseFloat(entry[4]);
            const avg = (high + low) / 2;
            const date = entry[0];
            dataMap.set(date, avg);
          });

          const btcAccount = new CheckingAccount(
            "btc",
            initialBalanceUsd,
            initialBalanceBtc,
            biWeeklyIncomeUsd,
            spendingLimitUsd,
            billAmountUsd,
            costBasisMethod
          );

          const fiatAccount = new CheckingAccount(
            "fiat",
            initialBalanceUsd,
            initialBalanceBtc,
            biWeeklyIncomeUsd,
            spendingLimitUsd,
            billAmountUsd,
            costBasisMethod
          );

          setBtcSim(
            btcAccount.processSimulation({
              startDate,
              endDate,
              bitcoinPrices: dataMap,
            })
          );

          setFiatSim(
            fiatAccount.processSimulation({
              startDate,
              endDate,
              bitcoinPrices: dataMap,
            })
          );

          setChartData({
            btcData: btcAccount.history,
            fiatData: fiatAccount.history,
          });
        } catch (error) {
          setErrorMessage(error.message);
        }
      },
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Living On Bitcoin vs Fiat Simulator</h1>
      </header>

      <main className="App-main">
        <div className="Content">
          <div className="ParametersForm">
            <div>
              <label>
                Initial USD Balance:
                <input
                  type="number"
                  value={initialBalanceUsd}
                  onChange={(e) =>
                    setInitialBalanceUsd(parseFloat(e.target.value))
                  }
                />
              </label>
            </div>
            <div>
              <label>
                Initial BTC Balance:
                <input
                  type="number"
                  value={initialBalanceBtc}
                  onChange={(e) =>
                    setInitialBalanceBtc(parseFloat(e.target.value))
                  }
                />
              </label>
            </div>
            <div>
              <label>
                Bi-Weekly Income (USD):
                <input
                  type="number"
                  value={biWeeklyIncomeUsd}
                  onChange={(e) =>
                    setBiWeeklyIncomeUsd(parseFloat(e.target.value))
                  }
                />
              </label>
            </div>
            <div>
              <label>
                Fiat Reserve Floor (USD):
                <input
                  type="number"
                  value={spendingLimitUsd}
                  onChange={(e) =>
                    setSpendingLimitUsd(parseFloat(e.target.value))
                  }
                />
              </label>
            </div>
            <div>
              <label>
                Bill Amount (USD):
                <input
                  type="number"
                  value={billAmountUsd}
                  onChange={(e) => setBillAmountUsd(parseFloat(e.target.value))}
                />
              </label>
            </div>
            <div>
              <label>
                Cost Basis Method:
                <select
                  value={costBasisMethod}
                  onChange={(e) => setCostBasisMethod(e.target.value)}
                >
                  <option value="fifo">FIFO</option>
                  <option value="lifo">LIFO</option>
                  <option value="hifo">HIFO</option>
                </select>
              </label>
            </div>
            <div>
              <label>
                Start Date:
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </label>
            </div>
            <div>
              <label>
                End Date:
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </label>
            </div>
            <button onClick={handleSubmit}>Run Simulation</button>
            {errorMessage && <p className="ErrorMessage">{errorMessage}</p>}
          </div>
        </div>
        {chartData && (
          <div className="SummaryChart">
            <div className="ChartContainer">
              <div className="Chart">
                <BitcoinChart chartData={chartData} />
              </div>
            </div>
            <div className="Summary">
              <h2>Living on Bitcoin</h2>
              <Summary simulation={btcSim} />
            </div>
            <div className="Summary">
              <h2>Living on Fiat</h2>
              <Summary simulation={fiatSim} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
