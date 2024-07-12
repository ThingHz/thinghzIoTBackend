var contentType = require('content-type')

const getUserId = (headers) => {
    return headers.app_user_id;
}

const getUserName = (headers) => {
    return headers.app_user_name;
}

const getContentType = (headers) => {
    var content_type = headers['Content-Type'];
    return content_type;
}

const varifyToken = (headers) => {
    let token = "";
    var bearerToken = headers.Authorization;
    console.log(bearerToken);
    if(bearerToken == null){
        return token;
    }
    token = bearerToken.replace('Bearer ', '');
    return token;
} 

const getResponseHeaders = () => {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Origin': '*'
    }
}

const getDownloadHeaders = (device_id) => {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Content-Disposition' : `attachment; filename=${device_id}_config.json`
    }
}

let postErrorResponse =(err)=>{ 
    return {
    statusCode: err.statusCode ? err.statusCode : 500,
    headers: util.getResponseHeaders(),
    body: JSON.stringify({
        error: err.name ? err.name : "Exception",
        message: err.message ? err.message : "Unknown error"
    })
}};
let convertToUnixIST = (unixTimeStamp)=>{
    return (unixTimeStamp+19800);
}

const user_error = {
    DEVICE_ERROR : 'device not available. Add the device first',
    NO_DEVICE_AT_TIME: 'no device data on following date',
    NO_AUTH: 'Not authorized user',
    AUTH_TOKEN_NULL: 'authorization header not declared',
    NO_OFFLINE: 'No offline devices',
    NO_ONLINE: 'No online devices',
    NO_ESCALATION: 'No escalation yet',
    NO_ESCALATED_DEVICES: 'No escalated devices',
    USER_NAME: 'user doesnot exixts',
    EMAIL: 'email is already register',
    SENSOR_PROFILE: 'this sensor does not exist',
    DEVICE_EXISTS : 'deviceId already exixts',
    THING_EXISTS : 'thing already exixts',
    No_USER: 'invalid username/password',
    INTERNAL: 'internal error',
    BAD_PASS: 'invalid password',
    EXPIRE:   'user expired',
    USER_EXISTS:'username already taken', 
    NO_CHILD_USER: 'no user assigned to admin',
    FAILED_TO_PUBLISH: 'failed to publish to iot topic'
  }

const device_status = {
    ONLINE: 'online',
    OFFLINE: 'offline'
}

const sensor_profile_enum = {
    SENSOR_NONE     :  1,
    SENSOR_T        :  2,
    SENSOR_TH       :  3,
    SENSOR_GAS      :  4,
    SENSOR_LIGHT    :  5  
}

const lux_profile_enum = {
    LUX_1     :  1,
    LUX_2     :  2,
    LUX_3     :  3,
    LUX_4     :  4,
      
}

const is_range_device = {
    DEVICE          :   1,
    Range           :   2,
    RANGE_DEVICE    :   3
}

const admin_enum = {
    IS_OPERATOR : 0,
    IS_ADMIN : 1  
}

module.exports = {
    getUserId,
    getUserName,
    getResponseHeaders,
    getDownloadHeaders,
    user_error,
    device_status,
    sensor_profile_enum,
    getContentType,
    postErrorResponse,
    admin_enum,
    is_range_device,
    varifyToken,
    convertToUnixIST,
    lux_profile_enum
}