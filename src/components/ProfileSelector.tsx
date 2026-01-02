
import { DrivingProfile } from '../types';
import * as Icons from 'lucide-react';
import { clsx } from 'clsx';

interface ProfileSelectorProps {
    profiles: DrivingProfile[];
    selectedId: string;
    onSelect: (id: string) => void;
}

export function ProfileSelector({ profiles, selectedId, onSelect }: ProfileSelectorProps) {
    return (
        <div className="grid grid-cols-3 gap-3">
            {profiles.map((profile) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const Icon = (Icons as any)[profile.icon] || Icons.Car;
                const isSelected = selectedId === profile.id;

                return (
                    <button
                        key={profile.id}
                        onClick={() => onSelect(profile.id)}
                        className={clsx(
                            "flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-300 text-center hover:scale-105 active:scale-95 relative overflow-hidden group",
                            isSelected
                                ? "border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/40 shadow-lg ring-2 ring-blue-200 dark:ring-blue-800"
                                : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-slate-500 hover:shadow-md"
                        )}
                    >
                        {isSelected && (
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-400/10 dark:to-indigo-400/10"></div>
                        )}
                        <div className={clsx(
                            "p-3 rounded-xl mb-2 relative z-10 transition-all",
                            isSelected
                                ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md"
                                : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 group-hover:bg-blue-100 dark:group-hover:bg-slate-600 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                        )}>
                            <Icon size={22} strokeWidth={2.5} />
                        </div>
                        <div className="relative z-10">
                            <span className={clsx(
                                "block font-bold text-xs mb-1",
                                isSelected ? "text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300"
                            )}>
                                {profile.name.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] opacity-70 line-clamp-2 leading-tight dark:text-gray-400">
                                {profile.description}
                            </span>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
