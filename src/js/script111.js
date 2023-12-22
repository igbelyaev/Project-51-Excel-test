// let fileName = 'description.xlsx';
let fileName = 'Рисунок ковра: ';

fileName = fileName.slice(-2);
console.log(fileName);


const arr = [2,1,3,5,4,0];

// arr[0] = [arr[1], arr[1] = arr[0]][0];

arr[1] = arr.splice(0,1, arr[1])[0];
// arr[0] = arr.splice(1,1, arr[0])[1];

console.log(arr);