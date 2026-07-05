import { Typography } from 'heroui-native';
import { useEffect, useMemo, useRef, useState } from 'react';

type CountdownProps = {
    expiresAt: string | number | Date | null | undefined;
    prefix?: string;
    className?: string;
    onExpire?: () => void;
};

function toTimestamp(value: CountdownProps['expiresAt']): number | null {
    if (!value) return null;
    const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime();
    return Number.isFinite(timestamp) ? timestamp : null;
}

function formatRemaining(ms: number): string {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export default function Countdown({ expiresAt, prefix = 'Expires in', className, onExpire }: CountdownProps) {
    const expiryTimestamp = useMemo(() => toTimestamp(expiresAt), [expiresAt]);
    const [now, setNow] = useState(() => Date.now());
    const onExpireRef = useRef(onExpire);
    const remainingMs = expiryTimestamp ? Math.max(0, expiryTimestamp - now) : 0;

    useEffect(() => {
        onExpireRef.current = onExpire;
    }, [onExpire]);

    useEffect(() => {
        if (!expiryTimestamp) return;

        const update = () => {
            const nextRemaining = Math.max(0, expiryTimestamp - Date.now());
            setNow(Date.now());
            if (nextRemaining === 0) onExpireRef.current?.();
        };

        const timer = setInterval(update, 1000);
        return () => clearInterval(timer);
    }, [expiryTimestamp]);

    if (!expiryTimestamp || remainingMs <= 0) return null;

    return (
        <Typography className={className ?? 'text-xs text-warning'}>
            {prefix} {formatRemaining(remainingMs)}
        </Typography>
    );
}
