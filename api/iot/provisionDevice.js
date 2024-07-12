/**
 * Route: GET device-range/{device_id} 
 */

const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });
const util = require('../util.js');
const jwt = require('jsonwebtoken');
const IoT = new AWS.Iot();

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const deviceTableName = process.env.DEVICE_TABLE;

exports.handler = async (event) => {
    try {
        let item = JSON.parse(event.body);
        let inDeviceTable = {};
        let authData = util.varifyToken(event.headers);
        /*decode JWT Token*/
        const decoded = jwt.verify(authData, process.env.JWT_SECRET);
        if (decoded.user.isAdmin === 0) {
            return {
                statusCode: 200,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({
                    Success: false,
                    error: util.user_error.NO_AUTH
                }),
            };
        }
        inDeviceTable.userName = decoded.user.userName;
        inDeviceTable.device_id = item.device_id;
        /*Check whether th device exists and is register under the name of user*/
        let paramsDevice = {
            TableName: deviceTableName,
            KeyConditionExpression: "device_id = :device_id AND userName = :userName",
            ExpressionAttributeValues: {
                ":device_id": inDeviceTable.device_id,
                ":userName": inDeviceTable.userName
            },
        };
        let isDeviceExists = await dynamoDB.query(paramsDevice).promise();

        /*If device exists then return the response with device exists message*/
        if (isDeviceExists.Count > 0) {
            return {
                statusCode: 200,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({
                    Success: false,
                    error: util.user_error.DEVICE_EXISTS
                }),
            }
        }
        /*Now Check in AWS IoT fro the device_id*/
        try{
            await IoT.describeThing({thingName : inDeviceTable.device_id}).promise();
            /*If device exists then return a response with thing exists error*/
            return {
                statusCode: 200,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({
                    Success: false,
                    error: util.user_error.THING_EXISTS
                })
            }
        }catch (err){
            /*If device does not exist then create a new thing*/
            console.log("thing does not exist create a new one");
            await IoT.createThing({thingName : inDeviceTable.device_id}).promise();
            console.log("Device Created successfully");
            return {
                statusCode: 200,
                    headers: util.getResponseHeaders(),
                    body: JSON.stringify({
                        Success: true,
                        message: `thing ${inDeviceTable.device_id} created successfuly`
                    })
            }
        }        
    } catch (err) {
        console.log("Error", err);
        return {
            statusCode: err.statusCode ? err.statusCode : 500,
            headers: util.getResponseHeaders(),
            body: JSON.stringify({
                Success: false,
                error: err.name ? err.name : "Exception",
                message: err.message ? err.message : "Unknown error"
            })
        }
    }
}

