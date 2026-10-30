import api from "./axios";


// ============================================================
// RÉCUPÉRER LES PARCELLES D'UNE COOPÉRATIVE
// ============================================================

export const getParcelsByCooperative = async (
  cooperativeId
) => {
  const response = await api.get(
    `/cooperatives/${cooperativeId}/parcels`
  );

  return response.data;
};


// ============================================================
// RÉCUPÉRER UNE PARCELLE
// ============================================================

export const getParcel = async (
  cooperativeId,
  parcelId
) => {
  const response = await api.get(
    `/cooperatives/${cooperativeId}/parcels/${parcelId}`
  );

  return response.data;
};

export const getMyParcels = async () => {
  const response = await api.get("/parcels");
  return response.data;
};


// ============================================================
// CRÉER UNE PARCELLE AVEC GEOJSON
// ============================================================

export const createParcel = async (
  cooperativeId,
  data
) => {
  const response = await api.post(
    `/cooperatives/${cooperativeId}/parcels`,
    data
  );

  return response.data;
};


// ============================================================
// IMPORTER UN FICHIER GÉOGRAPHIQUE
// KML / GeoPackage / Shapefile ZIP
// ============================================================

export const importParcelFile = async (
  cooperativeId,
  file,
  farmerId,
  name
) => {

  const formData = new FormData();

  formData.append(
    "file",
    file
  );

  formData.append(
    "farmer_id",
    farmerId
  );

  if (name) {
    formData.append(
      "name",
      name
    );
  }

  const response = await api.post(
    `/cooperatives/${cooperativeId}/parcels`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};


// ============================================================
// MODIFIER UNE PARCELLE
// ============================================================

export const updateParcel = async (
  cooperativeId,
  parcelId,
  data
) => {
  const response = await api.put(
    `/cooperatives/${cooperativeId}/parcels/${parcelId}`,
    data
  );

  return response.data;
};


// ============================================================
// SUPPRIMER UNE PARCELLE
// ============================================================

export const deleteParcel = async (
  cooperativeId,
  parcelId
) => {
  const response = await api.delete(
    `/cooperatives/${cooperativeId}/parcels/${parcelId}`
  );

  return response.data;
};