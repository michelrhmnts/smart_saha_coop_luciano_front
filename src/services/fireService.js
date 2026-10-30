import { getNearbyFires, getSyncStatus, triggerSync } from "../api/fire";

const fireService = {
  getNearbyFires: async (
    radiusKm = 5,
    period = "7d",
    refresh = false
  ) => {
    return await getNearbyFires(
      radiusKm,
      period,
      refresh
    );
  },

  getSyncStatus: async () => {
    return await getSyncStatus();
  },

  triggerSync: async (radiusKm = 10, days = 2) => {
    return await triggerSync(radiusKm, days);
  },
};

export default fireService;