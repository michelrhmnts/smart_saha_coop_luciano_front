import {
  getSurveys,
  getSurvey,
  createSurvey,
  updateSurvey,
  deleteSurvey,
  getSurveyResponses,
  submitSurveyResponse,
  deleteSurveyResponse,
  exportSurveyCsv,
} from "../api/surveys";

export const getAllSurveys = async (params = {}) => {
  return await getSurveys(params);
};

export const getSurveyById = async (id) => {
  return await getSurvey(id);
};

export const createNewSurvey = async (data) => {
  return await createSurvey(data);
};

export const updateExistingSurvey = async (id, data) => {
  return await updateSurvey(id, data);
};

export const deleteExistingSurvey = async (id) => {
  return await deleteSurvey(id);
};

export const getAllSurveyResponses = async (formId) => {
  return await getSurveyResponses(formId);
};

export const submitNewSurveyResponse = async (formId, data) => {
  return await submitSurveyResponse(formId, data);
};

export const deleteExistingSurveyResponse = async (formId, responseId) => {
  return await deleteSurveyResponse(formId, responseId);
};

export const downloadSurveyCsv = async (formId, formTitle = "enquete") => {
  const blob = await exportSurveyCsv(formId);
  const url = window.URL.createObjectURL(new Blob([blob]));
  const link = document.createElement("a");
  link.href = url;
  const safeTitle = formTitle.toLowerCase().replace(/[^a-z0-9]/g, "_");
  link.setAttribute("download", `${safeTitle}_reponses.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
