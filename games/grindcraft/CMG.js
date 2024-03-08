window.addEventListener("DOMContentLoaded", () => {
	var splashDiv = document.createElement("div");
	splashDiv.style.width = "100%";
	splashDiv.style.height = "100%";
	splashDiv.style.left = "0%";
	splashDiv.style.top = "0%";
	splashDiv.style.position = "absolute";
	splashDiv.style.display = "block";
	splashDiv.style.zIndex = 999;
	splashDiv.style.backgroundImage = "url('./CoolmathGamesSplash.png')";
	splashDiv.style.backgroundSize = "100% 100%";
	splashDiv.style.color = "white";
	splashDiv.style.overflowY = "auto";
	splashDiv.innerHTML = "";
	splashDiv.id = "splashDiv";
	document.body.appendChild(splashDiv);
	
	setTimeout(function(){
			document.getElementById("splashDiv").remove();
	}, 5000);
});

setInterval(showOnMobile, 1000 * 60 * 5); //every 5 minutes show small "available on mobile" prompt for 10 seconds
function showOnMobile()
{
	var onMobilePrompt = document.createElement("div");
	onMobilePrompt.style.width = "224px";
	onMobilePrompt.style.height = "89px";
	onMobilePrompt.style.left = "1px";
	onMobilePrompt.style.bottom = "1px";
	onMobilePrompt.style.position = "absolute";
	onMobilePrompt.style.display = "block";
	onMobilePrompt.style.zIndex = 999;
	onMobilePrompt.style.backgroundImage = "url('./OnMobilePrompt.png')";
	onMobilePrompt.style.backgroundSize = "100% 100%";
	onMobilePrompt.style.color = "white";
	onMobilePrompt.style.overflowY = "auto";
	onMobilePrompt.innerHTML = "";
	onMobilePrompt.id = "onMobilePrompt";
	document.body.appendChild(onMobilePrompt);
	
	setTimeout(function(){
			document.getElementById("onMobilePrompt").remove();
	}, 10000);
}