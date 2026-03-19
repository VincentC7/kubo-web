import axios, { type AxiosInstance } from 'axios'

const httpClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 10000,
})

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message: string =
      error.response?.data?.error ??
      error.response?.data?.message ??
      error.message ??
      'Erreur réseau'
    return Promise.reject(new Error(message))
  },
)

export default httpClient
