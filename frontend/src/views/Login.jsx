import { FaEyeSlash, FaEye } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { loginUsuario } from "../services/usuario.service";
import './Login.css'; 
import Loading from "../components/shared/Loading";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNotificationUsuarioNoRegistrado, setShowNotificationUsuarioNoRegistrado] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  // States for the marquee
  const marqueeRef = useRef(null);
  const containerRef = useRef(null);
  const [duration, setDuration] = useState(10); // Initial duration in seconds
  const mensajeTexto = "PAPUGRUPO";
  
  const handlePasswordChange = (event) => {
    const value = event.target.value.replace(/['"]/g, '');
    setPassword(value);
  };
  
  const handleEmailChange = (event) => {
    const value = event.target.value.replace(/['"]/g, '');
    setEmail(value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    
    try {
      // Create object with the correct structure
      const usuarioData = {
        email: email.trim(),
        contrasena: password
      };
      
      // Pass the complete object as expected
      const responseData = await loginUsuario(usuarioData);
      
      console.log('Inicio de sesión exitoso:', responseData);
      
      // Check role for redirection
      if (responseData) {
        navigate("/Tablero");
      }
      
    } catch (error) {
      console.error("Error en inicio de sesión:", error);
      setShowNotificationUsuarioNoRegistrado(true);
      setTimeout(() => {
        setShowNotificationUsuarioNoRegistrado(false);
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    navigate("/registro");
  };
  
  // Effect to calculate the duration of the marquee animation
  useEffect(() => {
    const calcularDuracion = () => {
      const el = marqueeRef.current;
      const container = containerRef.current;
      
      if (el && container) {
        // Get actual text width
        const textWidth = el.offsetWidth;
        const containerWidth = container.offsetWidth;
        
        // Total distance the text must travel
        const distanciaTotal = textWidth + containerWidth;
        
        // Calculate duration based on distance/time ratio
        // Adjust the speed factor (2) to make it faster or slower
        const duracionAjustada = (distanciaTotal / 100) * 0.5; // Speed factor
        
        setDuration(duracionAjustada);
        
        // Reset animation to apply changes
        el.style.animation = 'none';
        void el.offsetHeight; // Trigger reflow
        el.style.animation = `marquee ${duracionAjustada}s linear infinite`;
      }
    };
    
    // Run initially and when resizing
    calcularDuracion();
    
    // Set the data-text attribute for the LED effect
    if (marqueeRef.current) {
      marqueeRef.current.setAttribute('data-text', mensajeTexto);
    }
    
    const debouncedResize = debounce(calcularDuracion, 100);
    window.addEventListener('resize', debouncedResize);
    
    return () => {
      window.removeEventListener('resize', debouncedResize);
    };
  }, [mensajeTexto]);
  
  // Debounce function to optimize
  function debounce(func, wait) {
    let timeout;
    return function () {
      clearTimeout(timeout);
      timeout = setTimeout(func, wait);
    };
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-teal-700 to-blue-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full p-6 bg-slate-50 shadow-2xl rounded-2xl">
        <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-6">
          Tablero 2.0
        </h2>
        
        {/* Marquee container with improved styling */}
        <div 
          ref={containerRef}
          className="marquee-container mb-6 rounded-xl overflow-hidden relative"
        >
          <div
            ref={marqueeRef}
            className="marquee-text text-2xl font-bold"
            style={{
              animation: `marquee ${duration}s linear infinite`,
              letterSpacing: '3px'
            }}
          >
            {mensajeTexto}
          </div>
        </div>
          
        <form onSubmit={handleSubmit} className="space-y-6" action="#" method="POST">
          <input type="hidden" name="remember" value="true" />
          <div className="rounded-md -space-y-px">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Correo
              </label>
              <input 
                id="email"
                type="email" 
                value={email} 
                onChange={handleEmailChange} 
                className="w-full px-3 py-2 mb-4 placeholder-gray-400 text-gray-700 bg-white shadow focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent rounded-xl" 
                placeholder="example@gmail.com" 
                required 
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="relative">
                <input 
                  id="password"
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={handlePasswordChange} 
                  className="w-full px-3 py-2 placeholder-gray-400 text-gray-700 bg-white shadow focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent rounded-xl" 
                  placeholder="Contraseña" 
                  required 
                />
                <div 
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" 
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <button 
              type="submit" 
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-teal-800 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
              disabled={loading}
            >
              {loading ? 'Cargando...' : 'Iniciar Sesión'}
            </button>
            
            <button 
              type="button"
              onClick={handleRegister}
              className="group relative w-full flex justify-center py-2 px-4 border border-teal-600 text-sm font-medium rounded-md text-teal-700 bg-white hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              Registrarse
            </button>
          </div>
        </form>
      </div>
      
      {showNotificationUsuarioNoRegistrado && (
        <div className="fixed bottom-0 right-0 m-6 w-64 bg-white shadow-xl rounded-lg py-4 px-6 border-l-4 border-teal-700" role="alert">
          <strong className="font-semibold text-teal-700 block sm:inline">¡Ups! Ha ocurrido un problema.</strong>
          <span className="block sm:inline text-gray-600 mt-2">Correo o Contraseña inválida. Por favor, inténtalo de nuevo.</span>
        </div>
      )}
      <Loading isOpen={loading} />
    </div>
  );
};

export default Login;