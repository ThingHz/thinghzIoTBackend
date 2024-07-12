/**
 * Route: GET device-range/{device_id} 
 */

const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });
const _ = require('underscore');
const util = require('./util.js');
const jwt = require('jsonwebtoken');
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const deviceTableName = process.env.DEVICE_TABLE;
const escalationTableName = process.env.ESCALATION_TABLE;
const userTable = process.env.USER_TABLE;

exports.handler = async (event) => {
    try {
        let authData = util.varifyToken(event.headers);
        const decoded = jwt.verify(authData, process.env.JWT_SECRET);
        let device_id = decodeURIComponent(event.pathParameters.device_id);
        let query = event.queryStringParameters;
        let sensorProfile = parseInt(query.sensor_profile);
        console.log(device_id)
        let item = JSON.parse(event.body);
        console.log(item)
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

        let paramUsers = {
            TableName: deviceTableName,
            KeyConditionExpression: "#userName = :userName and #device_id = :device_id",
            ExpressionAttributeNames: {
                "#device_id": "device_id",
                "#userName": "userName"
            },
            ExpressionAttributeValues: {
                ":device_id": device_id,
                ":userName": decoded.user.userName
            }
        }

        let userItem = await dynamoDB.query(paramUsers).promise();
        if (userItem.Count == 0) {
            console.log("No device found");
            return {
                statusCode: 200,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({
                    Success: false,
                    error: util.user_error.DEVICE_ERROR
                }),
            }
        }
        
        await updateDeviceRange(device_id, item.range, sensorProfile);

        return {
            statusCode: 200,
            headers: util.getResponseHeaders(),
            body: JSON.stringify({
                Success: true,
                message: "device range updated"
            })
        }
    } catch (err) {
        console.log("Error", err);
        return {
            statusCode: err.statusCode ? err.statusCode : 500,
            headers: util.getResponseHeaders(),
            body: JSON.stringify({
                error: err.name ? err.name : "Exception",
                message: err.message ? err.message : "Unknown error"
            })
        }
    }
}


const updateDeviceRange = async (deviceId, deviceRange, sensorProfile) => {
    let escalationData = {};
    console.log("sensor profile:", sensorProfile);
    switch (sensorProfile) {
        case 1:
            return {
                statusCode: 200,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({
                    Success: false,
                    error: util.user_error.SENSOR_PROFILE
                })
            };
        case 2:
            escalationData = {
                TableName: escalationTableName,
                Key: { "device_id": deviceId, "escalation": 0 },
                ConditionExpression: '#device = :device AND #escalate >= :escalate',
                UpdateExpression: 'set #maxTemp = :maxTemp, #minTemp = :minTemp',
                ExpressionAttributeNames: {
                    '#device': 'device_id',
                    '#escalate': 'escalation',
                    '#maxTemp': 'maxTemp',
                    '#minTemp': 'minTemp'
                },
                ExpressionAttributeValues: {
                    ':device': device_id,
                    ':escalate': 0,
                    ':maxTemp': deviceRange.maxTemp,
                    ':minTemp': deviceRange.minTemp
                }
            }
            break;
        case 3:
            escalationData = {
                TableName: escalationTableName,
                Key: { "device_id": deviceId, "escalation": 0 },
                ConditionExpression: '#device = :device AND #escalate >= :escalate',
                UpdateExpression: 'set #maxTemp = :maxTemp, #minTemp = :minTemp, #minHumid = :minHumid, #maxHumid = :maxHumid',
                ExpressionAttributeNames: {
                    '#device': 'device_id',
                    '#escalate': 'escalation',
                    '#maxTemp': 'maxTemp',
                    '#minTemp': 'minTemp',
                    '#maxHumid': 'maxHumid',
                    '#minHumid': 'minHumid'
                },
                ExpressionAttributeValues: {
                    ':device': deviceId,
                    ':escalate': 0,
                    ':maxTemp': deviceRange.maxTemp,
                    ':minTemp': deviceRange.minTemp,
                    ':maxHumid': deviceRange.maxHumid,
                    ':minHumid': deviceRange.minHumid
                }
            }
            break;
        case 4:
            escalationData = {
                TableName: escalationTableName,
                Key: { "device_id": deviceId, "escalation": 0 },
                ConditionExpression: '#device = :device AND #escalate >= :escalate',
                UpdateExpression: 'set #maxGas = :maxGas, #minGas = :minGas',
                ExpressionAttributeNames: {
                    '#device': 'device_id',
                    '#escalate': 'escalation',
                    '#maxGas': 'maxGas',
                    '#minGas': 'minGas'
                },
                ExpressionAttributeValues: {
                    ':device': deviceId,
                    ':escalate': 0,
                    ':maxGas': deviceRange.maxGas,
                }
            }
            break;
        case 5:
            console.log("update Light escalation");
            escalationData = {
                TableName: escalationTableName,
                Key: { "device_id": deviceId, "escalation": 0 },
                ConditionExpression: '#device = :device AND #escalate >= :escalate',
                UpdateExpression: 'set #maxTemp = :maxTemp, #minTemp = :minTemp, #minHumid = :minHumid, #maxHumid = :maxHumid, #maxLight = :maxLight, #minLight = :minLight',
                ExpressionAttributeNames: {
                    '#device': 'device_id',
                    '#escalate': 'escalation',
                    '#maxTemp': 'maxTemp',
                    '#minTemp': 'minTemp',
                    '#maxHumid': 'maxHumid',
                    '#minHumid': 'minHumid',
                    '#maxLight': 'maxLight',
                    '#minLight': 'minLight'
                },
                ExpressionAttributeValues: {
                    ':device': deviceId,
                    ':escalate': 0,
                    ':maxTemp': deviceRange.maxTemp,
                    ':minTemp': deviceRange.minTemp,
                    ':maxHumid': deviceRange.maxHumid,
                    ':minHumid': deviceRange.minHumid,
                    ':maxLight': deviceRange.maxLight,
                    ':minLight': deviceRange.minLight
                }
            }
            break;
        default:
            return {
                statusCode: 200,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({
                    Success: false,
                    error: util.user_error.SENSOR_PROFILE
                })
            };
    }
    
    await dynamoDB.update(escalationData, (err, data) => {
        if (err) {
            if (err) {
                console.error("Unable to update data. Error JSON:", JSON.stringify(err, null, 2));
                return {
                    statusCode: err.statusCode ? err.statusCode : 500,
                    headers: util.getResponseHeaders(),
                    body: JSON.stringify({
                        error: err.name ? err.name : "Exception",
                        message: err.message ? err.message : "Unknown error"
                    })
                };
            }
        } else { console.log(`data updated successfully ${data}`) }
    }).promise();
}

