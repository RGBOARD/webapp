import {useEffect, useState} from 'react';
import '../App.css';
import '../assets/fonts/PixelifySans/PixelifySans-VariableFont_wght.ttf';
import axios from '../api/axios';
import {renderPixelDataToImage} from '../utils/pixelRenderer';

async function getDesigns(page, page_size) {
    try {
        return await axios.get('/designs', {params: {page, page_size}});
    } catch (error) {
        if (error.response) {
            return error.response.data;
        } else {
            return {error: "Unexpected error occurred"};
        }
    }
}

async function deleteDesign(design_id) {
    try {
        return await axios.delete('/design', {
            data: {design_id: design_id}
        });
    } catch (error) {
        if (error.response) {
            return error.response.data;
        } else {
            return {error: "Unexpected error occurred"};
        }
    }
}

function UserImages() {
    const [designs, setDesigns] = useState([]);
    const [selectedDesign, setSelectedDesign] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [page, setPage] = useState(1);
    const pageSize = 6;

    useEffect(() => {
        async function fetchDesigns() {
            const response = await getDesigns(page, pageSize);
            if (response?.data) {
                setDesigns(response.data);
                setSelectedDesign(response.data.length > 0 ? response.data[0] : null);
            }
        }

        fetchDesigns();
    }, [page]);

    const handlePrevious = () => {
        if (page > 1) setPage(page - 1);
    };

    const handleNext = () => {
        if (designs.length === pageSize) setPage(page + 1);
    };

    const handleQueue = () => {
        //TODO: Jandel: Move to the queue view and load up the design with the design_id
        if (selectedDesign) console.log("Queued design", selectedDesign.design_id);
    };

    const handleEdit = () => {
        //TODO: Irsa: Move to the create view and load up the design with the design_id
        if (selectedDesign) console.log("Edit design", selectedDesign.design_id);
    };

    const handleDeleteClick = () => {
        if (selectedDesign) {
            setShowDeleteModal(true); // Show delete modal
        }
    };

    const confirmDelete = async () => {
        if (selectedDesign) {
            const response = await deleteDesign(selectedDesign.design_id);

            if (response?.status === 200) {
                // Remove deleted design from local designs array
                const updatedDesigns = designs.filter(d => d.design_id !== selectedDesign.design_id);

                setDesigns(updatedDesigns);

                if (updatedDesigns.length > 0) {
                    setSelectedDesign(updatedDesigns[0]);
                } else if (page > 1) {
                    setPage(page - 1);
                } else {
                    setSelectedDesign(null);
                }

            } else {
                alert('Failed to delete design.');
            }
            setShowDeleteModal(false);
        }
    };


    return (<div className="flex flex-row w-full h-full items-center justify-center">
        {/* GALLERY SIDE */}
        <div className="w-1/2 p-2 flex flex-col h-full">
            <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-2 overflow-auto min-h-[400px]">
                {designs.map((design) => (<div
                    key={design.design_id}
                    className={`relative cursor-pointer border ${selectedDesign?.design_id === design.design_id ? 'border-blue-400' : 'border-gray-300'} rounded-md p-1`}
                    onClick={() => setSelectedDesign(design)}
                >
                    {/* Label */}
                    <div
                        className={`absolute top-1 left-1 px-1 py-[1px] rounded-sm text-[10px] text-white ${design.is_in_queue ? 'bg-green-500' : 'bg-gray-400'}`}>
                        {design.is_in_queue ? 'In Queue' : 'Not in Queue'}
                    </div>

                    <img
                        src={renderPixelDataToImage(JSON.parse(design.pixel_data), 64, 64, 8)}
                        alt={design.title}
                        className="w-full object-contain rounded"
                        style={{imageRendering: 'pixelated'}}
                    />
                </div>))}

                {/* Empty slots if less than 6 */}
                {Array.from({length: Math.max(0, pageSize - designs.length)}).map((_, idx) => (<div
                    key={`empty-${idx}`}
                    className="relative border border-dashed border-gray-300 rounded-md p-1 flex items-center justify-center"
                    style={{aspectRatio: '1 / 1'}}
                />))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center gap-4 p-2 text-xs border-t border-gray-300 mb-10"
                 style={{fontFamily: '"Pixelify Sans", sans-serif'}}>
                <button
                    onClick={handlePrevious}
                    className="border border-gray-300 bg-black text-white py-1 px-3 rounded-md cursor-pointer transition-all duration-200 ease-in-out font-pixelify hover:bg-white hover:text-black hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={page === 1}
                >
                    &laquo;
                </button>
                <button
                    onClick={handleNext}
                    className="border border-gray-300 bg-black text-white py-1 px-3 rounded-md cursor-pointer transition-all duration-200 ease-in-out font-pixelify hover:bg-white hover:text-black hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={designs.length < pageSize}
                >
                    &raquo;
                </button>
            </div>
        </div>

        {/* CARD SIDE */}
        <div className="w-1/4 p-2 flex flex-col items-center h-full">
            {selectedDesign ? (<div
                    className="w-full h-full bg-white border border-gray-300 rounded-xl shadow-md p-6 flex flex-col items-center space-y-6 mb-10">
                    {/* Image */}
                    <img
                        src={renderPixelDataToImage(JSON.parse(selectedDesign.pixel_data), 64, 64, 8)}
                        alt={selectedDesign.title}
                        className="w-48 h-48 border border-gray-300 rounded-lg object-contain"
                        style={{imageRendering: 'pixelated'}}
                    />

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-center" style={{fontFamily: 'Pixelify Sans, sans-serif'}}>
                        {selectedDesign.title}
                    </h2>

                    {/* Info Section */}
                    <div className="w-full max-w-md grid grid-cols-2 gap-4 text-sm md:text-base text-gray-700">
                        <div className="text-center">
                            <p><strong>ID:</strong></p>
                            <p>{selectedDesign.design_id}</p>
                        </div>
                        <div className="text-center">
                            <p><strong>Status:</strong></p>
                            <p>{selectedDesign.status ? 'Active' : 'Inactive'}</p>
                        </div>
                        <div className="text-center">
                            <p><strong>Approved:</strong></p>
                            <p>{selectedDesign.is_approved ? 'Yes' : 'No'}</p>
                        </div>
                        <div className="text-center">
                            <p><strong>In Queue:</strong></p>
                            <p>{selectedDesign.is_in_queue ? 'Yes' : 'No'}</p>
                        </div>
                    </div>

                    {/* Buttons Section (own row, centered) */}
                    <div className="flex flex-col w-full max-w-xs space-y-4 mt-4"
                         style={{fontFamily: '"Pixelify Sans", sans-serif'}}>
                        {/* Queue Button */}
                        <button
                            onClick={handleQueue}
                            className="w-full border font-bold text-black border-gray-300 bg-yellow-400 py-2 rounded-md text-md font-pixelify hover:bg-black hover:text-yellow-400 hover:shadow-md transition-all duration-200 ease-in-out"
                        >
                            Queue
                        </button>

                        {/* Edit and Delete side by side */}
                        <div className="flex gap-4">
                            <button
                                onClick={handleEdit}
                                className="flex-1 border font-bold text-black border-gray-300 bg-blue-500  py-2 rounded-md text-md font-pixelify hover:bg-black hover:text-blue-500 hover:shadow-md transition-all duration-200 ease-in-out"
                            >
                                Edit
                            </button>
                            <button
                                onClick={handleDeleteClick}
                                className="flex-1 border font-bold text-white border-gray-300 bg-red-500  py-2 rounded-md text-md font-pixelify hover:bg-black hover:text-red-500 hover:shadow-md transition-all duration-200 ease-in-out"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>

            ) : (<div
                className="text-gray-400 text-center text-lg w-full h-full flex items-center justify-center border border-gray-300 rounded-lg">
                No design selected
            </div>)}
        </div>
        {showDeleteModal && (
            <div className="fixed inset-0 bg-opacity-20 backdrop-blur-md flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-lg w-80 space-y-4 text-center"
                     style={{fontFamily: '"Pixelify Sans", sans-serif'}}>
                    <h2 className="text-lg font-bold">Confirm Deletion</h2>
                    <p>Are you sure you want to delete <span
                        className="font-bold text-red-500">"{selectedDesign.title}"</span>?</p>

                    <div className="flex justify-center gap-4 mt-4">
                        <button
                            onClick={confirmDelete}
                            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                        >
                            Yes, Delete
                        </button>
                        <button
                            onClick={() => setShowDeleteModal(false)}
                            className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400 transition"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>)}

    </div>);


}

export default UserImages;
