import axios from "axios";

const API_URL = process.env.NODE_ENV === 'production' ? 'https://bsocial1.herokuapp.com/' : 'http://localhost:5000/';

const axiosApi = axios.create({
    baseURL: API_URL,
    withCredentials: true
});

axiosApi.interceptors.request.use(function (config) {
    // console.log('req interceptor on ' + config.url)
    let userData = localStorage.getItem('userData');
    if (userData) {
        config.headers.Authorization = `Bearer ${JSON.parse(userData).accessToken}`;
    }
    // console.log('after headers')

    return config;
});

axiosApi.interceptors.response.use(function (response) {
    // console.log('res interceptor on ' + response.config.url)
    return response;
}, async function (error) {
    // console.log('res error interceptor on ' + error.response.config.url)
    const originalRequest = error.config;

    if (error.response.status === 401) {
        try {
            const res = await axios.get('/api/auth/refresh', {
                withCredentials: true
            });

            localStorage.setItem('userData', JSON.stringify({
                userId: res.data.details.userId,
                accessToken: res.data.details.accessToken
            }));

            originalRequest.headers.Authorization = `Bearer ${res.data.details.accessToken}`;
            return axios.request(originalRequest);
        } catch (e) {
            // localStorage.clear();
            console.log('Не авторизован!');
        }
    }

    return Promise.reject(error);
});

export default axiosApi;