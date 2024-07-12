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
        console.log(decoded.user.userName);
        console.log(device_id);

        let paramsDevice = {
            TableName: deviceTable,
            KeyConditionExpression: "userName = :userName and device_id = :device_id",
            ExpressionAttributeValues: {
                ":userName": decoded.user.userName,
                ":device_id": device_id
            }
        };

        let isDeviceExists = await dynamodb.query(paramsDevice).promise();
        console.log(isDeviceExists);
        if(isDeviceExists.Count == 0){
            return{
                statusCode: 200,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({Success: false,
                                      error:util.user_error.DEVICE_ERROR}),
            }
        }

        let paramsEscalatedDevice = {
            TableName: escalatedDeviceTable,
            KeyConditionExpression: "device_id = :device_id",
            ExpressionAttributeValues: {
                ":device_id": device_id
            }
        };

        let isEscalation = await dynamodb.query(paramsEscalatedDevice).promise();
        
        if (isEscalation.Count == 0){
            return {
                statusCode: 200,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({Success: false,
                                      error:util.user_error.NO_ESCALATION}),
            };
        }

        return {
            statusCode: 200,
            headers: util.getResponseHeaders(),
            body: JSON.stringify({Success: true,
                                  data:isEscalation.Items}),
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