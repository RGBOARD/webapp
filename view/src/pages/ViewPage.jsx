import React from 'react';
import '../App.css';
import UserImages from '../components/UserImages.jsx';

function ViewPage() {
    return (
        <div className="w-full h-full p-4">
            <div
                className="bg-gray-100 flex flex-row flex-wrap justify-between p-6 rounded-2xl w-full text-lg space-y-0 gap-4">
                <h1 className="text-3xl font-bold self-start">
                    My Images
                </h1>
                <div className="flex-1 min-w-[300px]">
                    <UserImages/>
                </div>
            </div>
        </div>
    );
}

export default ViewPage;
