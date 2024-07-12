const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });
AWS.config.correctClockSkew = true;
const _ = require('underscore');
var HandleHtml = require('handlebars');
var fs = require('fs');
const util = require('../util.js');

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const SES = new AWS.SES();
const deviceTableName = process.env.DEVICE_TABLE;
const userTable = process.env.USER_TABLE;

let paramStatus = {
    TableName: deviceTableName,
    FilterExpression: "#device_status = :s",
    ExpressionAttributeValues: {
        ":s": util.device_status.ONLINE
    },
    ExpressionAttributeNames: {
        "#device_status": "device_status"
    }
}

exports.handler = async (event) => {

    let isOnline = await dynamoDB.scan(paramStatus).promise();
    await emailEscalation(isOnline);
}

const emailEscalation = async (isOnline) => {

    for (var i = 0; i <= isOnline.Items.length; i++) {
        console.log(i);
        var userItems = isOnline.Items[i];
        console.log(userItems);
        if (userItems && userItems.escalation > 0) {
            let paramParentUser = {
                TableName: userTable,
                KeyConditionExpression: "userName = :userName",
                ExpressionAttributeValues: {
                    ":userName": userItems.userName
                }
            };
            var parentUserData = await dynamoDB.query(paramParentUser).promise();
            await emailParentUser(parentUserData.Items[0], userItems);
        }

    }
}


var emailParentUser = async (parentUserData, userItems) => {
    var emailData = {
        "device_name": userItems.device_name,
        "deviceId": userItems.deviceId,
        "escalation": userItems.escalation,
        "location": parentUserData.location,
        "userName": parentUserData.userName,
        "thinghz_logo": "https://thinghz-email-images.s3.amazonaws.com/thinghz.png",
        "thinghz_linked": "https://thinghz-email-images.s3.amazonaws.com/linkedIn.png",
        "thinghz_web": "https://thinghz-email-images.s3.amazonaws.com/website.png"
    };

    await fs.readFile('./api/thinghzEscalationMail.html', (err, emailHtmlTemplate) => {
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
                Subject: { Data: `ThingHz! ${userItems.device_name} escalation-level is ${userItems.escalation}` }
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
