// const jsQR = require('jsqr');
// const { Jimp } = require('jimp');
// const axios = require('axios');

// async function checkQRCodeFromUrl(imageUrl) {
//   try {
//     const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
//     const image = await Jimp.read(response.data);
    
//     // Convert image to Uint8ClampedArray (RGBA)
//     const imageData = new Uint8ClampedArray(image?.bitmap?.data);
    
//     // Perform QR code scanning using jsQR
//     const code = jsQR(imageData, image.bitmap.width, image.bitmap.height);

//     if (code) {
//       return { isQRCode: true, data: code.data };
//     } else {
//       return { isQRCode: false, data: null };
//     }

//   } catch (error) {
//     return { isQRCode: false, data: null, error: error.message };
//   }
// }

// // Test hàm
// const testImageUrl = 'https://scontent.fhan14-2.fna.fbcdn.net/v/t39.30808-6/483428559_1175947493932954_7035354696680862905_n.jpg?_nc_cat=100&ccb=1-7&_nc_sid=aa7b47&_nc_ohc=2OnSyshD0SUQ7kNvgEMFMva&_nc_oc=Adn-_d6astLYC-FDrwKaeWZ8c8m-LHJ47Nwc72LDAhIJmWDxEByzaO8gsITMEh3nG0gTBNTXb7DcSVeoxYJZWkQ6&_nc_zt=23&_nc_ht=scontent.fhan14-2.fna&_nc_gid=iEaxdh9mZDfwTzc_Y3DiWQ&oh=00_AYH9-17qo81dhvZ7BYorQgec47bBHBBOJZ46BnHB23TtjQ&oe=67E8012A';

// checkQRCodeFromUrl(testImageUrl)
//   .then(result => {
//     console.log('result: ', result)
//     if (result.isQRCode) {
//       console.log('✅ Đây là QR code!');
//       console.log('Nội dung:', result.data);
//     } else {
//       console.log('❌ Không phải QR code.');
//     }
//   })
//   .catch(err => console.error(err));

const { defaultFormats } = require("jimp");
const os = require("os");
const { execPath, setFdLimit } = require("process");
const { duplexPair } = require("stream");

const interfaces = os.networkInterfaces();
for (const iface of interfaces['WLAN']) {
  if (iface.family === "IPv4" && !iface.internal) {
    console.log("Local IP:", iface.address)
  }
}