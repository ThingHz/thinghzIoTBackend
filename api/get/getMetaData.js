/**
 * Route: GET /note/n/{device_id}
 */

const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });
const jwt = require('jsonwebtoken');
const _ = require('underscore');
const util = require('../util');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const deviceMeta = process.env.DEVICE_META_DATA_TABLE;

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
        console.log(device_id);
        console.log(decoded.user.userName);
        
        let paramsDevice = {
            TableName: deviceMeta,
            KeyConditionExpression: "userName = :userName and device_id = :device_id",
            ExpressionAttributeValues: {
                ":userName": decoded.user.userName,
                ":device_id": device_id
            }
        };


        let devicemetaData = await dynamodb.query(paramsDevice).promise();
        console.log(devicemetaData);
        if(devicemetaData.Count == 0){
                console.log(`device ${device_id} not present, adding the device first`);
                let deviceMetaData = {"device_id" : device_id, "userName" : decoded.user.userName};
                let data = await dynamodb.put({
                    TableName: deviceMeta,
                    Item: deviceMetaData
                }).promise();
                return {
                    statusCode: 200,
                    headers: util.getResponseHeaders(),
                    body: JSON.stringify({Success: true,
                                          message: `device ${device_id} successfuly added`})
                }; 
            }
            return {
                statusCode: 200,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({Success: true,
                                      data: devicemetaData.Items })
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