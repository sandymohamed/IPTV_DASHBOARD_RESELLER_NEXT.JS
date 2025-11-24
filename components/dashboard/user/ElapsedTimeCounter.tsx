'use client';

import { useState, useEffect } from 'react';

interface ElapsedTimeCounterProps {
    dateStart: number;
}

export default function ElapsedTimeCounter({ dateStart }: ElapsedTimeCounterProps) {
    const [elapsedTime, setElapsedTime] = useState<number>(0);

    useEffect(() => {
        const interval = setInterval(() => {
            const currentTimestamp = Math.floor(Date.now() / 1000); // Convert milliseconds to seconds
            const elapsed = currentTimestamp - dateStart;
            setElapsedTime(elapsed);
        }, 1000); // Update elapsed time every second

        return () => clearInterval(interval); // Cleanup function to clear the interval
    }, [dateStart]);

    // Function to format elapsed time into a human-readable format
    function formatTime(seconds: number): string {
        const days = Math.floor(seconds / (24 * 60 * 60));
        const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((seconds % (60 * 60)) / 60);
        const remainingSeconds = seconds % 60;
        if (days > 0) {
            return `${days} d: ${hours} h`;
        }
        if (hours > 0) {
            return `${hours} h: ${minutes} m`;
        }
        return `${minutes} m: ${remainingSeconds} s`;
    }

    return (
        <div>
            <small>{formatTime(elapsedTime)}</small>
        </div>
    );
}
