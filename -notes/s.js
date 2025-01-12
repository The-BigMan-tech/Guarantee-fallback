function compressSequence(sequence,delimeter) {
    let char_array = sequence.split(delimeter)
    let compressed_object = {}
    for (let v of char_array) {
        compressed_object[v] = 0
    }
    for (let num of char_array) {
        compressed_object[num] += 1
    }
    return compressed_object
}
let seq = 'A:A:A:A:A:A:B:BCC:DDEE:FF112:2:2:2'
let delimeter = ':'
console.log(compressSequence(seq,delimeter));

