import React, { useState } from 'react';
import { login } from '../services/authService';

const Login = () => {
    // Estados para los campos del formulario
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    
    // Estados para alertas de validación y carga
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // 3.- VALIDACIÓN DE DATOS (Criterio de Rúbrica)
        // Evita que se envíen campos vacíos o puros espacios al servidor
        if (!username.trim() || !password.trim()) {
            setError('Por favor, complete todos los campos.');
            return;
        }

        setLoading(true);

        try {
            // Conexión al servicio que crearemos para el Backend
            const data = await login(username, password);
            
            setSuccess(`¡Bienvenido, ${data.nombreCompleto}! Rol: ${data.rol}`);
            
            // Guardar los datos de sesión en el navegador
            localStorage.setItem('user_session', JSON.stringify(data));
            
        } catch (err) {
            setError(err); // Muestra los errores que mande .NET (ej: Credenciales incorrectas)
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
                    Control de Ventas
                </h2>
                <p className="text-sm text-center text-gray-500 mb-6">
                    Inicie sesión para acceder al sistema
                </p>

                {/* Mensajes de Alerta de Validación */}
                {error && (
                    <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 text-sm rounded">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-4 p-3 bg-green-100 border-l-4 border-green-500 text-green-700 text-sm rounded">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Usuario
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                            placeholder="Ingrese su nombre de usuario"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Contraseña
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-2 px-4 rounded-md text-white font-medium transition ${
                            loading 
                            ? 'bg-blue-400 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-md'
                        }`}
                    >
                        {loading ? 'Verificando...' : 'Ingresar al Sistema'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;