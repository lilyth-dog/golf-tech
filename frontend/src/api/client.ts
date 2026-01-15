import axios, { type InternalAxiosRequestConfig } from 'axios';

const client = axios.create({
    baseURL: 'http://localhost:8000/api', // Django API URL
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to attach the token
client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('token');
        if (token) {
            // In Axios v1+, request interceptor receives InternalAxiosRequestConfig
            // whose `headers` is an AxiosHeaders instance with `.set()`.
            config.headers.set('Authorization', `Token ${token}`);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default client;
