import React, {useEffect, useState} from 'react';
import {LogOut, ArrowLeft} from 'lucide-react';
import {useAuth} from '../auth/authContext';
import {useNavigate, useLocation} from 'react-router-dom';
import logoImage from '../assets/RGB-Icon.png';

function Header() {
    const {isAuthenticated, logout} = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [previousPaths, setPreviousPaths] = useState([]);

    // Track navigation history
    useEffect(() => {
        setPreviousPaths(prev => {
            if (prev.length > 0 && prev[prev.length - 1] === location.pathname) {
                return prev;
            }
            return [...prev, location.pathname].slice(-5);
        });
    }, [location.pathname]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleHome = () => {
        navigate('/');
    };

    const handleBack = () => {
        const prevPath = previousPaths.length > 1
            ? previousPaths[previousPaths.length - 2]
            : '/';

        if ((prevPath === '/login' || prevPath === '/signup') && isAuthenticated) {
            navigate('/');
        } else if (prevPath === location.pathname) {
            navigate('/');
        } else {
            navigate(-1);
        }
    };

    return (
        <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
            <div className="container mx-auto flex items-center justify-between px-4 py-3">

                {/* Left Actions - Back Button */}
                <div className="flex items-center space-x-4">
                    <button
                        onClick={handleBack}
                        className="p-2 rounded hover:bg-gray-100 transition"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-700"/>
                    </button>
                </div>

                {/* Logo - Home Button */}
                <div
                    className="flex items-center cursor-pointer"
                    onClick={handleHome}
                >
                    <img
                        src={logoImage}
                        alt="RGB Board"
                        className="h-14 w-auto"
                    />
                </div>

                {/* Right Actions - Logout */}
                <div className="flex items-center space-x-4">
                    {isAuthenticated && (
                        <button
                            onClick={handleLogout}
                            className="p-2 rounded hover:bg-gray-100 transition"
                        >
                            <LogOut className="w-6 h-6 text-gray-700"/>
                        </button>
                    )}
                </div>

            </div>
        </header>
    );
}

export default Header;
