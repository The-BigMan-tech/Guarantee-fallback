var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
//@ts-ignore
import { MongoClient } from 'mongodb';
const client = new MongoClient("mongodb://localhost:27017/");
let database;
export function connectToDB() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!database)
                database = client.db('MY_DATABASE');
            return database;
        }
        catch (error) {
            console.log(`Database connection error: ${error}`);
        }
    });
}
export function returnCollection(name) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = yield connectToDB();
        const collections = yield db.listCollections({ name: name }).toArray();
        if (!collections.length)
            return yield db.createCollection(name);
        return yield db.collection(name);
    });
}
export function returnLastDocument(collection, query) {
    return __awaiter(this, void 0, void 0, function* () {
        return collection.find(query).sort({ _id: -1 }).limit(1).toArray();
    });
}
export function closeConnectionToDB() {
    return __awaiter(this, void 0, void 0, function* () {
        yield client.close();
    });
}
