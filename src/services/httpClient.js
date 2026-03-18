/**
 * httpClient — Instance axios configurée pour l'API Kubo
 */
import axios from 'axios'

const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 10000,
})

// Intercepteur de réponse : normalise les erreurs
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ??
      error.response?.data?.message ??
      error.message ??
      'Erreur réseau'
    return Promise.reject(new Error(message))
  },
)

export default httpClient
