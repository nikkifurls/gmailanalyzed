const updateDashboard = () => {
	const dashboard = document.querySelector(".dashboard");

	const isLoggedIn = getLoginStatus();
	updateLoginButtons();

	if (isLoggedIn) {

		fetch("/api/getEmailSendersReport")
			.then(response => response.json())
			.then(result => {
				dashboard.innerHTML = 	"<h2>Email Senders Report</h2>" +
										"<p>Senders from the following domains are clogging up your inbox:</p>";
										
				if (result && result.message) {
					dashboard.innerHTML += result.message;
				} else {
					showNotification(`Failed to update dashboard`);
				}
			})
			.catch(error => console.warn(error));

	} else {

		dashboard.innerHTML = "";
	}
}