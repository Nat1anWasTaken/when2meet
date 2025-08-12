import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

import { Time } from "@internationalized/date";

export function listTimesByInterval(intervalInMinutes: number): Time[] {
    if (intervalInMinutes <= 0 || intervalInMinutes > 1440) {
        throw new Error("Interval must be between 1 and 1440 minutes.");
    }

    const timeList: Time[] = [];

    for (let totalMinutes = 0; totalMinutes <= 1440; totalMinutes += intervalInMinutes) {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        timeList.push(new Time(hours, minutes));
    }

    return timeList;
}

export function formatTime(time: Time): string {
    return `${time.hour}:${time.minute.toString().padStart(2, "0")}`;
}

export function parseTime(timeString: string): Time | null {
    const [hours, minutes] = timeString.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;
    return new Time(hours, minutes);
}
