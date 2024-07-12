/**
 * Route: POST /device 
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
        let escalation = parseInt(query.escalation);
        console.log(device_id)
        console.log(escalation)
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
            IndexName: "device_id-index",
            KeyConditionExpression: "#device_id = :device_id",
            ExpressionAttributeNames: {
                "#device_id": "device_id",
            },
            ExpressionAttributeValues: {
                ":device_id": device_id,
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

        
            if (userItem.Items.length > 1) {
                for (i = 0; i < userItem.Items.length; i++) {
                    await updateThingName(device_id, item.device_name, userItem.Items[i].userName);
                    /*if (userItem.Items[i].isAdmin === util.admin_enum.IS_OPERATOR) {
                        await updateLocation(userItem.Items[i].userName, item.location);
                    }*/
                }
            }
            await updateDeviceRange(device_id, item.range, item.sensor_profile,escalation);
                
        return {
            statusCode: 200,
            headers: util.getResponseHeaders(),
            body: JSON.stringify({
                Success: true,
                message: "devices update"
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


const updateThingName = async (deviceId, thingName, userName) => {
    let deviceData = {
        TableName: deviceTableName,
        Key: { "userName": userName, "device_id": deviceId },
        ConditionExpression: '#device = :device',
        UpdateExpression: 'set #name = :name',
        ExpressionAttributeNames: {
            '#name': 'device_name',
            '#device': 'device_id'
        },
        ExpressionAttributeValues: {
            ':name': thingName,
            ':device': deviceId
        }
    }

    await dynamoDB.update(deviceData, (err, data) => {
        if (err) {
            if (err) {
                console.error("Unable to update device data. Error JSON:", JSON.stringify(err, null, 2));
                return {
                    statusCode: err.statusCode ? err.statusCode : 500,
                    headers: util.getResponseHeaders(),
                    body: JSON.stringify({
                        error: err.name ? err.name : "Exception",
                        message: err.message ? err.message : "Unknown error"
                    })
                };
            }
        } else { console.log(`data updated successfully`) }
    }).promise();
}

const updateDeviceRange = async (deviceId, deviceRange, sensorProfile, escalation) => {
    let escalationData = {};
    switch (sensorProfile) {
        case util.sensor_profile_enum.SENSOR_NONE:
            return {
                statusCode: 200,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({
                    Success: false,
                    error: util.user_error.SENSOR_PROFILE
                })
            };
        case util.sensor_profile_enum.SENSOR_T:
            escalationData = {
                TableName: escalationTableName,
                Key: { "device_id": deviceId, "escalation": escalation },
                ConditionExpression: '#device = :device AND #escalate = :escalate',
                UpdateExpression: 'set #maxTemp = :maxTemp, #minTemp = :minTemp',
                ExpressionAttributeNames: {
                    '#device': 'device_id',
                    '#escalate': 'escalation',
                    '#maxTemp': 'maxTemp',
                    '#minTemp': 'minTemp'
                },
                ExpressionAttributeValues: {
                    ':device': device_id,
                    ':escalate': escalation,
                    ':maxTemp': deviceRange.maxTemp,
                    ':minTemp': deviceRange.minTemp
                }
            }
            break;
        case util.sensor_profile_enum.SENSOR_TH:
            escalationData = {
                TableName: escalationTableName,
                Key: { "device_id": deviceId, "escalation": escalation },
                ConditionExpression: '#device = :device AND #escalate = :escalate',
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
                    ':escalate': escalation,
                    ':maxTemp': deviceRange.maxTemp,
                    ':minTemp': deviceRange.minTemp,
                    ':maxHumid': deviceRange.maxHumid,
                    ':minHumid': deviceRange.minHumid
                }
            }
            break;
        case util.sensor_profile_enum.SENSOR_GAS:
            escalationData = {
                TableName: escalationTableName,
                Key: { "device_id": deviceId, "escalation": escalation },
                ConditionExpression: '#device = :device AND #escalate = :escalate',
                UpdateExpression: 'set #maxGas = :maxGas, #minGas = :minGas',
                ExpressionAttributeNames: {
                    '#device': 'device_id',
                    '#escalate': 'escalation',
                    '#maxGas': 'maxGas',
                    '#minGas': 'minGas'
                },
                ExpressionAttributeValues: {
                    ':device': deviceId,
                    ':escalate': escalation,
                    ':maxGas': deviceRange.maxGas,
                }
            }
            break;
            case util.sensor_profile_enum.LIGHT:
                escalationData = {
                    TableName: escalationTableName,
                    Key: { "device_id": deviceId, "escalation": escalation },
                    ConditionExpression: '#device = :device AND #escalate = :escalate',
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
                        ':escalate': escalation,
                        ':maxTemp': deviceRange.maxTemp,
                        ':minTemp': deviceRange.minTemp,
                        ':maxHumid': deviceRange.maxHumid,
                        ':minHumid': deviceRange.minHumid,
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

/*const updateLocation = async (userName, location) => {
    console.log(userName)
    console.log(location)
    let locationData = {
        TableName: childUserTable,
        Key: { "userName": userName, "isAdmin": util.admin_enum.IS_OPERATOR },
        ConditionExpression: '#user = :user',
        UpdateExpression: 'set #location = :location',
        ExpressionAttributeNames: {
            '#user': 'userName',
            '#location': 'location'
        },
        ExpressionAttributeValues: {
            ':user': userName,
            ':location': location
        }
    }

    await dynamoDB.update(locationData, (err, data) => {
        if (err) {
            if (err) {
                console.error("Unable to update location data. Error JSON:", JSON.stringify(err, null, 2));
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
}*/