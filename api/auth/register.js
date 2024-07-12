/**
 * Route: POST /device 
 */

const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const _ = require('underscore');
const util = require('../util.js');
const moment = require('moment');
//const bcrypt = require('bcrypt');

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.USER_TABLE;


exports.handler  = async(event)=>{
   try{
       let item = JSON.parse(event.body);
       
       let paramsUserName = {
        TableName: tableName,
        KeyConditionExpression: "userName = :userName",
        ExpressionAttributeValues: {
            ":userName": item.userName
        },
       };

       let userNameData = await dynamoDB.query(paramsUserName,(err,data)=>{
           if(err){
               console.log("Unable to query dynamodb User table");
            return{
                statusCode: err.statusCode ? err.statusCode : 500,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({
                    error: err.name ? err.name : "Exception",
                    message: err.message ? err.message : "Unknown error"
                })
            };
           }
       }).promise();

       if(userNameData.Count > 0){
        return{
          statusCode: 400,
          headers: util.getResponseHeaders(),
          body: JSON.stringify({Success: false,
                                error:util.user_error.USER_EXISTS}),
        }
       }

       let paramsEmail = {
        TableName: tableName,
        IndexName: "email_id-index", 
        KeyConditionExpression: "email_id = :email_id",
        ExpressionAttributeValues: {
            ":email_id": item.email_id
        },
       };
       
       let emailData = await dynamoDB.query(paramsEmail,(err,data)=>{
        if(err){
            console.log("Unable to query dynamodb Email");
         return{
             statusCode: err.statusCode ? err.statusCode : 500,
             headers: util.getResponseHeaders(),
             body: JSON.stringify({
                 error: err.name ? err.name : "Exception",
                 message: err.message ? err.message : "Unknown error"
             })
         };
        }
       }).promise();
       console.log(emailData)
       if(emailData.Count > 0){
        return{
          statusCode: 400,
          headers: util.getResponseHeaders(),
          body: JSON.stringify({Success: false,
                                error:util.user_error.EMAIL}),
        }
       }

       item.timestamp = moment().unix();
       item.expires = moment().add(180, 'days').unix();
       /*const salt =  await bcrypt.genSalt(10);
       item.password = await bcrypt.hash(item.password,salt);
       console.log(item.password);*/

       item.isAdmin = util.admin_enum.IS_ADMIN;
       item.parent = item.userName;
       
       let data = await dynamoDB.put({
           TableName: tableName,
           Item: item
       },(err,data)=>{
           if(err){
               console.log("Unable to query dynamodb User table");
            return{
                statusCode: err.statusCode ? err.statusCode : 500,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({
                    error: err.name ? err.name : "Exception",
                    message: err.message ? err.message : "Unknown error"
                })
            };
           }
       }).promise();
       
       return {
           statusCode: 200,
           headers: util.getResponseHeaders(),
           body: JSON.stringify({
                Success: true,
                user:item.userName,
                email: item.email_id
           })
       };

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