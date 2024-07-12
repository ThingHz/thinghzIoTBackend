/**
 * Route: GET /note/n/{device_id}
 */

 const AWS = require('aws-sdk');
 AWS.config.update({ region: 'us-east-1' });
 
 const _ = require('underscore');
 const dynamoDB = new AWS.DynamoDB.DocumentClient();
 const sns = new AWS.SNS({apiVersion:'2010-03-31'});
 const escalatedDeviceTable = process.env.ESCALATION_TABLE
 
 
 exports.handler = async (event) => {
    console.log("stepFunctionExecution");
    //const targetARN = 'arn:aws:sns:us-east-1:307339013420:endpoint/GCM/ThingHzSendNotification/75f388e5-0a32-3214-8533-3f1b45a15e74';
    
    var paramsEscalation = {
        TableName: escalatedDeviceTable,
        FilterExpression: '#escalation > :level',
        ExpressionAttributeValues: {':level': 2},
        ExpressionAttributeNames: {
            "#escalation": "escalation"
          }
    };

    let isEscalated = await dynamoDB.scan(paramsEscalation).promise();
    if(isEscalated.Count=0){
        return;
    }

    var escalationMap = _.map(isEscalated.Items, (collection)=>{
        return{device:collection.device_id,user:collection.userName,escalation:collection.escalation};
    });
    //await sendNotification(escalationMap,targetARN)
    
 }

 /*const sendNotification = async(deviceMap,arn)=>{
    for (i=0; i<deviceMap.length;i++){

    let payload = {
        dafault: 'default',
        GCM:{
            notification:{
                body:`Escalation of level ${deviceMap[i].escalation} occured in ${deviceMap[i].device}`,
                user: {userName:deviceMap[i].user,device_id:deviceMap[i].device,escalation:deviceMap[i].escalation},
                title:'Escalation Occured',
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
    await sns.publish(param_sns).promise()
 }  
}*/