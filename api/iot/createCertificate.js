/**
 * Route: GET device-range/{device_id} 
 */

const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });
const util = require('../util.js');
//const jwt = require('jsonwebtoken');
const IoT = new AWS.Iot();
const ca_cert = "";
const iot_policy = process.env.IOT_POLICY; 
exports.handler = async (event) => {
    try {
        //let item = JSON.parse(event.body);
        let query = event.queryStringParameters;
        let deviceId = query.device_id;
        let groupId = query.group_id;
        let inDeviceTable = {};
        inDeviceTable.device_id = deviceId;
        inDeviceTable.group_id = groupId.replace(/ /g, "_");
        
        console.log("creating certificates");
        const keysAndCertificates = await IoT.createKeysAndCertificate().promise();
        console.log("attaching certificate to policy");
            await IoT.attachPolicy({
                policyName: iot_policy,
                target: keysAndCertificates.certificateArn
            }).promise();
            console.log("attaching thing to policy");
        
            await IoT.attachThingPrincipal({
                thingName: inDeviceTable.device_id,
                principal: keysAndCertificates.certificateArn
            }).promise();
    
            const deviceCertificate = keysAndCertificates.certificatePem;
            const privateKey = keysAndCertificates.keyPair.PrivateKey;
            const endpoint = await IoT.describeEndpoint({}).promise();
            const iotEndpoint = endpoint.endpointAddress;

            console.log("getting CA certificate");
        
            
            const jsonDocument = {
                device_id: inDeviceTable.device_id,
                group_id: inDeviceTable.group_id,
                broker: iotEndpoint,
                port: 8883,
                authentication: {
                    device_certificate: deviceCertificate,
                    device_private_key: privateKey,
                    ca_certificate: ca_cert
                }
            };

            return{
                statusCode: 200,
                headers: util.getDownloadHeaders(inDeviceTable.device_id),
                body: JSON.stringify(jsonDocument)
            };
        
                
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

