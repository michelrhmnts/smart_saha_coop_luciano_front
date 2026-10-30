import {
  getFireAlerts,
  generateFireAlerts,
  sendFireAlert,
  sendAllFireAlerts,
} from "../api/fireAlert";

const fireAlertService = {
  getFireAlerts: async () => {
    return await getFireAlerts();
  },

  generateFireAlerts: async (
    radiusKm = 5,
    period = "7d"
  ) => {
    return await generateFireAlerts(
      radiusKm,
      period
    );
  },

  sendFireAlert: async (alertId, recipient = null, alertType = "sms", message = null) => {
    return await sendFireAlert(alertId, recipient, alertType, message);
  },

  sendAllFireAlerts: async (recipient = null, alertType = "sms", message = null) => {
    return await sendAllFireAlerts(recipient, alertType, message);
  },
};

export default fireAlertService;