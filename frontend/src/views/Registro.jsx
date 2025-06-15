import { FaEyeSlash, FaEye, FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { registrarUsuario } from "../services/usuario.service";
import Loading from "../components/shared/Loading";

const Registro = () => {
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationSuccess, setNotificationSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleEmailChange = (event) => {
    const value = event.target.value.replace(/['"]/g, '');
    setEmail(value);
  };
  
  const handleNombreChange = (event) => {
    const value = event.target.value.replace(/['"]/g, '');
    setNombre(value);
  };
  
  const handlePasswordChange = (event) => {
    const value = event.target.value.replace(/['"]/g, '');
    setPassword(value);
  };
  
  const handleConfirmPasswordChange = (event) => {
    const value = event.target.value.replace(/['"]/g, '');
    setConfirmPassword(value);
  };

  const showNotificationWithTimeout = (message, success = false) => {
    setNotificationMessage(message);
    setNotificationSuccess(success);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Validaciones básicas
    if (password !== confirmPassword) {
      showNotificationWithTimeout('Las contraseñas no coinciden');
      return;
    }
    
    if (password.length < 6) {
      showNotificationWithTimeout('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    setLoading(true);
    
    try {
      // Crear un objeto con la estructura correcta
      const usuarioData = {
        email: email.trim(),
        nombre: nombre.trim(),
        contrasena: password
      };
      
      // Llamar al servicio para registrar usuario
      const responseData = await registrarUsuario(usuarioData);
      
      console.log('Registro exitoso:', responseData);
      
      // Mostrar notificación de éxito
      showNotificationWithTimeout('Usuario registrado exitosamente. Redirigiendo...', true);
      
      // Redireccionar después de un breve retraso
      setTimeout(() => {
        navigate("/");
      }, 2000);
      
    } catch (error) {
      console.error("Error en registro:", error);
      
      // Determinar el mensaje de error
      let errorMessage = 'Error al registrar usuario. Inténtalo nuevamente.';
      
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showNotificationWithTimeout(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-teal-700 to-blue-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-6 bg-slate-50 shadow-2xl rounded-2xl">
        <div className="flex items-center justify-between">
          <button 
            onClick={handleBackToLogin}
            className="flex items-center text-teal-700 hover:text-teal-600 transition-colors"
          >
            <FaArrowLeft className="mr-1" /> Volver
          </button>
          <div className="w-6"></div> {/* Espaciador para centrar el título */}
        </div>
    
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Correo Electrónico
            </label>
            <input 
              id="email"
              type="email" 
              value={email} 
              onChange={handleEmailChange} 
              className="w-full px-3 py-2 mt-1 border-gray-300 placeholder-gray-400 text-gray-700 bg-white shadow focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent rounded-xl" 
              placeholder="ejemplo@gmail.com" 
              required 
            />
          </div>
          
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
              Nombre
            </label>
            <input 
              id="nombre"
              type="text" 
              value={nombre} 
              onChange={handleNombreChange} 
              className="w-full px-3 py-2 mt-1 border-gray-300 placeholder-gray-400 text-gray-700 bg-white shadow focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent rounded-xl" 
              placeholder="Tu nombre completo" 
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
                className="w-full px-3 py-2 mt-1 border-gray-300 placeholder-gray-400 text-gray-700 bg-white shadow focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent rounded-xl" 
                placeholder="Contraseña (mínimo 6 caracteres)" 
                required 
                minLength={6}
              />
              <div 
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" 
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <input 
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"} 
                value={confirmPassword} 
                onChange={handleConfirmPasswordChange} 
                className="w-full px-3 py-2 mt-1 border-gray-300 placeholder-gray-400 text-gray-700 bg-white shadow focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent rounded-xl" 
                placeholder="Confirma tu contraseña" 
                required 
              />
              <div 
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </div>
            </div>
          </div>
          
          <div className="pt-4">
            <button 
              type="submit" 
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-teal-800 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
              disabled={loading}
            >
              {loading ? 'Procesando...' : 'Crear Cuenta'}
            </button>
          </div>
        </form>
      </div>
      
      {showNotification && (
        <div 
          className={`fixed bottom-0 right-0 m-6 w-72 bg-white shadow-xl rounded-lg py-4 px-6 border-l-4 ${
            notificationSuccess ? 'border-green-500' : 'border-teal-700'
          }`} 
          role="alert"
        >
          <strong className={`font-semibold block sm:inline ${
            notificationSuccess ? 'text-green-700' : 'text-teal-700'
          }`}>
            {notificationSuccess ? '¡Éxito!' : '¡Atención!'}
          </strong>
          <span className="block sm:inline text-gray-600 mt-2">{notificationMessage}</span>
        </div>
      )}
      <Loading isOpen={loading} />
    </div>
  );
};

export default Registro;