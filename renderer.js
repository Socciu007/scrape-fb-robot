// renderer.js

// renderer.js

// 获取从主进程暴露的 robot 模块
// const { remote } = require('electron');
// const robot = remote.getGlobal('robot');

// Handle run scrape
async function handleRunScrape() {
    const accounts = []
    const accountElements = document.querySelectorAll(".container-input")
    console.log('element', accountElements);
    console.log('accountElements', accounts)
    try {
        accountElements.forEach(element => {
            const account = element.querySelector(".account-select").value;
            const password = element.querySelector(".password-input").value;
            accounts.push({ account, password });
        })
        console.log('accounts', accounts)
        // Send data from renderer process (frontend) to main process by using electronBridge in preload.js
        window.electronBridge.handleSelectAccount(accounts);
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
    var account = document.getElementById("account1");
    var password = document.getElementById("password");


    // When selecting an account, update the password input
    account.addEventListener("change", () => {
        const selectedAccount = account.value;
        password.value = accounts[selectedAccount] || ""; // Assign the corresponding password or empty if not available
    });
    // When selecting an account, update the password input
    // account.addEventListener("change", () => {
    //     const selectedAccount = account.value;
    //     password.value = accounts[selectedAccount] || ""; // Assign the corresponding password or empty if not available
    // });

    // Assign the initial password when the page loads
    password.value = accounts[account.value] || "";
}

// Handle add account
async function handleAddAccount(accountCount) {
    const accountsContainer = document.getElementById("accountsContainer")
    const btnRemoveAccount = document.getElementById("btnRemoveAccount")
    accountCount += 1
    const accountDiv = document.createElement("div")
    accountDiv.classList.add("container-input")

    accountDiv.innerHTML = `
      <h2>Account ${accountCount}: </h2>
      <select class="item account-select" id="account${accountCount}" type="text">
        <option value="fanyuanmy@gmail.com">fanyuanmy@gmail.com</option>
        <option value="shanghaifanyuan613@gmail.com">shanghaifanyuan613@gmail.com</option>
        <option value="shanghaifangyuanvn@gmail.com">shanghaifangyuanvn@gmail.com</option>
      </select>
      <input
        class="item password-input"
        type="password"
        id="password${accountCount}"
        placeholder="Password"
      />
    `

    accountsContainer.appendChild(accountDiv)
    btnRemoveAccount.style.display = "inline"
    btnRemoveAccount.innerText = "Remove Account"

    // Apply Select2 to the new select field
    $(accountDiv.querySelector(".account-select")).select2({
        tags: true, // Allow new values
        multiple: false, // Only select one value
        placeholder: "Select or enter email",
        allowClear: true,
        tokenSeparators: [",", " "], // Press Enter or comma to add
    })

    // When the user enters a new email, automatically select it
    $(accountDiv.querySelector(".account-select")).on(
        "select2:select",
        function (e) {
            let newValue = e.params.data.id
            $(this).val(newValue).trigger("change")
        }
    )

    // When the user clicks the remove account button, remove the account
    btnRemoveAccount.addEventListener("click", () => {
        accountDiv.remove()
        btnRemoveAccount.style.display = "none"
        accountCount -= 1

        document.getElementById("alert-message").style.display = "none"
    })
}