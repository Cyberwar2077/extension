function injectTheScript(code) {
    // Query the active tab, which will be only one tab and inject the script in it.
    //chrome.tabs.query({active: true, currentWindow: true}, tabs => {
     //   chrome.scripting.executeScript({target: {tabId: tabs[0].id}, func: executeTheScript})
    //})
	chrome.tabs.query({active: true, currentWindow: true}, tabs => {
        chrome.scripting.executeScript({target: {tabId: tabs[0].id}, func: code => {
		  const el = document.createElement('script');
		  el.textContent = code;
		  document.documentElement.appendChild(el);
		  el.remove();
		},
		args: [code],world: 'MAIN'})
    })
}

function save(){
	localStorage.setItem("userData", "console.log('saved')");
}

function executeTheScript(){
	var code=event.target.parentElement.children[0].value;
	injectTheScript(code);
}

function addElement(inputData) {
    var dynamic=document.getElementById('dynamic');
	var container = document.createElement("div");
	container.id = "container";
	container.style.display="flex";
	container.style.textAlign= "center";
	dynamic.appendChild(container);
	var jsToExecute = document.createElement("input");
	jsToExecute.type = "text";
	if(inputData){
		jsToExecute.value=inputData;
	}
	container.appendChild(jsToExecute);
	var jsExecuteButton = document.createElement("button");
	jsExecuteButton.addEventListener("click",executeTheScript);
	jsExecuteButton.innerHTML="execute";
	jsExecuteButton.style.marginLeft="10px";
	container.appendChild(jsExecuteButton);
	
}
function initilaize(){
	var savedData=localStorage.getItem("userData");
	addElement(savedData);
}
document.getElementById('add').addEventListener('click',addElement);
save()
initilaize()