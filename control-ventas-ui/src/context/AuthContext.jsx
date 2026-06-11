import { createContext, useState, useEffect, useContext } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [activeTurno, setActiveTurno] = useState(null);
  const [loading, setLoading] = useState(true);

  // Persistir la sesión al recargar la página
  useEffect(() => {
    const storedUser = localStorage.getItem('usuario');
    const storedTurno = localStorage.getItem('idTurno');
    
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    if (storedTurno) {
      setActiveTurno(parseInt(storedTurno));
    }
    setLoading(false);
  }, []);

  // Función para iniciar sesión apuntando a tu API /api/Auth/login
  const login = async (username, password) => {
    try {
      const response = await apiClient.post('/Auth/login', { username, password });
      
      // Ajusta esto según lo que devuelva tu endpoint real (asumimos que devuelve el objeto usuario)
      const usuarioData = response.data.usuario || response.data; 
      
      setUser(usuarioData);
      localStorage.setItem('usuario', JSON.stringify(usuarioData));
      return { success: true };
    } catch (error) {
      console.error("Error en login:", error);
      return { 
        success: false, 
        message: error.response?.data?.mensaje || "Credenciales incorrectas" 
      };
    }
  };

  // Función para cerrar sesión
  const logout = () => {
    setUser(null);
    setActiveTurno(null);
    localStorage.clear();
  };

  // Guardar el turno en el estado global cuando el cajero abra caja
  const guardarTurnoActivo = (idTurno) => {
    setActiveTurno(idTurno);
    localStorage.setItem('idTurno', idTurno);
  };

  // Limpiar el turno cuando el cajero haga el cierre de caja
  const limpiarTurnoActivo = () => {
    setActiveTurno(null);
    localStorage.removeItem('idTurno');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      activeTurno, 
      loading, 
      login, 
      logout, 
      guardarTurnoActivo, 
      limpiarTurnoActivo 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);