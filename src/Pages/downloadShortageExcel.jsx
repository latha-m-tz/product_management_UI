import * as XLSX from "xlsx";
import { toast } from "react-toastify";


export const downloadShortageExcel = (shortageOverview) => {
  if (!shortageOverview || shortageOverview.length === 0) {
    toast.warning("No shortage data available to download.");
    return;
  }

  const dataForExcel = shortageOverview.map((item, index) => ({
    "S.No": index + 1,
    "Spare Part": item.name,
    "Total Shortage": item.totalShortage,
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Shortage Overview");

  XLSX.writeFile(workbook, "shortage_overview.xlsx");
};
