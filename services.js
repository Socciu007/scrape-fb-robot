const axios = require('axios');

const saveDataFb = async (data) => {
  try {
    // http://localhost:3000/moneyapi/userFb
    // https://vn2.dadaex.cn/api/moneyapi/userFb
    const res = await axios.post('https://vn2.dadaex.cn/api/moneyapi/userFb', data)
    return res?.data
  } catch (error) {
    return null
  }
}

// Call api to transform data to data useful (ebvn2)
const transformDataByChatgpt = async () => {
  try {
    // http://localhost:3000/moneyapi/transformRawFb
    // https://vn2.dadaex.cn/api/moneyapi/transformRawFb
    const response = await axios.post('https://vn2.dadaex.cn/api/moneyapi/transformRawFb', { page: 1 });
    return response?.data;
  } catch (error) {
    console.log('Error transforming data: ', error);
    return false;
  }
}

// Fetch the data (group facebook data) from the server CRM
const fetchGroupData = async (page) => {
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
const saveDataWhatsapp = async (data) => {
  try {
    const response = await axios.post('https://www.dadaex.cn/api/vn/crm/addWhatsappDs', data);
    return response?.data;
  }
  catch (error) {
    console.log('Error saving data to database: ', error);
    return false;
  }
} 

// Call api to save data to database (ebvn2)
const saveDataToDatabase = async (data) => {
  try {
    // http://localhost:3000/moneyapi/saveDataFacebook
    // https://vn2.dadaex.cn/api/moneyapi/saveDataFacebook
    const response = await axios.post('https://vn2.dadaex.cn/api/moneyapi/saveDataFacebook', { data: data });
    return response?.data;
  } catch (error) {
    console.log('Error saving data to database: ', error);
    return false;
  }
}


const typeData = `{ 
  content: string,
  contentEn: string, explain: dịch từ content sang tiếng anh
  group: string,
  account: string,
  idAccount: string,
  type: string,
  userId: string,
  crawlBy: string,
  contactUs: string,
  urlZalo: string, explain: URL zalo nằm trong content, e.g: https://zalo.me/g/iivzmw963, https://zalo.me/000123, ...
  urlContent: string,
  urlFacebook: string,
  urlAvatar: string
}`;
const transformType = `{
  origin: string | '', e.g: departure port
  destination: string | '', e.g: destination port
  goods: string | '',
  price: string | '',
  contact: { platform: string, phone: string, zalo: string, facebook: string, whatsapp: string, instagram: string }, e.g: zalo: 0370583843, facebook: 0370583843, ...
  note: string
  rawId: number
  claimBy: string | null
  company: string | null
  urlZalo: string | null
  urlContent: string | null
  idFacebook: string | null, e.g: 100014487341047
  account: string
}`;
// Use Gemini service to transform data
const serviceGemini = async (dataCrawl, typeUse) => {
  try {
    let prompt;
    if (typeUse === 'filter') {
      prompt = { content: `Trích xuất dữ liệu liên quan đến nơi khởi hành/điểm đến, loại hoặc kích thước hàng hóa, báo giá cảng, thời gian giao hàng và dịch nội dung bài viết sang tiếng anh từ: ${JSON.stringify(dataCrawl?.map((item) => item.content))} in ${JSON.stringify(dataCrawl)}. Trả về tất cả dữ liệu theo cấu trúc ${typeData}.` };
    } else if (typeUse === 'transform') {
      prompt = {
        content: `Extract departure port, destination port, cargo details, company name, and price(if available) from ${JSON.stringify(dataCrawl)}. Return the data in the format ${transformType} without any additional words.`
      };
    } else if (typeUse === 'whatsapp') {
      prompt = {
        content: `Trích xuất ra đường link whatsapp từ nội dung: ${JSON.stringify(dataCrawl)}. Trả về định dạng mảng các đường link whatsapp.`
      };
    }

    const result = await axios.post('http://ai.dadaex.cn/backapi/chatGpt/chatAll', {
      content: prompt.content,
      modelType: '2',
      modeName: 'gemini-2.0-flash'
    });
    const objData = result?.data?.data?.res1?.kwargs?.content;
    let cleanObjData = null;
    if (objData.includes('```json')) {
      cleanObjData = objData.split('```json')[1].split('```')[0];
      return JSON.parse(cleanObjData);
    } else {
      return false;
    }
  } catch (error) {
    console.log('Error use Gemini: ', error);
    return false;
  }
}

module.exports = {
  saveDataFb,
  transformDataByChatgpt,
  fetchGroupData,
  saveDataToDatabase,
  serviceGemini,
  saveDataWhatsapp
}