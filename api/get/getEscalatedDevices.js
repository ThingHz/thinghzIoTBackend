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


exports.handler = async (event) => {
    try {
        let userName = util.getUserName(event.headers);
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
            TableName: escalatedDeviceTable,
            IndexName: "gsi_user",
            KeyConditionExpression: "userName = :userName and escalation > :level",
            ExpressionAttributeValues: {
                ":userName": decoded.user.userName,
                ":level": 0
            }
        };


        let isEscalation = await dynamodb.query(params).promise();

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
                                      data:isEscalation.Items})
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