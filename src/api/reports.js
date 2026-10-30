import api from "./axios";

export const getDashboardReports = async (params = {}) => {
  const response = await api.get("/reports/dashboard", { params });
  return response.data;
};

export const downloadReportsCsv = async (params = {}) => {
  const response = await api.get("/reports/export/csv", {
    params,
    responseType: "blob",
  });

  const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute(
    "download",
    `rapport_smartsaha_${params.period || "global"}.csv`
  );
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
};
