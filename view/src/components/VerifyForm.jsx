import {useEffect, useState} from 'react'
import '../App.css'
import '../assets/fonts/PixelifySans/PixelifySans-VariableFont_wght.ttf'
import {useNavigate} from 'react-router-dom'

import axios from '../api/axios';

async function verifyCode(code) {
    try {
        const response = await axios.post('/verify-email', {code});
        return response;
    } catch (error) {
        if (error.response) {
            return error.response.data; // Optional: return error details to the caller
        } else {
            return {error: "Unexpected error occurred"};
        }
    }
}


export default function VerifyForm() {

    const [message, setMessage] = useState(null)
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);

    const [formData, setFormData] = useState({code: ''})
    const [errors, setErrors] = useState({code: ''})
    const [touched, setTouched] = useState({code: false})

    const navigate = useNavigate();

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData(prev => ({
            ...prev, [name]: value
        }));
    };

    const handleBlur = (e) => {
        const {name} = e.target;
        setTouched(prev => ({
            ...prev, [name]: true
        }));
    };

    const validateCode = (code) => {
        if (!code) return 'Code is required';

        if (code.length < 6) return 'Code is at least 6 digits long';

        return '';
    }

    // Validate form on input change
    useEffect(() => {
        const newErrors = {code: touched.code ? validateCode(formData.code) : '',};
        setErrors(newErrors);

        // Form is valid if all fields are touched and have no errors
        const valid = touched.code && !newErrors.code;
        setIsFormValid(valid);
    }, [formData, touched]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setTouched({code: true});

        const codeError = validateCode(formData.code);

        if (codeError) {
            setErrors({code: codeError});
            return;
        }

        setIsLoading(true);
        setMessage(null);

        try {
            const response = await verifyCode(formData.code);

            if (response.status === 200) {
                setIsError(false);
                setMessage(response.data || "Account verified!");
                setFormData({code: ''});
                setTouched({code: false});
                setTimeout(() => {
                    navigate('/', {state: {justVerified: true}});
                }, 2000); // 1.5 seconds
            } else {
                setIsError(true)
                setMessage(response.error || "Verification failed.");
            }
        } catch (err) {
            setIsError(true)
            setMessage("An unexpected error occurred.");

        } finally {
            setIsLoading(false);
        }
    };

    const requestCode = async () => {
        try {
            const res = await axios.post('/code');
            setIsError(false)
            setMessage(res.data.message || 'Verification code sent!');
        } catch (error) {
            setIsError(true)
            const errMsg = error.response?.data?.error || 'Failed to request code.';
            setMessage(errMsg);
        }
    };


    return (<form
        onSubmit={handleSubmit}
        className={"max-w-md mx-auto mt-10 p-6 bg-white rounded-2xl shadow-md space-y-5"}>
        <h2 className="text-2xl font-bold text-center text-gray-800"
            style={{fontFamily: '"Pixelify Sans", sans-serif'}}>Verify your account</h2>
        {message && (<div
            className={`text-center p-2 rounded ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
            style={{fontFamily: '"Pixelify Sans", sans-serif'}}>
            {message}
        </div>)}
        <label htmlFor="text" className="block text-sm font-medium text-gray-700">
            Verification Code
        </label>
        <input
            id="code"
            name="code"
            type="text"
            value={formData.code}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Enter your verification code"
            className={`mt-1 w-full px-4 py-2 border ${errors.code ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:outline-none focus:ring ${errors.code ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
            disabled={isLoading}
        />

        {errors.code && (<p className="mt-1 text-sm text-red-600">{errors.code}</p>)}

        <button
            type="submit"
            className={`w-full py-2 px-4 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isFormValid ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-300 cursor-not-allowed'}`}
            style={{fontFamily: '"Pixelify Sans", sans-serif'}}
            disabled={isLoading || !isFormValid}>
            {isLoading ? 'Verifying...' : 'Verify'}
        </button>

        <div className="text-center mt-4">
            <p className="text-gray-600">
                <span className="text-sm">Didn't recieve a code?</span>{' '}
                <span className="text-gray-500 text-xs">(might need check spam/quarantine)</span>
            </p>
            <p className="text-gray-600 mt-1">
                <span
                    className="text-blue-600 cursor-pointer hover:underline text-sm"
                    onClick={requestCode}
                >
                    Request a new code
                </span>
            </p>
        </div>

    </form>)
}
