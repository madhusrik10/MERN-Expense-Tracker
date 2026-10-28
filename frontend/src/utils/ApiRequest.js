const configuredHost = process.env.REACT_APP_API_URL?.trim();
const host = (
  configuredHost ||
  (process.env.NODE_ENV === "production"
    ? ""
    : "http://localhost:5000")
).replace(/\/+$/, "");

export const getApiErrorMessage = (error, fallback) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.request || error.message === "Network Error") {
    return "Unable to reach the API. Make sure the backend is running and REACT_APP_API_URL points to it.";
  }

  return error.message || fallback;
};

export const setAvatarAPI = `${host}/api/auth/setAvatar`;
export const registerAPI = `${host}/api/auth/register`;
export const loginAPI = `${host}/api/auth/login`;
export const forgotPasswordAPI = `${host}/api/auth/forgotPassword`;
export const addTransaction = `${host}/api/v1/addTransaction`;
export const getTransactions = `${host}/api/v1/getTransaction`;
export const editTransactions = `${host}/api/v1/updateTransaction`;
export const deleteTransactions = `${host}/api/v1/deleteTransaction`;
export const aiInsightsAPI = `${host}/api/v1/ai/insights`;