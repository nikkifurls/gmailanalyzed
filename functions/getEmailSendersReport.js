exports.handler = async event => {

	getEmails()
	.then(
		emails => {
			// Get email senders report from list of email IDs

			// Count number of each sender
			let senderStats = [];

			emails.forEach((emailData, emailIndex) => {

				const senders = [
					emailData.domain,
					// emailData.email,
					// emailData.name
				];

				senders.forEach((sender, senderIndex) => {
					// If sender exists in senderStats, add to current value
					// Else, add to senderStats with value = 1
					const searchIndex = senderStats.findIndex(senderStat => senderStat.sender == sender);
					
					if (searchIndex > -1) {
						senderStats[searchIndex].count += 1;
					} else {
						senderStats.push({
							sender: sender,
							count: 1
						});
					}

					// Last sender of last email
					if ((typeof emails[emailIndex + 1] === "undefined") && (typeof senders[senderIndex + 1] === "undefined")) {

						// Remove any < 5
						// Sort ascending
						senderStats = senderStats.filter(senderStat => senderStat.count > 4);
						senderStats = senderStats.sort((senderStatA, senderStatB) => senderStatB.count - senderStatA.count);
						
						// Display
						let output = "<ul>";

						senderStats.forEach((senderStat, senderStatIndex) => {
							output += `<li><a target="_blank" href="https://mail.google.com/mail/u/0/?#search/from%3A%40${senderStat.sender}+in%3Ainbox">You have ${senderStat.count} emails from ${senderStat.sender}</a></li>`;

							// Last stat
							if (typeof senderStats[senderStatIndex + 1] === "undefined") {
								output += "</ul>";
								
								return {
									statusCode: 200,
									// body: JSON.stringify({ message: output })
									body: JSON.stringify({ message: "Hello!" })
								};
							}
						})
					}
				});
			});
		}
	);
}

// Later:
// - Set auth cookies with auth token using gapi.auth.getToken and gapi.auth.setToken
// - Refresh auth token after 45min by calling gapi.auth.authorize with the client ID, the scope, and immediate:true as parameters.
// After the initial user authorization, calls to gapi.auth.authorize that use immediate:true mode obtain an auth token without user interaction.

// Get emails for a user, with an optional query
const getEmails = (query = "INBOX") => {

	return new Promise((resolve, reject) => {

		let emails = [];
		let emailsData = [];
		let config = {
			"userId": "me",
			"labelIds": query,
		};

		const getPageOfEmails = () => {
			gapi.client.gmail.users.messages.list(config).then(
				response => {
					if (response.result.messages) {
						emails = emails.concat(response.result.messages);
					}

					if (response.result.nextPageToken) {
						config.pageToken = response.result.nextPageToken;
						getPageOfEmails();
					} else {
						emails.forEach(email => {
							getEmailData(email.id, "me")
								.then(emailData => {
									emailsData.push(emailData);
									if (emailsData.length == emails.length) {
										resolve(emailsData);
									}
								});
						});
					}
				},
				reason => {
					console.warn(`getEmails(): ${reason.result.error.message}`);
				}
			);
		};

		getPageOfEmails();
	});
}

// Get specific email message data by id
const getEmailData = emailId => {

	const config = {
		"userId": "me",
		"id": emailId
	};

	if (emailId) {

		return new Promise((resolve, reject) => {
			gapi.client.gmail.users.messages.get(config).then(
				response => {
					if (response.result.payload.headers !== undefined) {

						let sender = getEmailSender(response.result.payload.headers);
						let subject = getEmailSubject(response.result.payload.headers);
						let date = getEmailDate(response.result.payload.headers);
				
						// Resolve promise with email data
						resolve({
								name: sender.name,
								email: sender.email,
								domain: sender.domain,
								subject: subject,
								date: date,
							}
						);
				
					} else {
						reject(Error("getEmailData(): response.result.payload.headers is null"));
					}
				},
				reason => {
					console.warn(`getEmailData(): ${reason.result.error.message}`);
				}
			);
		});

	} else {

		console.warn("getEmailData(): emailId is null");
	}
}

// Extract email sender (name and email) from email header
const getEmailSender = headers => {

	let emailSender = {
		name: "",
		email: "",
		domain: ""
	};

	if (headers) {

		let senderEmailHeader = getEmailHeader(headers, "From");

		if (senderEmailHeader && (typeof senderEmailHeader == "object")) {

			senderEmailHeader.forEach(result => {

				if (result) {
					let senderEmailParts = result.split("<");

					if ((typeof senderEmailParts == "object") && (typeof senderEmailParts !== "undefined") && (senderEmailParts !== null)) {
						
						if (senderEmailParts.length > 1) {
							emailSender.name = senderEmailParts[0].replace(/\"|<|>/g, "").trim();
							emailSender.email = senderEmailParts[1].replace(/\"|<|>/g, "").trim();
						} else {
							emailSender.name = "";
							emailSender.email = senderEmailParts[0].replace(/\"|<|>/g, "").trim();
						}
					} else {
						console.warn("getEmailSender(): senderEmailParts not set");
					}

					let senderEmailDomainParts = emailSender.email.split("@");

					if ((typeof senderEmailDomainParts == "object") && (senderEmailDomainParts.length > 1)) {

						let senderEmailSubdomainParts = senderEmailDomainParts[1].split(".");

						if (senderEmailSubdomainParts.length > 2) {
							// Domain has subdomain, get root domain
							emailSender.domain = `${senderEmailSubdomainParts[senderEmailSubdomainParts.length-2]}.${senderEmailSubdomainParts[senderEmailSubdomainParts.length-1]}`;

						} else {
							emailSender.domain = senderEmailDomainParts[1].trim();
						}
					} else {
						console.warn("getEmailSender(): senderEmailDomainParts[1] not set");
					}

				} else {
					console.warn("getEmailSender(): result is null");
				}
			});
		} else {
			console.warn("getEmailSender(): senderEmailHeader either null or not an array");
		}
	} else {
		console.warn("getEmailSender(): headers is null");
	}

	return emailSender;
}

// Extract email subject from email header
const getEmailSubject = headers => {

	let emailSubject = "";

	if (headers) {

		let senderEmailHeader = getEmailHeader(headers, "Subject");

		if (senderEmailHeader && (typeof senderEmailHeader == "object")) {

			senderEmailHeader.forEach(result => {
				emailSubject = result;
			});

		} else {
			console.warn("getEmailSubject(): senderEmailHeader either null or not an array");
		}
	} else {
		console.warn("getEmailSubject(): headers is null");
	}

	return emailSubject;
}

// Extract email date from email header
const getEmailDate = headers => {

	let emailDate = "";

	if (headers) {

		let senderEmailHeader = getEmailHeader(headers, "Date");

		if (senderEmailHeader && (typeof senderEmailHeader == "object")) {
			
			senderEmailHeader.forEach(result => {
				emailDate = result;
			});

		} else {
			console.warn("getEmailDate(): senderEmailHeader either null or not an array");
		}
	} else {
		console.warn("getEmailDate(): headers is null");
	}

	return emailDate;
}

// Get contents of header by type
// where headerType is "From", "Subject", etc.
const getEmailHeader = (headers, headerType) => {

	let headerData = [];

	if (headers && headerType) {

		headers.forEach(result => {
			if ((typeof result.name !== undefined) && (typeof result.value !== undefined) && (result.name == headerType)) {
				headerData.push(result.value);
			}
		});
		
	} else {

		if (!headers && !headerType) {

			errorMessage = "headers and headerType are both null";

		} else {

			if (!headers) {
				errorMessage = "headers is null";
			}

			if (!headerType) {
				errorMessage = "headerType is null";
			}
		}

		console.warn(`getEmailHeader(): ${errorMessage}`);
	}

	return headerData;
}