/**
 * Route: GET /note/n/{device_id}
 */

const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });
const jwt = require('jsonwebtoken');
const _ = require('underscore');
const util = require('../util');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const deviceTable = process.env.DEVICE_TABLE;
const escalationTableName = process.env.ESCALATION_TABLE;
const childUserTable = process.env.CHILD_USER_TABLE;

exports.handler = async (event) => {
    try {
        let device_id = decodeURIComponent(event.pathParameters.device_id);
        let userLocationData = {};
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
            TableName: deviceTable,
            KeyConditionExpression: "userName = :userName and device_id = :device_id",
            ExpressionAttributeValues: {
                ":userName": decoded.user.userName,
                ":device_id": device_id
            }
        };

        let paramsEscalation = {
            TableName: escalationTableName,
            IndexName: "lsi_device_user",
            KeyConditionExpression: "userName = :userName and device_id = :device_id",
            ExpressionAttributeValues: {
                ":userName": decoded.user.userName,
                ":device_id": device_id
            }
        };

        let paramsUser = {
            TableName: childUserTable,
            KeyConditionExpression: "userName = :userName and isAdmin = :isAdmin",
            ExpressionAttributeValues: {
                ":userName": decoded.user.userName,
                ":device_id": util.admin_enum.IS_OPERATOR
            }
        };


        let deviceData = await dynamodb.query(paramsDevice).promise();
        console.log(deviceData);
        if(deviceData.Count == 0){
                return{
                    statusCode: 200,
                    headers: util.getResponseHeaders(),
                    body: JSON.stringify({Success: false,
                                          error:util.user_error.DEVICE_ERROR}),
                }
            }

        let escalationData = await dynamodb.query(paramsEscalation).promise();
        if(escalationData.Count == 0){
            return{
                statusCode: 200,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({Success: false,
                                      error:util.user_error.DEVICE_ERROR}),
            }
        }
        
        if(decoded.user.isAdmin == util.admin_enum.IS_OPERATOR){
            let userData = await dynamodb.query(paramsUser).promise();
            if(userData.Count == 0){
                return{
                    statusCode: 200,
                    headers: util.getResponseHeaders(),
                    body: JSON.stringify({Success: false,
                                          error:util.user_error.USER_NAME}),
                }   
            }
            userLocationData.location = userData.Items[0].location;
        }else{
            userLocationData.location = "NONE"
        }
        
        switch (deviceData.Items[0].sensor_profile){
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
                return {
                    statusCode: 200,
                    headers: util.getResponseHeaders(),
                    body: JSON.stringify({Success: true,
                                          data:{
                                              device_id: deviceData.Items[0].device_id,
                                              device_name: deviceData.Items[0].device_name,
                                              sensor_profile: deviceData.Items[0].sensor_profile,
                                              max_Temp: escalationData.Items[0].maxTemp,
                                              min_Temp: escalationData.Items[0].minTemp,
                                              location : userLocationData.location
                                          }})
                };
            case util.sensor_profile_enum.SENSOR_TH:
                return {
                    statusCode: 200,
                    headers: util.getResponseHeaders(),
                    body: JSON.stringify({Success: true,
                                          data:{
                                              device_id: deviceData.Items[0].device_id,
                                              device_name: deviceData.Items[0].device_name,
                                              sensor_profile: deviceData.Items[0].sensor_profile,
                                              max_temp: escalationData.Items[0].maxTemp,
                                              min_temp: escalationData.Items[0].minTemp,
                                              max_humid: escalationData.Items[0].maxHumid,
                                              min_humid: escalationData.Items[0].minHumid,
                                              location : userLocationData.location
                                          }})
                };
            case util.sensor_profile_enum.SENSOR_THM:
                return {
                    statusCode: 200,
                    headers: util.getResponseHeaders(),
                    body: JSON.stringify({Success: true,
                                          data:{
                                              device_id: deviceData.Items[0].device_id,
                                              device_name: deviceData.Items[0].device_name,
                                              sensor_profile: deviceData.Items[0].sensor_profile,
                                              max_temp: escalationData.Items[0].maxTemp,
                                              min_temp: escalationData.Items[0].minTemp,
                                              max_humid: escalationData.Items[0].maxHumid,
                                              min_humid: escalationData.Items[0].minHumid,
                                              max_moist: escalationData.Items[0].maxMoist,
                                              min_moist: escalationData.Items[0].minMoist,
                                              location : userLocationData.location
                                          }})
                };
            case util.sensor_profile_enum.SENSOR_GAS:
                return {
                    statusCode: 200,
                    headers: util.getResponseHeaders(),
                    body: JSON.stringify({Success: true,
                                          data:{
                                              device_id: deviceData.Items[0].device_id,
                                              device_name: deviceData.Items[0].device_name,
                                              sensor_profile: deviceData.Items[0].sensor_profile,
                                              max_gas: escalationData.Items[0].maxGas,
                                              min_gas: escalationData.Items[0].minGas,
                                              location : userLocationData.location
                                          }})
                };

                case util.sensor_profile_enum.SENSOR_LIGHT:
                    return {
                        statusCode: 200,
                        headers: util.getResponseHeaders(),
                        body: JSON.stringify({Success: true,
                                              data:{
                                                  device_id: deviceData.Items[0].device_id,
                                                  device_name: deviceData.Items[0].device_name,
                                                  sensor_profile: deviceData.Items[0].sensor_profile,
                                                  max_temp: escalationData.Items[0].maxTemp,
                                                  min_temp: escalationData.Items[0].minTemp,
                                                  max_humid: escalationData.Items[0].maxHumid,
                                                  min_humid: escalationData.Items[0].minHumid,
                                                  location : userLocationData.location
                                              }})
                    };
            case util.sensor_profile_enum.SENSOR_GYRO:
                return {
                    statusCode: 200,
                    headers: util.getResponseHeaders(),
                    body: JSON.stringify({Success: true,
                                          data:{
                                              device_id: deviceData.Items[0].device_id,
                                              device_name: deviceData.Items[0].device_name,
                                              sensor_profile: deviceData.Items[0].sensor_profile,
                                              max_gyro: escalationData.Items[0].gyroMax,
                                              min_gyro: escalationData.Items[0].gyroMin,
                                              max_accel: escalationData.Items[0].accelMax,
                                              min_accel: escalationData.Items[0].accelMin,
                                              location : userLocationData.location
                                          }})
                };
            case util.sensor_profile_enum.SENSOR_THC:
                return {
                    statusCode: 200,
                    headers: util.getResponseHeaders(),
                    body: JSON.stringify({Success: true,
                                            data:{
                                                device_id: deviceData.Items[0].device_id,
                                                device_name: deviceData.Items[0].device_name,
                                                sensor_profile: deviceData.Items[0].sensor_profile,
                                                max_temp: escalationData.Items[0].maxTemp,
                                                min_temp: escalationData.Items[0].minTemp,
                                                max_humid: escalationData.Items[0].maxHumid,
                                                min_humid: escalationData.Items[0].minHumid,
                                                max_cap: escalationData.Items[0].maxCap,
                                                minc_cap: escalationData.Items[0].minCap,
                                                location : userLocationData.location
                                            }})
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
                Success:false,
                error: err.name ? err.name : "Exception",
                message: err.message ? err.message : "Unknown error"
            })
        };
    }
}