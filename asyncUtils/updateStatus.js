const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
AWS.config.correctClockSkew = true;
const _ = require('underscore');
//const util = require('./util');
const moment = require('moment');

const dynamoDB = new AWS.DynamoDB.DocumentClient();
//const sns = new AWS.SNS({apiVersion:'2010-03-31'});
const deviceTableName = process.env.DEVICE_TABLE;
const secMultiply = 60;
const minMultiple = 90;
let nowTimestamp = (moment().unix())+19800;;

exports.handler  = async(event)=>{
    console.log("stepFunctionExecution");
    //const targetARN = 'arn:aws:sns:us-east-1:307339013420:endpoint/GCM/ThingHzSendNotification/75f388e5-0a32-3214-8533-3f1b45a15e74';
    var timeDifference =  minMultiple*secMultiply;
    var expectedTimeStamp = nowTimestamp - timeDifference;
    var paramsDeviceTime = {
        TableName: deviceTableName,
        FilterExpression: '#timestamp < :expect_time',
        ExpressionAttributeValues: {':expect_time':expectedTimeStamp},
        ExpressionAttributeNames: {
            "#timestamp": "timestamp"
          }
    };
    let isOffline = await dynamoDB.scan(paramsDeviceTime).promise();
    if(isOffline.Count=0){
        return;
    }

    var userDeviceMap = _.map(isOffline.Items, (collection)=>{
        return{device:collection.device_id,user:collection.userName};
    });

    await updateDeviceStatus(userDeviceMap);
    //await sendNotification(userDeviceMap,targetARN)
}

const updateDeviceStatus = async(deviceMap)=>{
    for (i=0; i<deviceMap.length;i++){
        console.log(deviceMap[i].device);
        let paramMap = {
            TableName: deviceTableName,
            Key: {"userName": deviceMap[i].user, "device_id":deviceMap[i].device},
            ConditionExpression: '#d = :d',
            UpdateExpression: 'set #s = :s',
            ExpressionAttributeNames: {
                '#s': 'device_status',
                '#d': 'device_id'
            },
            ExpressionAttributeValues: {
                ':s': 'offline',
                ':d': deviceMap[i].device
            }
        } 
        await dynamoDB.update(paramMap,(err,data)=>{
            if(err){
              console.error("Unable to update device Status. Error JSON:", JSON.stringify(err, null, 2));
            }else{
                console.error("Successful update device Status.", JSON.stringify(data, null, 2));
            }
        }).promise();
    }   
}


/*const sendNotification = async(deviceMap,arn)=>{
    for (i=0; i<deviceMap.length;i++){

    let payload = {
        dafault: 'default',
        GCM:{
            notification:{
                body:`${deviceMap[i].device} is offline`,
                user: {userName:deviceMap[i].user,device_id:deviceMap[i].device},
                title:'Device Offline',
                sound: 'default'
            }
        }
    }
    payload.GCM = JSON.stringify(payload.GCM);
    payload = JSON.stringify(payload);
    const param_sns = {
        Message: payload,
        TargetArn: arn,
        MessageStructure: 'json'
    }
    await sns.publish(param_sns,(err,data)=>{
        if(err){
            console.error("Unable to send notification. Error JSON:", JSON.stringify(err, null, 2));
          }else{
              console.error("Successful sent notification.", JSON.stringify(data, null, 2));
          }
    }).promise()
 }  
}*/

    