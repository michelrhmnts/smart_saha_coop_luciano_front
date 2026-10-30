import {
  getParcelsByCooperative,
  getParcel,
  createParcel,
  importParcelFile,
  updateParcel,
  deleteParcel,
  getMyParcels
} from "../api/parcels";


// ============================================================
// LISTE DES PARCELLES
// ============================================================

export const getAllParcelsByCooperative = async (
  cooperativeId
) => {
  return await getParcelsByCooperative(
    cooperativeId
  );
};

export const getAllMyParcels = async () => {
  return await getMyParcels();
};


// ============================================================
// DÉTAIL D'UNE PARCELLE
// ============================================================

export const getParcelById = async (
  cooperativeId,
  parcelId
) => {
  return await getParcel(
    cooperativeId,
    parcelId
  );
};


// ============================================================
// CRÉER UNE PARCELLE
// ============================================================

export const createNewParcel = async (
  cooperativeId,
  data
) => {
  return await createParcel(
    cooperativeId,
    data
  );
};


// ============================================================
// IMPORTER UN FICHIER
// ============================================================

export const importNewParcelFile = async (
  cooperativeId,
  file,
  farmerId,
  name
) => {
  return await importParcelFile(
    cooperativeId,
    file,
    farmerId,
    name
  );
};


// ============================================================
// MODIFIER UNE PARCELLE
// ============================================================

export const updateExistingParcel = async (
  cooperativeId,
  parcelId,
  data
) => {
  return await updateParcel(
    cooperativeId,
    parcelId,
    data
  );
};


// ============================================================
// SUPPRIMER UNE PARCELLE
// ============================================================

export const deleteExistingParcel = async (
  cooperativeId,
  parcelId
) => {
  return await deleteParcel(
    cooperativeId,
    parcelId
  );
};