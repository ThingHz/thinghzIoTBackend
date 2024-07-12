/**
 * Route: GET /note/n/{device_id}
 */

const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });
const jwt = require('jsonwebtoken');
const _ = require('underscore');
const util = require('../util');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const deviceTableName = process.env.DEVICE_TABLE;


exports.handler = async (event) => {
    try {
        let authData = util.varifyToken(event.headers);
        let query = event.queryStringParameters;
        let isStatus = query && query.status ? 1 : 0;
        let isEscalation = query && query.escalation ? 1 : 0;
        let isProfile = query && query.profile ? 1 : 0;
        let escalationExpression = "";
        if (isEscalation ){
            if (parseInt(query.escalation) ==1){
                escalationExpression = "#escalation >= :e"
            }else{
                escalationExpression = "#escalation = :e"
            }
        }
        let paramStatus = {};
        let switchStatus = getQueryCode(isStatus, isEscalation, isProfile);

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
            TableName: deviceTableName,
            KeyConditionExpression: "userName = :userName",
            ExpressionAttributeValues: {
                ":userName": decoded.user.userName
            }
        };

        let data = await dynamodb.query(params).promise();

        if(data.Count == 0){
            return{
                statusCode: 200,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({Success: false,
                                      error:util.user_error.DEVICE_ERROR}),
            }
        }
        if(switchStatus == 0){
            return {
                statusCode: 200,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({Success: true,
                                    data:data.Items})
            };
        }
        console.log(switchStatus);
        switch(switchStatus){
            case 1:
                paramStatus = {
                    TableName: deviceTableName,
                    FilterExpression: "#device_status = :s and #userName = :userName",
                    ExpressionAttributeValues: {
                        ":s": query.status,
                        ":userName":  decoded.user.userName
                    },
                    ExpressionAttributeNames: {
                        "#device_status": "device_status",
                        "#userName":"userName"
                      }
                }
                break;
            case 2:
                paramStatus = {
                    TableName: deviceTableName,
                    FilterExpression: `${escalationExpression} and #userName = :userName`,
                    ExpressionAttributeValues: {
                        ":e": parseInt(query.escalation),
                        ":userName":  decoded.user.userName
                    },
                    ExpressionAttributeNames: {
                        "#escalation": "escalation",
                        "#userName":"userName"
                      }
                }
                break;
            case 3:
                paramStatus = {
                    TableName: deviceTableName,
                    FilterExpression: `${escalationExpression} and #device_status = :s and #userName = :userName`,
                    ExpressionAttributeValues: {
                        ":e": parseInt(query.escalation),
                        ":s": query.status,
                        ":userName":  decoded.user.userName
                    },
                    ExpressionAttributeNames: {
                        "#escalation": "escalation",
                        "#device_status": "device_status",
                        "#userName":"userName"
                      }
                }
                break;
             case 4:
                paramStatus = {
                    TableName: deviceTableName,
                    FilterExpression: "#sensor_profile = :p and #userName = :userName",
                    ExpressionAttributeValues: {
                        ":p": parseInt(query.profile),
                        ":userName":  decoded.user.userName
                    },
                    ExpressionAttributeNames: {
                        "#sensor_profile": "sensor_profile",
                        "#userName":"userName"
                      }
                }
                break;
            case 5:
                paramStatus = {
                    TableName: deviceTableName,
                    FilterExpression: "#sensor_profile = :p and  #device_status = :s and #userName = :userName",
                    ExpressionAttributeValues: {
                        ":p": parseInt(query.profile),
                        ":s": query.status,
                        ":userName":  decoded.user.userName
                    },
                    ExpressionAttributeNames: {
                        "#sensor_profile": "sensor_profile",
                        "#device_status": "device_status",
                        "#userName":"userName"
                      }
                }
                break;
            case 6:
                paramStatus = {
                    TableName: deviceTableName,
                    FilterExpression: `#sensor_profile = :p and ${escalationExpression} and #userName = :userName`,
                    ExpressionAttributeValues: {
                        ":p": parseInt(query.profile),
                        ":e": parseInt(query.escalation),
                        ":userName":  decoded.user.userName
                    },
                    ExpressionAttributeNames: {
                        "#sensor_profile": "sensor_profile",
                        "#escalation": "escalation",
                        "#userName":"userName"
                      }
                }
                break;
            case 7:
                paramStatus = {
                    TableName: deviceTableName,
                    FilterExpression: `#sensor_profile = :p and ${escalationExpression} and #device_status = :s and #userName = :userName`,
                    ExpressionAttributeValues: {
                        ":p": parseInt(query.profile),
                        ":e": parseInt(query.escalation),
                        ":s": query.status,
                        ":userName":  decoded.user.userName
                    },
                    ExpressionAttributeNames: {
                        "#sensor_profile": "sensor_profile",
                        "#escalation": "escalation",
                        "#device_status":"device_status",
                        "#userName":"userName"
                      }
                }
                break;
            default:
                return{
                    statusCode: 200,
                    headers: util.getResponseHeaders(),
                    body: JSON.stringify({Success: false,
                                          error:util.user_error.DEVICE_ERROR}),
                }
        }
        let queryData = await dynamodb.scan(paramStatus).promise();
        return {
            statusCode: 200,
            headers: util.getResponseHeaders(),
            body: JSON.stringify({Success: true,
                                data:queryData.Items})
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

const getQueryCode = (isStatus, isEscalation, isProfile)=>{
    console.log(isStatus);
    console.log(isEscalation);
    console.log(isProfile);
    return ((isProfile<<2)+(isEscalation<<1)+isStatus);
} 