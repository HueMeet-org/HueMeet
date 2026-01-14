import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Get started | HueMeet",
};

export default function SetupLayout({
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