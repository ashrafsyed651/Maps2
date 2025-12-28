
import { useState } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { Loader2, Navigation, Sparkles } from 'lucide-react';
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
                { lat: destLoc.lat, lon: destLoc.lon }
            );

            const enrichedRoutes = fetchedRoutes.map(r => ({
                ...r,
                source: sourceLoc.display_name,
                destination: destLoc.display_name
            }));

            const ranked = rankRoutes(enrichedRoutes, selectedProfile);
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
                const ranked = rankRoutes(routes, profile);
                setRoutes(ranked);
                setSelectedRouteId(ranked[0]?.id);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col md:flex-row">
            {/* Sidebar */}
            <div className="w-full md:w-[420px] h-screen overflow-y-auto bg-white/80 backdrop-blur-xl border-r border-gray-200/50 p-6 shadow-2xl z-20">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 rounded-2xl shadow-lg">
                            <Navigation className="text-white" size={26} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
                                SmartDrive
                            </h1>
                            <p className="text-xs text-gray-500 font-medium">Intelligent Route Planning</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles size={16} className="text-blue-600" />
                            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Plan Your Trip</h2>
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
                                />
                            </section>
                        </>
                    )}
                </div>
            </div>

            {/* Main Content (Map) */}
            <div className="flex-1 relative h-[50vh] md:h-screen">
                {isLoaded ? (
                    <MapComponent
                        routes={routes}
                        selectedRouteId={selectedRouteId}
                        onSelectRoute={setSelectedRouteId}
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
