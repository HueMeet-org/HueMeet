"use client";

export function ChatDateSeparator({ date }: { date: string }) {
    return (
        <div className="flex items-center justify-center my-4">
            <span className="px-3 py-1 rounded-full bg-muted text-[11px] font-medium text-muted-foreground select-none shadow-sm">
                {formatDateSeparator(date)}
            </span>
        </div>
    );
}

function formatDateSeparator(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msgDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    );
    const diff = today.getTime() - msgDate.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return date.toLocaleDateString([], { weekday: "long" });
    return date.toLocaleDateString([], {
        month: "long",
        day: "numeric",
        year:
            date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
}
