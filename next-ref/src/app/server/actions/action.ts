'use server'

export async function createPage(Data:FormData) {
    const title = Data.get('title')
    console.log(`RECEIVED TITLE: ${title}`)
}
export async function echoInput(dat:string) {
    console.log('ECHOED INPUT DATA: ',dat)
} 