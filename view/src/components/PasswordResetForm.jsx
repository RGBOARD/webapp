import {useEffect, useState} from 'react';
import '../App.css';
import '../assets/fonts/PixelifySans/PixelifySans-VariableFont_wght.ttf';
import {useNavigate} from 'react-router-dom';
import axios from '../api/axios';

export default function PasswordResetForm() {
    const [step, setStep] = useState(1); // 1: request temp password, 2: reset password
    const [formData, setFormData] = useState({
        email: '',
        temp_password: '',
        new_password: ''
    });

    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [message, setMessage] = useState(null);
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);

    const navigate = useNavigate();

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleBlur = (e) => {
        const {name} = e.target;
        setTouched(prev => ({...prev, [name]: true}));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.email) newErrors.email = 'Email is required';

        if (step === 2) {
            if (!formData.temp_password) newErrors.temp_password = 'Temporary password is required';
            if (!formData.new_password) {
                newErrors.new_password = 'New password is required';
            } else if (formData.new_password.length < 8) {
                newErrors.new_password = 'Password must be at least 8 characters';
            }
        }

        setErrors(newErrors);
        const allTouched = Object.keys(newErrors).every(key => touched[key]);
        const valid = Object.keys(newErrors).length === 0 && allTouched;
        setIsFormValid(valid);
    };

    useEffect(() => {
        validate();
    }, [formData, touched, step]);

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setTouched({email: true});
        validate();

        if (!formData.email || errors.email) return;

        setIsLoading(true);
        setMessage(null);

        try {
            const res = await axios.post('/temp-password', {email: formData.email});
            if (res.status === 201) {
                setIsError(false);
                setMessage(res.data.message || "Temporary password sent to your email.");
                setStep(2);
                setTouched({temp_password: false, new_password: false});
            } else {
                setIsError(true);
                setMessage(res.data.error || "Failed to request temporary password.");
            }
        } catch (error) {
            setIsError(true);
            setMessage(error.response?.data?.error || "Unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetSubmit = async (e) => {
        e.preventDefault();
        setTouched({temp_password: true, new_password: true});
        validate();

        if (!isFormValid) return;

        setIsLoading(true);
        setMessage(null);

        try {
            const res = await axios.post('/reset-password', {
                email: formData.email,
                temp_password: formData.temp_password,
                new_password: formData.new_password
            });

            if (res.status === 200) {
                setIsError(false);
                setMessage(res.data.message || "Password reset successfully!");
                setTimeout(() => {
                    navigate('/login', {state: {justReset: true}});
                }, 2000);
            } else {
                setIsError(true);
                setMessage(res.data.error || "Password reset failed.");
            }
        } catch (error) {
            setIsError(true);
            setMessage(error.response?.data?.error || "Unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form
            onSubmit={step === 1 ? handleEmailSubmit : handleResetSubmit}
            className="max-w-md mx-auto mt-10 p-6 bg-white rounded-2xl shadow-md space-y-5"
            style={{fontFamily: '"Pixelify Sans", sans-serif'}}
        >
            <h2 className="text-2xl font-bold text-center text-gray-800">
                {step === 1 ? 'Request Temporary Password' : 'Reset Your Password'}
            </h2>

            {message && (
                <div className={`text-center p-2 rounded ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {message}
                </div>
            )}

            {/* Email Field */}
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`mt-1 w-full px-4 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:outline-none focus:ring ${errors.email ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
                    disabled={isLoading || step === 2}
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            {step === 2 && (
                <>
                    <div className="h-2"></div>
                    {/* Temporary Password Field */}
                    <div>
                        <label htmlFor="temp_password" className="block text-sm font-medium text-gray-700">Temporary Password</label>
                        <input
                            id="temp_password"
                            name="temp_password"
                            type="password"
                            value={formData.temp_password}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className={`mt-1 w-full px-4 py-2 border ${errors.temp_password ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:outline-none focus:ring ${errors.temp_password ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
                            disabled={isLoading}
                        />
                        {errors.temp_password && <p className="mt-1 text-sm text-red-600">{errors.temp_password}</p>}
                    </div>

                    <div className="h-2"></div>
                    {/* New Password Field */}
                    <div>
                        <label htmlFor="new_password" className="block text-sm font-medium text-gray-700">New Password</label>
                        <input
                            id="new_password"
                            name="new_password"
                            type="password"
                            value={formData.new_password}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className={`mt-1 w-full px-4 py-2 border ${errors.new_password ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:outline-none focus:ring ${errors.new_password ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
                            disabled={isLoading}
                        />
                        {errors.new_password && <p className="mt-1 text-sm text-red-600">{errors.new_password}</p>}
                    </div>
                </>
            )}

            <div className="h-8"></div>
            <button
                type="submit"
                className={`w-full py-2 px-4 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isFormValid ? 'bg-blue-600 hover:bg-blue-500 cursor-pointer' : 'bg-blue-300 cursor-not-allowed'}`}
                disabled={isLoading || !isFormValid}
            >
                {isLoading
                    ? step === 1 ? 'Requesting...' : 'Resetting...'
                    : step === 1 ? 'Request Temporary Password' : 'Reset Password'}
            </button>
        </form>
    );
}
