import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../api"; // ✅ corrected path
import { Card, Row, Col, Form } from "react-bootstrap";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

const SkeletonCard = () => (
  <div
    style={{
      width: "60px",
      height: "28px",
      backgroundColor: "#e9ecef",
      borderRadius: "6px",
      marginTop: "5px",
    }}
  ></div>
);

const SkeletonChart = () => (
  <div
    style={{
      height: "220px",
      backgroundColor: "#e9ecef",
      borderRadius: "6px",
      width: "100%",
    }}
  ></div>
);

function getYAxisConfig(maxVal) {
  const paddedMax = maxVal * 1.1;

  if (paddedMax <= 10) {
    return { min: 1, max: 10, stepSize: 1 };
  } else if (paddedMax <= 100) {
    const roundedMax = Math.ceil(paddedMax / 10) * 10;
    return { min: 0, max: roundedMax, stepSize: 10 };
  } else if (paddedMax <= 1000) {
    const roundedMax = Math.ceil(paddedMax / 100) * 100;
    return { min: 0, max: roundedMax, stepSize: 100 };
  } else {
    const roundedMax = Math.ceil(paddedMax / 1000) * 1000;
    return { min: 0, max: roundedMax, stepSize: 1000 };
  }
}

export default function OverviewPage() {
  const [stats, setStats] = useState({
    customers: 0,
    vendors: 0,
    productSales: 0,
  });
  const [graphData, setGraphData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countLoading, setCountLoading] = useState(true);
  const [duration, setDuration] = useState("Month");

  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);

  useEffect(() => {
    fetchCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, selectedYear]);

  const fetchCounts = async () => {
    setCountLoading(true);
    setLoading(true);
    try {
      const [vendorsRes, customersRes, salesSummaryRes, productsold] = await Promise.all([
        axios.get(`${API_BASE_URL}/vendors/count`),
        axios.get(`${API_BASE_URL}/customers/count`),
        axios.get(`${API_BASE_URL}/sales-summary`),
        axios.get(`${API_BASE_URL}/products/sold/count`),
      ]);

      setStats({
        vendors: vendorsRes.data.count ?? 0,
        customers: customersRes.data.count ?? 0,
        productSales: salesSummaryRes.data.totalProductsSold ?? 0,
        soldCount: productsold.data.count ?? 0,
      });

      const years = salesSummaryRes.data.yearlySales.map((y) => y.year);
      setAvailableYears(years);

      if (!selectedYear && years.length) {
        const currentYear = new Date().getFullYear();
        setSelectedYear(years.includes(currentYear) ? currentYear : Math.max(...years));
      }

      const summaryData = salesSummaryRes.data;

      if (duration === "Year") {
        setGraphData(
          summaryData.yearlySales.map((item) => ({
            label: item.year.toString(),
            value: item.total_quantity,
          }))
        );
      } else {
        // Here is the change:
        // Always show 12 months in x axis, filling zero for missing months
        const filteredMonthly = selectedYear
          ? summaryData.monthlySales.filter((m) => m.year === selectedYear)
          : summaryData.monthlySales;

        const allMonths = [
          "January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"
        ];

        // Map month name to short label (Jan, Feb, etc)
        const monthShortNames = {
          January: "Jan",
          February: "Feb",
          March: "Mar",
          April: "Apr",
          May: "May",
          June: "Jun",
          July: "Jul",
          August: "Aug",
          September: "Sep",
          October: "Oct",
          November: "Nov",
          December: "Dec",
        };

        // Create a lookup of sales by month name from DB data
        const salesByMonth = {};
        filteredMonthly.forEach(item => {
          salesByMonth[item.month_name] = item.total_quantity;
        });

        // Build graphData ensuring all 12 months present with 0 if missing
        const fullYearData = allMonths.map(month => ({
          label: monthShortNames[month],
          value: salesByMonth[month] ?? 0,
        }));

        setGraphData(fullYearData);
      }
    } catch {
      setStats({ vendors: 0, customers: 0, productSales: 0 });
      setGraphData([]);
      setAvailableYears([]);
      setSelectedYear(null);
    } finally {
      setCountLoading(false);
      setLoading(false);
    }
  };

  const formatCount = (num) => {
    if (!num) return 0;
    if (num >= 1000) return `${Math.round(num / 1000)}k`;
    return num;
  };

  const maxValue = Math.max(...graphData.map((item) => item.value), 0);
  const { min: yMin, max: yMax, stepSize } = getYAxisConfig(maxValue);

  const chartData = {
    labels: graphData.map((item) => item.label),
    datasets: [
      {
        label: "Product Sales",
        data: graphData.map((item) => item.value),
        borderColor: "#28a745",
        backgroundColor: "#28a745",
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: "index", intersect: false },
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: { font: { size: 12 } },
      },
      y: {
        grid: { display: false, drawBorder: false },
        min: yMin,
        max: yMax,
        ticks: {
          stepSize: stepSize,
          callback: (val) => {
            if (val === 0) return "0";
            if (yMax >= 1000) {
              return val % 1000 === 0 ? `${val / 1000}k` : val;
            }
            return val;
          },
          font: { size: 12 },
        },
      },
    },
  };

  return (
    <>
      <Row className="mb-4 g-3">
        <Col xs={12} sm={6} md={3}>
          <Card
            className="border-0 shadow-sm h-100"
            style={{ backgroundColor: "#E3F5FF" }}
          >
            <Card.Body>
              <h6 className="fw-semibold">Customer</h6>
              {countLoading ? (
                <SkeletonCard />
              ) : (
                <h2>{formatCount(stats.customers)}</h2>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Card
            className="border-0 shadow-sm h-100"
            style={{ backgroundColor: "#E5ECF6" }}
          >
            <Card.Body>
              <h6 className="fw-semibold">Vendor</h6>
              {countLoading ? (
                <SkeletonCard />
              ) : (
                <h2>{formatCount(stats.vendors)}</h2>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Card
            className="border-0 shadow-sm h-100"
            style={{ backgroundColor: "#E5ECF6" }}
          >
            <Card.Body>
              <h6 className="fw-semibold">Product Sale</h6>
              {countLoading ? (
                <SkeletonCard />
              ) : (
                <h2>{formatCount(stats.productSales)}</h2>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Card
            className="border-0 shadow-sm h-100"
            style={{ backgroundColor: "#cbddf8ff" }}
          >
            <Card.Body>
              <h6 className="fw-semibold">Sold Products</h6>
              {countLoading ? (
                <SkeletonCard />
              ) : (
                <h2>{formatCount(stats.soldCount)}</h2>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm border-0 mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-semibold mb-0">Product Sales</h6>

            <div className="d-flex align-items-center" style={{ gap: "4px" }}>
              {duration === "Month" && (
                <Form.Select
                  className="form-select w-auto"
                  value={selectedYear ?? ""}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  disabled={loading}
                  aria-label="Select Year"
                >
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </Form.Select>
              )}
            </div>
          </div>
          {loading ? (
            <SkeletonChart />
          ) : (
            <div style={{ height: "220px" }}>
              <Line data={chartData} options={chartOptions} />
            </div>
          )}
        </Card.Body>
      </Card>
    </>
  );
}
