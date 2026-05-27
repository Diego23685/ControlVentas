import axios from 'axios';

// Cambia el puerto (7123) por el que use tu API de .NET al levantar
const API_URL = 'http://localhost:5137/api/auth'; 

export const login = async (username, password) => {
    try {
        const response = await axios.post(`${API_URL}/login`, { username, password });
        return response.data;
    } catch (error) {
        throw error.response?.data?.mensaje || 'Error al conectar con el servidor';
    }
};