import React, { useEffect, useState } from "react";
import { Card, Row, Col, Form } from "react-bootstrap";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import api, { setAuthToken } from "../api";

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

  if (paddedMax <= 10) return { min: 0, max: 10, stepSize: 1 };
  if (paddedMax <= 100)
    return { min: 0, max: Math.ceil(paddedMax / 10) * 10, stepSize: 10 };
  if (paddedMax <= 1000)
    return { min: 0, max: Math.ceil(paddedMax / 100) * 100, stepSize: 100 };

  return { min: 0, max: Math.ceil(paddedMax / 1000) * 1000, stepSize: 1000 };
}

export default function OverviewPage() {
  const [stats, setStats] = useState({
    customers: 0,
    vendors: 0,
    productSales: 0,
    soldCount: 0,
  });

  const [graphData, setGraphData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countLoading, setCountLoading] = useState(true);
  const [duration, setDuration] = useState("Month");
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) setAuthToken(token);

    fetchCounts();
    fetchGraphData();

  }, [duration, selectedYear]);

  const fetchCounts = async () => {
    setCountLoading(true);

    try {
      const [vendorsRes, customersRes, availableRes, soldRes] =
        await Promise.all([
          api.get("/vendors/count"),
          api.get("/customers/count"),
          api.get("/products/available/count"),
          api.get("/products/sold/count"),
        ]);

      const extract = (obj) =>
        obj?.count ??
        obj?.total ??
        obj?.data ??
        obj?.totalProductsSold ??
        obj?.total_products_sold ??
        0;

      setStats({
        customers: extract(customersRes.data),
        vendors: extract(vendorsRes.data),
        productSales: extract(availableRes.data),
        soldCount: extract(soldRes.data),
      });
    } catch (error) {
      console.error("Dashboard API Error:", error);
    } finally {
      setCountLoading(false);
    }
  };

  const fetchGraphData = async () => {
    setLoading(true);

    try {
      const res = await api.get("/products/sold/count");

      const yearly = res.data.yearly_sales || [];
      const monthly = res.data.monthly_sales || [];

      const years = yearly.map((y) => Number(y.year));
      setAvailableYears(years);

      if (!selectedYear && years.length > 0) {
        const currentYear = new Date().getFullYear();
        setSelectedYear(
          years.includes(currentYear) ? currentYear : Math.max(...years)
        );
      }

      if (duration === "Year") {
        setGraphData(
          yearly.map((y) => ({
            label: y.year.toString(),
            value: Number(y.total_quantity) || 0,
          }))
        );
      } else {
        const allMonths = [
          "January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"
        ];

        const short = {
          January: "Jan", February: "Feb", March: "Mar", April: "Apr",
          May: "May", June: "Jun", July: "Jul", August: "Aug",
          September: "Sep", October: "Oct", November: "Nov", December: "Dec"
        };

        const filtered = monthly.filter(
          (m) => Number(m.year) === Number(selectedYear)
        );

        const lookup = {};
        filtered.forEach((m) => {
          lookup[m.month_name.trim()] = Number(m.total_quantity) || 0;
        });

        setGraphData(
          allMonths.map((month) => ({
            label: short[month],
            value: lookup[month] ?? 0,
          }))
        );
      }

    } catch (error) {
      console.error("Graph API Error:", error);
      setGraphData([]);
    } finally {
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
        backgroundColor: "rgba(40, 167, 69, 0.3)",
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
      x: { grid: { display: false } },
      y: {
        beginAtZero: true,
        min: 0,
        max: 1000,       
        ticks: {
          stepSize: 100,
          callback: (val) => val,
        },
        grid: { display: false },
      },
    },
  };


  return (
    <>
      <div className="container-fluid px-0">
        <Row className="mb-4 g-3 w-100 mx-0">

          {/* CUSTOMER */}
          <Col xs={12} sm={6} md={3} className="px-2">
            <Card className="border-0 shadow-sm h-100" style={{ backgroundColor: "#E3F5FF" }}>
              <Card.Body>
                <h6 className="fw-semibold">Customer</h6>
                {countLoading ? <SkeletonCard /> : <h2>{formatCount(stats.customers)}</h2>}
              </Card.Body>
            </Card>
          </Col>

          {/* VENDOR */}
          <Col xs={12} sm={6} md={3} className="px-2">
            <Card className="border-0 shadow-sm h-100" style={{ backgroundColor: "#E5ECF6" }}>
              <Card.Body>
                <h6 className="fw-semibold">Vendor</h6>
                {countLoading ? <SkeletonCard /> : <h2>{formatCount(stats.vendors)}</h2>}
              </Card.Body>
            </Card>
          </Col>

          {/* PRODUCTS AVAILABLE */}
          <Col xs={12} sm={6} md={3} className="px-2">
            <Card className="border-0 shadow-sm h-100" style={{ backgroundColor: "#E5ECF6" }}>
              <Card.Body>
                <h6 className="fw-semibold">Products</h6>
                {countLoading ? <SkeletonCard /> : <h2>{formatCount(stats.productSales)}</h2>}
              </Card.Body>
            </Card>
          </Col>

          {/* SOLD PRODUCTS */}
          <Col xs={12} sm={6} md={3} className="px-2">
            <Card className="border-0 shadow-sm h-100" style={{ backgroundColor: "#cbddf8" }}>
              <Card.Body>
                <h6 className="fw-semibold">Sold Products</h6>
                {countLoading ? <SkeletonCard /> : <h2>{formatCount(stats.soldCount)}</h2>}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>

      {/* GRAPH */}
      <Card className="shadow-sm border-0 mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-semibold mb-0">Product Sales</h6>

            {duration === "Month" && (
              <Form.Select
                className="form-select w-auto"
                value={selectedYear ?? ""}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </Form.Select>
            )}
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
