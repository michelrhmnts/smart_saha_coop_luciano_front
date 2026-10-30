import api from "./axios";

// ============================================================
// FORMULAIRES D'ENQUÊTE
// ============================================================

export const getSurveys = async (params = {}) => {
  const response = await api.get("/surveys", { params });
  return response.data;
};

export const getSurvey = async (id) => {
  const response = await api.get(`/surveys/${id}`);
  return response.data;
};

export const createSurvey = async (data) => {
  const response = await api.post("/surveys", data);
  return response.data;
};

export const updateSurvey = async (id, data) => {
  const response = await api.put(`/surveys/${id}`, data);
  return response.data;
};

export const deleteSurvey = async (id) => {
  const response = await api.delete(`/surveys/${id}`);
  return response.data;
};

// ============================================================
// RÉPONSES AUX ENQUÊTES
// ============================================================

export const getSurveyResponses = async (formId) => {
  const response = await api.get(`/surveys/${formId}/responses`);
  return response.data;
};

export const submitSurveyResponse = async (formId, data) => {
  const response = await api.post(`/surveys/${formId}/responses`, data);
  return response.data;
};

export const deleteSurveyResponse = async (formId, responseId) => {
  const response = await api.delete(`/surveys/${formId}/responses/${responseId}`);
  return response.data;
};

// ============================================================
// EXPORT CSV
// ============================================================

export const exportSurveyCsv = async (formId) => {
  const response = await api.get(`/surveys/${formId}/export`, {
    responseType: "blob",
  });
  return response.data;
};
