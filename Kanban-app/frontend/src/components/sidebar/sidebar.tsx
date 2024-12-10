'use client'
import tw from 'tailwind-styled-components'

const SideBarFlex = tw.aside`
    bg-[#2c2c38] text-white w-[20%] h-[40rem]
`
const BrandName = tw.h1`
    font-bold text-3xl
`
export default function SideBar() {
    return (
        <>
        <SideBarFlex>
            <BrandName>Kanban app</BrandName>
        </SideBarFlex>
        </>
    )
}