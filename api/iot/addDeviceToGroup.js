/**
 * Route: GET device-range/{device_id} 
 */

const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });
const util = require('../util.js');
const jwt = require('jsonwebtoken');
const IoT = new AWS.Iot();

exports.handler = async (event) => {
    try {
        let item = JSON.parse(event.body);
        let inDeviceTable = {};
        let authData = util.varifyToken(event.headers);
        /*decode JWT Token*/
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
        let group = item.group_id; 
        inDeviceTable.userName = decoded.user.userName;
        inDeviceTable.device_id = item.device_id;
        inDeviceTable.group_id = group.replace(/ /g, "_");
        /*Now Check in AWS IoT fro the device_id*/
        try{
            await IoT.describeThing({thingName : inDeviceTable.device_id}).promise();
            /*If device exists then return a response with thing exists error*/
        }catch (err){
            return {
                statusCode: 200,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({
                    Success: false,
                    error: util.user_error.DEVICE_ERROR
                })
            }
        }        
        try {
            /*Now check for the Thing Group*/
            await IoT.describeThingGroup({thingGroupName: inDeviceTable.group_id}).promise();
        } catch (error) {
            console.log("Group does not exists create a new one");
            /*Thing group does not exist, create a new one*/
            await IoT.createThingGroup({thingGroupName: inDeviceTable.group_id}).promise();
            console.log("Group created successfully");
        }

        /*Add the device to the group*/
        try{
            console.log("add Thing to group");
            await IoT.addThingToThingGroup({
                thingName: inDeviceTable.device_id,
                thingGroupName: inDeviceTable.group_id
            }).promise();
            console.log("Thing added to group");
            return {
                statusCode: 200,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({
                    Success: true,
                    message: `${inDeviceTable.device_id} add to the things ${inDeviceTable.group_id} group`
                })
            }     
        }catch(err){
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

