// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, globalShortcut, clipboard, session } = require('electron')
const path = require('node:path')
const jsQR = require('jsqr');
const os = require('os');
const { saveDataFb, fetchGroupData, saveDataWhatsapp, serviceGemini } = require('./services');
const { timeTaskScrapeFb } = require('./cron');
const groupFb = require('./mock/groupFb');
let PORT_LIST = [
  "ITALY", "CAMBODIA", "CHINA", "INDONESIA", "MALAYSIA", "MYANMAR",
  "PHILIPPINE", "SINGAPORE", "THAILAND", "VIETNAM",
  "SIHANOUKKVILLE", "HONG KONG", "JAKARTA", "SEMARANG",
  "PORT KELANG", "TANJUNG PELEPAS", "YANGON", "MANILA",
  "CEBU", "SUBIC", "SINGAPORE", "BANGKOK", "LAEMCHABANG",
  "HOCHIMINH", "HAIPHONG", "DANANG", "CHITTAGONG",
  "NHAVA SHEVA", "VISAKHAPATNAM", "CHENNAI", "PIPAVAV",
  "UMM QASAR", "SOHAR", "KARACHI", "HAMAD", "DAMMAM",
  "COLOMBO", "JEBEL ALI", "MINA QABOOS", "MUSCAT",
  "SALALAH", "DUBAI", "DJIBOUTI", "SOKHNA", "AQABA",
  "JEDDAH", "PORT SAID", "TEMA", "MOMBASA", "APAPA",
  "TIN CAN", "DURBAN", "CAPE TOWN", "LOME",
  "TOKYO OSAKA", "MOJI", "NAGOYA", "BUSAN", "INCHON",
  "KEELUNG", "KAOHSIUNG", "LOS ANGELES", "LONG BEACH",
  "NEW YORK", "MIAMI", "HOUSTON", "VANCOUVER",
  "ANIWERP", "FELIXSTOWE", "SOUTHAMPTON", "LE HAVRE",
  "HAMBURG", "PIRAEUS", "ASHDOD", "GENOVA", "ROTTERDAM",
  "KOPER", "VALENCIA", "BARCELONA", "ISTANBUL",
  "BUENOS AIRES", "RIO DE JANEIRO", "BUNAVENTURA",
  "GUAYAQUIL", "KINGSTON", "MANZANILLO", "CALLAO",
  "SYDNEY", "FREMANTLE", "BRISBANE", "WELLINGTON",
  "AUCKLAND", "SKV", "HKG", "JKT", "SMG", "PKG", "TPP",
  "YGN", "MNL", "CEB", "SUB", "SGP", "BKK", "LCB",
  "HCM", "HPG", "DAN", "TKY", "OSK", "MOJ", "NAG",
  "BUS", "INC", "KEE", "KAO", "Hải Phòng", "Hồ Chí Minh", "Hà Nội", "INC", "HPH", "CANADA", "MEL",
  "LAX", "LBG", "MUNDRA", "INDIA", "DELHI"
]

async function main() {
  // console.log('Robot version: ', process.versions);
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
      session: session.fromPartition('persist:Natalie@sfyf.cn')
    },
  })

  PORT_LIST = PORT_LIST.map(item => item.toLowerCase());

  // Load the index.html in project of the desktop app.
  await mainWindow.loadFile('index.html')

  // Run task scrape fb
  // await timeTaskScrapeFb(runTaskMain);

  // IPC event listener (Listen data from renderer process)
  ipcMain.handle("data-input", async (event, data) => {
    console.log("Received data from renderer: ", data);
    const { v4: uuidv4 } = await import('uuid');
    // await mainWindow.setBounds({ x: -2000, y: -2000, width: 1200, height: 600 });
    // Task main: Crawl data from group page with keyword='zalo'
    const runTaskMain = async () => {
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
        let urlGroup = groupFb?.map((g) => g?.url)
        // for (let i = urlGroup.length - 1; i > 0; i--) {
        //   const j = Math.floor(Math.random() * (i + 1));
        //   [urlGroup[i], urlGroup[j]] = [urlGroup[j], urlGroup[i]];
        // }
        const urlGroupData = await fetchGroupData(page) // Call the function to fetch group data
        urlGroup = urlGroup.concat(urlGroupData)
        // console.log('Page: ', page + 1)
        if (!urlGroupData) break

        for (const url of urlGroup) {
          let urlAccess = url
          // Load the url of the group facebook
          if (urlAccess.includes('share')) {
            await mainWindow.loadURL(urlAccess)
            urlAccess = mainWindow.webContents.getURL().split('?')[0].split('#')[0]
          }
          if (urlAccess.includes('?')) {
            urlAccess = urlAccess.split('?')[0]
          }
          console.log('urlAccess: ', urlAccess)
          if (!urlAccess.includes('https://www.facebook.com')) continue;
          await mainWindow.loadURL(`${urlAccess.replace(/\/$/, "")}`) ///search/?q=zalo
          await delay(5000)

          // Scrape data from browser
          //scrapeDataFromZalo
          //scrapeDataFromGroupPage
          const data = await mainWindow.webContents.executeJavaScript(scrapeDataFromGroupPage(urlAccess, groupFb?.map((g) => g?.url)))
          console.log('dataStart: ', data?.length)
          if (!data?.length) continue;
          let ipAddress = ''
          const interfaces = os.networkInterfaces();
          for (const iface of interfaces['WLAN']) {
            if (iface.family === "IPv4" && !iface.internal) {
              ipAddress = iface.address
            }
          }
          if (!!data?.length) {
            // Check QR code from url
            const dataNew = await Promise.all(data.map(async (item) => {
              if (!item?.urlZalo) return { ...item, ipAddress };
              const isQRCode = await checkQRCodeFromUrl(item?.urlZalo)
              if (isQRCode?.isQRCode) {
                return item
              }
              return { ...item, urlZalo: '', ipAddress, idAccount: item.idAccount || uuidv4() }
            }))

            // Remove duplicate data with field 'idAccount' and 'contactUs'
            const map = new Map();
            const dataUnique = dataNew.filter((item) => {
              const key = `${item.idAccount}-${item.contactUs}`;
              if (!map.has(key)) {
                map.set(key, true);
                return true;
              }
              return false;
            });

            // Add urlFacebook to dataUnique
            const dataSave = dataUnique.map(item => ({ ...item, urlFacebook: `https://www.facebook.com/${item.idAccount}` })).filter(item => !(item.contactUs === '' || item.contactUs === null));
            console.log('dataAfterFilter: ', dataSave?.length)

            if (!!dataSave?.length) {
              for (const item of dataSave) {
                if (!containsPort(item.content.toLowerCase(), PORT_LIST)) continue;
                const response = await saveDataFb(item)
                console.log('Save data fb: ', response)
              }
            }
          }

          await delay(1000) // Wait for 10 seconds
        }
        page++
      }

      // Load the index.html in project of the desktop app.
      await mainWindow.loadFile('index.html')
      await mainWindow.close()
    };

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

    // const runTask1 = data.map(async (item) => {
    //   await task1(item)
    //   return
    // })

    // Task 2: Crawl data from group page
    const task2 = async (account) => {
      const window2 = await createWindow({ width: 1200, height: 600, x: 0, y: 200, sessionName: account })
      if (!window2) return;
      // Load the url of the facebook (Login FB)
      await window2.loadURL('https://www.facebook.com/')

      // Check login status
      const isLogin = await window2.webContents.executeJavaScript(checkLoginFacebook)
      if (!isLogin) {
        await delay(100000)
        await window2.close()
        return
      };

      // Loop fetch group data by page
      const hasGroupData = true
      let page = 0
      while (hasGroupData) {
        let urlGroup = groupFb?.map((g) => g?.url)
        const urlGroupData = await fetchGroupData(page) // Call the function to fetch group data
        urlGroup = urlGroup.concat(urlGroupData)
        if (!urlGroupData) break

        for (const url of urlGroup) {
          let urlAccess = url
          // Load the url of the group facebook
          if (urlAccess.includes('share')) {
            await window2.loadURL(urlAccess)
            urlAccess = window2.webContents.getURL().split('?')[0].split('#')[0]
          }
          if (urlAccess.includes('?')) {
            urlAccess = urlAccess.split('?')[0]
          }
          console.log('urlAccess: ', urlAccess)
          if (!urlAccess.includes('https://www.facebook.com')) continue;
          await window2.loadURL(`${urlAccess.replace(/\/$/, "")}/search/?q=whatsapp%20group`) ///search/?q=zalo
          await delay(5000)

          // Scrape data from browser
          const data = await window2.webContents.executeJavaScript(scrapeDataWhatsapp())
          console.log('dataStart: ', data?.length)
          if (!data?.length) continue;
          let ipAddress = ''
          const interfaces = os.networkInterfaces();
          for (const iface of interfaces['WLAN']) {
            if (iface.family === "IPv4" && !iface.internal) {
              ipAddress = iface.address
            }
          }
          if (!!data?.length) {
            for (const item of data) {
              const responseGemini = await serviceGemini(item, 'whatsapp')
              console.log('responseGemini: ', responseGemini)
              if (!!responseGemini?.length) {
                for (const itemGemini of responseGemini) {
                  const responseSave = await saveDataWhatsapp({ ...item, linkWhatsapp: itemGemini })
                  console.log('Save data fb: ', responseSave)
                }
              };
              // const responseSave = await saveDataWhatsapp(response)
              // console.log('Save data fb: ', responseSave)
            }
          }

          await delay(1000) // Wait for 10 seconds
        }
        page++
      }
      // // Load the url of the group facebook
      // await window2.loadURL('https://www.facebook.com/groups/751699098197946/search?q=zalo/SĐT')
      // await delay(3000)

      // // Scrape data from browser
      // const data = await window2.webContents.executeJavaScript(scrapeDataFromZalo('https://www.facebook.com/groups/logisticsvietnam', 'https://www.facebook.com/groups/logisticsvietnam'))
      // console.log('dataStart: ', data?.length)
      // let ipAddress = ''
      // const interfaces = os.networkInterfaces();
      // for (const iface of interfaces['WLAN']) {
      //   if (iface.family === "IPv4" && !iface.internal) {
      //     ipAddress = iface.address
      //   }
      // }
      // if (!!data?.length) {
      //   // Check QR code from url
      //   const dataNew = await Promise.all(data.map(async (item) => {
      //     if (!item?.urlZalo) return { ...item, ipAddress };
      //     const isQRCode = await checkQRCodeFromUrl(item?.urlZalo)
      //     if (isQRCode?.isQRCode) {
      //       return item
      //     }
      //     return { ...item, urlZalo: '', ipAddress, idAccount: item.idAccount || uuidv4() }
      //   }))

      //   // Remove duplicate data with field 'idAccount' and 'contactUs'
      //   const map = new Map();
      //   const dataUnique = dataNew.filter((item) => {
      //     const key = `${item.idAccount}-${item.contactUs}`;
      //     if (!map.has(key)) {
      //       map.set(key, true);
      //       return true;
      //     }
      //     return false;
      //   });

      //   // Add urlFacebook to dataUnique
      //   const dataSave = dataUnique.map(item => ({ ...item, urlFacebook: `https://www.facebook.com/${item.idAccount}` })).filter(item => !(item.contactUs === '' || item.contactUs === null));

      //   if (!!dataSave?.length) {
      //     for (const item of dataSave) {
      //       if (!containsPort(item.content.toLowerCase(), PORT_LIST)) continue;
      //       const response = await saveDataFb(item)
      //       console.log('Save data fb: ', response)
      //     }
      //   }
      // }
      // Close the window
      await window2.close()
    }

    await Promise.all([runTaskMain(), task2(data[0].account)]) //runTask1
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

// Function to check if the target string contains any port in the port list
const containsPort = (targetString, portList) => {
  return portList.some(port => targetString.includes(port));
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
      mail.value = 'Natalie@sfyf.cn'
      pw.value = 'Aa123456@'
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

// Function to scrape the data from the browser (group page with keyword='zalo')
const scrapeDataFromZalo = (urlAccess, urlOriginal) => {
  return `(async () => {
  const delay = async (time) => {
    await new Promise(resolve => setTimeout(resolve, time));
  }
  try {
    await delay(1000)
    let documentPage = document?.querySelector('.x193iq5w.x1xwk8fm')
    // console.log('documentPage: ', documentPage)
    if (!documentPage) return [] // If the documentPage is not found, return an empty array

    // Get text of group name
    await delay(1000)
    const elementGroupName = document?.querySelector('div.x9f619.x1ja2u2z.x78zum5.x2lah0s.x1n2onr6.x1qughib.x6s0dn4.xozqiw3.x1q0g3np > div > div > div > div > div:nth-child(2) > span > span')?.textContent
    const groupName = elementGroupName?.split(' ')?.slice(1)?.join(' ')
    console.log('Group Name-----: ', groupName)

    await delay(1000)
    let elementArr = documentPage?.querySelectorAll('.x78zum5.xdt5ytf[data-virtualized="false"]')
    if (!elementArr || !elementArr.length) return [] // If the elementArr is not found or empty, return an empty array

    let data = []
    let count = 0
    for (let i = 0; i < elementArr.length; i++) {
      // Check if the end element is found
      const endElement = document?.querySelector('div.x9f619.x2lah0s.x1n2onr6.x78zum5.x1iyjqo2.x1t2pt76.x1lspesw > div > div > div > div > div > div > div > div > div > div > span')
      if (endElement) {
        count++
        const dateFilterEle = document?.querySelector('div.x1iyjqo2.xu06os2.x1ok221b.xeuugli > span > span')
        if (dateFilterEle) {
          dateFilterEle.focus()
          dateFilterEle.click()
          await delay(1000)
          const selectDateEle = document?.querySelectorAll('.x78zum5.xdt5ytf.x1iyjqo2.x1n2onr6 > div.x4k7w5x.x1h91t0o.x1beo9mf.xaigb6o.x12ejxvf.x3igimt.xarpa2k.xedcshv.x1lytzrv.x1t2pt76.x7ja8zs.x1n2onr6.x1qrby5j.x1jfb8zj > div')
          if (selectDateEle) {
            selectDateEle[count + 1]?.focus()
            selectDateEle[count + 1]?.click()
            await delay(3000)
            documentPage = document?.querySelector('.x193iq5w.x1xwk8fm')
            elementArr = documentPage?.querySelectorAll('.x78zum5.xdt5ytf[data-virtualized="false"]')
            i = 0
            console.log('elementArr: ', i, elementArr.length)
            continue;
          }
        }
      } else {
        console.log('count: ', count)
        elementArr = documentPage?.querySelectorAll('.x78zum5.xdt5ytf[data-virtualized="false"]')
      }
      console.log('index: ', i, elementArr.length)
      await delay(1500)
      // Scroll to the element ith
      elementArr[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });

      await delay(800)
      const btnSeeMore = elementArr[i]?.querySelector('span > div > div > div > div[role="button"]')
      if (btnSeeMore) {
        btnSeeMore.scrollIntoView({ behavior: 'smooth', block: 'center' });
        btnSeeMore.click()
        await delay(1000)
      }

      // Scrape text content of the element
      await delay(1000)
      let textContent = elementArr[i]?.querySelectorAll('.html-div.xdj266r.x14z9mp.xat24cr.x1lziwak.x1l90r2v.xv54qhq.xf7dkkf.x1iorvi4')?.[0]?.textContent
      if (!textContent) textContent = elementArr[i]?.querySelectorAll('div.html-div.xdj266r.x14z9mp.xat24cr.x1lziwak.xexx8yu.xyri2b.x18d9i69.x1c1uobl > div > div > div > div > div > span > div')?.[3]?.textContent
      if (!textContent) textContent = elementArr[i]?.querySelectorAll('div.html-div.xdj266r.x14z9mp.xat24cr.x1lziwak.xexx8yu.xyri2b.x18d9i69.x1c1uobl > div > div > div > div > div > span > div')?.[2]?.textContent
      if (!textContent) textContent = elementArr[i]?.querySelectorAll('div > div > span > div.html-div.xdj266r.x14z9mp.xat24cr.x1lziwak.xexx8yu.xyri2b.x18d9i69.x1c1uobl')?.[2]?.textContent
      if (!textContent) textContent = elementArr[i]?.querySelectorAll('span[dir="auto"].x193iq5w.xeuugli.x13faqbe.x1vvkbs.x1xmvt09.x1lliihq.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.xudqn12.x3x7a5m.x6prxxf.xvq8zen.xo1l8bm.xzsf02u.x1yc453h')?.[0]?.textContent
      if (!textContent) textContent = elementArr[i]?.querySelectorAll('.x78zum5.xdt5ytf.xz62fqu.x16ldp7u')?.[1]?.textContent
      if (!textContent) textContent = elementArr[i]?.querySelector('.x6s0dn4.x78zum5.xdt5ytf.x5yr21d.xl56j7k.x10l6tqk.x17qophe.x13vifvy.xh8yej3')?.textContent
      if (!textContent) textContent = elementArr[i]?.querySelector('div.x9f619.x2lah0s.x1n2onr6.x78zum5.x1iyjqo2.x1t2pt76.x1lspesw > div > div > div > div > div > div:nth-child(5) > div > div > div > div > div > div > div > div > div > div > div.html-div.xdj266r.x14z9mp.xat24cr.x1lziwak.xexx8yu.xyri2b.x18d9i69.x1c1uobl > div > div > div:nth-child(3) > div > div > div > div')?.textContent
      // console.log('Text Content-------: ', textContent)
      const textAccount = elementArr[i]?.querySelector('.html-h3')?.textContent || ''
      const textIdAccount = elementArr[i]?.querySelector('.html-h3 a')?.href?.split('/')?.[6] || ''
      const urlAvatar = elementArr[i]?.querySelector('g > image')?.href?.baseVal || ''
      await delay(1000)
      const elementUrlContent = elementArr[i]?.querySelectorAll('span:nth-child(1) > span > span > a[role="link"]')[2] ||
        elementArr[i]?.querySelector('div > span:nth-child(1) > span > a')
      let textUrlContent = ''
      if (elementUrlContent) {
        await elementUrlContent?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await elementUrlContent?.focus()
        await delay(1000)
        textUrlContent = (elementUrlContent?.href?.split('?')[0].includes('/search') ? elementUrlContent?.href?.split('?')[0].replace('/search', '') : elementUrlContent?.href?.split('?')[0])
      }
      // console.log('textUrlContent: ', textUrlContent)

      const urlImg = elementArr[i]?.querySelector('a > div.x6s0dn4.x1jx94hy.x78zum5.xdt5ytf.x6ikm8r.x10wlt62.x1n2onr6.xh8yej3 > div > div > div > img')?.src ||
        elementArr[i]?.querySelector('a > div.html-div.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x6ikm8r.x10wlt62 > div.xqtp20y.x6ikm8r.x10wlt62.x1n2onr6 > div > img')?.src || null
      if (textContent) {
        const type = ${JSON.stringify(urlOriginal)?.includes(urlAccess)} ? 'special' : 'comment'
        data.push({ content: textContent, group: groupName, account: textAccount, idAccount: textIdAccount, crawlBy: 'shanghaifanyuan613@gmail.com', userId: 2, type: type, urlContent: textUrlContent, urlZalo: urlImg, urlAvatar: urlAvatar })
      }

      if (count === 3) {
        break
      }

      // if (endElement || elementArr.length < 120) {
      //   await delay(2000)
      //   elementArr = documentPage?.querySelectorAll('.x78zum5.xdt5ytf[data-virtualized="false"]')
      // } else {
      //   break
      // }
    }

    // Remove duplicate comment and add field contactUs
    data = data.filter((item, index, self) =>
      index === self.findIndex((c) => c.content === item.content)
    ).map((c) => {
      const contactUs = Array.from(new Set(c?.content?.match(/\\+?\\d{1,3}(?:[.\\s]?\\d{1,4})+|\\b0\\d{9}\\b/g)
        ?.filter((num, index, self) =>
          self.indexOf(num) === index && num.replace(/\\D/g, '').length >= 9
        )
        ?.map(num => num.match(/\\d+/g)?.join('') || '')
        ?.filter(Boolean) || []))
        ?.join(', ') || '';
      return { ...c, contactUs };
    })

    return data
  } catch (error) {
    console.log('Error scraping data from browser: ', error)
    return []
  }
})()`
}

// Function to scrape the data from the browser (group page)
const scrapeDataFromGroupPage = (urlAccess, urlOriginal) => {
  return `(async () => {
    const delay = async (time) => {
      await new Promise(resolve => setTimeout(resolve, time));
    }
    try {
      await delay(1000)
      const documentPage = document?.querySelector('div[role="feed"]')
      if (!documentPage) return [] // If the documentPage is not found, return an empty array

      // Get text of group name
      await delay(1000)
      const groupName = document?.querySelector('.x1e56ztr.x1xmf6yo > [dir="auto"] > span[dir="auto"] > a[role="link"]')?.textContent
      // const groupName = elementGroupName?.split(' ')?.slice(1)?.join(' ')

      await delay(2000)
      let elementArr = documentPage?.querySelectorAll('.x1n2onr6.xh8yej3.x1ja2u2z.xod5an3')
      console.log('elementArr: ', elementArr.length)
      if (!elementArr || !elementArr.length) return [] // If the elementArr is not found or empty, return an empty array

      let data = []
      for (let i = 0; i < elementArr?.length; i++) {
        await delay(1000)
        // Scroll to the element ith
        elementArr[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });

        await delay(1000)
        const btnSeeMore = elementArr[i]?.querySelector('span > div > div > div > div[role="button"]') ||
          elementArr[i]?.querySelector('div > div > span > div > div:nth-child(3) > div > div')
        if (btnSeeMore) {
          // btnSeeMore.scrollIntoView({ behavior: 'smooth', block: 'center' });
          btnSeeMore.focus()
          btnSeeMore.click()
          await delay(1000)
        }

        // Scrape text content of the element
        await delay(1000)
        let textContent = elementArr[i]?.querySelectorAll('.html-div.xdj266r.x14z9mp.xat24cr.x1lziwak.x1l90r2v.xv54qhq.xf7dkkf.x1iorvi4')?.[0]?.textContent
        if (!textContent) textContent = elementArr[i]?.querySelectorAll('div.html-div.xdj266r.x14z9mp.xat24cr.x1lziwak.xexx8yu.xyri2b.x18d9i69.x1c1uobl > div > div > div > div > div > span > div')?.[3]?.textContent
        if (!textContent) textContent = elementArr[i]?.querySelectorAll('div.html-div.xdj266r.x14z9mp.xat24cr.x1lziwak.xexx8yu.xyri2b.x18d9i69.x1c1uobl > div > div > div > div > div > span > div')?.[2]?.textContent
        if (!textContent) textContent = elementArr[i]?.querySelectorAll('div > div > span > div.html-div.xdj266r.x14z9mp.xat24cr.x1lziwak.xexx8yu.xyri2b.x18d9i69.x1c1uobl')?.[2]?.textContent
        if (!textContent) textContent = elementArr[i]?.querySelectorAll('span[dir="auto"].x193iq5w.xeuugli.x13faqbe.x1vvkbs.x1xmvt09.x1lliihq.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.xudqn12.x3x7a5m.x6prxxf.xvq8zen.xo1l8bm.xzsf02u.x1yc453h')?.[0]?.textContent
        if (!textContent) textContent = elementArr[i]?.querySelectorAll('.x78zum5.xdt5ytf.xz62fqu.x16ldp7u')?.[1]?.textContent
        if (!textContent) textContent = elementArr[i]?.querySelector('.x6s0dn4.x78zum5.xdt5ytf.x5yr21d.xl56j7k.x10l6tqk.x17qophe.x13vifvy.xh8yej3')?.textContent
        if (!textContent) textContent = elementArr[i]?.querySelector('div.x9f619.x2lah0s.x1n2onr6.x78zum5.x1iyjqo2.x1t2pt76.x1lspesw > div > div > div > div > div > div:nth-child(5) > div > div > div > div > div > div > div > div > div > div > div.html-div.xdj266r.x14z9mp.xat24cr.x1lziwak.xexx8yu.xyri2b.x18d9i69.x1c1uobl > div > div > div:nth-child(3) > div > div > div > div')?.textContent
        const textAccount = elementArr[i]?.querySelector('.html-h3')?.textContent || elementArr[i]?.querySelector('.html-strong')?.textContent || '0'
        const textIdAccount = elementArr[i]?.querySelector('.html-h3 a')?.href?.split('/')?.[6] || elementArr[i]?.querySelector('.xjp7ctv > a')?.href?.split('/')?.[6] || ''
        const urlAvatar = elementArr[i]?.querySelector('g > image')?.href?.baseVal || ''
        await delay(1000)

        const elementUrlContent = elementArr[i]?.querySelector('div > span:nth-child(1) > span > a')
        let textUrlContent = ''
        if (elementUrlContent) {
          await elementUrlContent?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          await delay(1000)
          await elementUrlContent?.focus()
          textUrlContent = (elementUrlContent?.href?.split('?')[0].includes('/search') ? elementUrlContent?.href?.split('?')[0].replace('/search', '') : elementUrlContent?.href?.split('?')[0])
        }
        // console.log('textUrlContent: ', textUrlContent)

        if (textContent) {
          const type = ${JSON.stringify(urlOriginal)?.includes(urlAccess)} ? 'special' : 'comment'
          data.push({ content: textContent, group: groupName, account: textAccount, idAccount: textIdAccount, crawlBy: 'shanghaifanyuan613@gmail.com', userId: 2, type: type, urlContent: textUrlContent, urlAvatar: urlAvatar })
        }
        console.log('data: ', i, data)

        if (elementArr.length < 150) {
          await delay(2000)
          elementArr = documentPage?.querySelectorAll('.x1n2onr6.xh8yej3.x1ja2u2z.xod5an3')
          console.log('Length of page array: ', elementArr.length)
        } else {
          break
        }
      }

      // Remove duplicate comment and add field contactUs
      data = data.filter((item, index, self) =>
        index === self.findIndex((c) => c.content === item.content)
      ).map((c) => {
        const contactUs = Array.from(new Set(c?.content?.match(/\\+?\\d{1,3}(?:[.\\s]?\\d{1,4})+|\\b0\\d{9}\\b/g)
          ?.filter((num, index, self) =>
            self.indexOf(num) === index && num.replace(/\\D/g, '').length >= 9
          )
          ?.map(num => num.match(/\\d+/g)?.join('') || '')
          ?.filter(Boolean) || []))
          ?.join(', ') || '';
        return { ...c, contactUs };
      })

      console.log('data: ', data.length)
      return data
    } catch (error) {
      console.log('Error scraping data from browser: ', error)
      return []
    }
  })()`
}

// Function to scrape the data from the browser (whatsapp group page)
const scrapeDataWhatsapp = () => {
  return `(async () => {
    const delay = async (time) => {
      await new Promise(resolve => setTimeout(resolve, time));
    }
    try {
      await delay(1000)
      const documentPage = document?.querySelector('div[role="feed"]')
      if (!documentPage) return [] // If the documentPage is not found, return an empty array

      await delay(2000)
      let elementArr = documentPage?.querySelectorAll('.x78zum5.xdt5ytf[data-virtualized="false"]')
      console.log('elementArr: ', elementArr.length)
      if (!elementArr || !elementArr.length) return [] // If the elementArr is not found or empty, return an empty array

      let data = []
      for (let i = 0; i < elementArr?.length; i++) {
        await delay(1000)
        // Scroll to the element ith
        elementArr[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });

        await delay(1000)
        const btnSeeMore = elementArr[i]?.querySelector('span > div > div > div > div[role="button"]') ||
          elementArr[i]?.querySelector('div > div > span > div > div:nth-child(3) > div > div')
        if (btnSeeMore) {
          // btnSeeMore.scrollIntoView({ behavior: 'smooth', block: 'center' });
          btnSeeMore.focus()
          btnSeeMore.click()
          await delay(1000)
        }

        // Scrape text content of the element
        await delay(1000)
        let textContent = elementArr[i]?.querySelectorAll('.html-div.xdj266r.x14z9mp.xat24cr.x1lziwak.x1l90r2v.xv54qhq.xf7dkkf.x1iorvi4')?.[0]?.textContent
        if (!textContent) textContent = elementArr[i]?.querySelectorAll('div.html-div.xdj266r.x14z9mp.xat24cr.x1lziwak.xexx8yu.xyri2b.x18d9i69.x1c1uobl > div > div > div > div > div > span > div')?.[3]?.textContent
        if (!textContent) textContent = elementArr[i]?.querySelectorAll('div.html-div.xdj266r.x14z9mp.xat24cr.x1lziwak.xexx8yu.xyri2b.x18d9i69.x1c1uobl > div > div > div > div > div > span > div')?.[2]?.textContent
        if (!textContent) textContent = elementArr[i]?.querySelectorAll('div > div > span > div.html-div.xdj266r.x14z9mp.xat24cr.x1lziwak.xexx8yu.xyri2b.x18d9i69.x1c1uobl')?.[2]?.textContent
        if (!textContent) textContent = elementArr[i]?.querySelectorAll('span[dir="auto"].x193iq5w.xeuugli.x13faqbe.x1vvkbs.x1xmvt09.x1lliihq.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.xudqn12.x3x7a5m.x6prxxf.xvq8zen.xo1l8bm.xzsf02u.x1yc453h')?.[0]?.textContent
        if (!textContent) textContent = elementArr[i]?.querySelectorAll('.x78zum5.xdt5ytf.xz62fqu.x16ldp7u')?.[1]?.textContent
        if (!textContent) textContent = elementArr[i]?.querySelector('.x6s0dn4.x78zum5.xdt5ytf.x5yr21d.xl56j7k.x10l6tqk.x17qophe.x13vifvy.xh8yej3')?.textContent
        if (!textContent) textContent = elementArr[i]?.querySelector('div.x9f619.x2lah0s.x1n2onr6.x78zum5.x1iyjqo2.x1t2pt76.x1lspesw > div > div > div > div > div > div:nth-child(5) > div > div > div > div > div > div > div > div > div > div > div.html-div.xdj266r.x14z9mp.xat24cr.x1lziwak.xexx8yu.xyri2b.x18d9i69.x1c1uobl > div > div > div:nth-child(3) > div > div > div > div')?.textContent
        const textAccount = elementArr[i]?.querySelector('.html-h3')?.textContent || elementArr[i]?.querySelector('.html-strong')?.textContent || '0'
        const textIdAccount = elementArr[i]?.querySelector('.html-h3 a')?.href?.split('/')?.[6] || elementArr[i]?.querySelector('.xjp7ctv > a')?.href?.split('/')?.[6] || ''
        const urlAvatar = elementArr[i]?.querySelector('g > image')?.href?.baseVal || ''
        await delay(1000)

        const elementUrlContent = elementArr[i]?.querySelector('div > span:nth-child(1) > span > a')
        let textUrlContent = ''
        if (elementUrlContent) {
          await elementUrlContent?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          await delay(1000)
          await elementUrlContent?.focus()
          textUrlContent = (elementUrlContent?.href?.split('?')[0].includes('/search') ? elementUrlContent?.href?.split('?')[0].replace('/search', '') : elementUrlContent?.href?.split('?')[0])
        }
        // console.log('textUrlContent: ', textUrlContent)

        if (textContent) {
          data.push({ content: textContent, account: textAccount, accountId: textIdAccount })
        }
        console.log('data: ', i, data)

        if (elementArr.length < 150) {
          await delay(2000)
          elementArr = documentPage?.querySelectorAll('.x78zum5.xdt5ytf[data-virtualized="false"]')
          console.log('Length of page array: ', elementArr.length)
        } else {
          break
        }
      }

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
      const btnChatComunication = document?.querySelector('div.x1ey2m1c.x9f619.xtijo5x.x1o0tod.x10l6tqk.x13vifvy > div:nth-child(5) > div > div > span > span')
      console.log('btnChatComunication: ', btnChatComunication)
      if (btnChatComunication) {
        btnChatComunication.click()
        await delay(14000)
      } else {
        const btnChatComunicationMore = document?.querySelector('div.x1ey2m1c.x9f619.xtijo5x.x1o0tod.x10l6tqk.x13vifvy > div.x1rg5ohu.x6ikm8r.x10wlt62.x1n2onr6.x16dsc37.xc9qbxq.x1useyqa > div > div > div > div')
        btnChatComunicationMore.click()
        await delay(3000)
        const btnCommunication = document?.querySelector('div > div > div.x1ey2m1c.xtijo5x.x1o0tod.xg01cxk.x47corl.x10l6tqk.x13vifvy.x1ebt8du.x19991ni.x1dhq9h.xbxg5aw.xxh58k5.xzw787d.xk59nb')
        if (btnCommunication) {
          btnCommunication.click()
          await delay(14000)
        }
      }

      // Click button see more to load more chat
      const btnSeeMore = document?.querySelector('div > div.x9f619.x1n2onr6.x78zum5.xdt5ytf.x193iq5w.x1t2pt76.x1xzczws.x1vjfegm.xcrg951.xilr8tx.xs83m0k.xczebs5.x1cvmir6 > div > div > div > div.x78zum5.xdt5ytf.x1iyjqo2.x5yr21d.x6ikm8r.x10wlt62.xkyw2dx > div > div.x78zum5.xdt5ytf.x1iyjqo2.x1n2onr6 > div.xod5an3.x1xmf6yo.xf7dkkf.xv54qhq > div > div')
      if (btnSeeMore) {
        btnSeeMore.scrollIntoView({ behavior: 'smooth', block: 'center' })
        btnSeeMore.click()
        await delay(1000)
      }

      // Get list chat and check if the list chat is empty
      const listChat = document?.querySelectorAll('[role="grid"] > div > .html-div.xdj266r.x14z9mp.xat24cr.x1lziwak.xexx8yu.xyri2b.x18d9i69.x1c1uobl')
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
        const btnBreak = document?.querySelector('div > div > div > div.xdg88n9.x10l6tqk.x1tk7jg1.x1vjfegm > div > i')
        if (btnBreak) break

        // Get name chat
        const textNameChat = document?.querySelector('div.html-div.xdj266r.x14z9mp.xat24cr.x1lziwak.xexx8yu.xyri2b.x18d9i69.x1c1uobl.x6s0dn4.x78zum5.x193iq5w > span > span > span.html-span')?.textContent || ''

        // Get list content chat
        let listContentChat = document?.querySelectorAll('div.x78zum5.xdt5ytf.x1iyjqo2.x6ikm8r.x1odjw0f.xish69e.x16o0dkt > div > div')
        if (!listContentChat || !listContentChat.length) continue

        let data = []
        let countLoop = 0
        let lengthListContentChat = listContentChat.length
        for (let j = lengthListContentChat - 1; j >= 0; j--) {
          const textChat = listContentChat[j]?.querySelector('.html-div.xdj266r.x14z9mp.xat24cr.x1lziwak.xexx8yu.xyri2b.x18d9i69.x1c1uobl.xeuugli.x1vjfegm')?.textContent || ''
          const timeChat = listContentChat[j]?.querySelector('.html-div.xexx8yu.xyri2b.x18d9i69.x1c1uobl.xr1yuqi.x11t971q.x4ii5y1.xvc5jky.x1ekjcvx.x2b8uid.x13faqbe')?.textContent || ''

          // Check if the text chat is not empty
          if (textChat && textChat.trim() !== '') {
            data.push({ content: textChat, group: textNameChat, time: timeChat, crawlBy: ${JSON.stringify(accountCrawl)}, userId: 2, type: 'chat', urlContent: urlMessage, idAccount: '1' })
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
          index === self.findIndex((c) => c.content === item.content)
        ).map((c) => {
          const contactUs = Array.from(new Set(c?.content?.match(/\\+?\\d{1,3}(?:[.\\s]?\\d{1,4})+|\\b0\\d{9}\\b/g)
            ?.filter((num, index, self) =>
              self.indexOf(num) === index && num.replace(/\\D/g, '').length >= 9
            )
            ?.map(num => num.match(/\\d+/g)?.join('') || '')
            ?.filter(Boolean) || []))
            ?.join(', ') || '';
          return { ...c, contactUs };
        })

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
    
    const { v4: uuidv4 } = await import('uuid');
    let ipAddress = ''
    const interfaces = os.networkInterfaces();
    for (const iface of interfaces['WLAN']) {
      if (iface.family === "IPv4" && !iface.internal) {
        ipAddress = iface.address
      }
    }

    // Remove duplicate data with field 'idAccount' and 'contactUs'
    const map = new Map();
    const dataUnique = data.filter((item) => {
      const key = `${item.contactUs}`;
      if (!map.has(key)) {
        map.set(key, true);
        return true;
      }
      return false;
    });

    // Add ipAddress to dataUnique
    const dataSave = dataUnique.map(item => ({ ...item, ipAddress: ipAddress, idAccount: uuidv4() })).filter(item => !(item.contactUs === '' || item.contactUs === null || item.contactUs === null));

    if (dataSave.length > 0) {
      for (const item of dataSave) {
        if (!containsPort(item.content.toLowerCase(), PORT_LIST)) continue;
        const res1 = await saveDataFb(item)
        console.log('res1: ', res1)
      }
    }
  }
});

ipcMain.handle('require-action', async (event, action) => {
  if (action === 'paste') {
    console.log('action: ', action)
    await executeAction({ type: action }, 1000)
  }
})
