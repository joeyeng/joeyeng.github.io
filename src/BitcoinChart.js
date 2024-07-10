import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const BitcoinChart = ({ chartData }) => {
  const btcData = chartData.btcData;
  const fiatData = chartData.fiatData;
  const labels = btcData.map((entry) => entry.date);

  const data = {
    labels,
    datasets: [
      {
        label: "Living on Bitcoin",
        data: btcData,
        borderColor: "rgba(255, 165, 0, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        fill: true,
        borderWidth: 2,
      },
      {
        label: "Living on Fiat",
        data: fiatData,
        borderColor: "rgba(133, 187, 101, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        fill: true,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    parsing: {
      xAxisKey: "date",
      yAxisKey: "btc_balance",
    },

    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "BTC Stacked",
      },
      tooltip: {
        callbacks: {
          afterBody: function (t, d) {
            // const data = t[0].raw;
            // return `Net worth: ${new Intl.NumberFormat("en-US", {
            //   style: "currency",
            //   currency: "USD",
            // }).format(data.price_usd * data.btc_balance)}`; //return a string that you wish to append
          },
        },
      },
    },
  };

  return <Line className="Chart" data={data} options={options} />;
};

export default BitcoinChart;
