// renderer.js

// renderer.js

// 获取从主进程暴露的 robot 模块
const { remote } = require('electron');
const robot = remote.getGlobal('robot');

async function submitText() {
    var inputText = parseInt(document.getElementById("inputText").value);
    var xxx = parseInt(document.getElementById("xxx").value);
    var yyy = parseInt(document.getElementById("yyy").value);
    console.log(inputText, 'Input times');

    try {
        const response = await electronAPI.submitText(inputText, xxx, yyy);
        console.log('Operation completed:这是什么', response);
    } catch (err) {
        console.error('Failed to execute robot actions:', err);
    }


}