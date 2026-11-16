import axiosClient from "./axiosClient";

const getErrorMessage = (error) => {
  if (typeof error === "string") return error;

  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Error inesperado"
  );
};

const handle = async (promise) => {
  try {
    const { data } = await promise;
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const api = {
  get: (url) => handle(axiosClient.get(url)),
  post: (url, payload) => handle(axiosClient.post(url, payload)),
  put: (url, payload) => handle(axiosClient.put(url, payload)),
  patch: (url, payload) => handle(axiosClient.patch(url, payload)),
  delete: (url) => handle(axiosClient.delete(url)),
  postAuth: (url, payload) => handle(axiosClient.post(url, payload)),
};
