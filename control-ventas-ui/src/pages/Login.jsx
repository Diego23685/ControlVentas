import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import '../styles/AuthStyles.css';

export const Login = () => {
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Estados independientes para el formulario de Login
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Estados independientes para el formulario de Registro (Basado en tus tablas)
  const [regUser, setRegUser] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regNombres, setRegNombres] = useState('');
  const [regApellidos, setRegApellidos] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [idRol, setIdRol] = useState(2); // Por defecto nace como Cajero

  // Detectar cambios en el tamaño de pantalla para el flujo responsivo
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Procesar Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (!loginUser || !loginPass) {
      setError('Por favor, ingrese usuario y contraseña.');
      setSubmitting(false);
      return;
    }

    const result = await login(loginUser, loginPass);
    if (!result.success) {
      setError(result.message);
    }
    setSubmitting(false);
  };

  // Procesar Registro apuntando a tu endpoint /api/Auth/registrar
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    if (!regUser || !regPass || !regNombres || !regApellidos || !regEmail) {
      setError('Por favor, rellene todos los campos de registro.');
      setSubmitting(false);
      return;
    }

    try {
        // Enviamos los datos mapeando la propiedad exacta que pide tu backend: "Password"
        await apiClient.post('/Auth/registrar', {
            idRol: idRol,
            username: regUser,
            Password: regPass, 
            nombres: regNombres,
            apellidos: regApellidos,
            email: regEmail,
            estado: 1
        });

        setSuccess('¡Usuario registrado con éxito! Ya puede iniciar sesión.');
        
        // Limpiar campos del formulario
        setRegUser(''); 
        setRegPass(''); 
        setRegNombres(''); 
        setRegApellidos(''); 
        setRegEmail('');
        
        // Regresar automáticamente al Login después de 2 segundos
        setTimeout(() => { 
            setIsRegister(false); 
            setSuccess(''); 
        }, 2000);

        } catch (err) {
            setError(err.response?.data?.mensaje || 'Error al procesar el registro.');
        } finally {
            setSubmitting(false);
        }
  };

  // Lógica dinámica para el cálculo de la posición deslizante del cuadro blanco
  const getSlidingStyle = () => {
    if (windowWidth <= 850) return {}; // En móvil se desactiva el deslizamiento lateral
    return {
      left: isRegister ? '440px' : '10px'
    };
  };

  return (
    <main className="auth__main">
      <div className="container__all">
        
        {/* CAJAS TRASERAS (Fondo Oscuro con Blur) */}
        <div className="back__box">
          <div className="back__box-login" style={{ opacity: isRegister || windowWidth <= 850 ? 1 : 0 }}>
            <h3>¿Ya tienes una cuenta?</h3>
            <p>Inicia sesión para entrar al panel de facturación</p>
            <button onClick={() => { setIsRegister(false); setError(''); }}>Iniciar Sesión</button>
          </div>
          
          <div className="back__box-register" style={{ opacity: !isRegister || windowWidth <= 850 ? 1 : 0 }}>
            <h3>¿Eres nuevo en el sistema?</h3>
            <p>Registra un nuevo usuario para controlar tus accesos</p>
            <button onClick={() => { setIsRegister(true); setError(''); }}>Registrarse</button>
          </div>
        </div>

        {/* CONTENEDOR FLOTANTE BLANCO (Formularios) */}
        <div className="container__login-register" style={getSlidingStyle()}>
          
          {/* FORMULARIO DE LOGIN */}
          {!isRegister ? (
            <form onSubmit={handleLoginSubmit} className="form__login">
              <h2>Iniciar Sesión</h2>
              {error && <div style={styles.errorAlert}>{error}</div>}
              <input 
                type="text" 
                placeholder="Nombre de usuario" 
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                disabled={submitting}
              />
              <input 
                type="password" 
                placeholder="Contraseña" 
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                disabled={submitting}
              />
              <button type="submit" disabled={submitting}>
                {submitting ? 'Cargando...' : 'Entrar'}
              </button>
            </form>
          ) : (
            
            /* FORMULARIO DE REGISTRO */
            <form onSubmit={handleRegisterSubmit} className="form__register">
              <h2>Registrarse</h2>
              {error && <div style={styles.errorAlert}>{error}</div>}
              {success && <div style={styles.successAlert}>{success}</div>}
              <input 
                type="text" 
                placeholder="Nombres" 
                value={regNombres}
                onChange={(e) => setRegNombres(e.target.value)}
                disabled={submitting}
              />
              <input 
                type="text" 
                placeholder="Apellidos" 
                value={regApellidos}
                onChange={(e) => setRegApellidos(e.target.value)}
                disabled={submitting}
              />
              <input 
                type="email" 
                placeholder="Correo Electrónico" 
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                disabled={submitting}
              />
              <input 
                type="text" 
                placeholder="Nombre de Usuario" 
                value={regUser}
                onChange={(e) => setRegUser(e.target.value)}
                disabled={submitting}
              />
              <input 
                type="password" 
                placeholder="Contraseña" 
                value={regPass}
                onChange={(e) => setRegPass(e.target.value)}
                disabled={submitting}
              />
              <button type="submit" disabled={submitting}>
                {submitting ? 'Guardando...' : 'Registrar'}
              </button>
            </form>
          )}

        </div>
      </div>
    </main>
  );
};

const styles = {
  errorAlert: {
    backgroundColor: '#fee2e2',
    color: '#ef4444',
    padding: '10px',
    borderRadius: '5px',
    fontSize: '14px',
    textAlign: 'center',
    fontWeight: '500',
    border: '1px solid #fca5a5',
    marginTop: '10px'
  },
  successAlert: {
    backgroundColor: '#dcfce7',
    color: '#16a34a',
    padding: '10px',
    borderRadius: '5px',
    fontSize: '14px',
    textAlign: 'center',
    fontWeight: '500',
    border: '1px solid #86efac',
    marginTop: '10px'
  }
};