// let fileName = 'description.xlsx';
let fileName = 'Рисунок ковра: ';

fileName = fileName.slice(-2);
console.log(fileName);


const arr = [2,1,3,5,4,0];

// arr[0] = [arr[1], arr[1] = arr[0]][0];

arr[1] = arr.splice(0,1, arr[1])[0];
// arr[0] = arr.splice(1,1, arr[0])[1];

console.log(arr);


const str = 'Диаметр кабеля,  (id:5c4b8dbe-2e4e-11eb-80cb-00155dfe250f)';
console.log(str.indexOf(",  (id"));
console.log(str.slice(0, str.indexOf(",  (id")));

const str1 = 'Размеры, см (id:0db3c53e-d603-11e8-80c2-00155dfe2b51)';
console.log(str1.indexOf(",  (id"));
console.log(str1.slice(0, str1.indexOf(",  (id")));