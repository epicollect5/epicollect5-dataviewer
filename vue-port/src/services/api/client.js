import axios from 'axios';
import apiConfig from '@/services/api/apiConfig';

const client = axios.create({
  baseURL: apiConfig.baseUrl,
  headers: {
    Accept: 'application/json'
  }
});

export default client;
