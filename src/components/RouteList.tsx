import { Route, DrivingProfile } from '../types';
import { getRecommendationReason } from '../services/routeService';
import { Timer, Zap, Lightbulb, TrendingUp, Award, Sun, Cloud, CloudRain, Snowflake, CloudLightning } from 'lucide-react';
import { clsx } from 'clsx';

interface RouteListProps {
    routes: Route[];
    selectedProfile: DrivingProfile;
    selectedRouteId?: string;
    onSelectRoute?: (id: string) => void;
    travelTime?: string;
}

function getWeatherIcon(code: number) {
    if (code <= 1) return <Sun size={14} className="text-orange-500" />;
    if (code <= 3) return <Cloud size={14} className="text-gray-500" />;
    if (code <= 48) return <Cloud size={14} className="text-slate-500" />;
    if (code <= 67 || (code >= 80 && code <= 82)) return <CloudRain size={14} className="text-blue-500" />;
    if (code <= 77) return <Snowflake size={14} className="text-cyan-500" />;
    if (code >= 95) return <CloudLightning size={14} className="text-purple-500" />;
    return <Sun size={14} className="text-orange-500" />;
}

export function RouteList({ routes, selectedProfile, selectedRouteId, onSelectRoute, travelTime }: RouteListProps) {
    if (routes.length === 0) return null;

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="text-blue-600 dark:text-blue-400" size={18} />
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Recommended Routes</h3>
            </div>

            <div className="space-y-3">
                {routes.map((route, index) => {
                    const isTopPick = index === 0;
                    const isSelected = route.id === selectedRouteId;
                    const reason = getRecommendationReason(route, selectedProfile, travelTime);

                    return (
                        <div
                            key={route.id}
                            onClick={() => onSelectRoute?.(route.id)}
                            className={clsx(
                                "relative p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer group",
                                isSelected
                                    ? "border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 shadow-xl transform scale-[1.02]"
                                    : (isTopPick
                                        ? "border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 shadow-md hover:shadow-lg dark:border-green-800"
                                        : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md")
                            )}
                        >
                            {isTopPick && (
                                <div className={clsx(
                                    "absolute -top-3 left-4 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5",
                                    isSelected ? "bg-gradient-to-r from-blue-600 to-indigo-600" : "bg-gradient-to-r from-green-500 to-emerald-600"
                                )}>
                                    <Award size={14} />
                                    {isSelected ? "SELECTED" : "BEST MATCH"}
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className={clsx("font-bold text-lg mb-1", isSelected ? "text-gray-900 dark:text-white" : "text-gray-900 dark:text-slate-100")}>{route.roadType} Route</h4>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">{route.description}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                        {route.eta}
                                    </div>
                                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">minutes</span>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-4 gap-2 mb-4">
                                <div className="flex flex-col items-center p-3 bg-gradient-to-br from-white to-gray-50 dark:from-slate-700 dark:to-slate-800 rounded-xl border border-gray-100 dark:border-slate-600 shadow-sm">
                                    <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mb-1.5">
                                        <Timer size={14} />
                                        <span className="text-[10px] uppercase font-bold">ETA</span>
                                    </div>
                                    <span className={clsx("font-bold text-sm", route.eta < 50 ? "text-green-600 dark:text-green-400" : "text-gray-700 dark:text-gray-200")}>
                                        {route.eta}m
                                    </span>
                                </div>

                                <div className="flex flex-col items-center p-3 bg-gradient-to-br from-white to-gray-50 dark:from-slate-700 dark:to-slate-800 rounded-xl border border-gray-100 dark:border-slate-600 shadow-sm">
                                    <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mb-1.5">
                                        <span className="text-[10px] uppercase font-bold">Dist</span>
                                    </div>
                                    <span className="font-bold text-sm text-gray-700 dark:text-gray-200">
                                        {route.distance}km
                                    </span>
                                </div>

                                <div className="flex flex-col items-center p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-100 dark:border-blue-900/50 shadow-sm">
                                    <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 mb-1.5">
                                        <Zap size={14} />
                                        <span className="text-[10px] uppercase font-bold">Activity</span>
                                    </div>
                                    <div className="flex gap-0.5">
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i} className={clsx(
                                                "w-1.5 h-4 rounded-full transition-all",
                                                i < Math.floor(route.activityScore / 2)
                                                    ? "bg-gradient-to-t from-blue-500 to-blue-400 shadow-sm"
                                                    : "bg-gray-200 dark:bg-slate-600"
                                            )} />
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col items-center p-3 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl border border-yellow-100 dark:border-yellow-900/50 shadow-sm">
                                    <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-500 mb-1.5">
                                        <Lightbulb size={14} />
                                        <span className="text-[10px] uppercase font-bold">Lighting</span>
                                    </div>
                                    <div className="flex gap-0.5">
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i} className={clsx(
                                                "w-1.5 h-4 rounded-full transition-all",
                                                i < Math.floor(route.lightingScore / 2)
                                                    ? "bg-gradient-to-t from-yellow-500 to-yellow-400 shadow-sm"
                                                    : "bg-gray-200 dark:bg-slate-600"
                                            )} />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Weather Info */}
                            {route.weather && (
                                <div className="mb-4">
                                    <h5 className="text-[10px] text-gray-400 font-bold mb-2 uppercase tracking-wider">Weather Conditions</h5>
                                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-700">
                                        {/* Origin */}
                                        <div className="flex flex-col items-center p-2 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-100 dark:border-slate-600 min-w-[70px] flex-shrink-0">
                                            <span className="text-[10px] text-gray-400 font-bold mb-1 truncate max-w-full">Origin</span>
                                            <div className="flex items-center gap-1.5">
                                                {getWeatherIcon(route.weather.origin.code)}
                                                <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{route.weather.origin.temp}°</span>
                                            </div>
                                        </div>

                                        {/* Cities along route */}
                                        {route.weather.waypoints && route.weather.waypoints.length > 0 ? (
                                            route.weather.waypoints.map((wp, idx) => (
                                                <div key={idx} className="flex flex-col items-center p-2 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-100 dark:border-slate-600 min-w-[80px] flex-shrink-0">
                                                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold mb-1 truncate max-w-[75px]" title={wp.name}>
                                                        {wp.name.split(',')[0]}
                                                    </span>
                                                    <div className="flex items-center gap-1.5">
                                                        {getWeatherIcon(wp.data.code)}
                                                        <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{wp.data.temp}°</span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="flex flex-col items-center p-2 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-100 dark:border-slate-600 min-w-[70px] flex-shrink-0">
                                                <span className="text-[10px] text-gray-400 font-bold mb-1">Route</span>
                                                <span className="text-xs text-gray-400">--</span>
                                            </div>
                                        )}

                                        {/* Destination */}
                                        <div className="flex flex-col items-center p-2 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-100 dark:border-slate-600 min-w-[70px] flex-shrink-0">
                                            <span className="text-[10px] text-gray-400 font-bold mb-1 truncate max-w-full">Dest</span>
                                            <div className="flex items-center gap-1.5">
                                                {getWeatherIcon(route.weather.destination.code)}
                                                <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{route.weather.destination.temp}°</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Recommendation Reason */}
                            <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-xl p-3 border border-blue-100 dark:border-blue-900/30">
                                <p className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                                    <span className="text-blue-500 mt-0.5">💡</span>
                                    <span>
                                        <span className="font-bold text-gray-900 dark:text-gray-100">Why this route?</span>{' '}
                                        <span className="text-gray-600 dark:text-gray-400">{reason}</span>
                                    </span>
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
