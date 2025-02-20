"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const squeezepack_js_1 = require("./squeezepack.js");
const scores = new squeezepack_js_1.TinyPack();
scores.data = [30];
console.log(scores.at(0));
console.log(scores.data);
