/**
 * Route: GET /note/n/{device_id}
 */

const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });

const _ = require('underscore');
const util = require('../util');
const jwt = require('jsonwebtoken');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const escalatedDeviceTable = process.env.ESCALATION_TABLE
const deviceTable = process.env.DEVICE_TABLE


exports.handler = async (event) => {
    try {
        let deviceStatus = decodeURIComponent(event.pathParameters.device_status);
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
        console.log(decoded.user.userName);

        let paramsDevice = {
            TableName: deviceTable,
            KeyConditionExpression: "userName = :userName",
            ExpressionAttributeValues: {
                ":userName": decoded.user.userName,
            }
        };

        let isDeviceExists = await dynamodb.query(paramsDevice).promise

        if(isDeviceExists.Count == 0){
            return{
                statusCode: 200,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({Success: false,
                                      error:util.user_error.DEVICE_ERROR}),
            }
        }
        if(deviceStatus == 'offline'){
            let paramsDeviceStatus = {
                TableName: deviceTable,
                IndexName: "lsi_device",
                KeyConditionExpression: "userName = :userName and device_status = :device_status",
                ExpressionAttributeValues: {
                    ":userName": decoded.user.userName,
                    ":device_status":util.device_status.OFFLINE
                }
            };
            
            let isOffline = await dynamodb.query(paramsDeviceStatus).promise();
            if(isOffline.Count == 0){
                return {
                    statusCode: 200,
                    headers: util.getResponseHeaders(),
                    body: JSON.stringify({Success: false,
                        error:util.user_error.NO_OFFLINE}),
                };
            }
             
            return {
                statusCode: 200,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({Success: true,
                                  data:isOffline.Items}),
            };

        }else if(deviceStatus == 'online'){
            let paramsDeviceStatus = {
                TableName: deviceTable,
                IndexName: "lsi_device",
                KeyConditionExpression: "userName = :userName and device_status = :device_status",
                ExpressionAttributeValues: {
                    ":userName": decoded.user.userName,
                    ":device_status":util.device_status.ONLINE
                }
            };

            
            let isOnline = await dynamodb.query(paramsDeviceStatus).promise();
            if(isOnline.Count == 0){
                return {
                    statusCode: 200,
                    headers: util.getResponseHeaders(),
                    body: JSON.stringify({Success: false,
                        error:util.user_error.NO_ONLINE}),
                };
            } 
            return {
                statusCode: 200,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({Success: true,
                                  data:isOnline.Items}),
            };
        }else{
            return {
                statusCode: 200,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({Success: false,
                                      error:util.user_error.NO_OFFLINE}),
            };
        }
                    
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