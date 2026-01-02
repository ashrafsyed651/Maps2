
import { useState } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { Loader2, Navigation, Sparkles, RefreshCw, Moon, Sun } from 'lucide-react';
import { InputSection } from './components/InputSection';
import { RouteList } from './components/RouteList';
import { ProfileSelector } from './components/ProfileSelector';
import { MapComponent } from './components/MapComponent';
import { Route, DrivingProfile } from './types';
import { PROFILES, fetchRoutes, rankRoutes } from './services/routeService';
import { geocodeLocation } from './services/geocodingService';

const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

function App() {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey,
        libraries: ['places', 'geometry']
    });

    const [routes, setRoutes] = useState<Route[]>([]);
    const [selectedProfile, setSelectedProfile] = useState<DrivingProfile>(PROFILES[1]);
    const [selectedRouteId, setSelectedRouteId] = useState<string | undefined>();
    const [travelTime, setTravelTime] = useState<string>("20:00");
    const [travelDate, setTravelDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isSyncingTime, setIsSyncingTime] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (source: string, destination: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const [sourceLoc, destLoc] = await Promise.all([
                geocodeLocation(source),
                geocodeLocation(destination)
            ]);

            if (!sourceLoc || !destLoc) {
                throw new Error("One or both locations could not be found.");
            }

            const fetchedRoutes = await fetchRoutes(
                { lat: sourceLoc.lat, lon: sourceLoc.lon },
                { lat: destLoc.lat, lon: destLoc.lon },
                travelTime,
                travelDate
            );

            const enrichedRoutes = fetchedRoutes.map(r => ({
                ...r,
                source: sourceLoc.display_name,
                destination: destLoc.display_name
            }));

            const ranked = rankRoutes(enrichedRoutes, selectedProfile, travelTime);
            setRoutes(ranked);
            setSelectedRouteId(ranked[0]?.id);
        } catch (err: any) {
            setError(err.message || "Failed to find routes. Please check your locations.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleProfileChange = (profileId: string) => {
        const profile = PROFILES.find(p => p.id === profileId);
        if (profile) {
            setSelectedProfile(profile);
            if (routes.length > 0) {
                const ranked = rankRoutes(routes, profile, travelTime);
                setRoutes(ranked);
                setSelectedRouteId(ranked[0]?.id);
            }
        }
    };

    const handleTimeChange = (time: string) => {
        setTravelTime(time);
        if (routes.length > 0) {
            const ranked = rankRoutes(routes, selectedProfile, time);
            setRoutes(ranked);
            setSelectedRouteId(ranked[0]?.id);
        }
    };

    const handleDateChange = (date: string) => {
        setTravelDate(date);
    };

    const fetchNetworkTime = async () => {
        setIsSyncingTime(true);
        try {
            const response = await fetch('https://worldtimeapi.org/api/ip');
            const data = await response.json();
            if (data.datetime) {
                const dateObj = new Date(data.datetime);
                const hours = dateObj.getHours().toString().padStart(2, '0');
                const minutes = dateObj.getMinutes().toString().padStart(2, '0');
                const dateStr = dateObj.toISOString().split('T')[0];

                handleTimeChange(`${hours}:${minutes}`);
                handleDateChange(dateStr);
            }
        } catch (error) {
            console.error("Failed to fetch time", error);
        } finally {
            setIsSyncingTime(false);
        }
    };

    return (
        <div className="relative h-screen w-screen overflow-hidden bg-slate-50">
            {/* Sidebar */}
            <div className={`absolute left-0 top-0 h-full w-full md:w-[420px] overflow-y-auto bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl border-r border-gray-200/50 dark:border-slate-800 p-6 shadow-2xl z-20 transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
                {/* Header */}
                <div className="mb-8 flex justify-between items-start">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 rounded-2xl shadow-lg">
                            <Navigation className="text-white" size={26} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
                                SmartDrive
                            </h1>
                            <p className="text-xs text-gray-500 font-medium dark:text-gray-400">Intelligent Route Planning</p>
                        </div>
                    </div>

                    {/* Dark Mode Toggle */}
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        aria-label="Toggle Dark Mode"
                    >
                        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                </div>

                <div className="space-y-6">
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles size={16} className="text-blue-600" />
                            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Plan Your Trip</h2>
                        </div>

                        {/* Time & Date Input */}
                        <div className="mb-4 bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm space-y-3 transition-colors duration-300">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 flex justify-between items-center">
                                    <span>Travel Date</span>
                                    <button
                                        onClick={fetchNetworkTime}
                                        disabled={isSyncingTime}
                                        className="flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-2 py-0.5 rounded-full transition-colors"
                                    >
                                        <RefreshCw size={10} className={isSyncingTime ? "animate-spin" : ""} />
                                        {isSyncingTime ? "Syncing..." : "Sync Live"}
                                    </button>
                                </label>
                                <input
                                    type="date"
                                    value={travelDate}
                                    onChange={(e) => handleDateChange(e.target.value)}
                                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                    Travel Time
                                </label>
                                <input
                                    type="time"
                                    value={travelTime}
                                    onChange={(e) => handleTimeChange(e.target.value)}
                                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <InputSection onSearch={handleSearch} isLoading={isLoading} />
                    </section>

                    {error && (
                        <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 text-red-700 rounded-2xl text-sm flex items-start gap-3 animate-in fade-in zoom-in shadow-sm">
                            <span className="text-lg">⚠️</span>
                            <span className="font-medium">{error}</span>
                        </div>
                    )}

                    {routes.length > 0 && (
                        <>
                            <section className="animate-in slide-in-from-left duration-500">
                                <div className="flex items-center gap-2 mb-4">
                                    <Sparkles size={16} className="text-blue-600" />
                                    <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Driving Profile</h2>
                                </div>
                                <ProfileSelector
                                    profiles={PROFILES}
                                    selectedId={selectedProfile.id}
                                    onSelect={handleProfileChange}
                                />
                            </section>

                            <section>
                                <RouteList
                                    routes={routes}
                                    selectedProfile={selectedProfile}
                                    selectedRouteId={selectedRouteId}
                                    onSelectRoute={setSelectedRouteId}
                                    travelTime={travelTime}
                                />
                            </section>
                        </>
                    )}
                </div>
            </div>

            {/* Main Content (Map) */}
            <div className="absolute inset-0 z-0">
                {isLoaded ? (
                    <MapComponent
                        routes={routes}
                        selectedRouteId={selectedRouteId}
                        onSelectRoute={setSelectedRouteId}
                        isDarkMode={isDarkMode}
                    />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 gap-4">
                        <Loader2 className="animate-spin text-blue-600" size={40} strokeWidth={2.5} />
                        <span className="text-gray-600 font-semibold tracking-wide">Initializing Maps...</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
