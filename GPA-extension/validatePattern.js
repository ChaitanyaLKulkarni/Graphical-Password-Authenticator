const profile = Object.fromEntries(
    new URLSearchParams(window.location.search).entries()
);

const PASS_LEN = 12;
if (profile.generate) {
    profile.password = CryptoJS.lib.WordArray.random(PASS_LEN).toString(
        CryptoJS.enc.Base64url
    );
    sendResponse({ type: "GENERATE", profile });
}

const selectedPattern = [];

function encrypt(msg, pass) {
    try {
        return CryptoJS.AES.encrypt(msg, pass).toString();
    } catch (e) {}
    return "";
}

function decrypt(msg, pass) {
    try {
        return CryptoJS.AES.decrypt(msg, pass).toString(CryptoJS.enc.Utf8);
    } catch (e) {}
    return "";
}

function checkPattern() {
    // TODO: This try to decrypt the password with the selected pattern if not success then it will try again
    let password = "";
    selectedPattern.forEach((pId) => {
        document
            .querySelector(`.img[data-p-id="${pId}"]`)
            .classList.remove("selected");
        password += pId;
    });

    selectedPattern.length = 0;
    console.log("Password before: ", profile.password);

    let modifiedPass;
    if (profile.encrypt) {
        // TODO: Check in https://password.kaspersky.com/ with SHA1 of password to see if it good or not
        modifiedPass = encrypt(profile.password, password);
    } else {
        modifiedPass = decrypt(profile.password, password);
    }

    if (!modifiedPass) {
        alert("Wrong Pattern");
        return;
    }
    profile.password = modifiedPass;
    console.log("Password: ", profile.password);
    sendResponse({ type: "PATTERN_VALID", valid: true, profile });
}

function onImgClick(event) {
    const pId = event.target.dataset.pId;
    if (selectedPattern.includes(pId)) {
        return;
    }
    selectedPattern.push(pId);
    event.target.classList.add("selected");
    if (selectedPattern.length === 3) {
        checkPattern();
    }
}

function createImgs(imgs) {
    imgs.forEach((img) => {
        const imgEl = document.createElement("img");
        imgEl.src = img.src;
        imgEl.dataset.pId = img.id;
        imgEl.classList.add("img");
        imgEl.addEventListener("click", onImgClick);
        document.querySelector(".pattern-container").appendChild(imgEl);
    });
}

const imgs = [
    {
        src: "https://m.media-amazon.com/images/I/51AsTzERRQL._SX679_PIbundle-54,TopRight,0,0_SX679SY339SH20_.jpg",
        id: "CAD01",
    },
    {
        src: "https://www.bigbasket.com/media/uploads/p/xxl/281026-2_3-cadbury-dairy-milk-chocolate.jpg",
        id: "CAD02",
    },
    {
        src: "https://soulbowl.in/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/c/a/cadbury_perk5.jpg",
        id: "CAD03",
    },
    {
        src: "https://cdn.shopify.com/s/files/1/0046/5285/9482/products/Nestle.MilkyBar.jpg?v=1584540031",
        id: "CAD04",
    },
    {
        src: "https://newassets.apollo247.com/pub/media/catalog/product/1/_/1_3_4.png",
        id: "CAD05",
    },
];

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

shuffleArray(imgs);
createImgs(imgs);

function sendResponse(response) {
    window.opener.postMessage(response, "*");
    window.close();
    //     window.opener.postMessage({ type: "PATTERN_VALID", valid: true }, "*");
}
