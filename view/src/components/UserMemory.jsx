import {useEffect, useState} from 'react';
import axios from '../api/axios';

export default function UserMemory() {
    const [usedBytes, setUsedBytes] = useState(null);
    const [maxMB, setMaxMB] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUsage = async () => {
            try {
                const res = await axios.get('/design/bytes');
                setUsedBytes(res.data.user_bytes);
                setMaxMB(res.data.max_bytes_mb);
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to get user memory.');
            } finally {
                setLoading(false);
            }
        };
        fetchUsage();
    }, []);

    const formatMB = (bytes) => (bytes / (1024 * 1024)).toFixed(2);
    const percent = usedBytes && maxMB
        ? Math.min((usedBytes / (maxMB * 1024 * 1024)) * 100, 100).toFixed(1)
        : 0;

    return (
        <div
            className="w-full bg-white border border-gray-300 rounded-xl shadow-md flex flex-col items-center space-y-4 p-4 mb-6"
            style={{fontFamily: '"Pixelify Sans", sans-serif'}}
        >
            <h2 className="text-xl font-bold text-center text-gray-800 break-words w-full">
                Storage Usage
            </h2>

            {loading ? (
                <p className="text-center text-gray-500">Loading...</p>
            ) : error ? (
                <div className="text-center p-2 w-full bg-red-100 text-red-700 rounded-md text-sm">
                    {error}
                </div>
            ) : (
                <>
                    <div className="w-full bg-gray-200 h-4 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-300 ease-out ${
                                percent > 90 ? 'bg-red-500' : 'bg-blue-500'
                            }`}
                            style={{width: `${percent}%`}}
                        />
                    </div>
                    <p className="text-sm text-gray-700 text-center w-full">
                        {formatMB(usedBytes)} MB used of {maxMB} MB ({percent}%)
                    </p>
                </>
            )}
        </div>
    );
}
