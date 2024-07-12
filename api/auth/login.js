
const jwt = require('jsonwebtoken');
const JWT_EXPIRATION_TIME = '8h';
const util = require('../util.js');
//const bcrypt = require('bcrypt');
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.USER_TABLE;


module.exports.handler = async(event) => {
  const {userName,password} = JSON.parse(event.body);

  try {
    let params = {
      TableName: tableName,
      KeyConditionExpression: "userName = :userName",
      ExpressionAttributeValues: {
          ":userName": userName
      },
    };
    let data = await dynamodb.query(params).promise();
    
    if(data.Count === 0){
      return{
        statusCode: 200,
        headers: util.getResponseHeaders(),
        body: JSON.stringify({Success: false,
                              error:util.user_error.No_USER}),
      }
    }
    //const hasValidPassword = await bcrypt.compare(password,data.Items[0].password);

    //if (!hasValidPassword) {
    if(password != data.Items[0].password){
      return{
          statusCode: 200,
          headers: util.getResponseHeaders(),
          body: JSON.stringify({Success: false,
                                error:util.user_error.BAD_PASS}),
        }
    }
    // Issue JWT
    const user = {
      userName: userName,
      email_id: data.Items[0].email_id,
      isAdmin: data.Items[0].isAdmin,
      location: data.Items[0].location
    };
    const token = jwt.sign({user:user}, process.env.JWT_SECRET,{expiresIn:'20d'});
      return{ // Success response
        statusCode: 200,
        headers: util.getResponseHeaders(),
        body: JSON.stringify({Success:true,
          token
        })
      }
  } catch (e) {
    console.log(`Error logging in: ${e.message}`);
    return{ // Error response
        statusCode: err.statusCode ? err.statusCode : 500,
        headers: util.getResponseHeaders(),
        body: JSON.stringify({
            Success:false,
            error: err.name ? err.name : "Exception",
            message: err.message ? err.message : "Unknown error"
        })
    };
  }
};