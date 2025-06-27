import React, { useRef, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler
);

export default function SentimentTrendChart({ data }) {
  const chartRef = useRef();

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = chartRef.current;
    const ctx = chart.ctx;
    const gradientPositive = ctx.createLinearGradient(0, 0, 0, 400);
    gradientPositive.addColorStop(0, "rgba(0,230,118,0.15)");
    gradientPositive.addColorStop(1, "rgba(0,230,118,0)");

    const gradientNeutral = ctx.createLinearGradient(0, 0, 0, 400);
    gradientNeutral.addColorStop(0, "rgba(255,197,61,0.15)");
    gradientNeutral.addColorStop(1, "rgba(255,197,61,0)");

    const gradientNegative = ctx.createLinearGradient(0, 0, 0, 400);
    gradientNegative.addColorStop(0, "rgba(193,28,94,0.15)");
    gradientNegative.addColorStop(1, "rgba(193,28,94,0)");

    chart.data.datasets[0].borderColor = "#00e676";
    chart.data.datasets[0].backgroundColor = gradientPositive;
    chart.data.datasets[0].pointBackgroundColor = "#00e676";
    chart.data.datasets[0].pointBorderColor = "#fff";
    chart.data.datasets[0].fill = true;
    chart.data.datasets[1].borderColor = "#FFC53D";
    chart.data.datasets[1].backgroundColor = gradientNeutral;
    chart.data.datasets[1].pointBackgroundColor = "#FFC53D";
    chart.data.datasets[1].pointBorderColor = "#fff";
    chart.data.datasets[1].fill = true;
    chart.data.datasets[2].borderColor = "#C11C5E";
    chart.data.datasets[2].backgroundColor = gradientNegative;
    chart.data.datasets[2].pointBackgroundColor = "#C11C5E";
    chart.data.datasets[2].pointBorderColor = "#fff";
    chart.data.datasets[2].fill = true;
    chart.update();
  }, [data]);

  const chartData = {
    labels: data.map((item) => item.month),
    datasets: [
      {
        label: "Positive",
        data: data.map((item) => item.positive),
        borderWidth: 3,
        pointRadius: 7,
        pointBackgroundColor: "#00e676",
        pointBorderColor: "#fff",
        pointShadowBlur: 10,
        fill: false,
        tension: 0.4,
      },
      {
        label: "Neutral",
        data: data.map((item) => item.neutral),
        borderWidth: 3,
        pointRadius: 7,
        pointBackgroundColor: "#FFC53D",
        pointBorderColor: "#fff",
        pointShadowBlur: 10,
        fill: false,
        tension: 0.4,
      },
      {
        label: "Negative",
        data: data.map((item) => item.negative),
        borderWidth: 3,
        pointRadius: 7,
        pointBackgroundColor: "#C11C5E",
        pointBorderColor: "#fff",
        pointShadowBlur: 10,
        fill: false,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: {
          font: {
            family: "Orbitron, Montserrat, sans-serif",
            size: 16,
            weight: "bold",
          },
          generateLabels: (chart) => {
            const original =
              ChartJS.defaults.plugins.legend.labels.generateLabels;
            const labels = original(chart);
            const colorMap = ["#00e676", "#FFC53D", "#C11C5E"];
            return labels.map((label, i) => ({
              ...label,
              strokeStyle: colorMap[i],
              fillStyle: "transparent",
              fontColor: colorMap[i],
              font: {
                family: "Orbitron, Montserrat, sans-serif",
                size: 16,
                weight: "bold",
              },
              color: colorMap[i],
            }));
          },
          color: undefined,
        },
      },
      tooltip: {
        backgroundColor: "#FFF7E2",
        titleColor: "#C11C5E",
        bodyColor: "#C11C5E",
        borderColor: "#FFC53D",
        borderWidth: 2,
        padding: 12,
        caretSize: 8,
        cornerRadius: 8,
      },
    },
    layout: {
      padding: 20,
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Month",
          color: "#C11C5E",
          font: { size: 16 },
        },
        ticks: { color: "#C11C5E", font: { size: 14 } },
        grid: { color: "rgba(255, 255, 255, 0)" },
      },
      y: {
        title: {
          display: true,
          text: "Count",
          color: "#C11C5E",
          font: { size: 16 },
        },
        beginAtZero: true,
        precision: 0,
        ticks: { color: "#C11C5E", font: { size: 14 }, stepSize: 1 },
        grid: { color: "rgba(255,255,255,0)" },
      },
    },
    animation: {
      duration: 1200,
      easing: "easeInOutQuart",
    },
  };

  return (
    <div
      style={{
        background: "#FFF6F9",
        borderRadius: 20,
        border: "2px solid #C11C5E",
        boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.07)",
        padding: 32,
        margin: "32px 0",
      }}
    >
      <Line
        ref={chartRef}
        data={chartData}
        options={options}
        width={1000}
        height={400}
      />
    </div>
  );
}
