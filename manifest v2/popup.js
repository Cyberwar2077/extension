function injectTheScript(script) {
    // Query the active tab, which will be only one tab and inject the script in it.
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
        chrome.scripting.executeScript({target: {tabId: tabs[0].id}, func: executeTheScript})
    })
}

function executeTheScript(){
	console.log('happy');
}

function addElement() {
    var dynamic=document.getElementById('dynamic');
	var container = document.createElement("div");
	container.id = "container";
	container.style.display="flex";
	container.style.textAlign= "center";
	dynamic.appendChild(container);
	var jsToExecute = document.createElement("input");
	jsToExecute.type = "text";
	container.appendChild(jsToExecute);
	var jsExecuteButton = document.createElement("button");
	jsExecuteButton.addEventListener("click",executeTheScript);
	jsExecuteButton.innerHTML="execute";
	jsExecuteButton.style.marginLeft="10px";
	container.appendChild(jsExecuteButton);
	
}
document.getElementById('add').addEventListener('click',addElement);