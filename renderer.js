// renderer.js

// renderer.js

// 获取从主进程暴露的 robot 模块
// const { remote } = require('electron');
// const robot = remote.getGlobal('robot');

// Handle run scrape
async function handleRunScrape() {
    var account = document.getElementById("account").value;
    var password = document.getElementById("password").value;
    try {
        // Send data from renderer process (frontend) to main process by using electronBridge in preload.js
        window.electronBridge.handleSelectAccount({ account, password });
    } catch (err) {
        console.error('Failed to execute robot actions:', err);
    }
}

// Handle change account
async function handleChangeAccount() {
    // List of accounts and passwords
    const accounts = {
        "shanghaifanyuan613@gmail.com": "Fago1618@",
        "fanyuanmy@gmail.com": "Damonbnh_123",
        "shanghaifangyuanvn@gmail.com": "Damonbnh_8",
        "Natalie@sfyf.cn": "Aa123456@",
    };
    var account = document.getElementById("account");
    var password = document.getElementById("password");
    // When selecting an account, update the password input
    account.addEventListener("change", () => {
        const selectedAccount = account.value;
        password.value = accounts[selectedAccount] || ""; // Assign the corresponding password or empty if not available
    });

    // Assign the initial password when the page loads
    password.value = accounts[account.value] || "";
}

// 监听主进程的 auto-start 事件
// window.electronBridge.onAutoStart(() => {
//     handleSelectAccount();
// });