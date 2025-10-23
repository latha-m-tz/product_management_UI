import React, { useState } from "react";
import { Button } from "react-bootstrap";

import ActionButton from "../components/ActionButton";
import BreadCrumb from "../components/BreadCrumb";
import Card from "../components/Card";
import DatePicker from "../components/DatePicker";
import { FormInput, FormDropdown } from "../components/FormInput";
import Loader from "../components/Loader";
import PageWrapper from "../components/PageWrapper";
import Pagination from "../components/Pagination";
import Search from "../components/Search";
import SweetAlert from "../components/SweetAlert";

export default function ComponentsPage() {
  const [showLoader, setShowLoader] = useState(false);
  const [showToaster, setShowToaster] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  const breadcrumbItems = [
    { label: "Home", link: "/" },
    { label: "Components", link: "/components" },
  ];

  return (
    <PageWrapper title="Components Demo">
      <BreadCrumb items={breadcrumbItems} />

      <div className="container py-4">
        <h2 className="mb-4">Reusable Components Showcase</h2>

        {/* Loader */}
        <Card title="Loader">
          <Button
            variant="primary"
            onClick={() => {
              setShowLoader(true);
              setTimeout(() => setShowLoader(false), 2000);
            }}
          >
            Show Loader
          </Button>
          {showLoader && <Loader />}
        </Card>

        {/* Toaster */}
        <Card title="Toaster">
          <Button variant="success" onClick={() => setShowToaster(true)}>
            Show Toaster
          </Button>
          {showToaster && (
            <Toaster
              message="This is a success message!"
              type="success"
              onClose={() => setShowToaster(false)}
            />
          )}
        </Card>

        {/* SweetAlert */}
        <Card title="SweetAlert">
          <Button variant="warning" onClick={() => setShowAlert(true)}>
            Show Alert
          </Button>
          {showAlert && (
            <SweetAlert
              title="Are you sure?"
              text="This action cannot be undone."
              onConfirm={() => {
                alert("Confirmed!");
                setShowAlert(false);
              }}
              onCancel={() => setShowAlert(false)}
            />
          )}
        </Card>

        {/* Action Buttons */}
        <Card title="Action Buttons">
          <ActionButton type="add" onClick={() => alert("Add clicked")} />
          <ActionButton type="edit" onClick={() => alert("Edit clicked")} />
          <ActionButton type="delete" onClick={() => alert("Delete clicked")} />
        </Card>

        {/* Form Input */}
        <Card title="Form Input">
          <FormInput label="Name" placeholder="Enter your name" />
          <FormDropdown
            label="Select Option"
            options={["Option 1", "Option 2", "Option 3"]}
          />
        </Card>

        {/* Date Picker */}
        <Card title="Date Picker">
          <DatePicker onChange={(date) => alert(`Selected: ${date}`)} />
        </Card>

        {/* Search */}
        <Card title="Search">
          <Search
            placeholder="Search items..."
            onSearch={(query) => alert(`Searching for: ${query}`)}
          />
        </Card>

        {/* Pagination */}
        <Card title="Pagination">
          <Pagination
            currentPage={1}
            totalPages={5}
            onPageChange={(page) => alert(`Go to page: ${page}`)}
          />
        </Card>
      </div>
    </PageWrapper>
  );
}
