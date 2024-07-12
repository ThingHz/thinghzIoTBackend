/**
 * Route: GET /note/n/{device_id}
 */

const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });
const jwt = require('jsonwebtoken');
const _ = require('underscore');
const util = require('../util');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const userTableName = process.env.CHILD_USER_TABLE;


exports.handler = async (event) => {
    try {
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
        console.log(decoded);
        if(decoded.user.isAdmin === 0){
            let params = {
                TableName: userTableName,
                KeyConditionExpression: "userName = :userName and isAdmin = :isAdmin",
                ExpressionAttributeValues: {
                    ":userName": decoded.user.userName,
                    ":isAdmin": util.admin_enum.IS_OPERATOR
                }
            };
            let data = await dynamodb.query(params).promise();
            if(data.Count == 0){
                return{
                    statusCode: 200,
                    headers: util.getResponseHeaders(),
                    body: JSON.stringify({Success: false,
                                          error:util.user_error.No_USER}),
                }
            }
            return {
                statusCode: 200,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({Success: true,
                                      data:data.Items})
            };    
        }

        let params = {
            TableName: userTableName,
            IndexName: "gsi_parent",
            KeyConditionExpression: "parent = :parent and isAdmin = :isAdmin",
            ExpressionAttributeValues: {
                ":parent": decoded.user.userName,
                ":isAdmin": util.admin_enum.IS_OPERATOR
            }
        };


        let data = await dynamodb.query(params).promise();
        if(data.Count == 0){
                return{
                    statusCode: 200,
                    headers: util.getResponseHeaders(),
                    body: JSON.stringify({Success: false,
                                          error:util.user_error.NO_CHILD_USER}),
                }
            }
            return {
                statusCode: 200,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({Success: true,
                                      data:data.Items})
            };
        
    } catch (err) {
        console.log("Error", err);
        return {
            statusCode: err.statusCode ? err.statusCode : 500,
            headers: util.getResponseHeaders(),
            body: JSON.stringify({
                error: err.name ? err.name : "Exception",
                message: err.message ? err.message : "Unknown error"
            })
        };
    }
}