import { Time } from "@internationalized/date";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const preservedEventNames = ["events"];

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

/// Generates a list of time intervals within a day.
export function listTimesByInterval(intervalInMinutes: number): Time[] {
    if (intervalInMinutes <= 0 || intervalInMinutes > 1440) {
        throw new Error("Interval must be between 1 and 1440 minutes.");
    }

    const timeList: Time[] = [];

    for (let totalMinutes = 0; totalMinutes < 1440; totalMinutes += intervalInMinutes) {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        timeList.push(new Time(hours, minutes));
    }

    return timeList;
}

/// Generates a list of time strings within a day.
export function generateTimeStrings(intervalInMinutes: number, use24h: boolean = false): string[] {
    if (intervalInMinutes <= 0 || intervalInMinutes > 1440) {
        throw new Error("Interval must be between 1 and 1440 minutes.");
    }

    const times: string[] = [];

    for (let totalMinutes = 0; totalMinutes < 1440; totalMinutes += intervalInMinutes) {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        if (use24h) {
            const hh = String(hours).padStart(2, "0");
            const mm = String(minutes).padStart(2, "0");
            times.push(`${hh}:${mm}`);
        } else {
            const period = hours < 12 ? "AM" : "PM";
            const hour12 = hours % 12 === 0 ? 12 : hours % 12;
            const mm = String(minutes).padStart(2, "0");
            times.push(`${hour12}:${mm} ${period}`);
        }
    }

    return times;
}

export type Cell = [number, number];

export function rectCellsArray(from: Cell, to: Cell): Cell[] {
    const minX = Math.min(from[0], to[0]);
    const maxX = Math.max(from[0], to[0]);
    const minY = Math.min(from[1], to[1]);
    const maxY = Math.max(from[1], to[1]);

    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    const total = width * height;

    const out = new Array<[number, number]>(total);
    let i = 0;
    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            out[i++] = [x, y];
        }
    }
    return out;
}

export function formatTime(time: Time): string {
    return `${time.hour}:${time.minute.toString().padStart(2, "0")}`;
}

export function parseTime(timeString: string): Time | null {
    const [hours, minutes] = timeString.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;
    return new Time(hours, minutes);
}
