/**
 * Route: GET /note/n/{device_id}
 */

const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });

const _ = require('underscore');
const util = require('../util');
const jwt = require('jsonwebtoken');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.DATA_TABLE;


exports.handler = async (event) => {
    try {
        let device_id = decodeURIComponent(event.pathParameters.device_id);
        let query = event.queryStringParameters;
        let limit = query && query.limit ? parseInt(query.limit) : 30;
        console.log(limit);
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
            TableName: tableName,
            KeyConditionExpression: "device_id = :device_id",
            ExpressionAttributeValues: {
                ":device_id": device_id
            },
            Limit: limit,
            ScanIndexForward: false
        };

        let startTimestamp = query && query.start ? parseInt(query.start) : 0;
        console.log(startTimestamp);

        if(startTimestamp > 0) {
            params.ExclusiveStartKey = {
                device_id: device_id,
                timestamp: startTimestamp
            }
        }

        let data = await dynamodb.query(params).promise();
        if(data.Count == 0){
            if(startTimestamp==0){
                return{
                    statusCode: 200,
                    headers: util.getResponseHeaders(),
                    body: JSON.stringify({Success: false,
                                          error:util.user_error.DEVICE_ERROR}),
                }
            }
            return{
                statusCode: 200,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({Success: false,
                                      error:util.user_error.NO_DEVICE_AT_TIME}),
            }
        }   
        console.log(data);
            return {
                statusCode: 200,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({Success: true,data:data})
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