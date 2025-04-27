import React from 'react';
import '../App.css';
import UserImages from '../components/UserImages.jsx';

function ViewPage() {
  return (
    <div className="flex flex-col w-full h-full p-4 space-y-6">
      {/* Header */}
      <div className="w-full flex justify-center">
        <h1 className="text-3xl font-bold" style={{fontFamily: '"Pixelify Sans", sans-serif'}}>
          My Images
        </h1>
      </div>
      <UserImages />
    </div>
  );
}

export default ViewPage;
