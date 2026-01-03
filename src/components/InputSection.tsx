import { useState } from 'react';
import { MapPin, Navigation, X, Search, Locate, Loader2 } from 'lucide-react';
import { reverseGeocodeOSM } from '../services/osmService';

interface InputSectionProps {
    onSearch: (source: string, destination: string) => void;
    isLoading: boolean;
}

export function InputSection({ onSearch, isLoading }: InputSectionProps) {
    const [source, setSource] = useState('');
    const [destination, setDestination] = useState('');
    const [isLocating, setIsLocating] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (source && destination) {
            onSearch(source, destination);
        }
    };

    const handleUseLocation = () => {
        console.log("Locate button clicked"); // Debug log

        if (!('geolocation' in navigator)) {
            console.error("Geolocation not supported");
            alert("Geolocation is not supported by your browser");
            return;
        }

        setIsLocating(true);
        console.log("Requesting current position...");

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                console.log("Position received:", position);
                const { latitude, longitude } = position.coords;
                try {
                    console.log("Reverse geocoding...");
                    const address = await reverseGeocodeOSM(latitude, longitude);
                    console.log("Address found:", address);
                    if (address) {
                        setSource(address);
                    } else {
                        // Fallback to coordinates if address not found
                        setSource(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
                    }
                } catch (error) {
                    console.error("Error getting location address:", error);
                    setSource(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
                } finally {
                    setIsLocating(false);
                }
            },
            (error) => {
                console.error("Error getting location:", error);
                setIsLocating(false);
                let errorMessage = "Unable to retrieve your location.";
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "Location permission was denied. Please enable location services for this site.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Location information is unavailable.";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "The request to get user location timed out.";
                        break;
                }
                alert(errorMessage);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 space-y-4 transition-colors duration-300">
            <div className="space-y-4">
                <div className="relative group">
                    <div className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors">
                        <MapPin size={20} />
                    </div>
                    <input
                        type="text"
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                        placeholder="Starting Point (e.g. Mumbai)"
                        className="w-full pl-12 pr-10 py-3 border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
                    {source ? (
                        <button
                            type="button"
                            onClick={() => setSource('')}
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                        >
                            <X size={18} />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleUseLocation}
                            disabled={isLocating}
                            className="absolute right-3 top-3 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                            title="Use my current location"
                        >
                            {isLocating ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <Locate size={18} />
                            )}
                        </button>
                    )}
                </div>

                <div className="relative group">
                    <div className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors">
                        <Navigation size={20} />
                    </div>
                    <input
                        type="text"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder="Destination (e.g. Pune)"
                        className="w-full pl-12 pr-10 py-3 border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
                    {destination && (
                        <button
                            type="button"
                            onClick={() => setDestination('')}
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>

            <button
                type="submit"
                disabled={isLoading || !source || !destination}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
            >
                {isLoading ? (
                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                ) : (
                    <>
                        <Search size={20} />
                        Find Best Routes
                    </>
                )}
            </button>
        </form>
    );
}
