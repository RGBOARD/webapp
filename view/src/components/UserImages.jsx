import {useEffect, useState} from 'react';
import '../App.css';
import './styles/UserImages.css';
import '../assets/fonts/PixelifySans/PixelifySans-VariableFont_wght.ttf';
import axios from '../api/axios';
import {renderPixelDataToImage} from '../utils/pixelRenderer';
import { Navigate, useNavigate} from 'react-router-dom';
// modal component
import Modal from "../components/Modal";

// memory component
import UserMemory from "../components/UserMemory"

async function getDesigns(page, page_size) {
    try {
        const res = await axios.get('/designs', {params: {page, page_size}});
        return res.data;
    } catch (error) {
        if (error.response) return error.response.data;
        return {error: "Unexpected error occurred"};
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
    const [redirectToEdit, setRedirectToEdit] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [AlertMessage, setAlertMessage] = useState(null);

    // A funny trick to remount the memory bar
    const [memoryRefreshKey, setMemoryRefreshKey] = useState(0);

    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const pageSize = 8;
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchDesigns() {
            const response = await getDesigns(page, pageSize);
            if (response?.designs) {
                setDesigns(response.designs);
                setPages(response.pages);
                setSelectedDesign(response.designs.length > 0 ? response.designs[0] : null);
            } else {
                setDesigns([]);
                setPages(1);
            }
        }

        fetchDesigns();
    }, [page]);

    const handleQueue = () => {
        if (selectedDesign) {
            navigate(`/upload-to-queue/${selectedDesign.design_id}`);
        }
    };

    const handleEdit = () => {
        if (selectedDesign) {
            setRedirectToEdit({
                design: {
                    design_id: selectedDesign.design_id,
                    title: selectedDesign.title,
                    pixel_data: selectedDesign.pixel_data
                }
            });
        }
    };

    if (redirectToEdit) {
        return <Navigate to="/edit" state={redirectToEdit} replace/>;
    }

    const handleDeleteClick = () => {
        if (selectedDesign) {
            setShowDeleteModal(true);
        }
    };

    const confirmDelete = async () => {
        if (!selectedDesign) return;

        const response = await deleteDesign(selectedDesign.design_id);

        if (response && response.status === 200) {
            let refreshed = await getDesigns(page, pageSize);

            // If the current page is now empty, try going back a page
            if (refreshed?.designs?.length === 0 && page > 1) {
                const prevPage = page - 1;
                setPage(prevPage); // will trigger useEffect to fetch new page
                return;
            }

            setDesigns(refreshed.designs);
            setPages(refreshed.pages || 1);
            setSelectedDesign(refreshed.designs[0] || null);
            setMemoryRefreshKey(prev => prev + 1);
            setShowDeleteModal(false);
            return;
        }

        // failure case
        setAlertMessage(response?.error || "An unexpected error occurred.");
        setShowAlertModal(true);
        setShowDeleteModal(false);
    };

    return (
        <div className="flex flex-col md:flex-row w-full gap-4 px-2">
            {/* GALLERY SIDE */}
            <div className="w-full md:w-3/4 p-2 flex flex-col h-full">
                <div
                    className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 overflow-auto min-h-[300px]">
                    {designs.map((design) => (
                        <div
                            key={design.design_id}
                            className={`relative cursor-pointer border ${
                                selectedDesign?.design_id === design.design_id
                                    ? 'border-blue-400'
                                    : 'border-gray-300'
                            } rounded-md p-1`}
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
                <div
                    className="flex justify-center items-center gap-2 image-panel-container text-xs border-t border-gray-300 arrows py-3"
                    style={{fontFamily: '"Pixelify Sans", sans-serif'}}
                >
                    {/* Previous Arrow */}
                    <button
                        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                        disabled={page === 1}
                        className="border border-gray-300 bg-black text-white py-1 px-3 rounded-md cursor-pointer transition-all duration-200 ease-in-out font-pixelify hover:bg-white hover:text-black hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        &laquo;
                    </button>

                    {/* Page Numbers */}
                    {Array.from({length: pages}, (_, i) => i + 1)
                        .filter((p) => {
                            if (pages <= 5) return true;
                            if (page <= 3) return p <= 5;
                            if (page >= pages - 2) return p >= pages - 4;
                            return Math.abs(p - page) <= 2;
                        })
                        .map((p) => (
                            <button
                                key={p}
                                onClick={() => setPage(p)}
                                className={`border border-gray-300 py-1 px-3 rounded-md cursor-pointer font-pixelify transition-all duration-200 ease-in-out ${
                                    page === p
                                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                                        : 'bg-white text-black hover:bg-black hover:text-white'
                                }`}
                            >
                                {p}
                            </button>
                        ))}

                    {/* Next Arrow */}
                    <button
                        onClick={() => setPage((prev) => Math.min(prev + 1, pages))}
                        disabled={page === pages}
                        className="border border-gray-300 bg-black text-white py-1 px-3 rounded-md cursor-pointer transition-all duration-200 ease-in-out font-pixelify hover:bg-white hover:text-black hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        &raquo;
                    </button>
                </div>
            </div>

            {/* CARD SIDE */}
            <div className="w-full md:w-1/4 p-2 flex flex-col items-center h-auto md:h-full">
                <UserMemory key={memoryRefreshKey}/>
                {selectedDesign ? (
                    <div
                        className="w-full bg-white border border-gray-300 rounded-xl shadow-md flex flex-col items-center space-y-4 selected-box"
                        style={{maxHeight: '80vh', overflowY: 'auto'}}
                    >
                        <img
                            src={renderPixelDataToImage(JSON.parse(selectedDesign.pixel_data), 64, 64, 8)}
                            alt={selectedDesign.title}
                            className="w-48 h-48 border border-gray-300 rounded-lg object-contain"
                            style={{imageRendering: 'pixelated'}}
                        />

                        <h2
                            className="text-2xl font-bold text-center break-words w-full overflow-hidden text-ellipsis"
                            style={{fontFamily: 'Pixelify Sans, sans-serif'}}
                        >
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

                        <div
                            className="flex flex-col w-full max-w-xs space-y-2 selected-buttons"
                            style={{fontFamily: '"Pixelify Sans", sans-serif'}}
                        >
                            {selectedDesign.is_approved ? (
                                <>
                                    {(!selectedDesign.is_scheduled && !selectedDesign.is_in_queue) && (
                                        <button
                                            onClick={handleQueue}
                                            className="cursor-pointer w-full border font-bold text-black border-gray-300 bg-yellow-400 py-2 rounded-md text-md font-pixelify hover:bg-black hover:text-yellow-400 hover:shadow-md transition-all duration-200 ease-in-out"
                                        >
                                            {selectedDesign.is_in_queue ? 'Schedule' : 'Queue'}
                                        </button>
                                    )}

                                    <div className="flex flex-col sm:flex-row gap-4">
                                        {!selectedDesign.is_in_queue && (<button
                                            onClick={selectedDesign.is_scheduled ? handleQueue : handleEdit}
                                            className={`cursor-pointer flex-1 border font-bold text-black border-gray-300 py-2 rounded-md text-md font-pixelify hover:bg-black hover:shadow-md transition-all duration-200 ease-in-out ${
                                                selectedDesign.is_scheduled
                                                    ? 'bg-yellow-400 hover:text-yellow-400'
                                                    : 'bg-blue-500 hover:text-blue-500'
                                            }`}
                                        >
                                            {selectedDesign.is_scheduled ? 'Edit Schedule' : 'Edit'}
                                        </button>)}


                                        <button
                                            onClick={handleDeleteClick}
                                            className="cursor-pointer flex-1 border font-bold text-white border-gray-300 bg-red-500 py-2 rounded-md text-md font-pixelify hover:bg-white hover:text-red-500 hover:shadow-md transition-all duration-200 ease-in-out"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <button
                                        onClick={handleDeleteClick}
                                        className="cursor-pointer flex-1 border font-bold text-white border-gray-300 bg-red-500 py-2 rounded-md text-md font-pixelify hover:bg-white hover:text-red-500 hover:shadow-md transition-all duration-200 ease-in-out"
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div
                        className="text-gray-400 text-center text-lg w-full h-full flex items-center justify-center border border-gray-300 rounded-lg no-design-box">
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
