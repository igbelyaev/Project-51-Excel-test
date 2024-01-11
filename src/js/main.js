// "use strict";

import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';

const workbook = new Workbook();
const wbDescr = new Workbook();

let ws = undefined;
let wsDescr = undefined;
let newWs = undefined;


//________________________________________


const specsFile = document.querySelector('#specs-file');
const descrFile = document.querySelector('#descr-file');
const readBtn = document.querySelector('#read-btn');
const clearBtn = document.querySelector('#clear-btn');
const taskBtn = document.querySelector('.task_control');
const specList = document.querySelector('.tasks_list');
const messagesList = document.querySelector('.messages_list');
const processBtn = document.querySelector('#processing-btn');
const reloadBtn = document.querySelector('#reload-btn');
const inputs = document.querySelectorAll('input[type=file]');


inputs.forEach(input => {
    input.addEventListener('change', (e) => {
        let fileName = input.files[0].name;
        input.parentElement.lastElementChild.textContent = fileName;
    })
})


let file;
let fileName;
let specs = [];
let specsTemp = [];
const newLine = '\n';
const idParam = {id: ['id', 'Описание'],
                 code: ['Код', 'Описание номенклатуры']};
let codeId, descrId;


readBtn.addEventListener('click', (e) => {
    console.log("Event has happened");

    async function init() {
        file = specsFile.files[0];
        await readFile(file, workbook);
        
        file = descrFile.files[0];
        fileName = file.name;
        await readFile(file, wbDescr);
        
        const timeId = setTimeout(function() {
            wsDescr = workbook.addWorksheet('Descr');
            ws = workbook.worksheets[0];
            // ws = workbook.getWorksheet('TDSheet');
            newWs = wbDescr.worksheets[0];
            // newWs = wbDescr.getWorksheet('TDSheet');

            copySheet(newWs, wsDescr);

            checkIdParam(wsDescr);

            if (codeId == 'Код') {
                
                removeEmptyRows(ws);    
                removeEmptyRowsDescr(wsDescr);
            }

            
            const arrDescrCodeList = getArray(wsDescr, 'Описание');
            const arrSpecsCodeList = getArray(ws, 'Свойства');

            compareArrays(arrDescrCodeList, arrSpecsCodeList);

            specsTemp = getSpecsList();

            showSpecs(specsTemp, false);
            dragAndDrop();

                               
            

            console.log('inter stop');
            
        }, 500);


    };

    
    if (specsFile.files.length && descrFile.files.length) {

        init();
        e.target.disabled = true;
        messagesList.innerHTML = '';

    } else {
        messagesList.innerHTML += `
            <li class="error-message">Вы не выбрали файлы</li>
        `;
    }    

    

});



clearBtn.addEventListener('click', () => clearForm());

processBtn.addEventListener('click', (e) => {
    messagesList.innerHTML = '';
    processingArray(specsTemp, specs);
    writeSpecs(specs, newLine);
    mergeSkuInfo();
    writeData(workbook);
// }, {once: true});
});

reloadBtn.addEventListener('click', () => {
    showSpecs(specsTemp, true);
    dragAndDrop();
}, {once: true});
    
 
    

//_________functions________________________________________________


function clearForm() {
    
    inputs.forEach(input => {
        input.value = '';
        input.parentElement.lastElementChild.textContent = '';
        
    })

    codeId = '';
    descrId = '';

    ws = undefined;
    wsDescr = undefined;
    newWs = undefined;

    fileName = '';
    specs = [];
    specsTemp = [];

    specList.innerHTML = '';
    messagesList.innerHTML = '';
    taskBtn.classList.add('hidden');
    readBtn.disabled = false;


}



async function readFile(file, WB) {
    const reader = new FileReader();

    reader.readAsArrayBuffer(file);
    reader.onload = () => {
        const buffer = reader.result;
        WB.xlsx.load(buffer).then(WB => {
    
        })
    }

    
    
}


function copySheet(source, target) {
    source.eachRow((row, rowNumber) => {
        const newRow = target.getRow(rowNumber);
        row.eachCell((cell, colNumber) => {
            const newCell = newRow.getCell(colNumber)
            for(var prop in cell)
            {
                newCell[prop] = cell[prop];
            }
        })
    })  


}

function checkIdParam(worksheet) {
    
    let position = 0;

    for (let i=1; i < 12; i++) {
        const row = worksheet.getRow(i);
        
        for (let j=1; j < 10; j++) {

            if (row.getCell(j).value == 'Код') {

                [codeId, descrId] = idParam.code;
                return;
            } else if (row.getCell(j).value == 'id') {

                [codeId, descrId] = idParam.id;
                return;
            }
        }
        
    }

    if (!codeId && !descrId) {
        messagesList.innerHTML += `
            <li class="error-message">Программа не смогла найти колонку с идентификатором SKU. Ни по 'id', ни по 'Код'.</li>
        `;
    }
} 

function removeEmptyRows(worksheet) {

    let position = 0;

    next: for (let i=1; i < 12; i++) {
        const row = worksheet.getRow(i);
        
        for (let j=1; j < 10; j++) {

            if (row.getCell(j).value == 'Код') {

                position = i;
                break next;
            }
        }
        
    }

    worksheet.spliceRows(1, position-1);

    return worksheet;

}

function removeEmptyRowsDescr(worksheet) {

    let position = 0;

    next: for (let i=1; i < 12; i++) {
        const row = worksheet.getRow(i);
        
        for (let j=1; j < 10; j++) {

            if (row.getCell(j).value == 'Номенклатура') {

                position = i;
                break next;
            }
        }
        
    }

    if (position == 1) {

        let index;
        const row = worksheet.getRow(1);
        for (let i=1; i < 8; i++) {
                        
            if (row.getCell(i).value == descrId) {
    
                    index = i;
                    break;
            }
        }

        
        
        for (let i=2; i < 10; i++) {
            const row = worksheet.getRow(i);
            
            if (row.getCell(index).value) {
                index = i;
                break;
            }
                 
        }

        
        if (index - position > 1) {
            worksheet.spliceRows(2, index - 2);
        }

        
    }

    if (position > 1) {
        worksheet.spliceRows(1, position-1);
    }
   
    return worksheet;

}

function getArray(worksheet, fileName) {
    
    const row = worksheet.getRow(1);
    let index = undefined;
    const array = [];

    for (let i=1; i <= worksheet.columnCount; i++) {
        const cell = row.getCell(i);

        if (cell.value == codeId) {
            index = i;
        }
    }

    if (index == 'undefined') {

        messagesList.innerHTML += `
            <li class="error-message">В файле "${fileName}" колонки '${codeId}' не найдено</li>
        `;

        
        return
    }

    for (let i=2; i <= worksheet.rowCount; i++) {
        const cell = worksheet.getRow(i).getCell(index);
        
        if (cell.value !== null) array.push(cell.value);
            
    }

    function compareNum(a, b) {
        return a - b;
    }

    array.sort(compareNum);

    return array;

}

function compareArrays(array1, array2) {

    
    if (array1.length === array2.length && array1.every((value, index) => value === array2[index])) {
        
        messagesList.innerHTML += `
            <li class="info-message">Списки позиций в обоих файлах совпадают</li>
        `;
        
    } else {
        messagesList.innerHTML += `
            <li class="error-message">Внимание! Проверьте одинаковость списков позиций</li>
        `;
        
    }    
}

function getSpecsList() {
    
    const row = ws.getRow(1);
    let array = [];
    let repeatFlag = false;


    array = codeId == 'id' ? whiteTable() : colorTable();


    function colorTable() {
        const massive = [];

        for (let i=1; i <= ws.columnCount; i++) {
            const cell = row.getCell(i);
    
            if (cell.fill.bgColor && cell.value !== 'ед.изм.') {
    
                const neededCell = [cell.address, i, cell.value, 'false', 0, 'false'];
                if (!repeatFlag) {
    
                    if (row.getCell(i+1).value == 'ед.изм.') {
                        neededCell[3] = 'true';
    
                        if (row.getCell(i+2).value == cell.value) {
                            repeatFlag = i;
                            neededCell[4] = 1;
                        }
                        
                    } else if (cell.value == row.getCell(i+1).value) {
                        repeatFlag = i;
                        neededCell[4] = 1;
                    }
                } else {
                    neededCell[4] = repeatFlag;
                    if (row.getCell(i+1).value == 'ед.изм.') {
                        neededCell[3] = 'true';
    
                        if (row.getCell(i+2).value !== cell.value) {
                            repeatFlag = false;
                        }
                        
                    } else if (cell.value !== row.getCell(i+1).value) {
                        repeatFlag = false;
                    }
    
                }
    
                          
                
                massive.push(neededCell);
            }
    
        }
    
        return massive;
    }

    function whiteTable() {
        const massive = [];

        for (let i=1; i <= ws.columnCount; i++) {
            const cell = row.getCell(i);
            let value = cell.value;
    
            if (cell.value !== 'id' && cell.value !== 'Артикул' && cell.value !== 'Наименование' && !cell.value.includes('Часто ищут') && !cell.value.includes('Сленг')) {
                
                value = value.indexOf(',  (id') == -1 ? value.slice(0, value.indexOf(" (id")) : value.slice(0, value.indexOf(",  (id"));

                const neededCell = [cell.address, i, value, 'false', 0, 'false'];
                massive.push(neededCell);
            }
    
        }
    
        return massive;
    }

    return array;

}

function showSpecs(array, clear) {
    
    if (clear) specList.innerHTML = '';

    array = correctOrder(array);
    
    for (let i=0; i < array.length; i++) {

        if (array[i][4] < 2) {

            specList.innerHTML += `
                <li class="tasks_item">${array[i][2]}</li>  
            `;

        }

        
    }

    taskBtn.classList.remove('hidden');

    messagesList.innerHTML += `
            <li class="info-message">Расставьте характеристики справа в нужном порядке путем перетаскивания</li>
            <li class="info-message">Затем нажмите кнопку "Обработать список"</li>
            <li class="info-message">Кнопка "Сбросить порядок" позволит сбросить порядок характеристик в начальное состояние</li>
    `;
    
}

function correctOrder(massive) {

    const order = [['Тип товара', 0], ['Бренд', 1], ['Страна-производитель', massive.length - 1]]

    for (let i=0; i < order.length; i++) {
        for (let j=0; j < massive.length; j++) {
            if (order[i][0] == massive[j][2]) {

                if (order[i][1] < j) {
                    changeElements(order[i][1], j);
                    continue;
                }

                changeElements(j, order[i][1]);
                
            }
        }
    }

    
    function changeElements(current, old) {

        massive[old] = massive.splice(current,1, massive[old])[0];

        
        // also working:
        // massive[current] = [massive[old], massive[old] = massive[current]][0];

    }

    return massive;

}

function dragAndDrop() {
    const tasksListElement = document.querySelector(`.tasks_list`);
    const taskElements = tasksListElement.querySelectorAll(`.tasks_item`);

    // Перебираем все элементы списка и присваиваем нужное значение
    for (const task of taskElements) {
        task.draggable = true;
    }

    tasksListElement.addEventListener(`dragstart`, (evt) => {
        evt.target.classList.add(`selected`);
    })

    tasksListElement.addEventListener(`dragend`, (evt) => {
        evt.target.classList.remove(`selected`);
    });


    tasksListElement.addEventListener(`dragover`, (evt) => {
        // Разрешаем сбрасывать элементы в эту область
        evt.preventDefault();

        // Находим перемещаемый элемент
        const activeElement = tasksListElement.querySelector(`.selected`);
        // Находим элемент, над которым в данный момент находится курсор
        const currentElement = evt.target;
        // Проверяем, что событие сработало:
        // 1. не на том элементе, который мы перемещаем,
        // 2. именно на элементе списка
        const isMoveable = activeElement !== currentElement &&
              currentElement.classList.contains(`tasks_item`);

        // Если нет, прерываем выполнение функции
        if (!isMoveable) {
            return;
        }

        // evt.clientY — вертикальная координата курсора в момент,
        // когда сработало событие
        const nextElement = getNextElement(evt.clientY, currentElement);

        // Проверяем, нужно ли менять элементы местами
        if (
            nextElement && 
            activeElement === nextElement.previousElementSibling ||
            activeElement === nextElement
        ) {
            // Если нет, выходим из функции, чтобы избежать лишних изменений в DOM
            return;
        }

        tasksListElement.insertBefore(activeElement, nextElement);
            });
}

const getNextElement = (cursorPosition, currentElement) => {
  // Получаем объект с размерами и координатами
  const currentElementCoord = currentElement.getBoundingClientRect();
  // Находим вертикальную координату центра текущего элемента
  const currentElementCenter = currentElementCoord.y + currentElementCoord.height / 2;

  // Если курсор выше центра элемента, возвращаем текущий элемент
  // В ином случае — следующий DOM-элемент
  const nextElement = (cursorPosition < currentElementCenter) ?
      currentElement :
      currentElement.nextElementSibling;

  return nextElement;
};


function processingArray(oldArray, newArray) {
    const oderedList = specList.querySelectorAll('.tasks_item');

    for (let i=0; i < oderedList.length; i++) {
        const value = oderedList[i].textContent;
        
        for (let j=0; j < oldArray.length; j++) {

            if (value == oldArray[j][2]) {

                if (oldArray[j][4] == 0) { oldArray[j][5] = i;
                    
                } else if (oldArray[j][4] == 1) {
                    oldArray[j][5] = i;
                    for (let k=0; k < oldArray.length; k++) {
                        if (oldArray[k][2] == oldArray[j][2]) {
                            oldArray[k][5] = oldArray[j][5];
                        }
                    } 
               }

            }    
            
        }
    }

    
    for (let i=0; i < oldArray.length; i++) {
        
        for (let j=0; j < oldArray.length; j++) {
            if (i == oldArray[j][5]) {
                newArray.push(oldArray[j]);
            }
        }
    }


}



function writeSpecs(specs, newLine) {

    let numbeOfNewColumn = ws.columnCount + 1;
    let row = ws.getRow(1);
    let index;

    for (let j=1; j <= ws.columnCount; j++) {
        if (row.getCell(j) == codeId) index = j;
    }
       
    for (let j=2; j <= ws.rowCount; j++) {
        let specString = `Технические характеристики:${newLine}`;
        const row = ws.getRow(j);

        if (row.getCell(index).value == null) continue;

        for (let k=0; k < specs.length; k++) {
            const cell = row.getCell(specs[k][1]);

            if (specs[k][4] == 0) {

                if (cell.value == null) continue;
    
                specString += `${specs[k][2]}: ${cell.value} ${specs[k][3] == 'true' ? row.getCell(specs[k][1] + 1).value : ''}${newLine}`; 
                checkEmptyUnits(specs[k][3], row.getCell(specs[k][1] + 1).value, specs[k][2]);

            } else if (specs[k][4] == 1) {
                let subString = `${specs[k][2]}: `;

                if (cell.value !== null) subString += `${cell.value}${specs[k][3] == 'true' ? row.getCell(specs[k][1] + 1).value : ''}`;

                for (let i=1; i <= 10; i++) { 

                    if (specs[k+i][4] == specs[k][1]) {
                        if (row.getCell(specs[k+i][1]).value !== null) {
                            subString += `${subString.slice(-2) == ': ' ? row.getCell(specs[k+i][1]).value : '/' + row.getCell(specs[k+i][1]).value}`;
                            subString += `${specs[k+i][3] == 'true' ? ' ' + row.getCell(specs[k+i][1] + 1).value : ''}`;

                            checkEmptyUnits(specs[k+i][3], row.getCell(specs[k+i][1] + 1).value, specs[k+i][2]);
                        }
                    } else {break}
                }


                specString += `${subString.slice(-2) == ': ' ? '' : subString + newLine}`;

            } else if (specs[k][4] > 1) continue;

    
            
        }
    
        row.getCell(numbeOfNewColumn).value = specString;

        
    }

    function checkEmptyUnits(link, value, name) {
        
        if (link == 'true' && value == null) {
            messagesList.innerHTML += `
                <li class="error-message">Внимание! У свойства "${name}" не проставлена единица измерения. Программа в этом месте проставила "null"</li>
            `;

        }

    }
}

function mergeSkuInfo() {

    const specsField = {};
    let index;
    let indexDescr;
    let numbeOfNewColumn = wsDescr.columnCount + 1;
    let row = ws.getRow(1);

    for (let j=1; j <= ws.columnCount; j++) {
        if (row.getCell(j) == codeId) index = j;
    }

    for (let i=2; i <= ws.rowCount; i++) {
        const row = ws.getRow(i);
        
        specsField[row.getCell(index).value] = row.getCell(ws.columnCount).value;

    }

    
    row = wsDescr.getRow(1);
    for (let j=1; j <= ws.columnCount; j++) {
        if (row.getCell(j).value == codeId) index = j;
        if (row.getCell(j).value == descrId) indexDescr = j;
    }

    wsDescr.getColumn(index).width = 20;
    wsDescr.getColumn(indexDescr).width = 60;
    row.getCell(indexDescr).alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
    row.getCell(indexDescr).font = { name: 'Arial', size: 10 };
    // row.getCell(indexDescr).value = 'Итоговое описание';

    for (let k=2; k <= wsDescr.rowCount; k++) {
        const row = wsDescr.getRow(k);

        row.getCell(indexDescr).alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
        row.getCell(indexDescr).font = { name: 'Arial', size: 8 };
        row.getCell(indexDescr).value = `${row.getCell(indexDescr).value}\n\n${specsField[row.getCell(index)]}`;

    }

    messagesList.innerHTML += `
        <li class="info-message">Описание успешно соединено с характеристиками</li>
    
    `;

}

async function writeData(data) {

    workbook.removeWorksheet(ws.id);

    fileName = (fileName.slice(0, -5) + "_сборка" + '.xlsx');

    const buffer = await data.xlsx.writeBuffer();
    
    saveAs(new Blob([buffer]), fileName);

    messagesList.innerHTML += `
        <li class="info-message">Файл успешно сформирован</li>
    
    `;
} 

  

