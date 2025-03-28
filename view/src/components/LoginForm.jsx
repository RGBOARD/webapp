import { useState, useEffect } from 'react'
import '../App.css'
import '../assets/fonts/PixelifySans/PixelifySans-VariableFont_wght.ttf'
import { useAuth } from '../auth/authContext.js'
import { useNavigate } from 'react-router-dom'

export default function LogInForm() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const [errors, setErrors] = useState({
    username: '',
    password: ''
  });

  const [touched, setTouched] = useState({
    username: false,
    password: false
  });

  const [message, setMessage] = useState(null);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // Validation functions
  const validateUsername = (username) => {
    if (!username) return 'Username is required';
    // For login, we'll just do a basic validation since the server will validate the actual credentials
    if (username.trim().length < 3) return 'Username must be at least 3 characters';
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    // For login, we'll just do a basic length check
    if (password.length < 8) return 'Password must be at least 8 characters';
    return '';
  };

  // Validate form on input change
  useEffect(() => {
    const newErrors = {
      username: touched.username ? validateUsername(formData.username) : '',
      password: touched.password ? validatePassword(formData.password) : ''
    };
    
    setErrors(newErrors);
    
    // Form is valid if all fields are touched and have no errors
    const valid = touched.username && touched.password && 
                  !newErrors.username && !newErrors.password;
    setIsFormValid(valid);
  }, [formData, touched]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched to show validation errors
    setTouched({
      username: true,
      password: true
    });
    
    // Check if form is valid
    const usernameError = validateUsername(formData.username);
    const passwordError = validatePassword(formData.password);
    
    if (usernameError || passwordError) {
      setErrors({
        username: usernameError,
        password: passwordError
      });
      return;
    }
    
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await login(formData.username, formData.password);
      
      if (result.success) {
        setMessage("Login successful!");
        setIsError(false);
        // Clear form fields
        setFormData({username: '', password: ''});
        setTouched({ username: false, password: false });
        // Redirect to home page
        navigate('/');
      } else {
        setMessage(result.error || "Login failed. Please check your credentials.");
        setIsError(true);
      }
    } catch (err) {
      setMessage("An unexpected error occurred. Please try again.");
      setIsError(true);
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto mt-10 p-6 bg-white rounded-2xl shadow-md space-y-5"
      style={{ fontFamily: '"Pixelify Sans", sans-serif' }}
    >
      <h2 className="text-2xl font-bold text-center text-gray-800">Login</h2>

      {message && (
        <div className={`text-center p-2 rounded ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          value={formData.username}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Enter your username"
          className={`mt-1 w-full px-4 py-2 border ${errors.username ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:outline-none focus:ring ${errors.username ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
          disabled={isLoading}
        />
        {errors.username && (
          <p className="mt-1 text-sm text-red-600">{errors.username}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Enter your password"
          className={`mt-1 w-full px-4 py-2 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:outline-none focus:ring ${errors.password ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
          disabled={isLoading}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password}</p>
        )}
      </div>

      <button
        type="submit"
        className={`w-full py-2 px-4 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isFormValid ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-300 cursor-not-allowed'}`}
        disabled={isLoading || !isFormValid}
      >
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
      
      <div className="text-center mt-4">
        <p className="text-gray-600">
          Don't have an account?{' '}
          <span 
            className="text-blue-600 cursor-pointer hover:underline"
            onClick={() => navigate('/signup')}
          >
            Sign up
          </span>
        </p>
      </div>
    </form>
  );
}