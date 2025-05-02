import React from 'react';
import '../App.css';
import "./styles/ViewPage.css";
import UserImages from '../components/UserImages.jsx';

function ViewPage() {
    return (
        <div className="view-container">
            <h1 className="text-3xl font-bold mb-6">My Images</h1>
            <div className="bg-gray-100 rounded-2xl w-full text-lg images-container">
                <UserImages/>
            </div>
        </div>
    );
}


export default ViewPage;
