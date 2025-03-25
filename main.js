// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, globalShortcut, clipboard, session } = require('electron')
const path = require('node:path')
const robot = require('robotjs');
const axios = require('axios');
const jsQR = require('jsqr');
// const { fork } = require('child_process');
// let envRenderer = {};  // Store the reference of the data in renderer process

async function main() {
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
      contextIsolation: true,
      session: session.fromPartition('persist:shanghaifanyuan613@gmail.com')
    },
  })

  // Load the index.html in project of the desktop app.
  await mainWindow.loadFile('index.html')

  // IPC event listener (Listen data from renderer process)
  ipcMain.handle("data-input", async (event, data) => {
    console.log("Received data from renderer: ", data);
    // await mainWindow.setBounds({ x: -2000, y: -2000, width: 1200, height: 600 });

    const task1 = async (data) => {
      const window1 = await createWindow({ width: 1200, height: 600, x: 0, y: 200, sessionName: data.account })
      if (!window1) return;

      // Load the url of the facebook (Login FB)
      await window1.loadURL('https://www.facebook.com/messages/t')

      // Get the url of the message
      await delay(20000)
      // await executeAction({ type: 'click', x: 185, y: 546 });
      // await delay(3000)
      await window1.webContents.executeJavaScript(scrapeDataFromMessagePage(data.account))

      // Close the window
      // window1.close();
    }

    const runTask1 = data.map(async (item) => {
      await task1(item)
      return
    })

    // Task main: Crawl data from group page with keyword='zalo'
    const runTaskMain = async () => {
      // Load the url of the facebook (Login FB)
      await mainWindow.loadURL('https://www.facebook.com/')

      // Check login status
      const isLogin = await mainWindow.webContents.executeJavaScript(checkLoginFacebook)
      if (!isLogin) {
        await delay(100000)
        await mainWindow.close()
        return
      };

      // Loop fetch group data by page
      const hasGroupData = true
      let page = 0
      while (hasGroupData) {
        const urlGroupData = await fetchGroupData(page) // Call the function to fetch group data
        console.log('Page: ', page + 1)
        if (!urlGroupData) break

        for (const url of urlGroupData) {
          let urlAccess = url
          // Load the url of the group facebook
          if (urlAccess.includes('share')) {
            await mainWindow.loadURL(urlAccess)
            urlAccess = mainWindow.webContents.getURL().split('?')[0].split('#')[0]
          }
          console.log('url: ', urlAccess)
          if (!urlAccess.includes('https://www.facebook.com')) continue;
          await mainWindow.loadURL(`${urlAccess.replace(/\/$/, "")}/search?q=zalo`)
          await delay(5000)

          // Scrape data from browser
          const data = await mainWindow.webContents.executeJavaScript(scrapeDataFromBrowser)
          if (!!data?.length) {
            // Check QR code from url
            const dataNew = await Promise.all(data.map(async (item) => {
              if (!item?.urlZalo) return item;
              const isQRCode = await checkQRCodeFromUrl(item?.urlZalo)
              if (isQRCode?.isQRCode) {
                return item
              }
              return { ...item, urlZalo: '' }
            }))
            const saveData = await saveDataToDatabase(JSON.stringify(dataNew))
            console.log('saveDataZalo: ', saveData)
            const transformData = await transformDataByChatgpt()
            console.log('transformDataZalo: ', transformData)
          }

          await delay(1000) // Wait for 10 seconds
        }
        page++
      }

      // Load the index.html in project of the desktop app.
      await mainWindow.loadFile('index.html')
    }

    // Task 2: Crawl data from group page
    const task2 = async () => {
      // Load the url of the facebook (Login FB)
      await mainWindow.loadURL('https://www.facebook.com/')

      // Loop fetch group data by page
      const hasGroupData = true
      let page = 0
      while (hasGroupData) {
        const urlGroupData = await fetchGroupData(page) // Call the function to fetch group data
        console.log('Page: ', page + 1)
        if (!urlGroupData) break

        for (const url of urlGroupData) {
          console.log('url: ', url)
          if (!url.includes('https://www.facebook.com')) continue;
          await mainWindow.loadURL(url)
          await delay(3000)

          // Scrape data from browser
          const data = await mainWindow.webContents.executeJavaScript(scrapeDataFromGroupPage())
          if (!!data?.length) {
            const saveData = await saveDataToDatabase(JSON.stringify(data))
            console.log('saveDataGroup: ', saveData)
            const transformData = await transformDataByChatgpt()
            console.log('transformData: ', transformData)
          }

          await delay(1000) // Wait for 10 seconds
        }
        page++
      }

      // Load the index.html in project of the desktop app.
      await mainWindow.loadFile('index.html')
    }

    await Promise.all([runTaskMain(), runTask1])
  });

  // Open the DevTools. (Ctr + Shift + I)
  // mainWindow.webContents.openDevTools()

  mainWindow.webContents.on('did-finish-load', async () => {
    await delay(3000);
    // mainWindow.webContents.openDevTools();
  });
}

// Create the browser window
async function createWindow({ width, height, x, y, sessionName }) {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width,
    height,
    x,
    y,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      session: session.fromPartition(`persist:${sessionName}`)
    },
  })

  return mainWindow;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  main();

  // Register keyboard shortcuts to close browser windows when necessary
  // App electron close when press CommandOrControl+Shift+E
  globalShortcut.register('CommandOrControl+Shift+E', () => {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach(window => {
      window.close();
    });
  });

  // Get mouse position when press CommandOrControl+P
  globalShortcut.register('CommandOrControl+P', () => {
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

// Function to check login facebook
const checkLoginFacebook = `(async () => {
  const delay = async (time) => {
    await new Promise(resolve => setTimeout(resolve, time));
  }
  try {
    const mail = document?.querySelector('#email')
    const pw = document?.querySelector('#pass')
    if (mail && pw) {
      mail.value = 'shanghaifanyuan613@gmail.com'
      pw.value = 'Fago1618@'
    } else {
      return true
    }
    await delay(1000)
    const btnLogin = document?.querySelector('button[name="login"]')
    await delay(1000)
    btnLogin.click()
    return true
  } catch (error) {
    console.log('Error checking login facebook: ', error);
    return false
  }
})()`

// Execute action on the app browser
async function executeAction(action, delayTime = 1000) {
  robot.moveMouse(action.x, action.y);
  switch (action.type) {
    case 'click':
      robot.mouseClick();
      break;
    case 'paste':
      console.log('action function: ', action)
      robot.keyTap('v', ['control']);
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

// Fetch the data (group facebook data) from the server CRM
async function fetchGroupData(page) {
  try {
    // Fetch data from server
    const response = await axios.get(`https://www.dadaex.cn/api/crm/groupChat/getGroupListVn?page=${page}&active=&name=&user=&account=&qq=&createTime=&scren=fanyuan`);

    // Check if fetch data error or group data is empty
    if (response?.data?.status !== 200 || !response?.data?.data?.data?.length) return false;

    // Filter the data by platform Facebook
    const groupFbData = response?.data?.data?.data?.filter((g) => g?.platform === 'Facebook');

    // Map the data to get the url of the group facebook
    const urlGroupArr = groupFbData?.map((g) => g?.account?.replace('/members', ''));

    return urlGroupArr;
  } catch (error) {
    console.error('Error fetching group data: ', error.message);
    return false;
  }
}

// Call api to save data to database (ebvn2)
async function saveDataToDatabase(data) {
  try {
    const response = await axios.post('https://vn2.dadaex.cn/api/moneyapi/saveDataFacebook', { data: data });
    return response?.data;
  } catch (error) {
    console.log('Error saving data to database: ', error);
    return false;
  }
}

// Function to check QR code from url
async function checkQRCodeFromUrl(imageUrl) {
  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const image = await Jimp.read(response.data);

    // Convert image to Uint8ClampedArray (RGBA)
    const imageData = new Uint8ClampedArray(image?.bitmap?.data);

    // Perform QR code scanning using jsQR
    const code = jsQR(imageData, image.bitmap.width, image.bitmap.height);

    if (code) {
      return { isQRCode: true, data: code.data };
    } else {
      return { isQRCode: false, data: null };
    }
  } catch (error) {
    return { isQRCode: false, data: null, error: error.message };
  }
}

// Call api to transform data to data useful (ebvn2)
async function transformDataByChatgpt() {
  try {
    const response = await axios.post('https://vn2.dadaex.cn/api/moneyapi/transformRawFb', { page: 1 });
    return response?.data;
  } catch (error) {
    console.log('Error transforming data: ', error);
    return false;
  }
}

// Function to scrape the data from the browser (group page wiyh keyword='zalo')
const scrapeDataFromBrowser = `(async () => {
  const delay = async (time) => {
    await new Promise(resolve => setTimeout(resolve, time));
  }
  try {
    await delay(1000)
    const documentPage = document?.querySelector('.x193iq5w.x1xwk8fm')
    // console.log('documentPage: ', documentPage)
    if (!documentPage) return [] // If the documentPage is not found, return an empty array

    // Get text of group name
    await delay(1000)
    const elementGroupName = document?.querySelector('div.x9f619.x1ja2u2z.x78zum5.x2lah0s.x1n2onr6.x1qughib.x6s0dn4.xozqiw3.x1q0g3np.x1sy10c2.xktsk01.xod5an3.x1d52u69 > div > div > div > div > div:nth-child(2) > span > span')?.textContent
    const groupName = elementGroupName?.split(' ')?.slice(1)?.join(' ')

    await delay(1000)
    let elementArr = documentPage?.querySelectorAll('.x1yztbdb.x1n2onr6.xh8yej3.x1ja2u2z')
    // console.log('elementArr: ', elementArr.length)
    if (!elementArr || !elementArr.length) return [] // If the elementArr is not found or empty, return an empty array

    let data = []
    for (let i = 0; i < elementArr.length; i++) {
      await delay(1000)
      // Scroll to the element ith
      elementArr[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });

      await delay(1000)
      const btnSeeMore = elementArr[i]?.querySelector('.x1i10hfl.xjbqb8w.x1ejq31n.xd10rxx.x1sy0etr.x17r0tee.x972fbf.xcfux6l.x1qhh985.xm0m39n.x9f619.x1ypdohk.xt0psk2.xe8uvvx.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x16tdsg8.x1hl2dhg.xggy1nq.x1a2a7pz.x1sur9pj.xkrqix3.xzsf02u.x1s688f[role="button"]')
      if (btnSeeMore) {
        btnSeeMore.scrollIntoView({ behavior: 'smooth', block: 'center' });
        btnSeeMore.click()
        await delay(1000)
      }

      // Scrape text content of the element
      await delay(1000)
      let textContent = elementArr[i]?.querySelector('.x1yx25j4.x13crsa5.x1rxj1xn.xxpdul3.x6x52a7')?.textContent
      if (!textContent) textContent = elementArr[i]?.querySelector('.html-div.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.x1l90r2v.x1pi30zi.x1swvt13.x1iorvi4')?.textContent
      if (!textContent) textContent = elementArr[i]?.querySelectorAll('span[dir="auto"].x193iq5w.xeuugli.x13faqbe.x1vvkbs.x1xmvt09.x1lliihq.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.xudqn12.x3x7a5m.x6prxxf.xvq8zen.xo1l8bm.xzsf02u.x1yc453h')[2]?.textContent
      if (!textContent) textContent = elementArr[i]?.querySelectorAll('span[dir="auto"].x193iq5w.xeuugli.x13faqbe.x1vvkbs.x1xmvt09.x1lliihq.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.xudqn12.x3x7a5m.x6prxxf.xvq8zen.xo1l8bm.xzsf02u.x1yc453h')[1]?.textContent
      if (!textContent) textContent = elementArr[i]?.querySelectorAll('span[dir="auto"].x193iq5w.xeuugli.x13faqbe.x1vvkbs.x1xmvt09.x1lliihq.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.xudqn12.x3x7a5m.x6prxxf.xvq8zen.xo1l8bm.xzsf02u.x1yc453h')[0]?.textContent
      if (!textContent) textContent = elementArr[i]?.querySelector('.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.x1vvkbs.x126k92a')?.textContent
      const textAccount = elementArr[i]?.querySelector('.html-h3')?.textContent || ''
      const textIdAccount = elementArr[i]?.querySelector('.html-h3 a')?.href?.split('/')[6] || ''
      await delay(1000)
      const elementUrlContent = elementArr[i]?.querySelectorAll('span:nth-child(1) > span > span > a[role="link"]')[2] ||
        elementArr[i]?.querySelector('div > span:nth-child(1) > span > a')
      const elementShare = elementArr[i]?.querySelector('div.html-div.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd > div > div > div:nth-child(4) > div > div > div > div > div.xq8finb.x16n37ib > div > div:nth-child(4) > div > div.x9f619.x1ja2u2z.x78zum5.x1n2onr6.x1r8uery.x1iyjqo2.xs83m0k.xeuugli.xl56j7k.x6s0dn4.xozqiw3.x1q0g3np.xn6708d.x1ye3gou.xexx8yu.xcud41i.x139jcc6.x4cne27.xifccgj.xn3w4p2.xuxw1ft > div:nth-child(1) > i')
      let textUrlContent = ''
      if (elementUrlContent || elementShare) {
        await elementUrlContent?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await elementUrlContent?.focus()
        console.log('elementUrlContent: ', elementUrlContent?.href?.split('?')[0])
        if (elementShare) {
          await elementShare.scrollIntoView({ behavior: 'smooth', block: 'center' });
          await elementShare.click()
          await delay(1000)
          const elementCopy = document?.querySelector('div.x1uvtmcs.x4k7w5x.x1h91t0o.x1beo9mf.xaigb6o.x12ejxvf.x3igimt.xarpa2k.xedcshv.x1lytzrv.x1t2pt76.x7ja8zs.x1n2onr6.x1qrby5j.x1jfb8zj > div > div > div > div > div > div > div.xb57i2i.x1q594ok.x5lxg6s.x78zum5.xdt5ytf.x6ikm8r.x1ja2u2z.x1pq812k.x1rohswg.xfk6m8.x1yqm8si.xjx87ck.xx8ngbg.xwo3gff.x1n2onr6.x1oyok0e.x1odjw0f.x1iyjqo2.xy5w88m > div.x78zum5.xdt5ytf.x1iyjqo2.x1n2onr6.xaci4zi.x129vozr > div > div > div > div:nth-child(6) > div > div > div > div > div > div:nth-child(3) > div > div.x1n2onr6.x1ja2u2z.x9f619.x78zum5.xdt5ytf.x193iq5w.x1l7klhg.x1iyjqo2.xs83m0k.x2lwn1j.x1y1aw1k.xwib8y2 > div > div:nth-child(1) > div > i');
          if (elementCopy) {
            elementCopy.addEventListener("click", async () => {
              try {
                textUrlContent = await navigator.clipboard.readText();
                console.log("Content copied: ", textUrlContent);
              } catch (err) {
                console.log("Error copying content: ", err);
              }
            })
            await elementCopy.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await elementCopy.click()
            await delay(1000)
            // await window.electronBridge.requireAction('paste')
          }
        }
        await delay(1000)
        textUrlContent = textUrlContent || (elementUrlContent?.href?.split('?')[0].includes('/search') ? elementUrlContent?.href?.split('?')[0].replace('/search', '') : elementUrlContent?.href?.split('?')[0])
      }
      console.log('textUrlContent: ', textUrlContent)
      const urlImg = elementArr[i]?.querySelector('a > div.x6s0dn4.x1jx94hy.x78zum5.xdt5ytf.x6ikm8r.x10wlt62.x1n2onr6.xh8yej3 > div > div > div > img')?.src ||
        elementArr[i]?.querySelector('a > div.html-div.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x6ikm8r.x10wlt62 > div.xqtp20y.x6ikm8r.x10wlt62.x1n2onr6 > div > img')?.src || null

      if (textContent && (textContent.toLowerCase().includes('Zalo'.toLowerCase()) || textContent.includes('𝐙𝐚𝐥𝐨'))) {
        data.push({ content: textContent, group: groupName, account: textAccount, idAccount: textIdAccount, crawlBy: 'shanghaifanyuan613@gmail.com', userId: 2, type: 'comment', urlContent: textUrlContent, urlZalo: urlImg })
      }

      if (i < 25 || data.length < 25) {
        await delay(2000)
        elementArr = documentPage?.querySelectorAll('.x1yztbdb.x1n2onr6.xh8yej3.x1ja2u2z')
      } else {
        break
      }

      console.log('data: ', data.length)
    }

    // Remove duplicate comment and add field contactUs
    data = data.filter((item, index, self) =>
      index === self.findIndex((c) => c.content === item.content)
    ).map((c) => {
      const contactUs = Array.from(new Set(c?.content?.match(/\\+?\\d{1,3}(?:[.\\s]?\\d{1,4})+|\\b0\\d{9}\\b/g)
        ?.filter((num, index, self) =>
          self.indexOf(num) === index && num.replace(/\\D/g, '').length >= 9
        ) || []))
        ?.join(', ') || '';
      return { ...c, contactUs };
    })

    return data
  } catch (error) {
    console.log('Error scraping data from browser: ', error)
    return []
  }
})()`

// Function to scrape the data from the browser (group page)
const scrapeDataFromGroupPage = () => {
  return `(async () => {
    const delay = async (time) => {
      await new Promise(resolve => setTimeout(resolve, time));
    }
    try {
      await delay(1000)
      const documentPage = document?.querySelector('div[role="feed"]')
      console.log('documentPage: ', documentPage)
      if (!documentPage) return [] // If the documentPage is not found, return an empty array

      // Get text of group name
      await delay(1000)
      const groupName = document?.querySelector('.x1e56ztr.x1xmf6yo > [dir="auto"] > span[dir="auto"] > a[role="link"]')?.textContent
      // const groupName = elementGroupName?.split(' ')?.slice(1)?.join(' ')

      await delay(1000)
      let elementArr = documentPage?.querySelectorAll('.x1yztbdb.x1n2onr6.xh8yej3.x1ja2u2z')
      // console.log('elementArr: ', elementArr.length)
      if (!elementArr || !elementArr.length) return [] // If the elementArr is not found or empty, return an empty array

      let data = []
      for (let i = 0; i < elementArr.length; i++) {
        await delay(1000)
        // Scroll to the element ith
        elementArr[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });

        await delay(1000)
        const btnSeeMore = elementArr[i]?.querySelector('.x1i10hfl.xjbqb8w.x1ejq31n.xd10rxx.x1sy0etr.x17r0tee.x972fbf.xcfux6l.x1qhh985.xm0m39n.x9f619.x1ypdohk.xt0psk2.xe8uvvx.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x16tdsg8.x1hl2dhg.xggy1nq.x1a2a7pz.x1sur9pj.xkrqix3.xzsf02u.x1s688f[role="button"]')
        if (btnSeeMore) {
          btnSeeMore.scrollIntoView({ behavior: 'smooth', block: 'center' });
          btnSeeMore.click()
          await delay(1000)
        }

        // Scrape text content of the element
        await delay(1000)
        let textContent = elementArr[i]?.querySelector('.x1yx25j4.x13crsa5.x1rxj1xn.xxpdul3.x6x52a7')?.textContent
        if (!textContent) textContent = elementArr[i]?.querySelector('.html-div.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.x1l90r2v.x1pi30zi.x1swvt13.x1iorvi4')?.textContent
        if (!textContent) textContent = elementArr[i]?.querySelectorAll('span[dir="auto"].x193iq5w.xeuugli.x13faqbe.x1vvkbs.x1xmvt09.x1lliihq.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.xudqn12.x3x7a5m.x6prxxf.xvq8zen.xo1l8bm.xzsf02u.x1yc453h')[2]?.textContent
        if (!textContent) textContent = elementArr[i]?.querySelectorAll('span[dir="auto"].x193iq5w.xeuugli.x13faqbe.x1vvkbs.x1xmvt09.x1lliihq.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.xudqn12.x3x7a5m.x6prxxf.xvq8zen.xo1l8bm.xzsf02u.x1yc453h')[1]?.textContent
        if (!textContent) textContent = elementArr[i]?.querySelectorAll('span[dir="auto"].x193iq5w.xeuugli.x13faqbe.x1vvkbs.x1xmvt09.x1lliihq.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.xudqn12.x3x7a5m.x6prxxf.xvq8zen.xo1l8bm.xzsf02u.x1yc453h')[0]?.textContent
        if (!textContent) textContent = elementArr[i]?.querySelector('.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.x1vvkbs.x126k92a')?.textContent
        if (!textContent) textContent = elementArr[i]?.querySelector('.html-div.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x1swvt13.x1pi30zi.x18d9i69')?.textContent || ''
        const textAccount = elementArr[i]?.querySelector('.html-h3')?.textContent || ''
        const textIdAccount = elementArr[i]?.querySelector('.html-h3 a')?.href?.split('/')[6] || ''
        await delay(1000)
        const elementUrlContent = elementArr[i]?.querySelector('span:nth-child(1) > span > span > a[role="link"]') ||
          elementArr[i]?.querySelector('div > span:nth-child(1) > span > a')
        const elementShare = elementArr[i]?.querySelector('div.html-div.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd > div > div > div:nth-child(4) > div > div > div > div > div.xq8finb.x16n37ib > div > div:nth-child(4) > div > div.x9f619.x1ja2u2z.x78zum5.x1n2onr6.x1r8uery.x1iyjqo2.xs83m0k.xeuugli.xl56j7k.x6s0dn4.xozqiw3.x1q0g3np.xn6708d.x1ye3gou.xexx8yu.xcud41i.x139jcc6.x4cne27.xifccgj.xn3w4p2.xuxw1ft > div:nth-child(1) > i')
        let textUrlContent = ''
        if (elementUrlContent || elementShare) {
          await elementUrlContent?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          await elementUrlContent?.focus()
          if (elementShare) {
            await elementShare.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await elementShare.click()
            await delay(1000)
            const elementCopy = document?.querySelector('div.x1uvtmcs.x4k7w5x.x1h91t0o.x1beo9mf.xaigb6o.x12ejxvf.x3igimt.xarpa2k.xedcshv.x1lytzrv.x1t2pt76.x7ja8zs.x1n2onr6.x1qrby5j.x1jfb8zj > div > div > div > div > div > div > div.xb57i2i.x1q594ok.x5lxg6s.x78zum5.xdt5ytf.x6ikm8r.x1ja2u2z.x1pq812k.x1rohswg.xfk6m8.x1yqm8si.xjx87ck.xx8ngbg.xwo3gff.x1n2onr6.x1oyok0e.x1odjw0f.x1iyjqo2.xy5w88m > div.x78zum5.xdt5ytf.x1iyjqo2.x1n2onr6.xaci4zi.x129vozr > div > div > div > div:nth-child(6) > div > div > div > div > div > div:nth-child(3) > div > div.x1n2onr6.x1ja2u2z.x9f619.x78zum5.xdt5ytf.x193iq5w.x1l7klhg.x1iyjqo2.xs83m0k.x2lwn1j.x1y1aw1k.xwib8y2 > div > div:nth-child(1) > div > i');
            if (elementCopy) {
              elementCopy.addEventListener("click", async () => {
                try {
                  textUrlContent = await navigator.clipboard.readText();
                  console.log("✅ Nội dung đã copy:", textUrlContent);
                } catch (err) {
                  console.log("❌ Lỗi khi lấy nội dung clipboard:", err);
                }
              })
              await elementCopy.scrollIntoView({ behavior: 'smooth', block: 'center' });
              await elementCopy.click()
              await delay(1000)
            }
          }
          textUrlContent = textUrlContent || (elementUrlContent?.href?.split('?')[0].includes('/search') ? elementUrlContent?.href?.split('?')[0].replace('/search', '') : elementUrlContent?.href?.split('?')[0])
        }
        console.log('textUrlContent: ', textUrlContent)

        if (textContent) {
          data.push({ content: textContent, group: groupName, account: textAccount, idAccount: textIdAccount, crawlBy: 'shanghaifanyuan613@gmail.com', userId: 2, type: 'comment', urlContent: textUrlContent })
        }

        if (i < 25 || data.length < 25) {
          await delay(2000)
          elementArr = documentPage?.querySelectorAll('.x1yztbdb.x1n2onr6.xh8yej3.x1ja2u2z')
        } else {
          break
        }

        console.log('data: ', data.length)
      }

      // Remove duplicate comment and add field contactUs
      data = data.filter((item, index, self) =>
        index === self.findIndex((c) => c.content === item.content)
      ).map((c) => {
        const contactUs = Array.from(new Set(c?.content?.match(/\\+?\\d{1,3}(?:[.\\s]?\\d{1,4})+|\\b0\\d{9}\\b/g)
          ?.filter((num, index, self) =>
            self.indexOf(num) === index && num.replace(/\\D/g, '').length >= 9
          ) || []))
          ?.join(', ') || '';
        return { ...c, contactUs };
      })

      // Remove data if contactUs is empty
      data = data.filter((c) => c.contactUs)

      return data
    } catch (error) {
      console.log('Error scraping data from browser: ', error)
      return []
    }
  })()`
}

// Function to scrape the data from the browser (message page)
const scrapeDataFromMessagePage = (accountCrawl) => {
  return `(async () => {
    const delay = async (time) => {
      await new Promise(resolve => setTimeout(resolve, time))
    }
    try {
      // Click button chat communication
      const btnChatComunication = document?.querySelector('div.x1ey2m1c.x9f619.xds687c.x17qophe.x10l6tqk.x13vifvy > div:nth-child(3)')
      console.log('btnChatComunication: ', btnChatComunication)
      if (btnChatComunication) {
        btnChatComunication.querySelector('span[dir="auto"]').click()
        await delay(14000)
      }

      // Click button see more to load more chat
      const btnSeeMore = document?.querySelector('div.x9f619.x1n2onr6.x78zum5.xdt5ytf.x193iq5w.x1t2pt76.x1xzczws.x1vjfegm.xcrg951.xilr8tx.xs83m0k.xczebs5.x1cvmir6 > div > div > div > div.x78zum5.xdt5ytf.x1iyjqo2.x5yr21d.x6ikm8r.x10wlt62 > div > div.x78zum5.xdt5ytf.x1iyjqo2.x1n2onr6 > div:nth-child(2) > div > div.xod5an3.x1xmf6yo.x1swvt13.x1pi30zi > div > div')
      if (btnSeeMore) {
        btnSeeMore.scrollIntoView({ behavior: 'smooth', block: 'center' })
        btnSeeMore.click()
        await delay(1000)
      }

      // Get list chat and check if the list chat is empty
      const listChat = document?.querySelectorAll('[role="grid"] > div > .html-div.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd')
      console.log('listChat: ', listChat.length)
      if (!listChat || !listChat.length) return false

      for (let i = 0; i < listChat.length; i++) {
        // Click chat to load chat content
        await delay(1000)
        listChat[i].scrollIntoView({ behavior: 'smooth', block: 'center' })
        await delay(1000)
        listChat[i].querySelector('.x1lliihq.x6ikm8r.x10wlt62.x1n2onr6.xlyipyv.xuxw1ft').click()
        await delay(1000)
        const urlMessage = await window.location.href
        console.log('urlMessage: ', urlMessage)

        // Click button break to break the chat
        const btnBreak = document?.querySelector('div:nth-child(2) > div > div > div > div.x9f619.x1n2onr6.x1ja2u2z.x78zum5.xdt5ytf.x2lah0s.x193iq5w.x5ib6vp.xc73u3c.xyamay9.x1l90r2v > div > div > div.x6s0dn4.x78zum5.xl56j7k.x1608yet.xljgi0e.x1e0frkt')
        if (btnBreak) break

        // Get name chat
        const textNameChat = document?.querySelector('div.html-div.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x6s0dn4.x78zum5.x193iq5w > span > span > span.html-span')?.textContent || ''

        // Get list content chat
        let listContentChat = document?.querySelectorAll('div.x78zum5.xdt5ytf.x1iyjqo2.x6ikm8r.x1odjw0f.xish69e.x16o0dkt > div > div')
        if (!listContentChat || !listContentChat.length) continue

        let data = []
        let countLoop = 0
        let lengthListContentChat = listContentChat.length
        for (let j = lengthListContentChat - 1; j >= 0; j--) {
          const textChat = listContentChat[j]?.querySelector('.html-div.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x1gslohp.x11i5rnm.x12nagc.x1mh8g0r.x1yc453h.x126k92a.x18lvrbx')?.textContent || ''
          const timeChat = listContentChat[j]?.querySelector('.html-div.xexx8yu.x4uap5.x18d9i69.xkhd6sd.xr1yuqi.xkrivgy.x4ii5y1.x1gryazu.x1ekjcvx.x2b8uid.x13faqbe')?.textContent || ''

          // Check if the text chat is not empty
          if (textChat && textChat.trim() !== '') {
            data.push({ content: textChat, group: textNameChat, time: timeChat, crawlBy: ${JSON.stringify(accountCrawl)}, userId: 2, type: 'chat', urlContent: urlMessage })
          }
          
          if (j === 0) {
            if (countLoop === 5) break

            // Scroll to the top of the chat
            listContentChat[j]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            await delay(3000)

            // Set list content chat again
            listContentChat = document?.querySelectorAll('div.x78zum5.xdt5ytf.x1iyjqo2.x6ikm8r.x1odjw0f.xish69e.x16o0dkt > div > div')
            j = listContentChat.length - lengthListContentChat - 1
            lengthListContentChat = listContentChat.length
            countLoop++
          }
          await delay(1000)
        }
        data = data.filter((item, index, self) =>
          item?.content?.trim() !== '' &&
          index === self.findIndex((c) => c?.content?.toLowerCase()?.trim() === item?.content?.toLowerCase()?.trim())
        ).map((c) => {
          const contactUs = Array.from(new Set(c?.content?.match(/\\+?\\d{1,3}(?:[.\\s]?\\d{1,4})+|\\b0\\d{9}\\b/g)
            ?.filter((num, index, self) =>
              self.indexOf(num) === index && num.replace(/\\D/g, '').length >= 9
            ) || []))
            ?.join(', ') || '';
          return { ...c, contactUs };
        })

        console.log('data: ', data.length)
        window.electronBridge.sendDataChat(data)
      }

      return true
    } catch (error) {
      console.log('Error scraping data from browser: ', error)
      return false
    }
  })()`
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
ipcMain.handle('data-chat', async (event, data) => {
  if (data?.length > 0) {
    const res1 = await saveDataToDatabase(JSON.stringify(data))
    console.log('saveDataChat: ', res1)

    const res2 = await transformDataByChatgpt()
    console.log('transformDataChatByChatgpt: ', res2)
  }
});

ipcMain.handle('require-action', async (event, action) => {
  if (action === 'paste') {
    console.log('action: ', action)
    await executeAction({ type: action }, 1000)
  }
})
