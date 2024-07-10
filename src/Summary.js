const Summary = ({ simulation }) => {
  const summary = simulation.summary;
  return (
    <div>
      <div className="SummaryContainer">
        <div className="SummaryTable">
          <table id="summary">
            <thead>
              <tr>
                <th>Year</th>
                <th>Bitcoin Stacked</th>
                <th>Bitcoin Spent</th>
                <th>Bitcoin Kept</th>
                <th>Realized Gains/Losses</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(summary).map((year, index) => (
                <tr key={index}>
                  <td>{year}</td>
                  <td>{summary[year].bitcoin_accumulated.toFixed(8)}</td>
                  <td>{summary[year].bitcoin_sold.toFixed(8)}</td>
                  <td>{summary[year].bitcoin_retained.toFixed(8)}</td>
                  <td>
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(summary[year].realized_gain_loss)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th>Total</th>
                <th>
                  {Object.keys(summary)
                    .map((year) => summary[year].bitcoin_accumulated)
                    .reduce((total, value) => total + value, 0)
                    .toFixed(8)}
                </th>
                <th>
                  {Object.keys(summary)
                    .map((year) => summary[year].bitcoin_sold)
                    .reduce((total, value) => total + value, 0)
                    .toFixed(8)}
                </th>
                <th>
                  {Object.keys(summary)
                    .map((year) => summary[year].bitcoin_retained)
                    .reduce((total, value) => total + value, 0)
                    .toFixed(8)}
                </th>
                <th>
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(
                    Object.keys(summary)
                      .map((year) => summary[year].realized_gain_loss)
                      .reduce((total, value) => total + value, 0)
                  )}
                </th>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      <h2>Transactions</h2>
      <div className="SummaryContainer">
        <div className="TransactionsTable">
          <table id="transactions">
            <thead>
              <tr>
                <th>Date</th>
                <th>Buy/Sell</th>
                <th>Amount (₿)</th>
                <th>BTC-USD</th>
                <th>Balance (₿)</th>
              </tr>
            </thead>
            <tbody>
              {simulation.transactions.map((t) => (
                <tr>
                  <td>{t.date}</td>
                  <td>{t.type}</td>
                  <td>{t.amount_btc.toFixed(8)}</td>
                  <td>
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(t.price_usd)}
                  </td>
                  <td>{t.btc_balance.toFixed(8)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Summary;
