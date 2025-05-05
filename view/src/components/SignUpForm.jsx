import { useState, useEffect } from 'react'
import '../App.css'
import '../assets/fonts/PixelifySans/PixelifySans-VariableFont_wght.ttf'
import { useAuth } from '../auth/authContext'
import { useNavigate } from 'react-router-dom'

export default function SignUpForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState({
    email: '',
    password: ''
  });

  const [touched, setTouched] = useState({
    email: false,
    password: false
  });

  const [message, setMessage] = useState(null);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  
  const { signup } = useAuth();
  const navigate = useNavigate();

  // Validation functions

  const validateEmail = (email) => {
    // Must be a valid email format and end with @upr.edu
    const emailRule = /^[a-zA-Z0-9._%+-]+@upr\.edu$/;
    if (!email) return 'Email is required';
    if (!emailRule.test(email)) {
      return 'Email must be a valid @upr.edu address';
    }
    return '';
  };

  const validatePassword = (password) => {
    // Must contain at least: 1 uppercase, 1 lowercase, 1 digit, 1 special char
    // Length: 8-32 chars
    const passwordRule = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+\[\]{};:\'",.<>?/\\|`~]).{8,32}$/;
    if (!password) return 'Password is required';
    if (!passwordRule.test(password)) {
      return (
        <>
          Password must be: 
          <ul>
            <li>• 8-32 characters long</li>
            <li>• At least one uppercase letter</li>
            <li>• At least one lowercase letter</li>
            <li>• At least one number</li>
            <li>• At least one special character</li>
          </ul>
        </>
        )
    }
    return '';
  };

  // Validate form on input change
  useEffect(() => {
    const newErrors = {
      email: touched.email ? validateEmail(formData.email) : '',
      password: touched.password ? validatePassword(formData.password) : ''
    };
    
    setErrors(newErrors);
    
    // Form is valid if all fields are touched and have no errors
    const valid = touched.email && touched.password && !newErrors.email && !newErrors.password;

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
      email: true,
      password: true
    });
    
    // Check if form is valid
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    
    if (emailError || passwordError) {
      setErrors({
        email: emailError,
        password: passwordError
      });
      return;
    }
    
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await signup(formData);
      
      if (result.success) {
        setMessage("Signup successful! Please login.");
        setIsError(false);
        setFormData({email: '', password: '' });
        setTouched({email: false, password: false });
        
        // Navigate to login after a delay
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setMessage(result.error || "Registration failed. Please try again.");
        setIsError(true);
      }
    } catch (err) {
      setMessage("An unexpected error occurred. Please try again.");
      setIsError(true);
      console.error('Signup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto mt-10 p-6 bg-white rounded-2xl shadow-md space-y-5"
    >
      <h2 className="text-2xl font-bold text-center text-gray-800"
      style={{fontFamily: '"Pixelify Sans", sans-serif'}}>Sign Up</h2>

      {message && (
        <div className={`text-center p-2 rounded ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Enter email (@upr.edu)"
          className={`mt-1 w-full px-4 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:outline-none focus:ring ${errors.email ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
          disabled={isLoading}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
        )}
      </div>
      
      <div className="h-2"></div>
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
          placeholder="Enter password"
          className={`mt-1 w-full px-4 py-2 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:outline-none focus:ring ${errors.password ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
          disabled={isLoading}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password}</p>
        )}
      </div>
      
      <div className="h-8"></div>
      <button
        type="submit"
        className={`w-full py-2 px-4 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isFormValid ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-300 cursor-not-allowed'}`}
        disabled={isLoading || !isFormValid}
        style={{fontFamily: '"Pixelify Sans", sans-serif'}}
      >
        {isLoading ? 'Signing up...' : 'Sign Up'}
      </button>
      
      <div className="text-center mt-4">
        <p className="text-gray-600">
          Already have an account?{' '}
          <span 
            className="text-blue-600 cursor-pointer hover:underline"
            onClick={() => navigate('/login')}
          >
            Login
          </span>
        </p>
      </div>
    </form>
  );
}
