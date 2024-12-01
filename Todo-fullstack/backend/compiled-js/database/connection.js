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
        if (!database) {
            try {
                database = client.db('MY_DATABASE');
            }
            catch (err) {
                console.log("Database connection error: ", err);
            }
        }
        return database;
    });
}
export function closeConnectionToDB() {
    return __awaiter(this, void 0, void 0, function* () {
        yield client.close();
    });
}
