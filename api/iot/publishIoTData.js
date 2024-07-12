/**
 * Route: POST /publish 
 */

const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });
const util = require('../util');
var iotdata = new AWS.IotData({ endpoint: "a26dm966t9g0lv-ats.iot.us-east-1.amazonaws.com" });
const jwt = require('jsonwebtoken');

exports.handler = async (event) => {

    let item = JSON.parse(event.body);

    console.log("mqtt_payload: ", item);

    let authData = util.varifyToken(event.headers);
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

    var params = {
        topic: 'aws/thing/thinghz/light',
        payload: JSON.stringify({
            light_state_1: item.light_state_1,
            light_state_2: item.light_state_2,
            light_thresh: item.light_thresh
        }),
        qos: 1
    };
    iotdata.publish(params, (err, data) => {
        if (err) {
            return {
                statusCode: 200,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({
                    Success: false,
                    err: util.user_error.FAILED_TO_PUBLISH,
                    msg: err
                })
            }
        }

    }).promise();
    return {
        statusCode: 200,
        headers: util.getResponseHeaders(),
        body: JSON.stringify({
            Success: true,
            data: params
        })
    }

}

