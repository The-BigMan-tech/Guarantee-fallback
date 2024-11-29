var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
//*I changed the output directpry of all my js files to the compiled-js folder to free my code from all the compiled js clutter and i also changed the icon of the folder.
import express from 'express';
import { getFood } from './database/food-db.js';
const app = express();
app.use(express.json());
app.get('/pixel', (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield getFood('CraftyNinja');
    response.json(data);
}));
app.listen(4000, () => console.log('Connection successful.Listening on port 4000'));
