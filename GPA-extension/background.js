chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log(
        sender.tab
            ? "from a content script:" + sender.tab.url
            : "from the extension"
    );
    switch (request.type) {
        case "get_data":
            getData(request.hostname).then((data) => {
                sendResponse({
                    data: data,
                });
            });
            break;
        case "save_or_update_data":
            console.log(request.data);
            saveOrUpdateData(request.data).then((data) => {
                sendResponse({
                    data: "ok",
                });
            });
            break;
        default:
            break;
    }
    return true;
});

const getData = async (hostname) =>
    fetch(`http://localhost:3000/profile?hostname=${hostname}`)
        .then((res) => res.json())
        .then((data) => data);

const saveOrUpdateData = async (data) => {
    if (data.id) {
        return fetch(`http://localhost:3000/profile/${data.id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        }).then((res) => res.json());
    }
    return fetch(`http://localhost:3000/profile`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    })
        .then((res) => res.json())
        .then((data) => data);
};
