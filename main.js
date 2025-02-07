// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron')
const path = require('node:path')
const robot = require('robotjs');
const { fork } = require('child_process');
let robotProcess = null;  // 存储子进程的引用

const ACCOUNT = {
  'shanghaifanyuan613@gmail.com': 'Fago1618@',
  'fanyuanmy@gmail.com': 'Damonbnh_123',
  'shanghaifangyuanvn@gmail.com': 'Damonbnh_8',
  'fanyuanshanghai@gmail.com': 'Damonbnh_8', // Password incorrect
  'darthub88@gmail.com': 'Damonbnh_123',
  'eternityy188@gmail.com': 'Damonbnh_123', // Change password
  '8562056522584': 'Tao56658838',
  '0899801832': 'lexi251102',
  'nyrinsfyf23@gmail.com': 'Quynhnhu1205@',
  'lucysfyf@gmail.com': 'Lucu2408@',
  'Natalie@sfyf.cn': 'Aa123456@' // Password incorrect
};

function createWindow() {
  console.log('robotjs version: ', process.versions);

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    x: 0,
    y: 0,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
  })

  // and load the facebook of the app.
  mainWindow.loadURL('https://www.facebook.com/groups/nqvuong72')

  // Open the DevTools. (Ctr + Shift + I)
  // mainWindow.webContents.openDevTools()

  mainWindow.webContents.on('did-finish-load', async () => {
    await delay(3000);
    // mainWindow.webContents.openDevTools();
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  // Register keyboard shortcuts to close browser windows when necessary
  // Windown close when press Control+Shift+E
  globalShortcut.register('CommandOrControl+Shift+E', () => {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach(window => {
      window.close();
    });
  });

  // Get mouse position when press CommandOrControl+L
  globalShortcut.register('CommandOrControl+L', () => {
    const mousePos = robot.getMousePos();
    console.log('Mouse position:', mousePos);
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send('mouse-position', mousePos);
    });
  });

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

// Close global shortcuts when the app is about to quit
// Avoid the situation where the application cannot re-register the shortcut if reopened without first releasing resources.
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// Function to delay the execution of the code
async function delay(time) {
  await new Promise(resolve => setTimeout(resolve, time));
}

// Execute action on the app browser
async function executeAction(action, delayTime) {
  robot.moveMouse(action.x, action.y);
  switch (action.type) {
    case 'click':
      robot.mouseClick();
      break;
    case 'text':
      clipboard.writeText(action.content);
      if (process.platform === 'darwin') {
        robot.keyToggle('command', 'down');
        robot.keyTap('v');
        robot.keyToggle('command', 'up');
      } else {
        robot.keyToggle('control', 'down');
        robot.keyTap('v');
        robot.keyToggle('control', 'up');
      }
      break;
    case 'enter':
      robot.keyTap('enter');
      break;
  }

  await delay(delayTime);
}

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