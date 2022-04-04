const fs = require('fs')

// function for milliseconds
function getRandomInt(max) {
    return Math.floor(Math.random() * max)
}

// function to convert current time to ms appropriate time
// Test:【ツ】
function formattedTime(date) {
    // commented out for tests
    // // let today = new Date(date)
    return new Promise(resolve => {
        let createdDateTime = ""
        let year = date.getFullYear();
        createdDateTime += year
    
        let month = date.getMonth() + 1
        if (month < 10) {
            createdDateTime += `-0${month}`
        } else {
            createdDateTime += `-${month}`
        }

        let day = date.getDate()
        if (day < 10) {
            createdDateTime += `-0${day}`
        } else {
            createdDateTime += `-${day}`
        }

        let hour = date.getHours()
        if (hour < 10) {
            createdDateTime += `T0${hour}`
        } else {
            createdDateTime += `T${hour}`
        }

        let min = date.getMinutes()
        if (min < 10) {
            createdDateTime += `:0${min}`
        } else {
            createdDateTime += `:${min}`
        }

        let secs = date.getSeconds()
        if (secs < 10) {
            createdDateTime += `:0${secs}`
        } else {
            createdDateTime += `:${secs}`
        }
        
        resolve(createdDateTime + `.${getRandomInt(9)}${getRandomInt(9)}${getRandomInt(9)}Z`)
    })
}

 // function to encode file data to base64encoded string
function base64Encode(file) {
    return new Promise(resolve => {
        // read binary data
        let bitmap = fs.readFileSync(file)
        // convert binary to base64encode string
        resolve(new Buffer.from(bitmap).toString("base64"))
    })
}

// console.log(formattedTime(new Date("August 01, 2013 00:01:00")))
// console.log(formattedTime(new Date("1565009880.000200" * 1000)))

module.exports = {
    formattedTime: formattedTime,
    base64Encode, base64Encode
}