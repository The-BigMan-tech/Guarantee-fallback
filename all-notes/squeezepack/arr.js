"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const squeezepack_js_1 = require("./squeezepack.js");
const scores = new squeezepack_js_1.TinyPack();
scores.data = [111111111111];
scores.compress();
scores.push(100000000000);
scores.push(13);
console.log(scores.at(1));
