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
 const escalationTable = process.env.ESCALATION_TABLE;
 const deviceMetaTable = process.env.DEVICE_META_DATA_TABLE;
 
 
 exports.handler = async (event) => {
     try {
         let authData = util.varifyToken(event.headers);
         let query = event.queryStringParameters;
         if(authData == ""){
             return{
                 statusCode: 200,
                 headers: util.getResponseHeaders(),
                 body: JSON.stringify({Success: false,
                                       error:util.user_error.AUTH_TOKEN_NULL}),
             }
         }
         const decoded = jwt.verify(authData, process.env.JWT_SECRET); 
         let device_id = decodeURIComponent(event.pathParameters.device_id);
         let paramsDevices = {
            TableName: deviceTableName,
            Key:{
            "device_id": device_id,
            "userName": decoded.user.userName
            }
            }

        let paramsMeta = {
            TableName: deviceMetaTable,
            Key:{
            "device_id": device_id,
            "userName": decoded.user.userName
            }
            }

         let deviceDeleteData = await dynamodb.delete(paramsDevices,(err,data)=>{
            if (err) {
                console.error("Unable to delete from Device Table. Error JSON:", JSON.stringify(err, null, 2));
                return{
                    statusCode: err.statusCode ? err.statusCode : 500,
                    headers: util.getResponseHeaders(),
                    body: JSON.stringify({
                        Success: false,
                        error: err.name ? err.name : "Exception",
                        message: err.message ? err.message : "Unknown error"
                    })
                }
            }
        
         }).promise(); 

         let deviceDeleteMeta = await dynamodb.delete(paramsMeta,(err,data)=>{
            if (err) {
                console.error("Unable to delete from Device Table. Error JSON:", JSON.stringify(err, null, 2));
                return{
                    statusCode: err.statusCode ? err.statusCode : 500,
                    headers: util.getResponseHeaders(),
                    body: JSON.stringify({
                        Success: false,
                        error: err.name ? err.name : "Exception",
                        message: err.message ? err.message : "Unknown error"
                    })
                }
            }
        
         }).promise(); 

         let paramsEscalatedDevice = {
            TableName: escalationTable,
            Key:{
                "device_id": device_id,
                "escalation": parseInt(query.escalation)
            }
            }
         let escalationDeleteData = await dynamodb.delete(paramsEscalatedDevice,(err,data)=>{
            if (err) {
                console.error("Unable to delete from Escalation Table. Error JSON:", JSON.stringify(err, null, 2));
                return{
                    statusCode: err.statusCode ? err.statusCode : 500,
                    headers: util.getResponseHeaders(),
                    body: JSON.stringify({
                        Success: false,
                        error: err.name ? err.name : "Exception",
                        message: err.message ? err.message : "Unknown error"
                    })
                }
            }
         }).promise();   
        
         return{
            statusCode: 200,
            headers: util.getResponseHeaders(),
            body: JSON.stringify({
                Success: true,
                message: `${device_id} deleted success` 
            })
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