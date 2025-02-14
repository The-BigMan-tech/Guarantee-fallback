import { ReactNode} from "react";
import Link from "next/link";

export default function ParallelLayout({slot_1,slot_2}:Readonly<Record<string,ReactNode>>) {
    const isAdmin:boolean = true
    return (
        <>
            <nav className="space-x-7">
                <Link href='/parallel/sloth'>Link to the sloth</Link>
                <Link href='/parallel'>Link to the parallel page</Link>
            </nav>
            {(isAdmin)?slot_1:slot_2}
        </>
    )
}