import React from 'react';
import '../App.css';
import UserImages from '../components/UserImages.jsx';

function ViewPage() {
    return (
        <div className="w-full h-full p-4">
            <h1 className="text-3xl font-bold mb-6">My Images</h1>
            <div className="bg-gray-100 p-4 rounded-2xl w-full text-lg">
                <div className="flex-1 h-[80vh] overflow-y-auto">
                    <UserImages/>
                </div>
            </div>
        </div>
    );
}


export default ViewPage;
