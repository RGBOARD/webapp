import {useEffect, useState} from 'react';
import '../App.css';
import '../assets/fonts/PixelifySans/PixelifySans-VariableFont_wght.ttf';
import axios from '../api/axios';
import {renderPixelDataToImage} from '../utils/pixelRenderer';

// modal component
import Modal from "../components/Modal";

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
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [AlertMessage, setAlertMessage] = useState(null);
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
        if (selectedDesign) {
            console.log("Queued design", selectedDesign.design_id);
            // TODO: Jandel: Go to queue view
            // Not putting anything here so you can mount the component your way
        }
    };

    const handleEdit = () => {
        if (selectedDesign) {
            console.log("Edit design", selectedDesign.design_id);
            // TODO: Irsa: Go to edit view
            // Not putting anything here so you can mount the component your way
        }
    };

    const handleDeleteClick = () => {
        if (selectedDesign) {
            setShowDeleteModal(true);
        }
    };

    // this was buggy to set up, but it works.
    const confirmDelete = async () => {
        if (!selectedDesign) return;

        const response = await deleteDesign(selectedDesign.design_id);

        if (response && response.status === 200) {
            const refreshed = await getDesigns(page, pageSize);
            const refreshedDesigns = refreshed?.data ?? [];

            if (refreshedDesigns.length > 0) {
                setDesigns(refreshedDesigns);
                setSelectedDesign(refreshedDesigns[0]);
            } else if (page > 1) {
                setPage(page - 1); //  fetch the previous page
            } else {
                setDesigns([]);
                setSelectedDesign(null);
            }

            setShowDeleteModal(false);
            return;
        }

        // failure case
        setAlertMessage(response?.error || "An unexpected error occurred.");
        setShowAlertModal(true);
        setShowDeleteModal(false);
    };


    return (
        <div className="flex flex-row w-full h-full items-center justify-center">
            {/* GALLERY SIDE */}
            <div className="w-1/2 p-2 flex flex-col h-full">
                <div
                    className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-2 overflow-auto min-h-[400px]">{designs.map((design) => (
                    <div
                        key={design.design_id}
                        className={`relative cursor-pointer border ${selectedDesign?.design_id === design.design_id ? 'border-blue-400' : 'border-gray-300'} rounded-md p-1`}
                        onClick={() => setSelectedDesign(design)}
                    >
                        <div
                            className={`absolute top-1 left-1 px-1 py-[1px] rounded-sm text-sm text-white font-bold ${
                                !design.is_approved
                                    ? 'bg-red-500'
                                    : design.is_scheduled
                                        ? 'bg-blue-500'
                                        : design.is_in_queue
                                            ? 'bg-green-500'
                                            : 'bg-gray-400'
                            }`}
                            style={{fontFamily: '"Pixelify Sans", sans-serif'}}
                        >
                            {!design.is_approved
                                ? 'Not Approved'
                                : design.is_scheduled
                                    ? 'Scheduled'
                                    : design.is_in_queue
                                        ? 'In Queue'
                                        : 'Not in Queue'}
                        </div>

                        <img
                            src={renderPixelDataToImage(JSON.parse(design.pixel_data), 64, 64, 8)}
                            alt={design.title}
                            className="w-full object-contain rounded"
                            style={{imageRendering: 'pixelated'}}
                        />
                    </div>
                ))}


                    {Array.from({length: Math.max(0, pageSize - designs.length)}).map((_, idx) => (
                        <div
                            key={`empty-${idx}`}
                            className="relative border border-dashed border-gray-300 rounded-md p-1 flex items-center justify-center"
                            style={{aspectRatio: '1 / 1'}}
                        />
                    ))}
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
                {selectedDesign ? (
                    <div
                        className="w-full h-full bg-white border border-gray-300 rounded-xl shadow-md p-6 flex flex-col items-center space-y-6 mb-10">
                        <img
                            src={renderPixelDataToImage(JSON.parse(selectedDesign.pixel_data), 64, 64, 8)}
                            alt={selectedDesign.title}
                            className="w-48 h-48 border border-gray-300 rounded-lg object-contain"
                            style={{imageRendering: 'pixelated'}}
                        />

                        <h2 className="text-2xl font-bold text-center break-words w-full truncate"
                            style={{fontFamily: 'Pixelify Sans, sans-serif'}}>
                            {selectedDesign.title}
                        </h2>

                        <div className="w-full max-w-md grid grid-cols-2 gap-4 text-sm md:text-base text-gray-700">
                            <div className="text-center">
                                <p><strong>Approved:</strong></p>
                                <p>{selectedDesign.is_approved ? 'Yes' : 'No'}</p>
                            </div>
                            <div className="text-center">
                                <p><strong>Scheduled:</strong></p>
                                <p>{selectedDesign.is_scheduled ? 'Yes' : 'No'}</p>
                            </div>
                        </div>

                        <div className="flex flex-col w-full max-w-xs space-y-4 mt-4"
                             style={{fontFamily: '"Pixelify Sans", sans-serif'}}>

                            {selectedDesign.is_approved ? (
                                <>
                                    {!selectedDesign.is_scheduled && (
                                        <button
                                            onClick={handleQueue}
                                            className="w-full border font-bold text-black border-gray-300 bg-yellow-400 py-2 rounded-md text-md font-pixelify hover:bg-black hover:text-yellow-400 hover:shadow-md transition-all duration-200 ease-in-out cursor-pointer"
                                        >
                                            {selectedDesign.is_in_queue? 'Schedule' : 'Queue'}
                                        </button>
                                    )}

                                    <div className="flex gap-4">
                                        <button
                                            onClick={selectedDesign.is_scheduled ? handleQueue : handleEdit}
                                            className={`flex-1 border font-bold text-black border-gray-300 py-2 rounded-md text-md font-pixelify hover:bg-black hover:shadow-md transition-all duration-200 ease-in-out cursor-pointer ${
                                                selectedDesign.is_scheduled ? 'bg-yellow-400 hover:text-yellow-400' : 'bg-blue-500 hover:text-blue-500'
                                            }`}
                                        >
                                            {selectedDesign.is_scheduled ? 'Edit Schedule' : 'Edit'}
                                        </button>

                                        <button
                                            onClick={handleDeleteClick}
                                            className="flex-1 border font-bold text-white border-gray-300 bg-red-500 py-2 rounded-md text-md font-pixelify hover:bg-white hover:text-red-500 hover:shadow-md transition-all duration-200 ease-in-out cursor-pointer"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </>
                            ) : (
                                // only delete and edit if not approved
                                <div className="flex gap-4">
                                    <button
                                        onClick={handleEdit}
                                        className="flex-1 border font-bold text-black border-gray-300 bg-blue-500 py-2 rounded-md text-md font-pixelify hover:bg-black hover:text-blue-500 hover:shadow-md transition-all duration-200 ease-in-out cursor-pointer"
                                    >
                                        Edit
                                    </button>

                                    <button
                                        onClick={handleDeleteClick}
                                        className="flex-1 border font-bold text-white border-gray-300 bg-red-500 py-2 rounded-md text-md font-pixelify hover:bg-white hover:text-red-500 hover:shadow-md transition-all duration-200 ease-in-out cursor-pointer"
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div
                        className="text-gray-400 text-center text-lg w-full h-full flex items-center justify-center border border-gray-300 rounded-lg">
                        No design selected
                    </div>
                )}
            </div>


            <Modal
                isOpen={showDeleteModal}
                type="delete"
                message={`Are you sure you want to delete "${selectedDesign?.title}"?`}
                onConfirm={confirmDelete}
                onCancel={() => setShowDeleteModal(false)}
            />

            <Modal
                isOpen={showAlertModal}
                type="alert"
                message={AlertMessage}
                onConfirm={() => setShowAlertModal(false)}
            />


        </div>
    );
}

export default UserImages;
