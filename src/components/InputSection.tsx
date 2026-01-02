import { useState } from 'react';
import { MapPin, Navigation, X, Search } from 'lucide-react';

interface InputSectionProps {
    onSearch: (source: string, destination: string) => void;
    isLoading: boolean;
}

export function InputSection({ onSearch, isLoading }: InputSectionProps) {
    const [source, setSource] = useState('');
    const [destination, setDestination] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (source && destination) {
            onSearch(source, destination);
        }
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
                    {source && (
                        <button
                            type="button"
                            onClick={() => setSource('')}
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                        >
                            <X size={18} />
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
