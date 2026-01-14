import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Login | HueMeet",
};

export default function LoginLayout({
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