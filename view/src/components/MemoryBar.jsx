import { useState, useEffect } from 'react';
import axios from '../api/axios';

export default function MemoryUsage() {
    const [usedBytes, setUsedBytes] = useState(null);
    const [maxMB, setMaxMB] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUsage = async () => {
            try {
                const res = await axios.get('/memory');
                setUsedBytes(res.data.bytes);
                setMaxMB(res.data.max);
            } catch (err) {
                setError(error.response?.data?.error || 'Failed to get used memory.');
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
            className="max-w-md mx-auto mt-10 p-6 bg-white rounded-2xl shadow-md space-y-4"
            style={{ fontFamily: '"Pixelify Sans", sans-serif' }}
        >
            <h2 className="text-2xl font-bold text-center text-gray-800">Storage Usage</h2>

            {loading ? (
                <p className="text-center text-gray-500">Loading...</p>
            ) : error ? (
                <div className="text-center p-2 rounded bg-red-100 text-red-700">{error}</div>
            ) : (
                <>
                    <div className="w-full bg-gray-200 h-4 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-300 ease-out ${
                                percent > 90 ? 'bg-red-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${percent}%` }}
                        ></div>
                    </div>

                    <p className="text-center text-sm text-gray-700">
                        {formatMB(usedBytes)} MB used of {maxMB} MB ({percent}%)
                    </p>
                </>
            )}
        </div>
    );
}
