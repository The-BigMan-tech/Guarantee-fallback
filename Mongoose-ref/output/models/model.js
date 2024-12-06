//!mongoose plugins,virtuals--ideal for computed or derived data,popuate for data that has references,validators,aggregation,transactions
//*Once you have learnt one,you have covered 60% of the rest
//*low level modules and high level ones.The high level abstracts away from the low level and is more declarative and expressive
//*http module--low level,express-high level
//*mongo db sriver low level,mongoose high level
//*best practice is not an enforcement
//*A model is a JS class that represents a mongo db collection.It has a name and a schema which togethr formas an interface for any data that will be stored in the collection
import mongoose, { Schema } from 'mongoose';
import { connectToDB } from '../database/connection.js';
connectToDB();
const sampleSchema = new Schema({
    name: {
        type: String,
        default: 'Default',
        unique: true,
        validate: {
            validator: (value) => /^[a-zA-Z]+$/.test(value),
            message: '{VALUE} is not a valid name'
        }
    },
    phoneNum: {
        type: Number,
        required: true
    }
});
export const sampleDB = mongoose.model('samples', sampleSchema);
sampleDB.create({ phoneNum: 1234567890 });
sampleDB.create({ name: 'person', phoneNum: 1234567890 });
sampleDB.find({ name: 'person' });
//*there are optional stuffs you can state for your schema
