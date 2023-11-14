function injectTheScript(code) {
    // Query the active tab, which will be only one tab and inject the script in it.
    //chrome.tabs.query({active: true, currentWindow: true}, tabs => {
     //   chrome.scripting.executeScript({target: {tabId: tabs[0].id}, func: executeTheScript})
    //})
	//eval(code);
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

var scriptMap=new Map();
var interceptMap=new Map();
	
function saveData(){
	//scriptMap.set("test","console.log('saved')");
	var storeData=JSON.stringify(Array.from(scriptMap.entries()));
	localStorage.setItem("userScriptData", storeData);
	//interceptMap.set("test1","a.do,a,abc");
	var storeInterceptData=JSON.stringify(Array.from(interceptMap.entries()));
	localStorage.setItem("userInterceptData", storeInterceptData);
}

function interceptRequest(){
	if(!splitQueryString){
		//to update form data
		function splitQueryString(queryString, keyToUpdate, valueToUpdate) {
			var pairs = queryString.split('&');
			var result = {};
			for (var i = 0; i < pairs.length; i++) {
				var pair = pairs[i].split('=');
				var key = decodeURIComponent(pair[0]);
				var value = decodeURIComponent(pair[1]);
				if (key === keyToUpdate) {
					value = valueToUpdate;
				}
				result[key] = value;
			}
			if (!(keyToUpdate in result)) {
				result[keyToUpdate] = valueToUpdate;
			}
			// Serialize the result object back into a query string
			var updatedQueryString = Object.keys(result).map(function(key) {
				return encodeURIComponent(key) + '=' + encodeURIComponent(result[key]);
			}).join('&');
			return updatedQueryString;
		}
		
		//for get request
		const oldXHROpen = window.XMLHttpRequest.prototype.open;
		window.XMLHttpRequest.prototype.open = function(method, url, ...rest) {
			this._url=url;
			return oldXHROpen.call(this, method, url, ...rest);
		}
		//for post request
		XMLHttpRequest.prototype.realSend = XMLHttpRequest.prototype.send; 
		XMLHttpRequest.prototype.send = function(vData) { 
		var interceptorElement=document.getElementById('interceptorDetails');
			if(interceptorElement){
				var overrides=interceptorElement.getElementsByTagName("span");
				for(var i=0;i<overrides.length;i++){
					var override=overrides[i];
					var overrideUrl=override.getAttribute("url");
					var overrideUrlParam=override.getAttribute("value");
					var overrideParamValue=override.getAttribute("replace");
					var overrideResponseValue=override.getAttribute("response");
					var overrideUrlCheck=override.getAttribute("urlCondition"); 
					if (this._url && (("equals"===overrideUrlCheck && this._url===(overrideUrl)||("contains"===overrideUrlCheck && this._url.includes(overrideUrl))))) {
					if(typeof(vData) === 'string' || vData instanceof String)
						vData=splitQueryString(vData, overrideUrlParam, overrideParamValue);
						break;
					}
				}
			}
			this.addEventListener("readystatechange", function (response) {
				var original_response, modified_response;
				if (this.readyState === 4) {
					if(interceptorElement){
						var overrides=interceptorElement.getElementsByTagName("span");
						for(var i=0;i<overrides.length;i++){
							var override=overrides[i];
							var overrideUrl=override.getAttribute("url");
							var overrideUrlParam=override.getAttribute("value");
							var overrideParamValue=override.getAttribute("replace");
							var overrideResponseValue=override.getAttribute("response");
							var overrideUrlCheck=override.getAttribute("urlCondition"); 
							if (overrideResponseValue && this._url && (("equals"===overrideUrlCheck && this._url===(overrideUrl)||("contains"===overrideUrlCheck && this._url.includes(overrideUrl))))) {
								if(overrideResponseValue.startsWith('response.')){
									var overrideResponseValueExpected = overrideResponseValue.split('response.')[0];
									let [key,value]=overrideResponseValueExpected.split('=');
									original_response = response.target.responseText;
									Object.defineProperty(this, "responseText", {writable: true});
									modified_response = JSON.parse(original_response);
									modified_response.key = value;
									this.responseText = JSON.stringify(modified_response);
								}else{
									setTimeout(eval(overrideResponseValue),1000);
								}
							}
						}
					}
				}
			});
			this.realSend(vData);
		};
		
		function addInterceptorElement(displayName,url,param,replace,response) {
			var interceptorElement=document.getElementById('interceptorDetails');
			if(!interceptorElement){
				var interceptorElement = document.createElement("span");
				interceptorElement.id = "interceptorDetails";
				document.body.appendChild(interceptorElement);
			}
			var newInterceptorDetails=interceptorElement.querySelector(displayName);
			if(!newInterceptorDetails){
				newInterceptorDetails = document.createElement("span");
				newInterceptorDetails.id=displayName;
				newInterceptorDetails.setAttribute("url", url);
				newInterceptorDetails.setAttribute("value", param);
				newInterceptorDetails.setAttribute("replace", replace);
				newInterceptorDetails.setAttribute("response", response);
				newInterceptorDetails.setAttribute("urlCondition", "contains");
				interceptorElement.appendChild(newInterceptorDetails);
			}
		}
	}
}

function executeTheScript(){
	var jsToExecute=event.target.parentElement.children[0];
	var code=jsToExecute.getAttribute("execute");
	injectTheScript(code);
}

function addScriptElement(displayName,inputData,displayExecute) {
    var dynamic=document.getElementById('dynamic');
	var container = document.createElement("div");
	container.id = displayName;
	container.style.display="flex";
	container.style.textAlign= "center";
	dynamic.appendChild(container);
	var jsToExecute = document.createElement("input");
	jsToExecute.type = "text";
	jsToExecute.disabled="disabled";
	jsToExecute.style.width="150px";
	if(inputData && (typeof(inputData) === 'string' || inputData instanceof String)){
		jsToExecute.value=displayName;
		jsToExecute.setAttribute("execute", inputData);
	}
	container.appendChild(jsToExecute);
	if(displayExecute){
		var jsExecuteButton = document.createElement("button");
		jsExecuteButton.addEventListener("click",executeTheScript);
		jsExecuteButton.innerHTML="execute";
		jsExecuteButton.style.marginLeft="10px";
		container.appendChild(jsExecuteButton);
	}
	addExtraButtons(container,displayExecute);
	var newForm=document.getElementById('newForm');
	newForm.hidden=true;
	var executeForm=document.getElementById('executeForm');
	executeForm.hidden=false;
}

function removeTheScript(){
	var mainElement=event.target.parentElement;
	var id=mainElement.id;
	scriptMap.delete(id);
	interceptMap.delete(id);
	saveData();
	mainElement.remove();
}

function removeTheScriptAndInterceptor(){
	var id=event.target.parentElement.id;
	injectTheScript("document.getElementById('interceptorDetails').querySelector('#"+id+"').remove()");
	removeTheScript();
}

function addExtraButtons(container,isExecute){
	var removeButton = document.createElement("button");
	if(isExecute){
		removeButton.addEventListener("click",removeTheScript);
	}else{
		removeButton.addEventListener("click",removeTheScriptAndInterceptor);
	}
	removeButton.innerHTML="delete";
	removeButton.style.marginLeft="10px";
	container.appendChild(removeButton);
}

function addNewOverride(){
	var newForm=document.getElementById('newForm');
	newForm.hidden=false;
	var executeForm=document.getElementById('executeForm');
	executeForm.hidden=true;
}

function saveNewOverride(){
	var selectedType=document.querySelector('input[name="Type"]:checked').value;
	var name=document.getElementById('Name').value;
	if(selectedType==="override param"){
		var selectedUrl=document.getElementById('Url').value;
		var selectedParam=document.getElementById('Param').value;
		var selectedReplacement=document.getElementById('Request').value;
		var selectedResponse=document.getElementById('Response').value;
		injectTheScript("addInterceptorElement('"+name+"','"+selectedUrl+"','"+selectedParam+"','"+selectedReplacement+"','"+selectedResponse+"');");
		addScriptElement(name,selectedUrl,false);
		var newForm=document.getElementById('newForm');
		newForm.hidden=true;
		var executeForm=document.getElementById('executeForm');
		executeForm.hidden=false;
		interceptMap.set(name,selectedUrl+','+selectedParam+','+selectedReplacement+','+selectedResponse);
	}else{
		var selectedScript=document.getElementById('Data').value;
		addScriptElement(name,selectedScript,true);
		scriptMap.set(name,selectedScript);
	}
	saveData();
	clearForm();
}

function clearForm(){
	document.getElementById('Name').value="";
	document.getElementById('Url').value="";
	document.getElementById('Param').value="";
	document.getElementById('Request').value="";
	document.getElementById('Data').value="";
	document.getElementById('Type1'),checked=true;
}
function initilaize(){
	injectTheScript(interceptRequest.toString().replace('function interceptRequest(){','').slice(0, -1));
	var savedScriptData=localStorage.getItem("userScriptData");
	if(savedScriptData){
		scriptMap=new Map(JSON.parse(savedScriptData));
		for (let [key, value] of scriptMap) {
			addScriptElement(key,value,true);	
		}
	}
	var savedInterceptData=localStorage.getItem("userInterceptData");
	if(savedInterceptData){
		interceptMap=new Map(JSON.parse(savedInterceptData));
		for (let [key, value] of interceptMap) {
			let [url,param,replace,...rest] = value.split(',');
			var selectedUrl=url;
			var selectedParam=param;
			var selectedReplacement=replace;
			var selectedResponse=rest.join(',');
			addScriptElement(key,value,false);
			injectTheScript("addInterceptorElement('"+key+"','"+selectedUrl+"','"+selectedParam+"','"+selectedReplacement+"','"+selectedResponse+"');");
		}
	}
}

function updateForm(){
	var isChecked=event.target.checked;
	if(isChecked){
		var formid=event.target.value+" form";
		var allforms = ['override param form','execute directly form'];
		var oldFormid = allforms.filter(function(x) { return x !== formid; });
		var selectedForm=document.getElementById(formid);
		selectedForm.hidden=false;
		var oldForm=document.getElementById(oldFormid[0]);
		oldForm.hidden=true;
	}
}

function cancel(){
	var newForm=document.getElementById('newForm');
	newForm.hidden=true;
	var executeForm=document.getElementById('executeForm');
	executeForm.hidden=false;
}

document.getElementById('add').addEventListener('click',saveNewOverride);
document.getElementById('new').addEventListener('click',addNewOverride);
document.getElementById('cancel').addEventListener('click',cancel);
document.getElementById('Type1').addEventListener('click',updateForm);
document.getElementById('Type2').addEventListener('click',updateForm);

//saveData()
initilaize()