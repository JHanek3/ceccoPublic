import 'regenerator-runtime/runtime'
import { getAccessToken, createTeam, getUsersPath, getUsersDict, getAllDirectories } from './main';
const msal = require('@azure/msal-node');
require('dotenv').config();
// // import { formattedTime } from "./helpers.js"
// import axios from 'axios';
// import { TestWatcher } from 'jest';
// jest.mock('axios');

const config = {
    auth: {
        clientId: process.env.CLIENT_ID,
        authority: process.env.AUTHORITY,
        clientSecret: process.env.CLIENT_SECRET
    }
}
const cca = new msal.ConfidentialClientApplication(config)
let accessToken = ""
let teamID = ""
let path = ""
let usersDict = ""
let directories = []

test("Succesful MSAL object creation", () => {
    expect(cca).not.toBe("")

})

// test("Security Token Acquistion", async () => {
//     accessToken = await getAccessToken()
//     expect(accessToken).not.toBe("")
// })

// test("Create Teams returns ID", async () => {
//     teamID = await createTeam(accessToken)
//     expect(teamID).not.toBe("")
// })

test("Users Path Works", async () => {
    path = await getUsersPath()
    let daPath = path.slice(-4)
    expect(daPath).toBe("json")
})

test("Dictionary Created from users.json", async () => {
    usersDict = await getUsersDict(path)
    expect(usersDict).not.toBe("")
})

test("At least one directory in the folder", async () => {
    directories = await getAllDirectories()
    expect(directories).not.toBe([])
})

