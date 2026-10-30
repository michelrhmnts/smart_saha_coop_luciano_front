import {
  getAllMyFarmers,
  getFarmersByCooperative,
  getFarmer,
  createFarmer,
  updateFarmer,
  deleteFarmer,
} from "../api/farmers";


// ============================================================
// TOUS LES AGRICULTEURS DE L'UTILISATEUR
// ============================================================

export const getAllFarmers = async () => {
  return await getAllMyFarmers();
};


// ============================================================
// LISTE DES AGRICULTEURS D'UNE COOPÉRATIVE
// ============================================================

export const getAllFarmersByCooperative = async (
  cooperativeId
) => {
  return await getFarmersByCooperative(cooperativeId);
};


// ============================================================
// DÉTAIL D'UN AGRICULTEUR
// ============================================================

export const getFarmerById = async (
  cooperativeId,
  farmerId
) => {
  return await getFarmer(
    cooperativeId,
    farmerId
  );
};


// ============================================================
// CRÉER UN AGRICULTEUR
// ============================================================

export const createNewFarmer = async (
  cooperativeId,
  data
) => {
  return await createFarmer(
    cooperativeId,
    data
  );
};


// ============================================================
// MODIFIER UN AGRICULTEUR
// ============================================================

export const updateExistingFarmer = async (
  cooperativeId,
  farmerId,
  data
) => {
  return await updateFarmer(
    cooperativeId,
    farmerId,
    data
  );
};


// ============================================================
// SUPPRIMER UN AGRICULTEUR
// ============================================================

export const deleteExistingFarmer = async (
  cooperativeId,
  farmerId
) => {
  return await deleteFarmer(
    cooperativeId,
    farmerId
  );
};