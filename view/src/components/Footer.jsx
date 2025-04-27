import React from 'react';
import SimpleIcon from './SimpleIcon';
import {Linkedin} from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-gray-100 border-t border-gray-300 py-6 mt-8">
            <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Sponsor's Socials */}
                <div className="flex flex-col items-center md:items-start">
                    <div className="font-semibold text-gray-700 mb-2">
                        Sponsor's Socials:
                    </div>
                    <div className="flex space-x-4">
                        <a href="https://x.com/ComputerSociety" target="_blank" rel="noopener noreferrer"
                           className="hover:opacity-75">
                            <SimpleIcon name="X" color="#000000"/>
                        </a>
                        <a href="https://www.instagram.com/ieee_computer_society/" target="_blank"
                           rel="noopener noreferrer" className="hover:opacity-75">
                            <SimpleIcon name="Instagram" color="#000000"/>
                        </a>
                        <a href="https://www.youtube.com/@IEEEComputerSociety" target="_blank" rel="noopener noreferrer"
                           className="hover:opacity-75">
                            <SimpleIcon name="Youtube" color="#000000"/>
                        </a>
                        <a href="https://www.linkedin.com/company/ieee-computer-society/" target="_blank"
                           rel="noopener noreferrer" className="hover:opacity-75">
                            <Linkedin className="w-6 h-6 text-black"/>
                        </a>
                    </div>
                </div>

                {/* Footer Links */}
                <div className="flex flex-wrap justify-center md:justify-end gap-6 text-gray-600 text-sm">
                    <a href="/faq" className="hover:text-gray-900">FAQ</a>
                    <a href="/privacy" className="hover:text-gray-900">Privacy Policy</a>
                    <a href="/developers" className="hover:text-gray-900">Our Developers</a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
