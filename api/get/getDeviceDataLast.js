/**
 * Route: GET /note/n/{device_id}
 */

const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });

const _ = require('underscore');
const util = require('../util');
const moment = require('moment');
const jwt = require('jsonwebtoken');

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const dataTableName = process.env.DATA_TABLE;


var deviceStatus = util.device_status.OFFLINE;

exports.handler = async (event) => {
    try {
        let device_id = decodeURIComponent(event.pathParameters.device_id);
        let authData = util.varifyToken(event.headers);
        if(authData == ""){
            return{
                statusCode: 200,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({Success: false,
                                      error:util.user_error.AUTH_TOKEN_NULL}),
            }
        }
        const decoded = jwt.verify(authData, process.env.JWT_SECRET);
        let params = {
            TableName: dataTableName,
            KeyConditionExpression: "device_id = :device_id",
            ExpressionAttributeValues: {
                ":device_id": device_id
            },
            Limit: 1,
            ScanIndexForward: false
        };


        let data = await dynamoDB.query(params).promise();
        if(data.Count == 0){
            return{
                statusCode: 200,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({Success: false,
                                      error:util.user_error.DEVICE_ERROR}),
            }
        }
        var laterTimestamp = data.Items[0].timestamp;
        console.log(laterTimestamp);
        var nowTimestamp = moment().unix();
        console.log(nowTimestamp);
        var timeDifference = nowTimestamp - laterTimestamp;
        console.log(timeDifference);
           
        /*if (timeDifference>(3*secMultiply*milliSecMultiply)){
            console.log("device offline")
            deviceStatus =  util.device_status.OFFLINE;
            updateDeviceStatus(deviceStatus,device_id,userName);
        }*/

            return {
                statusCode: 200,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({
                    Success: true,
                    deviceStatus:deviceStatus,
                    item:data.Items[0] 
                    })
            };
        
    } catch (err) {
        console.log("Error", err);
        return {
            statusCode: err.statusCode ? err.statusCode : 500,
            headers: util.getResponseHeaders(),
            body: JSON.stringify({
                Success:false,
                error: err.name ? err.name : "Exception",
                message: err.message ? err.message : "Unknown error"
            })
        };
    }
}

/*const updateDeviceStatus = async(deviceStatus,device_id,userName)=>{
    console.log(deviceStatus);
    console.log(device_id);
    console.log(userName);
    let data = await dynamoDB.update({
        TableName: deviceTableName,
        Key: {"userName": userName, "device_id":device_id},
        ConditionExpression: '#d = :d',
        UpdateExpression: 'set #s = :s',
        ExpressionAttributeNames: {
            '#s': 'deviceStatus',
            '#d': 'device_id'
        },
        ExpressionAttributeValues: {
            ':s': deviceStatus,
            ':d': device_id
        }
      }).promise();
}*/