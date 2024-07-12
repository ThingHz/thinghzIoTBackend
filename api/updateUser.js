/**
 * Route: POST /device 
 */

const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});

const _ = require('underscore');
const util = require('./util.js');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const deviceTableName = process.env.DEVICE_TABLE;
const childTableName = process.env.CHILD_USER_TABLE;  
const escalationTableName = process.env.ESCALATION_TABLE;

 exports.handler  = async(event)=>{
    try{
        let inDeviceTable = {};
        let inUserTable = {};
        let authData = util.varifyToken(event.headers);
        const decoded = jwt.verify(authData, process.env.JWT_SECRET); 
        let item = JSON.parse(event.body);
        if(decoded.user.isAdmin === 0){
            return{
                statusCode: 200,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({Success: false,
                                      error:util.user_error.NO_AUTH}),
            };
        }
        item.timestamp = moment().unix();
        inUserTable.timestamp = item.timestamp;
        inDeviceTable.timestamp = item.timestamp;
        for(var i=0; i<item.userCount; i++){
            userData = item.users[i];
            console.log(userData);
            deviceCount = userData.deviceCount;
            inDeviceTable.userName = userData.userName;
            inUserTable.userName = userData.userName;
            userData.isAdmin = util.admin_enum.IS_OPERATOR;
            inDeviceTable.isAdmin = util.admin_enum.IS_OPERATOR;
            await updateUserTable(userData,decoded.user.userName);
            for(j=0;j<deviceCount;j++){
                try{
                    console.log(userData.devices[j])
                    await updateDeviceTable(userData.devices[j],userData.userName,decoded.user.userName);
                    await updateEscalationTable(userData.devices[j],userData.userName,decoded.user.userName);
                }catch(err){
                    console.log("Error",err);
                    return{
                        statusCode: err.statusCode ? err.statusCode : 500,
                        headers: util.getResponseHeaders(),
                        body: JSON.stringify({
                            error: err.name ? err.name : "Exception",
                            message: err.message ? err.message : "Unknown error"
                        })
                    }
                }
            }
        }
        return{
            statusCode: 200,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({
                    Success: true,
                    message: "users updated"
                    })
        }
    }catch(err){
        console.log("Error",err);
        return{
            statusCode: err.statusCode ? err.statusCode : 500,
            headers: util.getResponseHeaders(),
            body: JSON.stringify({
                error: err.name ? err.name : "Exception",
                message: err.message ? err.message : "Unknown error"
            })
        }
    }
 }

 
 const updateDeviceTable = async (deviceId,childUser,userName)=>{
    console.log(deviceId);
    let params = {
        TableName: deviceTableName,
        KeyConditionExpression: "userName = :userName and device_id = :device_id",
        ExpressionAttributeValues: {
            ":userName": userName,
            ":device_id": deviceId
        }
    };

    let data = await dynamoDB.query(params).promise();
    
    if(data.Count == 0){
            return{
                statusCode: 200,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({Success: false,
                                      error:util.user_error.DEVICE_ERROR}),
            }
        }

    data.Items[0].userName = childUser
    data.Items[0].isAdmin = util.admin_enum.IS_OPERATOR; 
    console.log(data)    
    await dynamoDB.put({
        TableName: deviceTableName,
        Item: data.Items[0]
        },(err,data)=>{
            if(err){
                return{
                    statusCode: err.statusCode ? err.statusCode : 500,
                    headers: util.getResponseHeaders(),
                    body: JSON.stringify({
                        error: err.name ? err.name : "Exception",
                        message: err.message ? err.message : "Unknown error"
                    })
                }               
            }
        }).promise();
        
}

const updateUserTable = async (userData,parentUserName)=>{
    let userDataTable = {};
    userDataTable.userName = userData.userName;
    userDataTable.email_id = userData.email_id;
    userDataTable.password = userData.password;
    userDataTable.phone = userData.phone;
    userDataTable.timestamp = userData.timestamp;
    userDataTable.parent = parentUserName;
    userDataTable.isAdmin = userData.isAdmin;
    userDataTable.location = userData.location;
    await dynamoDB.put({
        TableName: childTableName,
        Item:userDataTable,
    },(err,data)=>{
        if(err){
            return{
                statusCode: err.statusCode ? err.statusCode : 500,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({
                    error: err.name ? err.name : "Exception",
                    message: err.message ? err.message : "Unknown error"
                })
            } 
        }
    }).promise()
}

const updateEscalationTable = async (deviceId,childUser,userName)=>{
    let params = {
        TableName: escalationTableName,
        KeyConditionExpression: "device_id = :deviceId AND userName = :user",
        ExpressionAttributeValues: {
            ":deviceId": deviceId,
            ":user": userName
        }
    };
    
    let escalationData = await dynamoDB.query(params).promise();
    
    if(escalationData.Count == 0){
            return{
                statusCode: 200,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({Success: false,
                                      error:util.user_error.DEVICE_ERROR}),
            }
        }
    escalationData.Items[0].userName = childUser;
    await dynamoDB.put({
        TableName: escalationTableName,
        Item:data,
    },(err,data)=>{
        if(err){
            return{
                statusCode: err.statusCode ? err.statusCode : 500,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({
                    error: err.name ? err.name : "Exception",
                    message: err.message ? err.message : "Unknown error"
                })
            } 
        }
    }).promise()
}
