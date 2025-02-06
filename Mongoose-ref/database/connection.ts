import mongoose from 'mongoose';

export async function connectToDB() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/MongoData')
        console.log("Database connection is successful");
    }catch(err) {
        console.log("Database connection error:",err);
        process.exit(1)
    }
}
export async function closeConnectionToDB() {
    mongoose.connection.close()
}