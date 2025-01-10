import {z} from 'zod';

export const userSchema = z.object({
    name:z.string().min(1,'Your name is required'),
    email:z.string().email('Your email is invalid')
})
export type userDTO = z.infer<typeof userSchema>