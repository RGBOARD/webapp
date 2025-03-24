import { useState } from 'react';

import '../App.css';
import '../assets/fonts/PixelifySans-VariableFont_wght.ttf'

import rgbLogo from '/images/logo.png';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="bg-white shadow-md" style={{fontFamily: '"Pixelify Sans", sans-serif'}}>
      <div className="container mx-auto flex items-center justify-between py-4 px-4">
        <img src={rgbLogo} alt="logo" className="h-12 w-auto mr-3" />

        {/* Desktop Menu */}
        <ul className="hidden md:flex space-x-6">
          <li className="hover:text-red-300 cursor-pointer">Home</li>
          <li className="hover:text-green-300 cursor-pointer">Sign Up</li>
          <li className="hover:text-blue-300 cursor-pointer">Login</li>
        </ul>

        {/* Mobile Menu Button */}
        <button onClick={toggleMenu} className="md:hidden focus:outline-none">
          {isOpen ? (
            <svg
              className="w-6 h-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="w-6 h-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <ul className="md:hidden px-4 pb-4 space-y-2">
          <li className="hover:text-red-300 cursor-pointer">Home</li>
          <li className="hover:text-green-300 cursor-pointer">Sign Up</li>
          <li className="hover:text-blue-300 cursor-pointer">Login</li>
        </ul>
      )}
    </nav>
  );
}
