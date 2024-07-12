/**
 * Route: POST /device 
 */

const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });
const jwt = require('jsonwebtoken');
const _ = require('underscore');
const util = require('./util.js');
const moment = require('moment');

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.DEVICE_TABLE;
const tableNameCheck = process.env.USER_TABLE;
const escalationTable = process.env.ESCALATION_TABLE;

exports.handler = async (event) => {
    try {
        let item = JSON.parse(event.body);
        let inDeviceTable = {};
        let inEscalationTable = {};
        let authData = util.varifyToken(event.headers);
        const decoded = jwt.verify(authData, process.env.JWT_SECRET);
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

        item.userName = decoded.user.userName;
        inDeviceTable.userName = item.userName;
        item.timestamp = util.convertToUnixIST(moment().unix());
        inDeviceTable.timestamp = item.timestamp
        item.device_status = util.device_status.OFFLINE
        inDeviceTable.device_status = item.device_status;
        inDeviceTable.sensor_profile = item.sensor_profile;
        inDeviceTable.device_id = item.device_id;
        inDeviceTable.device_name = item.device_name;

        inEscalationTable.userName = item.userName;
        inEscalationTable.escalation = 0;
        inEscalationTable.device_id = item.device_id;

        let paramsUser = {
            TableName: tableNameCheck,
            KeyConditionExpression: "userName = :userName",
            ExpressionAttributeValues: {
                ":userName": inDeviceTable.userName
            },
        };
        let isUserExists = await dynamoDB.query(paramsUser).promise();
        if (isUserExists.Count === 0) {
            return {
                statusCode: 200,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({
                    Success: false,
                    error: util.user_error.USER_NAME
                }),
            }
        }

        let paramsDevice = {
            TableName: tableName,
            KeyConditionExpression: "device_id = :device_id AND userName = :userName",
            ExpressionAttributeValues: {
                ":device_id": inDeviceTable.device_id,
                ":userName": inDeviceTable.userName
            },
        };
        let isDeviceExists = await dynamoDB.query(paramsDevice).promise();

        if (isDeviceExists.Count > 0) {
            return {
                statusCode: 200,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({
                    Success: false,
                    error: util.user_error.DEVICE_EXISTS
                }),
            }
        }


        let data = await dynamoDB.put({
            TableName: tableName,
            Item: inDeviceTable
        }).promise();

        switch (item.sensor_profile) {
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
                inEscalationTable.minTemp = item.minTemp ? item.minTemp : 0;
                inEscalationTable.maxTemp = item.maxTemp ? item.maxTemp : 0;
                let isEscalationT = await dynamoDB.put({
                    TableName: escalationTable,
                    Item: inEscalationTable
                }).promise();

                return {
                    statusCode: 200,
                    headers: util.getResponseHeaders(),
                    body: JSON.stringify({
                        Success: true,
                        data: {
                            sensor_profile: 'temperature sensor',
                            item
                        }
                    })
                };
            case util.sensor_profile_enum.SENSOR_TH:
                inEscalationTable.minTemp = item.minTemp ? item.minTemp : 0;
                inEscalationTable.maxTemp = item.maxTemp ? item.maxTemp : 0;
                inEscalationTable.minHumid = item.minHumid ? item.minHumid : 0;
                inEscalationTable.maxHumid = item.maxHumid ? item.maxHumid : 0;

                let isEscalationTH = await dynamoDB.put({
                    TableName: escalationTable,
                    Item: inEscalationTable
                }).promise();


                return {
                    statusCode: 200,
                    headers: util.getResponseHeaders(),
                    body: JSON.stringify({
                        Success: true,
                        data: item
                    })
                };

            case util.sensor_profile_enum.SENSOR_GAS:
                inEscalationTable.minGas = item.minGas ? item.minGas : 0;
                inEscalationTable.maxGas = item.maxGas ? item.maxGas : 0;
                inEscalationTable.minTemp = item.minTemp ? item.minTemp : 0;
                inEscalationTable.maxTemp = item.maxTemp ? item.maxTemp : 0;
                inEscalationTable.minHumid = item.minHumid ? item.minHumid : 0;
                inEscalationTable.maxHumid = item.maxHumid ? item.maxHumid : 0;

                let isEscalationG = await dynamoDB.put({
                    TableName: escalationTable,
                    Item: inEscalationTable
                }).promise();

                return {
                    statusCode: 200,
                    headers: util.getResponseHeaders(),
                    body: JSON.stringify({
                        Success: true,
                        data: {
                            sensor_profile: 'gas Sensor',
                            item
                        }
                    })
                };

            case util.sensor_profile_enum.SENSOR_LIGHT:
                inEscalationTable.minTemp = item.minTemp ? item.minTemp : 0;
                inEscalationTable.maxTemp = item.maxTemp ? item.maxTemp : 0;
                inEscalationTable.minHumid = item.minHumid ? item.minHumid : 0;
                inEscalationTable.maxHumid = item.maxHumid ? item.maxHumid : 0;
                inEscalationTable.minLight = item.minLight ? item.minLight : 0;
                inEscalationTable.maxLight = item.maxLight ? item.maxLight : 0;
        

                let isEscalationLight = await dynamoDB.put({
                    TableName: escalationTable,
                    Item: inEscalationTable
                }).promise();


                return {
                    statusCode: 200,
                    headers: util.getResponseHeaders(),
                    body: JSON.stringify({
                        Success: true,
                        data: item
                    })
                };

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

    } catch (err) {
        console.log("Error", err);
        return {
            statusCode: err.statusCode ? err.statusCode : 500,
            headers: util.getResponseHeaders(),
            body: JSON.stringify({
                Success: false,
                error: err.name ? err.name : "Exception",
                message: err.message ? err.message : "Unknown error"
            })
        }
    }
}