/**
 * Route: POST /device 
 */

const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });
const _ = require('underscore');
const util = require('./util.js');
const jwt = require('jsonwebtoken');
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const deviceTable = process.env.DEVICE_TABLE;
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
        let item = JSON.parse(event.body);
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


        let deviceItem = await dynamoDB.query(paramsDevice).promise();
        if (deviceItem.Count == 0) {
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

        let paramsDeviceMeta = {
            TableName: deviceMeta,
            KeyConditionExpression: "userName = :userName and device_id = :device_id",
            ExpressionAttributeValues: {
                ":userName": decoded.user.userName,
                ":device_id": device_id
            }
        };

        await updateMeta(deviceItem.Items[0],item);
        await updateLux(deviceItem.Items[0],item);

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


const updateLux = async (deviceItem, metaItems) => {
        console.log(deviceItem);
        console.log(metaItems);  
        deviceItem.sensor_at = metaItems.sensor_at;
        let deviceUpdateData = {};
        switch(deviceItem.sensor_at){
            case util.lux_profile_enum.LUX_1:
                deviceItem.lux_2 = metaItems.lux_2;
                deviceItem.lux_3 = metaItems.lux_3;
                deviceItem.lux_4 = metaItems.lux_4;
                deviceUpdateData = {
                    TableName: deviceTable,
                    Key: { "userName": deviceItem.userName, "device_id": deviceItem.device_id},
                    ConditionExpression: '#device = :device',
                    UpdateExpression: 'set #sensor_at = :sensor_at, #lux_2 = :lux2, #lux_3 = :lux3, #lux_4 = :lux4',
                    ExpressionAttributeNames: {
                        '#device': 'device_id',
                        '#sensor_at': 'sensor_at',
                        '#lux_2': 'lux_2',
                        '#lux_3': 'lux_3',
                        '#lux_4': 'lux_4'
                    },
                    ExpressionAttributeValues: {
                        ':device': device_id,
                        ':sensor_at': deviceItem.sensor_at,
                        ':lux_2': deviceItem.lux_2,
                        ':lux_3': deviceItem.lux_3,
                        ':lux_4': deviceItem.lux_4
                    }
                }
            break;
            case util.lux_profile_enum.LUX_2:
                deviceItem.lux_1 = metaItems.lux_1;
                deviceItem.lux_3 = metaItems.lux_3;
                deviceItem.lux_4 = metaItems.lux_4;
                deviceUpdateData = {
                    TableName: deviceTable,
                    Key: { "userName": deviceItem.userName, "device_id": deviceItem.device_id},
                    ConditionExpression: '#device = :device',
                    UpdateExpression: 'set #sensor_at = :sensor_at, #lux_1 = :lux1, #lux_3 = :lux3, #lux_4 = :lux4',
                    ExpressionAttributeNames: {
                        '#device': 'device_id',
                        '#sensor_at': 'sensor_at',
                        '#lux_1': 'lux_1',
                        '#lux_3': 'lux_3',
                        '#lux_4': 'lux_4'
                    },
                    ExpressionAttributeValues: {
                        ':device': device_id,
                        ':sensor_at': deviceItem.sensor_at,
                        ':lux_1': deviceItem.lux_1,
                        ':lux_3': deviceItem.lux_3,
                        ':lux_4': deviceItem.lux_4
                    }
                }
            break;
            case util.lux_profile_enum.LUX_3:
                deviceItem.lux_1 = metaItems.lux_1;
                deviceItem.lux_3 = metaItems.lux_2;
                deviceItem.lux_4 = metaItems.lux_4;
                deviceUpdateData = {
                    TableName: deviceTable,
                    Key: { "userName": deviceItem.userName, "device_id": deviceItem.device_id},
                    ConditionExpression: '#device = :device',
                    UpdateExpression: 'set #sensor_at = :sensor_at, #lux_1 = :lux1, #lux_2 = :lux2, #lux_4 = :lux4',
                    ExpressionAttributeNames: {
                        '#device': 'device_id',
                        '#sensor_at': 'sensor_at',
                        '#lux_1': 'lux_1',
                        '#lux_2': 'lux_2',
                        '#lux_4': 'lux_4'
                    },
                    ExpressionAttributeValues: {
                        ':device': device_id,
                        ':sensor_at': deviceItem.sensor_at,
                        ':lux_1': deviceItem.lux_1,
                        ':lux_2': deviceItem.lux_2,
                        ':lux_4': deviceItem.lux_4
                    }
                }
            break;
            case util.lux_profile_enum.LUX_4:
                deviceItem.lux_1 = metaItems.lux_1;
                deviceItem.lux_2 = metaItems.lux_2;
                deviceItem.lux_3 = metaItems.lux_3;
                deviceUpdateData = {
                    TableName: deviceTable,
                    Key: { "userName": deviceItem.userName, "device_id": deviceItem.device_id},
                    ConditionExpression: '#device = :device',
                    UpdateExpression: 'set #sensor_at = :sensor_at, #lux_1 = :lux1, #lux_2 = :lux2, #lux_3 = :lux3',
                    ExpressionAttributeNames: {
                        '#device': 'device_id',
                        '#sensor_at': 'sensor_at',
                        '#lux_1': 'lux_1',
                        '#lux_2': 'lux_2',
                        '#lux_3': 'lux_3'
                    },
                    ExpressionAttributeValues: {
                        ':device': device_id,
                        ':sensor_at': deviceItem.sensor_at,
                        ':lux_1': deviceItem.lux_1,
                        ':lux_2': deviceItem.lux_2,
                        ':lux_3': deviceItem.lux_3
                    }
                }
            break;
            default:
                deviceItem.lux_1 = metaItems.lux_1;
                deviceItem.lux_2 = metaItems.lux_2;
                deviceItem.lux_3 = metaItems.lux_3;
                deviceItem.lux_4 = metaItems.lux_4;
            break;
        }
    if(!deviceItem['sensorAt']){
        await dynamoDB.put({
            TableName: deviceTable,
            Item: deviceItem
          }, (err, data) => {
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
          }).promise();
    }else{
        await dynamoDB.update(deviceUpdateData, (err, data) => {
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
}

const updateMeta = async (deviceItem, metaItems) => {
    console.log(deviceItem);
    console.log(metaItems);
    let deviceMetaData = {
        TableName: deviceMeta,
        Key: { "userName": deviceItem.userName, "device_id": deviceItem.device_id },
        ConditionExpression: '#device = :device',
        UpdateExpression: 'set #ex_1 = :ex_1, #ex_2 = :ex_2, #ex_3 = :ex_3, #ex_4 = :ex_4, #obj_1 = :obj_1, #obj_2 = :obj_2, #obj_3 = :obj_3, #obj_4 = :obj_4 ',
        ExpressionAttributeNames: {
            '#device': 'device_id',
            '#ex_1': 'ex_1',
            '#ex_2': 'ex_2',
            '#ex_3': 'ex_3',
            '#ex_4': 'ex_4',
            '#obj_1' : 'obj_1',
            '#obj_2' : 'obj_2',
            '#obj_3' : 'obj_3',
            '#obj_4' : 'obj_4',
        },
        ExpressionAttributeValues: {
            ':device': deviceItem.device_id,
            ':ex_1' : metaItems.ex_1,
            ':ex_2' : metaItems.ex_2,
            ':ex_3' : metaItems.ex_3,
            ':ex_4' : metaItems.ex_4,
            ':obj_1' : metaItems.obj_1,
            ':obj_2' : metaItems.obj_2,
            ':obj_3' : metaItems.obj_3,
            ':obj_4' : metaItems.obj_4,
        }
    }

    if(!deviceItem['ex_1']){
        let deviceMetaItems = {};
        deviceMetaItems.device_id = deviceItem.device_id;
        deviceMetaItems.userName = deviceItem.userName;
        deviceMetaItems.ex_1 = metaItems.ex_1;
        deviceMetaItems.ex_2 = metaItems.ex_2;
        deviceMetaItems.ex_3 = metaItems.ex_3;
        deviceMetaItems.ex_4 = metaItems.ex_4;
        deviceMetaItems.obj_1 = metaItems.obj_1;
        deviceMetaItems.obj_2 = metaItems.obj_2;
        deviceMetaItems.obj_3 = metaItems.obj_3;
        deviceMetaItems.obj_4 = metaItems.obj_4;
        await dynamoDB.put({
            TableName: deviceMeta,
            Item: deviceMetaItems
          }, (err, data) => {
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
          }).promise();
    }else{
        await dynamoDB.update(deviceMetaData, (err, data) => {
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

    
}
