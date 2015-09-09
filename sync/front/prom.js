
export default fn => new Promise((res, rej) => fn((err, val) => err ? rej(err) : res(val)));

