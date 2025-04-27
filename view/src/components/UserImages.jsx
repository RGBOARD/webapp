import {useState, useEffect} from 'react';
import '../App.css';
import '../assets/fonts/PixelifySans/PixelifySans-VariableFont_wght.ttf';
import axios from '../api/axios';
import {renderPixelDataToImage} from '../utils/pixelRenderer';

async function getImages(page, page_size) {
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

function UserImages() {
    const [designs, setDesigns] = useState([]);
    const [selectedDesign, setSelectedDesign] = useState(null);
    const [page, setPage] = useState(1);
    const pageSize = 6;

    useEffect(() => {
        async function fetchDesigns() {
            const response = await getImages(page, pageSize);
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
        if (selectedDesign) console.log("Queued design", selectedDesign.design_id);
    };

    const handleEdit = () => {
        if (selectedDesign) console.log("Edit design", selectedDesign.design_id);
    };

    const handleDelete = () => {
        if (selectedDesign) console.log("Delete design", selectedDesign.design_id);
    };

    return (
        <div className="flex flex-row w-full h-full">
            {/* GALLERY SIDE FIRST */}
            <div className="w-1/2 p-2 flex flex-col h-full">
                <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-2 overflow-auto min-h-[400px]">
                    {designs.map((design) => (
                        <div
                            key={design.design_id}
                            className={`relative cursor-pointer border ${selectedDesign?.design_id === design.design_id ? 'border-blue-400' : 'border-gray-300'} rounded-md p-1`}
                            onClick={() => setSelectedDesign(design)}
                        >
                            {/* Always show a label */}
                            <div className={`absolute top-1 left-1 px-1 py-[1px] rounded-sm text-[10px] text-white
                      ${design.is_in_queue ? 'bg-green-500' : 'bg-gray-400'}`}>
                                {design.is_in_queue ? 'In Queue' : 'Not in Queue'}
                            </div>

                            <img
                                src={renderPixelDataToImage(JSON.parse(design.pixel_data), 64, 64, 8)}
                                alt={design.title}
                                className="w-full object-contain rounded"
                                style={{imageRendering: 'pixelated'}}
                            />
                        </div>
                    ))}

                    {/* Fill empty slots if fewer than pageSize */}
                    {Array.from({length: Math.max(0, pageSize - designs.length)}).map((_, idx) => (
                        <div
                            key={`empty-${idx}`}
                            className="relative border border-dashed border-gray-300 rounded-md p-1 flex items-center justify-center"
                            style={{aspectRatio: '1 / 1'}}
                        />
                    ))}
                </div>


                {/* Pagination */}
                <div className="flex justify-between items-center p-2 text-xs border-t border-gray-300">
                    <button
                        onClick={handlePrevious}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-1 px-2 rounded disabled:opacity-50"
                        disabled={page === 1}
                    >
                        Prev
                    </button>
                    <button
                        onClick={handleNext}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-1 px-2 rounded disabled:opacity-50"
                        disabled={designs.length < pageSize}
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* CARD SIDE SECOND */}
            <div className="w-1/2 p-2 flex flex-col items-center h-full">
                {selectedDesign ? (
                    <div
                        className="w-full h-full border border-gray-300 rounded-lg p-4 flex flex-col items-center space-y-4">
                        <img
                            src={renderPixelDataToImage(JSON.parse(selectedDesign.pixel_data), 64, 64, 8)}
                            alt={selectedDesign.title}
                            className="w-32 h-32 border border-gray-300 rounded-md object-contain"
                            style={{imageRendering: 'pixelated'}}
                        />
                        <h2 className="text-lg font-bold text-center" style={{fontFamily: 'Pixelify Sans, sans-serif'}}>
                            {selectedDesign.title}
                        </h2>
                        <div className="text-gray-600 text-xs text-center space-y-1">
                            <p><strong>ID:</strong> {selectedDesign.design_id}</p>
                            <p><strong>Status:</strong> {selectedDesign.status ? 'Active' : 'Inactive'}</p>
                            <p><strong>Approved:</strong> {selectedDesign.is_approved ? 'Yes' : 'No'}</p>
                            <p><strong>In Queue:</strong> {selectedDesign.is_in_queue ? 'Yes' : 'No'}</p>
                        </div>
                        <div className="flex flex-col space-y-2 w-full">
                            <button onClick={handleQueue}
                                    className="bg-blue-500 hover:bg-blue-600 text-white py-1 rounded w-full text-sm">
                                Queue
                            </button>
                            <button onClick={handleEdit}
                                    className="bg-yellow-400 hover:bg-yellow-500 text-white py-1 rounded w-full text-sm">
                                Edit
                            </button>
                            <button onClick={handleDelete}
                                    className="bg-red-500 hover:bg-red-600 text-white py-1 rounded w-full text-sm">
                                Delete
                            </button>
                        </div>
                    </div>
                ) : (
                    <div
                        className="text-gray-400 text-center text-lg w-full h-full flex items-center justify-center border border-gray-300 rounded-lg">
                        No design selected
                    </div>
                )}
            </div>
        </div>
    );


}

export default UserImages;
