//  export const API_BASE_URL = "http://api-vci.tamilzorous.com/api";
// export const API_BASE_URL = "http://192.168.1.61:8000/api";
import axios from "axios";

export const API_BASE_URL = "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export default api;