import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Discover Users | HueMeet",
};

export default function DiscoverLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="left-0 w-full h-full">
            {children}
        </div>
    );
}