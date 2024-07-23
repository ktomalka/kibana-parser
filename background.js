chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "kibana-parser",
      title: "Kibana Parser",
      contexts: ["selection"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "kibana-parser") {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: checkSelectedText,
            args: [info.selectionText]
        });
    }
});

const checkSelectedText = (selectionText) => {
    const jsonText = selectionText.trim();

    try {
        const fullLog = JSON.parse(jsonText);

        if (fullLog.log) {
            try {
                fullLog.log = JSON.parse(fullLog.log)
            } catch {
                fullLog.log = fullLog.log;
            }
        }

        if (fullLog?.log?.data) {
            fullLog.log.data = typeof fullLog.log.data === 'object' ? fullLog.log.data : JSON.parse(fullLog.log.data);

            fullLog.log.data = fullLog.log.data.map((item) => {
                try {
                    let text = item;

                    if (text.endsWith(';')) text = text.slice(0, -1).trim();

                    const firstBraceIndex = text.indexOf('{');
                    if (firstBraceIndex !== -1) text = text.substring(firstBraceIndex).trim();

                    const lastBraceIndex = text.lastIndexOf('}');
                    if (lastBraceIndex !== -1) text = text.substring(0, lastBraceIndex + 1).trim();

                    return {
                        loggerText: item.replace(/(\{.*\})/, '{...}'),
                        data: JSON.parse(text),
                    };
                } catch {
                    return item;
                }
            })
        }

        const range = window.getSelection().getRangeAt(0);
        const newNode = document.createElement('pre');

        newNode.textContent = JSON.stringify(fullLog, null, 4);
        range.deleteContents();
        range.insertNode(newNode);

        console.log('KIBANA PARSER:', fullLog)
    } catch (e) {
        console.error(e)
    }
}
