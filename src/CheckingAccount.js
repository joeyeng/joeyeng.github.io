class Transaction {
  constructor(amount_btc, price_usd) {
    this.amount_btc = amount_btc;
    this.price_usd = price_usd;
  }
}

class History {
  constructor(date, btc_balance, amount_btc, price_usd, type) {
    this.date = date;
    this.btc_balance = btc_balance;
    this.amount_btc = amount_btc;
    this.price_usd = price_usd;
    this.type = type;
  }
}

class YearlySummary {
  constructor(year) {
    this.year = year;
    this.bitcoin_accumulated = 0.0;
    this.bitcoin_sold = 0.0;
    this.realized_gain_loss = 0.0;
    this.bitcoin_retained = 0.0;
  }

  addAccumulated(amount_btc) {
    this.bitcoin_accumulated += amount_btc;
    this.bitcoin_retained += amount_btc;
  }

  addSold(amount_btc, gain_loss) {
    this.bitcoin_sold += amount_btc;
    this.realized_gain_loss += gain_loss;
    this.bitcoin_retained -= amount_btc;
  }
}

export class CheckingAccount {
  constructor(
    unit_of_account,
    initialBalanceUsd,
    initialBalanceBtc,
    biWeeklyIncomeUsd,
    spendingLimitUsd,
    billAmountUsd,
    costBasisMethod
  ) {
    this.unit_of_account = unit_of_account;
    this.usd_balance = initialBalanceUsd;
    this.bitcoin_balance = initialBalanceBtc;
    this.bi_weekly_income_usd = biWeeklyIncomeUsd;
    this.spending_limit_usd = unit_of_account == "fiat" ? spendingLimitUsd : 0;
    this.bill_amount_usd = billAmountUsd;
    this.cost_basis_method = costBasisMethod.toLowerCase();
    this.transactions = [];
    this.yearly_summaries = {};
    this.history = [];
  }

  addIncome(bitcoin_price, current_date) {
    if (this.unit_of_account == "btc") {
      let bi_weekly_income_usd = this.bi_weekly_income_usd;
      if (this.usd_balance > 0) {
        bi_weekly_income_usd += this.usd_balance;
        this.usd_balance = 0;
      }

      const bi_weekly_income_btc = bi_weekly_income_usd / bitcoin_price;
      this.bitcoin_balance += bi_weekly_income_btc;

      this.transactions.push(
        new Transaction(bi_weekly_income_btc, bitcoin_price)
      );

      this.history.push(
        new History(
          this.getDateString(current_date),
          this.bitcoin_balance,
          bi_weekly_income_btc,
          bitcoin_price,
          "buy"
        )
      );

      const year = current_date.getFullYear();
      if (!this.yearly_summaries[year]) {
        this.yearly_summaries[year] = new YearlySummary(year);
      }
      this.yearly_summaries[year].addAccumulated(bi_weekly_income_btc);
    } else {
      this.usd_balance += this.bi_weekly_income_usd;
      this.buyBitcoin(bitcoin_price, current_date);
    }
  }

  payBills(bitcoin_price, current_date) {
    const bill_amount_btc = this.bill_amount_usd / bitcoin_price;
    let realized_gain_loss = 0;

    if (this.unit_of_account == "btc") {
      if (this.bitcoin_balance >= bill_amount_btc) {
        realized_gain_loss = this.calculateGainLoss(
          bill_amount_btc,
          bitcoin_price,
          this.getDateString(current_date)
        );
        this.bitcoin_balance -= bill_amount_btc;

        this.transactions.push(new Transaction(bill_amount_btc, bitcoin_price));

        this.history.push(
          new History(
            this.getDateString(current_date),
            this.bitcoin_balance,
            bill_amount_btc,
            bitcoin_price,
            "sell"
          )
        );

        const year = current_date.getFullYear();
        if (!this.yearly_summaries[year]) {
          this.yearly_summaries[year] = new YearlySummary(year);
        }
        this.yearly_summaries[year].addSold(
          bill_amount_btc,
          realized_gain_loss
        );
      } else {
        throw new Error("Oops, you ran out of Bitcoin to pay your bills!");
      }
    } else if (this.unit_of_account == "fiat") {
      if (this.usd_balance >= this.bill_amount_usd) {
        this.usd_balance -= this.bill_amount_usd;
      } else {
        throw new Error("Oops, you ran out of fiat to pay your bills!");
      }
    }
  }

  buyBitcoin(bitcoin_price, current_date) {
    const amount_to_spend = this.usd_balance - this.spending_limit_usd;
    if (amount_to_spend > 0) {
      const bitcoins_bought = amount_to_spend / bitcoin_price;
      this.usd_balance -= amount_to_spend;
      this.bitcoin_balance += bitcoins_bought;

      this.transactions.push(new Transaction(bitcoins_bought, bitcoin_price));

      this.history.push(
        new History(
          this.getDateString(current_date),
          this.bitcoin_balance,
          bitcoins_bought,
          bitcoin_price,
          "buy"
        )
      );

      const year = current_date.getFullYear();
      if (!this.yearly_summaries[year]) {
        this.yearly_summaries[year] = new YearlySummary(year);
      }
      this.yearly_summaries[year].addAccumulated(bitcoins_bought);
    }
  }

  calculateGainLoss(amount_btc, current_price, current_date) {
    let gain_loss = 0;
    let amount_to_sell = amount_btc;
    let transactions_to_use = [];

    if (this.cost_basis_method === "fifo") {
      transactions_to_use = this.transactions.slice();
    } else if (this.cost_basis_method === "lifo") {
      transactions_to_use = this.transactions.slice().reverse();
    } else if (this.cost_basis_method === "hifo") {
      transactions_to_use = this.transactions
        .slice()
        .sort((a, b) => b.price_usd - a.price_usd);
    }

    while (amount_to_sell > 0 && transactions_to_use.length > 0) {
      const transaction = transactions_to_use.shift();
      if (transaction.amount_btc <= amount_to_sell) {
        gain_loss +=
          (current_price - transaction.price_usd) * transaction.amount_btc;
        amount_to_sell -= transaction.amount_btc;
        this.transactions = this.transactions.filter((t) => t !== transaction);
      } else {
        gain_loss += (current_price - transaction.price_usd) * amount_to_sell;
        transaction.amount_btc -= amount_to_sell;
        amount_to_sell = 0;
      }
    }

    return gain_loss;
  }

  processSimulation({ startDate, endDate, bitcoinPrices }) {
    var currentDate = this.getDate(startDate);
    let end = this.getDate(endDate);
    let isIncomeWeek = true;

    while (currentDate <= end) {
      let date = this.getDateString(currentDate);
      if (!bitcoinPrices.has(date))
        throw new Error("No price data for " + date);

      let bitcoinPrice = bitcoinPrices.get(date);

      if (bitcoinPrice) {
        if (isIncomeWeek) {
          this.addIncome(bitcoinPrice, currentDate);
        } else {
          this.payBills(bitcoinPrice, currentDate);
        }
      }

      currentDate.setDate(currentDate.getDate() + 7);
      isIncomeWeek = !isIncomeWeek;
    }

    return { summary: this.yearly_summaries, transactions: this.history };
  }

  getDate(value) {
    let parts = value.split("-");
    // Please pay attention to the month (parts[1]); JavaScript counts months from 0:
    // January - 0, February - 1, etc.
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  getDateString(date) {
    let month = (date.getMonth() + 1).toString().padStart(2, "0");
    let day = (date.getDate() + 0).toString().padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
  }
}
