import {
  getCooperatives,
  getCooperative,
  createCooperative,
  updateCooperative,
  deleteCooperative,
} from "../api/cooperatives";

export const getAllCooperatives = async () => {
  return await getCooperatives();
};

export const getCooperativeById = async (uuid) => {
  return await getCooperative(uuid);
};

export const createNewCooperative = async (data) => {
  return await createCooperative(data);
};

export const updateExistingCooperative = async (uuid, data) => {
  return await updateCooperative(uuid, data);
};

export const deleteExistingCooperative = async (uuid) => {
  return await deleteCooperative(uuid);
};