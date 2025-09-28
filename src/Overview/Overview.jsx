import React from "react";
import OverviewPage from "./OverviewPage";
import TotalProductPage from "./OverviewTotalProductPage";
import "../index.css";   // ✅ fixed path
import ComponentStock from "./OverviewComponentStock";
import LastSalesList from "./OverviewLastSalesList";
import LastPurchaseList from "./OverviewLastPurchaseList";
import DashboardStats from "./PcbServiceOverview";
import { API_BASE_URL } from "../api"; // ✅ corrected path

const Overview = () => {
  return (
    <div className="p-4" style={{ minHeight: "100vh" }}>
      <h4 className="mb-4 fw-semibold">Overview</h4>

      <div className="row g-4 align-items-stretch" style={{ height: "100%" }}>
        <div className="col-lg-7 col-sm-12 d-flex">
          <div className="w-100 d-flex flex-column">
            <OverviewPage />
          </div>
        </div>

        <div className="col-lg-5 d-flex">
          <div className="w-100 d-flex flex-column h-100">
            <TotalProductPage />
          </div>
        </div>
      </div>
      <div className="row g-4 align-items-stretch mt-1">
        <div className="col-lg-12 d-flex">
          <div className="w-100 d-flex flex-column">
            <ComponentStock />
          </div>
        </div>
      </div>

       <div className="row g-4 align-items-stretch mt-1">
        <div className="col-lg-12 d-flex">
          <div className="w-100 d-flex flex-column">
            <DashboardStats/>
          </div>
        </div>
      </div>
      <div className="row g-4 align-items-stretch mt-1">
        <div className="col-lg-12 d-flex">
          <div className="w-100 d-flex flex-column">
            <LastSalesList />
          </div>
        </div>
      </div>
      <div className="row g-4 align-items-stretch mt-1">
        <div className="col-lg-12 d-flex">
          <div className="w-100 d-flex flex-column">
            <LastPurchaseList />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
