import api from "./axios";

// ============================================================
// RÉCUPÉRER TOUS LES AGRICULTEURS DE L'UTILISATEUR
// ============================================================

export const getAllMyFarmers = async () => {
  const response = await api.get("/farmers");
  return response.data;
};


// ============================================================
// RÉCUPÉRER LES AGRICULTEURS D'UNE COOPÉRATIVE
// ============================================================

export const getFarmersByCooperative = async (cooperativeId) => {
  const response = await api.get(
    `/cooperatives/${cooperativeId}/farmers`
  );

  return response.data;
};


// ============================================================
// RÉCUPÉRER UN AGRICULTEUR
// ============================================================

export const getFarmer = async (
  cooperativeId,
  farmerId
) => {
  const response = await api.get(
    `/cooperatives/${cooperativeId}/farmers/${farmerId}`
  );

  return response.data;
};


// ============================================================
// CRÉER UN AGRICULTEUR
// ============================================================

export const createFarmer = async (
  cooperativeId,
  data
) => {
  const response = await api.post(
    `/cooperatives/${cooperativeId}/farmers`,
    data
  );

  return response.data;
};


// ============================================================
// MODIFIER UN AGRICULTEUR
// ============================================================

export const updateFarmer = async (
  cooperativeId,
  farmerId,
  data
) => {
  const response = await api.put(
    `/cooperatives/${cooperativeId}/farmers/${farmerId}`,
    data
  );

  return response.data;
};


// ============================================================
// SUPPRIMER UN AGRICULTEUR
// ============================================================

export const deleteFarmer = async (
  cooperativeId,
  farmerId
) => {
  const response = await api.delete(
    `/cooperatives/${cooperativeId}/farmers/${farmerId}`
  );

  return response.data;
};