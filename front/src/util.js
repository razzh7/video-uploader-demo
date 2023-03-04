import axios from 'axios'

export const http = axios.create({
  baseURL: 'http://localhost:6003/',
  headers: {
    'Content-Type': 'multipart/form-data',
  },
})
