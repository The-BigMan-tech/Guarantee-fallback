import express from 'express'
import db from '../db/conn.js'
export const routine = express.Router()

routine.get('/',async (req,res)=>{
    const collection = db.collection('users')
    const result = await collection.find({}).limit(10).toArray()
    res.status(200).json(result)
})