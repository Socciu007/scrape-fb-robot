// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('node:path')
const robot = require('robotjs');
const { fork } = require('child_process');
let robotProcess = null;  // 存储子进程的引用


function createWindow() {
  console.log('1111111111111111111111111111111111111111111111111111111222', process.versions);

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,  // 推荐启用上下文隔离
      nodeIntegration: false   // 禁用节点集成
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// IPC 事件监听
ipcMain.handle('robot-action', async (event, inputText, xxx, yyy) => {
  for (let index = 0; index < parseInt(inputText); index++) {

    robot.setMouseDelay(10);
    // robot.setMouseSpeed(2); // 设置鼠标移动速度为默认速度的两倍
    // robot.moveMouseSmooth(xxx, yyy);
    robot.moveMouse(xxx, yyy);
    // robot.mouseClick();
    // console.log(robot.getPixelColor(400, 120))
    // const screenSize = robot.getScreenSize();
    // console.log(screenSize);

    // 重复其他操作
    // process.send("Completed");

  }

  // const child = fork('./robotWorker.js', [inputText]);
  // return new Promise((resolve, reject) => {
  //   child.on('message', (msg) => {
  //     resolve(msg);
  //   });
  //   child.on('error', (err) => {
  //     reject(err);
  //   });
  // });
});


// ipcMain.handle('robot-action', async (event, inputText) => {
//   if (robotProcess) {
//     robotProcess.kill();  // 如果已有进程在运行，先结束它
//     robotProcess = null;
//   }
//   robotProcess = fork('./robotTask.js');
//   robotProcess.send({ inputText });
//   return new Promise((resolve, reject) => {
//     robotProcess.on('message', (result) => {
//       resolve(result);
//     });
//     robotProcess.on('error', reject);
//     robotProcess.on('exit', () => {
//       robotProcess = null;  // 清理引用
//       resolve("Process terminated.");
//     });
//   });
// });

// ipcMain.handle('stop-action', async () => {
//   if (robotProcess) {
//     robotProcess.kill();  // 发送信号终止子进程
//     robotProcess = null;
//     return "Stopped";
//   }
//   return "No process running.";
// });