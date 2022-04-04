# Slack to Teams via NodeJS
Company wants to move everything to Microsoft office. Given this article, [Importing 3rd party messages to Teams](https://docs.microsoft.com/en-us/microsoftteams/platform/graph-api/import-messages/import-external-messages-to-teams#step-3-import-messages), here's my solution
<p>
Going through the provided article was rough, I've tried to provide some detail in main.js to help other people create their own solutions.
</p>

## Helpful things to know
<ol>
    <li>Azure Portal Client ID</li>
    <li>Azure App Authority ID</li>
    <li>Azure App Client Secret</li>
    <li>Azure App Permissions
        <ul>
            <li>Teamwork.Migrate.All</li>
            <li>Channel.ReadBasic.All</li>
            <li>TeamMember.ReadWrite.All</li>
        </ul>
    </li>
    <li>Azure User ID</li>
    <li>Unix timestamps don't contain milliseconds...</li>
</ol>
Microsoft Graph API doesn't allow videos to be imported at this time.
Slack uses a UNIX Timestamp, Unix timezones are not timezone independent. What this means for us is that the time will not be super accurate or at least it won't be (I don't know this made my brain hurt). I've got a user that would post a message in east coast and then post in the midwest with the timestamp and no location data for the message, I can't provide an accurate time. 

## dummyData
I've provided some data to iterate through to see how everything works, all the .json has been edited to the barebones for user safety. The code will work with exported slack data.

## Use yarn start to run