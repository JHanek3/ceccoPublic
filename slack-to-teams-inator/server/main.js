const fs = require('fs')
const path = require('path')
const msal = require('@azure/msal-node');
require('dotenv').config();
const axios = require('axios')
const { dashLogger } = require("./logger")
const { formattedTime, base64Encode } = require("./helpers.js");

// Found in the Azure portal
const config = {
    auth: {
        clientId: process.env.CLIENT_ID,
        authority: process.env.AUTHORITY,
        clientSecret: process.env.CLIENT_SECRET
    }
}

// Creates msal application object
const cca = new msal.ConfidentialClientApplication(config);

// With client credentials flows permissions need to be granted in the portal by a tenant administrator. What this means to me: When the applications needs permissons like
// Teamwork.Migrate.All, Regardless of Admin Consent, the permission needs to be granted by the Admin Consent.
// Note: Type of API permisson will be Application, not Delegated
async function getAccessToken() {
    let accessToken = ""
    const clientCredentialRequest = {
        // Only resource needed
        scopes: ["https://graph.microsoft.com/.default"], 
    };
    
    await cca.acquireTokenByClientCredential(clientCredentialRequest).then((response) => {
        console.log("Token acquired");
        accessToken = response.accessToken
        }).catch((err) => {
            console.error("Error @ Token generation...")
            dashLogger.error(`Error @ Token generation: ${err}`)
        });
    return accessToken
}

// Creates the microsoft team
async function createTeam(accessToken) {
    let teamID = ""

    let options = {
        headers: {"Authorization": accessToken, "content-type": "application/json"}
    }

    // tried currentTime for teams creation, got weird message import error, I believe this is due to the millisecond error
    // However, I would like the team and channels to be created before all messages
    // let currentTime = await formattedTime(new Date())
    // UPDATE HERE 
    let slackCreation = await formattedTime(new Date("August 01, 2013 00:01:00"))
    const teamData = JSON.stringify({
        "@microsoft.graph.teamCreationMode": "migration",
        "template@odata.bind": "https://graph.microsoft.com/v1.0/teamsTemplates('standard')",
        "displayName": "Sample with Two Folders",
        "description": "Slack to Teams test run",
        "createdDateTime": slackCreation
    })

    await axios.post("https://graph.microsoft.com/v1.0/teams", teamData, options)
        .then((response) => {
            console.log("Team Created")
            teamID = response.headers.location
        })
        .catch((err) => {
            console.error("Error @ Team creation...")
            dashLogger.error(`Error @ Team creation: ${err.response.data.error.message}`)
        });
    teamID = teamID.split("/")
    teamID = teamID[1].replace("teams(", "")
    teamID = teamID.replace(")", "")
    teamID = teamID.replaceAll("'", "")
    console.log("Team ID acquired")
    return teamID
}

// Get the users.json from data folder
// Slack export is stored in a folder titled data and is in the same level as server
async function getUsersPath() {
    try {
        if (fs.existsSync(path.join(__dirname, "../dummyData/users.json"))) {
            return path.join(__dirname, "../dummyData/users.json")
        } else {
            console.error("No users.json found...")
            dashLogger.error("No users.json found...")
        }
        
    }
    catch (err) {
        console.error("Error @ Getting Users Path...")
        dashLogger.error(`Error @ Team creation: ${err}`)
    }
}

// Create a users dictionary containing user information (id, name)
async function getUsersDict(path) {
    let usersDict = {}
    let count = 1
    let rawdata = fs.readFileSync(path)
    let users = JSON.parse(rawdata)
    users.forEach((user) => {
        // Some users were deleted and returned undefined
        if (!user.real_name) {
            user.real_name = "Deleted"
        }
        usersDict[user.id] = [count, user.real_name] 
        count +=1
    })
    return usersDict
}

// Creates a list of all Directories in the data Folder
async function getAllDirectories() {
    const dataPath = path.join(__dirname, "../dummyData")
    let directories = []
    let possibles = fs.readdirSync(dataPath, function (err) {
        if (err) {
            dashLogger.error("Unable to scan data directory: " + err)
            return console.log("Unable to scan data directory: " + err)
        }
    })
    possibles.forEach(possible => {
        let possibleStat = fs.statSync(dataPath + `\\${possible}`).isDirectory()
        if (possibleStat) {
            directories.push(possible)
        }
    })
    return directories
}

// Creates a channel and returns its ID
async function createChannel(accessToken, teamID, channelName) {
    let channelID = ""

    let options = {
        headers: {"Authorization": accessToken, "content-type": "application/json"}
    }

    let slackCreation = await formattedTime(new Date("August 01, 2013 00:01:00"))

    const channelData = JSON.stringify({
        "@microsoft.graph.channelCreationMode": "migration",
        "displayName": channelName,
        "description": `Description of ${channelName}`,
        "membershipType": "standard",
        "createdDateTime": slackCreation,
    })

    await axios.post(`https://graph.microsoft.com/v1.0/teams/${teamID}/channels`, channelData, options)
        .then((response) => {
            console.log(`Channel Created for ${channelName}`)
            channelID = response.data.id
        })
        .catch((err) => {
            console.error("Error @ Channel creation...")
            dashLogger.error("Unable to create Channel: " + err.response.data.error.message)
        })
    return channelID
}

// formats the messages to be sent, json has a files array for multiple photos
// while messages have no such files array
async function formatMessages(data, dic, directoryPath) {
        
    let messages = []
        if (typeof data.files !== "undefined") {
            
            let text = data.text;
            let innerContent = ""
            let hostedContent = []
            let user = dic[data.files[0].user][1]
            let time = await formattedTime(new Date(data.files[0].timestamp * 1000))
            
            // innerContent and hostedContent deal with posting multiple images in one message
            for (let count = 0; count < data.files.length; count ++) {
                let fileName = data.files[count].name
                let fileMimetype = data.files[count].mimetype
                let picturePath = path.join(directoryPath,`./Files/${fileName}`)
                let content = await base64Encode(picturePath)

                if (fileMimetype.includes("mp4")) {
                    innerContent += `<span><video height=\"500\" src=\"../hostedContents/${count + 1}/$value\" width=\"750\" style=\"vertical-align:bottom; width:500px; height:500px\"></span>`
                } else {
                    innerContent += `<span><img height=\"500\" src=\"../hostedContents/${count + 1}/$value\" width=\"750\" style=\"vertical-align:bottom; width:500px; height:500px\"></span>`
                }
                
                hostedContent.push(
                    {
                        "@microsoft.graph.temporaryId": `${count + 1}`,
                        "contentBytes": content,
                        "contentType": fileMimetype
                    })
                }

                const messageData = JSON.stringify({
                    "createdDateTime": time,
                    "from": {
                        "user": {
                            "id": "",
                            "displayName": user,
                            "userIdentityType":"aadUser"
                            }
                        },
                    "body": {
                        "contentType":"html",
                        "content":
                            `<div>
                                <div>
                                    \n
                                    <div>
                                        ${innerContent}
                                        <br>
                                        <span>${text}</span>
                                        \n\n
                                    </div>
                                    \n
                                    \n
                                    \n
                                </div>
                                \n
                            </div>`
                        },
                    "hostedContents": hostedContent
                })
                messages.push(messageData)
            
            } else {
                const messageData = JSON.stringify({
                    "createdDateTime": `${data.ts}`,
                    "from":{
                        "user":{
                            // user doesn't exist yet so leave id blank
                            "id": "",
                            "displayName": dic[data.user][1],
                            "userIdentityType":"aadUser"
                            }
                        },
                    "body":{
                        "contentType": "html",
                        "content": `${data.text}`
                        }
                    })
                messages.push(messageData)
            }
        return messages
}

// Function to that sends the message to given channelID and TeamID
async function sendMessage(accessToken, teamID, channelID, message) {
        
    messageData = JSON.parse(message)
        
    let options = {
        headers: {"Authorization": accessToken, "content-type": "application/json"}
    }
    
    await axios.post(`https://graph.microsoft.com/v1.0/teams/${teamID}/channels/${channelID}/messages`, messageData, options)
        .then(() => {
            console.log(`${messageData.from.user.displayName} @ ${messageData.createdDateTime} imported...`)
        })
        .catch((err) => {
            console.error(`Error @ import message for ${messageData.from.user.displayName} @ ${messageData.createdDateTime}`)
            dashLogger.error(`Unable to import message for: ${messageData.from.user.displayName} @ ${messageData.createdDateTime} ` + err.response.data.error.message)          
        })  
}

// Function to close channel of current directory
async function closeChannel(accessToken, teamID, channelID, teamName) {
    let config = {
        headers: {Authorization: `Bearer ${accessToken}`}
    }

    // needs dummy body to not push config into data and not headers BIG DUMD
    const bodyParameters = {
        key: "value"
    }

    await axios.post(`https://graph.microsoft.com/v1.0/teams/${teamID}/channels/${channelID}/completeMigration`, bodyParameters, config)
        .then(() => {
            console.log(`Channel Closed for ${teamName}`)
        })
        .catch((err) => {
            console.log(err.response)
        })
}


// Loop through the directories to create a channnel, then loop through their corresponding JSON/Files and send messages. At the end of the directory close the channel
async function workhorse(dirs, dic, accessToken, teamID) {
    for (const directory of dirs) {
        
        let channelID = await createChannel(accessToken, teamID, directory)
        // let channelID = ""
        
        let directoryPath = path.join(__dirname, `../dummyData/${directory}`)
        let possibleFiles = fs.readdirSync(directoryPath, function (err) {
            if (err) {
                console.error("Error @ reading files in directory...")
                dashLogger.error("Error @ reading files in directory: " + err)
            }
        })
        
        for (const file of possibleFiles) {
            let fileStat = fs.statSync(path.join(directoryPath, `\\${file}`)).isFile()
            if (fileStat) {
                let rawData = fs.readFileSync(directoryPath + `\\${file}`)
                let data = JSON.parse(rawData)

                // remove all channel join messages and updateTS timestamp is unix this converts it to what teams wants
                let noUsers = []
                for (const entry of data) {
                    if (entry.subtype !== "channel_join") {
                        entry.ts = await formattedTime(new Date(entry.ts * 1000))
                        noUsers.push(entry)
                    }
                }

                for (const entry of noUsers) {
                    let toBeDelivered = await formatMessages(entry, dic, directoryPath)
                    // console.log(toBeDelivered)
                    for (const msg of toBeDelivered) {
                        await sendMessage(accessToken, teamID, channelID, msg)
                    }
                }
            }
        }
        await closeChannel(accessToken, teamID, channelID, directory)
    }
}

// Close General Channel, otherwise team is not ready to close Migration
async function closeGeneral(accessToken, teamID) {

    let config = {
        headers: {Authorization: `Bearer ${accessToken}`}
    }

    // needs dummy body to not push config into data and not headers BIG DUMD
    const bodyParameters = {
        key: "value"
    }

    let re = /^General$/
    let channelID = ""
    // Needed Mikey
    await axios.get(`https://graph.microsoft.com/v1.0/teams/${teamID}/channels`, config)
        .then((response) => {
            // console.log(response)
            response.data.value.forEach((channel) => {
                if (re.test(channel.displayName)) {
                    channelID = channel.id
                }
            })
        })
    
    
    await axios.post(`https://graph.microsoft.com/v1.0/teams/${teamID}/channels/${channelID}/completeMigration`, bodyParameters, config)
        .then(() => {
            console.log("General Channel Closed")
        })
        .catch((err) => {
            console.log(err.response)
        })

}

// Close Team and End Migration
async function closeTeam(accessToken, teamID) {
    let config = {
        headers: {Authorization: `Bearer ${accessToken}`}
    }

    const bodyParameters = {
        key: "value"
    }

    await axios.post(`https://graph.microsoft.com/v1.0/teams/${teamID}/completeMigration`, bodyParameters, config)
        .then(() => {
            console.log("Team Closed & Migration Completed")
        })
        .catch((err) => {
            console.log(err.response)
        })

}

// Need to add me otherwise no user can access the newly migrated team
async function addJon(accessToken, teamID) {
    let config = {
        headers: {Authorization: `Bearer ${accessToken}`, "content-type": "application/json"}
    }

    const memberJon = JSON.stringify({
        "@odata.type": "#microsoft.graph.aadUserConversationMember",
        "roles": ["owner"],
        "user@odata.bind": `https://graph.microsoft.com/v1.0/users(\'${process.env.JON_ID}\')`
    })
    
    await axios.post(`https://graph.microsoft.com/beta/teams/${teamID}/members`, memberJon, config)
        .then(() => {
            console.log("Owner Jon Added...")
        })
        .catch((err) => {
            console.log("Owner Jon Not Added...")
            console.log(err.response.data)
        })
}

// Main function to run it all
async function run() {
    let accessToken = await getAccessToken()
    let teamID = await createTeam(accessToken)
    let path = await getUsersPath()
    let usersDict = await getUsersDict(path)
    let directories = await getAllDirectories()
    await workhorse(directories, usersDict, accessToken, teamID)
    await closeGeneral(accessToken, teamID)
    await closeTeam(accessToken, teamID)
    await addJon(accessToken, teamID)
}

run()

module.exports = {
    getAccessToken: getAccessToken,
    createTeam: createTeam,
    getUsersPath: getUsersPath,
    getUsersDict: getUsersDict,
    getAllDirectories: getAllDirectories
}