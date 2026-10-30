import api from "./axios";

/**
 * Récupérer tous les audits
 */
export const getAllAudits = () => {
  return api.get("/audits/");
};

/**
 * Récupérer un audit par son ID
 */
export const getAuditById = (auditId) => {
  return api.get(`/audits/${auditId}`);
};

/**
 * Créer un audit
 */
export const createAudit = (data) => {
  return api.post("/audits/", data);
};

/**
 * Modifier un audit
 */
export const updateAudit = (auditId, data) => {
  return api.put(`/audits/${auditId}`, data);
};

/**
 * Supprimer un audit
 */
export const deleteAudit = (auditId) => {
  return api.delete(`/audits/${auditId}`);
};