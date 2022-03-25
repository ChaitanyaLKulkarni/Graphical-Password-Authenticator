console.log("contentScript.js");

const hostname = window.location.hostname;
let passwordField,
    userNameField,
    form,
    tries = 0;
let profile = {};

let autoSubmit = false;

const PASS_LEN = 14;

const delay = (ms) =>
    new Promise((resolve) => {
        tries++;
        tries < 3 && setTimeout(resolve, ms);
    });

function generateRandomPass(len) {
    const capLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const smallLetters = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+.-";

    const charset = capLetters + smallLetters + numbers + symbols;

    let result = "";
    if (window.crypto && window.crypto.getRandomValues) {
        values = new Uint32Array(len);
        window.crypto.getRandomValues(values);
        for (let i = 0; i < len; i++) {
            result += charset[values[i] % charset.length];
        }
        return result;
    } else {
        for (let i = 0; i < len; i++) {
            result += charset[Math.floor(Math.random() * charset.length)];
        }
        return result;
    }
}

const dispatchAllEvents = (domElement) => {
    domElement.dispatchEvent(new Event("focus", { bubbles: true }));
    domElement.dispatchEvent(new Event("keydown", { bubbles: true }));
    domElement.dispatchEvent(new Event("keyup", { bubbles: true }));
    domElement.dispatchEvent(new Event("change", { bubbles: true }));
    domElement.dispatchEvent(new Event("input", { bubbles: true }));
    domElement.dispatchEvent(new Event("blur", { bubbles: true }));
};

const onFormSubmit = (event) => {
    if (!userNameField.value || !passwordField.value) {
        return;
    }
    if (
        !profile ||
        profile.username !== userNameField.value ||
        profile.password !== passwordField.value
    ) {
        if (!confirm("Save/Update info?")) return;
        const newProfile = {
            username: userNameField.value,
            password: passwordField.value,
            hostname,
            encrypt: true,
        };
        popupCheckPattern(newProfile);
        return;
    }
};

function popupCheckPattern(param) {
    window.open(
        chrome.runtime.getURL("validatePattern.html") +
            "?" +
            new URLSearchParams(param).toString(),
        "_blank",
        "toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=yes, copyhistory=no, width=800, height=600, top=100, left=100"
    );
}

function main() {
    passwordField = document.querySelector(
        "input[type=password],input[name=password]"
    );

    if (!passwordField) {
        console.log("Not a password field");
        delay(2000).then(main);
        return;
    }
    userNameField = passwordField.form.querySelector(
        "input[type=text],input[type=email]"
    );

    if (!userNameField) {
        console.log("Not a username field");
        delay(2000).then(main);
        return;
    }

    // Add onsubmit event listener
    form = passwordField.form;
    const passEls = form.querySelectorAll(
        "input[type=password],input[name=password]"
    );
    if (passEls.length > 1) {
        if (!confirm("set random secure password?")) return;
        profile.password = generateRandomPass(10);
        [...passEls].forEach((passEl) => {
            passEl.value = profile.password;
            dispatchAllEvents(passEl);
        });
        return;
    }
    form.addEventListener("submit", onFormSubmit);

    console.log("Calling API", { hostname });
    chrome.runtime.sendMessage({ type: "get_data", hostname }, (response) => {
        console.log("Got response", response);
        if (response.data.length === 0) return;
        // TODO: Popup and then decryt data
        profile = response.data[0];
        if (!confirm("Fill field?")) return;
        popupCheckPattern(profile);
    });
}

window.addEventListener("message", (event) => {
    const { data } = event;
    if (!data.type || data.type !== "PATTERN_VALID" || !data.valid) return;
    console.log("Pattern validated", data);
    profile = data.profile;
    if (profile.encrypt) {
        chrome.runtime.sendMessage(
            {
                type: "save_or_update_data",
                data: {
                    hostname,
                    username: profile.username,
                    password: profile.password,
                    id: profile?.id,
                },
            },
            (response) => {
                console.log("Save data response: ", response);
            }
        );
        return;
    } else {
        userNameField.value = profile.username;
        dispatchAllEvents(userNameField);

        passwordField.value = profile.password;
        dispatchAllEvents(passwordField);

        if (autoSubmit)
            form.querySelector(
                "input[type=submit],button[type=submit]"
            ).click();
    }
});

main();
