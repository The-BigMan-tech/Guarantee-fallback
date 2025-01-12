import {z} from 'zod';

export const sampleSchema = z.object({
    username:z.string().min(1,'You must type a username'),
    userpassword:z.string().min(1,'You must type in a password')
})
export type sampleDTO = z.infer<typeof sampleSchema>