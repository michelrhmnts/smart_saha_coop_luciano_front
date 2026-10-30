import api from "./axios";

export const getFireAlerts = async () => {
  const response = await api.get("/fire-alerts");

  return response.data;
};

export const generateFireAlerts = async (
  radiusKm = 5,
  period = "7d"
) => {
  const response = await api.post(
    "/fire-alerts/generate",
    null,
    {
      params: {
        radius_km: radiusKm,
        period,
      },
    }
  );

  return response.data;
};

export const sendFireAlert = async (alertId, recipient = null, alertType = "sms", message = null) => {
  const response = await api.post(`/fire-alerts/${alertId}/send`, {
    recipient,
    alert_type: alertType,
    message,
  });
  return response.data;
};

export const sendAllFireAlerts = async (recipient = null, alertType = "sms", message = null) => {
  const response = await api.post("/fire-alerts/send-all", {
    recipient,
    alert_type: alertType,
    message,
  });
  return response.data;
};

export const testFireAlertSms = async (phone, message = null) => {
  const response = await api.post("/fire-alerts/test-sms", {
    phone,
    message,
  });
  return response.data;
};