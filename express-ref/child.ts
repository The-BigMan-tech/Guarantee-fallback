import express from 'express'
export const router = express.Router()

router.get('/',(request,response)=>{
    response.send('Child router')
})
