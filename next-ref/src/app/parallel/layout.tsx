import { ReactNode } from "react";

export default function RootLayout({children,destroy,create}:
    Readonly<{children:ReactNode,destroy:ReactNode,create:ReactNode}>) {
    return (
        <>
            {children}
            {destroy}
            {create}
        </>
    );
}