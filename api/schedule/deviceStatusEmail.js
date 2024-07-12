const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });
AWS.config.correctClockSkew = true;
const _ = require('underscore');
const util = require('../util.js');
var HandleHtml = require('handlebars');
var fs = require('fs');


const dynamoDB = new AWS.DynamoDB.DocumentClient();
const SES = new AWS.SES();
const deviceTableName = process.env.DEVICE_TABLE;
const userTable = process.env.USER_TABLE;

let paramStatus = {
    TableName: deviceTableName,
    FilterExpression: "#device_status = :s",
    ExpressionAttributeValues: {
        ":s": util.device_status.OFFLINE
    },
    ExpressionAttributeNames: {
        "#device_status": "device_status"
    }
}

exports.handler = async (event) => {

    let isOffline = await dynamoDB.scan(paramStatus).promise();
    if (isOffline.ScannedCount = 0) {
        return;
    }
    await emailStatus(isOffline);
}


const emailStatus = async (isOffline) => {
    for (var i = 0; i < isOffline.Items.length; i++) {
        var userItems = isOffline.Items[i];
        console.log(userItems);
        console.log(userItems.isAdmin);
        console.log("Parent User");
        let paramParentUser = {
            TableName: userTable,
            KeyConditionExpression: "userName = :userName",
            ExpressionAttributeValues: {
                ":userName": userItems.userName
            }
        };
        var parentUserData = await dynamoDB.query(paramParentUser).promise();
        await emailParentUser(parentUserData.Items[0], userItems.device_id, userItems.device_name);

    }
}


var emailParentUser = async (parentUserData, deviceId, deviceName) => {
    var emailData = {
        "device_name": deviceName,
        "deviceId": deviceId,
        "location": parentUserData.location,
        "userName": parentUserData.userName,
        "thinghz_logo": "https://thinghz-email-images.s3.amazonaws.com/thinghz.png",
        "thinghz_linked": "https://thinghz-email-images.s3.amazonaws.com/linkedIn.png",
        "thinghz_web": "https://thinghz-email-images.s3.amazonaws.com/website.png"
    };
    await fs.readFile('./api/thinghzStatusMail.html', (err, emailHtmlTemplate) => {
        if (err) {
            console.log("Error reading html file");
            throw err;
        }
        var htmlStatusTempelate = HandleHtml.compile(emailHtmlTemplate.toString());
        var bodyHtml = htmlStatusTempelate(emailData);
        var emailAttr = {
            Destination: {
                ToAddresses: [parentUserData.email_id]
            },
            Message: {
                Body: {
                    Html: { Data: bodyHtml },
                },
                Subject: { Data: `ThingHz! ${deviceName} is offline` }
            },
            Source: process.env.EMAIL_ID
        };
        try {
            SES.sendEmail(emailAttr, (err, data) => {
                if (err) {
                    console.error("Unable to send mail. Error JSON:", JSON.stringify(err, null, 2));
                } else {
                    console.error("Successful sent mail", JSON.stringify(data, null, 2));
                }
            }).promise();
        } catch (error) {
            console.log('error sending email ', error);
        }

    });
}
