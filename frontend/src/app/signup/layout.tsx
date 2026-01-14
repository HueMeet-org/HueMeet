import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Create an account | HueMeet",
};

export default function SignupLayout({
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