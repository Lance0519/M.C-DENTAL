import { useEffect, useState, memo } from 'react';
import api from '@/lib/api';

type Occasion = 'none' | 'xmas' | 'cny' | 'newyear' | 'halloween' | 'valentines';

export const HolidayOverlay = memo(function HolidayOverlay() {
    const [occasion, setOccasion] = useState<Occasion>('none');

    useEffect(() => {
        let mounted = true;

        const fetchOccasion = async () => {
            try {
                const response = await api.getSettings();
                const responseData = (response as any)?.data ?? response;
                const data = typeof responseData === 'object' && responseData !== null
                    ? responseData as Record<string, string>
                    : {};

                if (mounted && data.active_occasion) {
                    setOccasion(data.active_occasion as Occasion);
                }
            } catch (err) {
                console.error('Error fetching holiday setting:', err);
            }
        };

        fetchOccasion();

        // Listen for settings modifications from the SettingsTab
        const handleSettingsUpdated = () => fetchOccasion();
        window.addEventListener('settingsUpdated', handleSettingsUpdated);

        // Poll for changes every minute
        const interval = setInterval(fetchOccasion, 60000);
        return () => {
            mounted = false;
            clearInterval(interval);
            window.removeEventListener('settingsUpdated', handleSettingsUpdated);
        };
    }, []);

    if (occasion === 'none') return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
            {occasion === 'xmas' && <ChristmasOverlay />}
            {occasion === 'cny' && <ChineseNewYearOverlay />}
            {occasion === 'newyear' && <NewYearOverlay />}
            {occasion === 'halloween' && <HalloweenOverlay />}
            {occasion === 'valentines' && <ValentinesOverlay />}
        </div>
    );
});

// Implementation of specific overlays
function ChristmasOverlay() {
    // Generate 50 snowflakes with random properties
    const snowflakes = Array.from({ length: 50 }).map((_, i) => {
        const size = Math.random() * 0.5 + 0.5; // 0.5vw to 1vw
        const left = Math.random() * 100; // 0 to 100vw
        const animationDuration = Math.random() * 10 + 10; // 10s to 20s
        const animationDelay = Math.random() * 10; // 0s to 10s
        const opacity = Math.random() * 0.5 + 0.3; // 0.3 to 0.8

        return (
            <div
                key={i}
                className="absolute rounded-full bg-white animate-snowfall blur-[1px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] dark:drop-shadow-none"
                style={{
                    width: `${size}vw`,
                    height: `${size}vw`,
                    left: `${left}vw`,
                    top: '-5vh',
                    opacity,
                    animationDuration: `${animationDuration}s`,
                    animationDelay: `${animationDelay}s`,
                }}
            />
        );
    });

    return <>{snowflakes}</>;
}

function ChineseNewYearOverlay() {
    // Generate 15 floating lanterns
    const lanterns = Array.from({ length: 15 }).map((_, i) => {
        const size = Math.random() * 2 + 3; // 3rem to 5rem
        const left = Math.random() * 100; // 0 to 100vw
        const animationDuration = Math.random() * 15 + 15; // 15s to 30s
        const animationDelay = Math.random() * 10; // 0s to 10s

        return (
            <div
                key={i}
                className="absolute animate-float-up opacity-80"
                style={{
                    left: `${left}vw`,
                    bottom: '0',
                    width: `${size}rem`,
                    height: `${size * 1.5}rem`,
                    animationDuration: `${animationDuration}s`,
                    animationDelay: `${animationDelay}s`,
                }}
            >
                <div className="w-full h-full bg-red-600 rounded-3xl relative overflow-hidden shadow-[0_0_20px_rgba(239,68,68,0.6)]">
                    <div className="absolute top-0 w-full h-2 bg-yellow-500"></div>
                    <div className="absolute bottom-0 w-full h-2 bg-yellow-500"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-yellow-500 font-bold opacity-50 text-2xl">福</div>
                </div>
            </div>
        );
    });

    return <>{lanterns}</>;
}

function NewYearOverlay() {
    // Generate 10 fireworks that burst at random intervals
    const fireworks = Array.from({ length: 10 }).map((_, i) => {
        const left = Math.random() * 80 + 10; // 10vw to 90vw
        const top = Math.random() * 40 + 10; // 10vh to 50vh
        const animationDelay = Math.random() * 5; // 0s to 5s
        const colors = ['bg-yellow-400', 'bg-blue-400', 'bg-red-400', 'bg-green-400', 'bg-purple-400', 'bg-pink-400'];
        const color = colors[Math.floor(Math.random() * colors.length)];

        return (
            <div
                key={i}
                className="absolute animate-firework-burst"
                style={{
                    left: `${left}vw`,
                    top: `${top}vh`,
                    animationDelay: `${animationDelay}s`,
                }}
            >
                {/* Simple firework burst using multiple rotated lines */}
                {Array.from({ length: 8 }).map((_, j) => (
                    <div
                        key={j}
                        className="absolute origin-bottom -ml-[2px]"
                        style={{
                            transform: `rotate(${j * 45}deg)`,
                            bottom: 0,
                            width: '4px',
                            height: '3rem',
                        }}
                    >
                        <div
                            className={`w-full h-full rounded-full ${color}`}
                            style={{
                                animation: `firework-particle 2s ease-out infinite ${animationDelay}s`
                            }}
                        />
                    </div>
                ))}
            </div>
        );
    });

    return <>{fireworks}</>;
}

function ValentinesOverlay() {
    // Generate 30 floating hearts
    const hearts = Array.from({ length: 30 }).map((_, i) => {
        const size = Math.random() * 1.5 + 1; // 1rem to 2.5rem
        const left = Math.random() * 100; // 0 to 100vw
        const animationDuration = Math.random() * 10 + 10; // 10s to 20s
        const animationDelay = Math.random() * 10; // 0s to 10s

        return (
            <div
                key={i}
                className="absolute animate-float-heart drop-shadow-md"
                style={{
                    left: `${left}vw`,
                    bottom: '0',
                    width: `${size}rem`,
                    height: `${size}rem`,
                    animationDuration: `${animationDuration}s`,
                    animationDelay: `${animationDelay}s`,
                }}
            >
                <div className="relative w-full h-full text-pink-500">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                </div>
            </div>
        );
    });

    return <>{hearts}</>;
}

function HalloweenOverlay() {
    // Generate 20 floating ghosts
    const ghosts = Array.from({ length: 20 }).map((_, i) => {
        const size = Math.random() * 2 + 2; // 2rem to 4rem
        const left = Math.random() * 100; // 0 to 100vw
        const animationDuration = Math.random() * 15 + 10; // 10s to 25s
        const animationDelay = Math.random() * 10; // 0s to 10s

        return (
            <div
                key={i}
                className="absolute animate-float-ghost drop-shadow-lg opacity-80"
                style={{
                    left: `${left}vw`,
                    bottom: '0',
                    width: `${size}rem`,
                    height: `${size}rem`,
                    animationDuration: `${animationDuration}s`,
                    animationDelay: `${animationDelay}s`,
                }}
            >
                <div className="relative w-full h-full text-white dark:text-gray-300">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        <path d="M12 2c-4.97 0-9 4.03-9 9v11h18V11c0-4.97-4.03-9-9-9zm-3 8c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm6 0c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z" />
                    </svg>
                </div>
            </div>
        );
    });

    return <>{ghosts}</>;
}
