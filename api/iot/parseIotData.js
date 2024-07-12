/**
 * Route: POST /data 
 */

const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });
const _ = require('underscore');
const util = require('../util');
const moment = require('moment');

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.DATA_TABLE;
const deviceTableName = process.env.DEVICE_TABLE;
const escalationTable = process.env.ESCALATION_TABLE;


exports.handler = async (event) => {

  try {
    console.log(event);
    let item = event;
    item.timestamp = (moment().unix()) + 19800;
    console.log(item);
    let paramsDevice = {
      TableName: escalationTable,
      KeyConditionExpression: "device_id = :device_id",
      ExpressionAttributeValues: {
        ":device_id": item.device_id
      },
    }

    let deviceData = await dynamoDB.query(paramsDevice).promise();
    if (deviceData.Count === 0) {
      return {
        statusCode: 200,
        headers: util.getResponseHeaders(),
        body: JSON.stringify({
          Success: false,
          error: util.user_error.DEVICE_ERROR
        })
      }
    }

    let escalation = deviceData.Items[0].escalation;

    await dynamoDB.put({
      TableName: tableName,
      Item: item
    }, (err, data) => {

    }).promise();


    switch (item.sensor_profile) {
      case util.sensor_profile_enum.SENSOR_NONE:
        return {
          statusCode: 200,
          headers: util.getResponseHeaders(),
          body: JSON.stringify({
            Success: false,
            error: util.user_error.SENSOR_PROFILE
          })
        };

      case util.sensor_profile_enum.SENSOR_T:
        var tempMin = Number(deviceData.Items[0].minTemp);
        var tempMax = Number(deviceData.Items[0].maxTemp);
        if (escalation <= 5 && (item.temp > tempMax || item.temp < tempMin)) {
          escalation++;
          await isEscalation(deviceData, escalation);
        } else if (escalation > 0 &&
          (item.temp <= tempMax || item.temp >= tempMin)) {
          escalation = 0;
          await isEscalation(deviceData, escalation);
        }
        await updateDeviceStatus(util.device_status.ONLINE, deviceData.Items[0], item);

        let paramT = {
          device_id: item.device_id,
          sensor_profile: util.sensor_profile_enum.SENSOR_T,
          temp: item.temp,
          battery: item.battery,
          escalation: escalation,
          timestamp: item.timestamp,
          range: {
            tempMin: deviceData.Items[0].minTemp,
            tempMax: deviceData.Items[0].maxTemp
          }
        };

        return {
          statusCode: 200,
          headers: util.getResponseHeaders(),
          body: JSON.stringify({
            Success: true,
            deviceStatus: util.device_status.ONLINE,
            data: paramT
          })
        };
      case util.sensor_profile_enum.SENSOR_TH:
        var tempMin = Number(deviceData.Items[0].minTemp);
        var tempMax = Number(deviceData.Items[0].maxTemp);
        var humidMin = Number(deviceData.Items[0].minHumid);
        var humidMax = Number(deviceData.Items[0].maxHumid);
        if (escalation <= 5 &&
          (item.temp > tempMax || item.temp < tempMin) &&
          (item.humid > humidMax || item.humid < humidMin)) {
          escalation++;
          await isEscalation(deviceData, escalation);
        } else if (escalation > 0 &&
          (item.temp <= tempMax || item.temp >= tempMin) &&
          (item.humid <= humidMax || item.humid >= humidMin)) {
          escalation = 0;
          await isEscalation(deviceData, escalation);
        }
        await updateDeviceStatus(util.device_status.ONLINE, deviceData.Items[0], item);
        let paramTH = {
          device_id: item.device_id,
          sensor_profile: util.sensor_profile_enum.SENSOR_TH,
          temp: item.temp,
          humid: item.humid,
          battery: item.battery,
          timestamp: item.timestamp,
          range: {
            tempMin: deviceData.Items[0].minTemp,
            tempMax: deviceData.Items[0].maxTemp,
            humidMax: deviceData.Items[0].maxHumid,
            humidMin: deviceData.Items[0].minHumid
          }
        };

        //await callStepFunction(paramTH,deviceData.Items[0].userName)
        return {
          statusCode: 200,
          headers: util.getResponseHeaders(),
          body: JSON.stringify({
            Success: true,
            data: paramTH
          })
        };

      case util.sensor_profile_enum.SENSOR_GAS:
        var gasMin = Number(deviceData.Items[0].minGas);
        var gasMax = Number(deviceData.Items[0].maxGas);
        var tempMin = Number(deviceData.Items[0].minTemp);
        var tempMax = Number(deviceData.Items[0].maxTemp);
        var humidMin = Number(deviceData.Items[0].minHumid);
        var humidMax = Number(deviceData.Items[0].maxHumid);
        if (escalation <= 5 &&
          (item.gas > gasMax || item.gas < gasMin)) {
          escalation++;
          await isEscalation(deviceData, escalation);
        } else if (escalation > 0 &&
          (item.gas < gasMax || item.gas > gasMin)) {
          escalation = 0;
          await isEscalation(deviceData, escalation);
        }
        await updateDeviceStatus(util.device_status.ONLINE, deviceData.Items[0], item);
        let paramGas = {
          device_id: item.device_id,
          device_status: util.device_status.ONLINE,
          sensor_profile: util.sensor_profile_enum.SENSOR_GAS,
          gas: item.gas,
          humid: item.humid,
          temp: item.temp,
          battery: item.battery,
          escalation: escalation,
          timestamp: item.timestamp,
          range: {
            gasMin: deviceData.Items[0].gasMin,
            gasMax: deviceData.Items[0].gasMax
          }
        };

        //await callStepFunction(paramGas,deviceData.Items[0].userName);
        return {
          statusCode: 200,
          headers: util.getResponseHeaders(),
          body: JSON.stringify({
            Success: true,
            data: paramGas
          })
        };

      case util.sensor_profile_enum.SENSOR_LIGHT:
        var tempMin = Number(deviceData.Items[0].minTemp);
        var tempMax = Number(deviceData.Items[0].maxTemp);
        var humidMin = Number(deviceData.Items[0].minHumid);
        var humidMax = Number(deviceData.Items[0].maxHumid);
        if (escalation <= 5 &&
          (item.temp > tempMax || item.temp < tempMin) &&
          (item.humid > humidMax || item.humid < humidMin)) {
          escalation++;
          await isEscalation(deviceData, escalation);
        } else if (escalation > 0 &&
          (item.temp <= tempMax || item.temp >= tempMin) &&
          (item.humid <= humidMax || item.humid >= humidMin)) {
          escalation = 0;
          await isEscalation(deviceData, escalation);
        }
        await updateDeviceStatus(util.device_status.ONLINE, deviceData.Items[0], item);
        let paramLight = {
          device_id: item.device_id,
          device_status: util.device_status.ONLINE,
          sensor_profile: util.sensor_profile_enum.SENSOR_LIGHT,
          lux: item.lux,
          light_state_1: item.light_state_1,
          light_state_2: item.light_state_2,
          light_state_3: item.light_state_3,
          light_state_4: item.light_state_4,
          humid: item.humid,
          temp: item.temp,
          battery: item.battery,
          escalation: escalation,
          timestamp: item.timestamp,
          range: {
            tempMin: deviceData.Items[0].minTemp,
            tempMax: deviceData.Items[0].maxTemp,
            humidMax: deviceData.Items[0].maxHumid,
            humidMin: deviceData.Items[0].minHumid
          }
        };

        return {
          statusCode: 200,
          headers: util.getResponseHeaders(),
          body: JSON.stringify({
            Success: true,
            data: paramLight
          })
        };


      default:
        return {
          statusCode: 200,
          headers: util.getResponseHeaders(),
          body: JSON.stringify({
            Success: false,
            error: util.user_error.SENSOR_PROFILE
          })
        };
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

const isEscalation = async (deviceData, escalation) => {
  await dynamoDB.delete({
    TableName: escalationTable,
    Key: {
      "device_id": deviceData.Items[0].device_id,
      "escalation": deviceData.Items[0].escalation
    }
  }, (err, data) => {
    if (err) {
      console.error("Unable to delete escalation. Error JSON:", JSON.stringify(err, null, 2));
      return {
        statusCode: err.statusCode ? err.statusCode : 500,
        headers: util.getResponseHeaders(),
        body: JSON.stringify({
          error: err.name ? err.name : "Exception",
          message: err.message ? err.message : "Unknown error"
        })
      }
    }
  }).promise();
  deviceData.Items[0].escalation = escalation;
  await dynamoDB.put({
    TableName: escalationTable,
    Item: deviceData.Items[0]
  }, (err, data) => {
    if (err) {
      console.error("Unable to update escalation. Error JSON:", JSON.stringify(err, null, 2));
      return {
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


const updateDeviceStatus = async (device_status, device, items) => {
  let params = {};
  switch (items.sensor_profile) {
    case util.sensor_profile_enum.SENSOR_T:
      params = {
        TableName: deviceTableName,
        Key: {
          "device_id": device.device_id,
          "userName": device.userName
        },
        ConditionExpression: '#d = :d',
        UpdateExpression: 'set #s = :s, #time = :time, #t = :t, #bat = :bat, #e = :e',
        ExpressionAttributeNames: {
          '#s': 'device_status',
          '#d': 'device_id',
          '#time': 'timestamp',
          '#t': 'temp',
          '#e': 'escalation',
          '#bat': 'battery'
        },
        ExpressionAttributeValues: {
          ':s': device_status,
          ':d': device.device_id,
          ':time': util.convertToUnixIST(moment().unix()),
          ':t': items.temp,
          ':e': device.escalation,
          ':bat': items.battery
        }
      };
      break;
    case util.sensor_profile_enum.SENSOR_TH:
      params = {
        TableName: deviceTableName,
        Key: {
          "device_id": device.device_id,
          "userName": device.userName
        },
        ConditionExpression: '#d = :d',
        UpdateExpression: 'set #s = :s, #time = :time, #t = :t, #h = :h, #bat = :bat,#e = :e',
        ExpressionAttributeNames: {
          '#s': 'device_status',
          '#d': 'device_id',
          '#time': 'timestamp',
          '#t': 'temp',
          '#h': 'humid',
          '#e': 'escalation',
          '#bat': 'battery'
        },
        ExpressionAttributeValues: {
          ':s': device_status,
          ':d': device.device_id,
          ':time': util.convertToUnixIST(moment().unix()),
          ':t': items.temp,
          ':h': items.humid,
          ':e': device.escalation,
          ':bat': items.battery
        }
      };
      break;
    case util.sensor_profile_enum.SENSOR_GAS:
      params = {
        TableName: deviceTableName,
        Key: {
          "device_id": device.device_id,
          "userName": device.userName
        },
        ConditionExpression: '#d = :d',
        UpdateExpression: 'set #s = :s, #time = :time, #bat = :bat, #t = :t, #h = :h, #gas = :gas,#e = :e',
        ExpressionAttributeNames: {
          '#s': 'device_status',
          '#d': 'device_id',
          '#time': 'timestamp',
          '#bat': 'battery',
          '#t': 'temp',
          '#h': 'humid',
          '#e': 'escalation',
          '#gas': 'gas'
        },
        ExpressionAttributeValues: {
          ':s': device_status,
          ':d': device.device_id,
          ':time': util.convertToUnixIST(moment().unix()),
          ':t': items.temp,
          ':h': items.humid,
          ':gas': items.gas,
          ':e': device.escalation,
          ':bat': items.battery
        }
      };
      break;
      case util.sensor_profile_enum.SENSOR_LIGHT:
        let lightState3 = items.light_state_3 ? items.light_state_3 : 0;
        let lightState4 = items.light_state_4 ? items.light_state_4 : 0;
        params = {
          TableName: deviceTableName,
          Key: {
            "device_id": device.device_id,
            "userName": device.userName
          },
          ConditionExpression: '#d = :d',
          UpdateExpression: 'set #s = :s, #time = :time, #bat = :bat, #t = :t, #h = :h, #lux = :lux,#e = :e,#ls = :ls,#ls1 = :ls1,#ls2 = :ls2,#ls3 = :ls3',
          ExpressionAttributeNames: {
            '#s': 'device_status',
            '#d': 'device_id',
            '#time': 'timestamp',
            '#bat': 'battery',
            '#t': 'temp',
            '#h': 'humid',
            '#e': 'escalation',
            '#lux': 'lux',
            '#ls' : 'light_state_1',
            '#ls1' : 'light_state_2',
            '#ls2' : 'light_state_3',
            '#ls3' : 'light_state_4'
          },
          ExpressionAttributeValues: {
            ':s': device_status,
            ':d': device.device_id,
            ':time': util.convertToUnixIST(moment().unix()),
            ':t': items.temp,
            ':h': items.humid,
            ':lux': items.lux,
            ':e': device.escalation,
            ':bat': items.battery,
            ':ls': items.light_state_1,
            ':ls1': items.light_state_2,
            ':ls2': lightState3,
            ':ls3': lightState4,
          }
        };
        break;
    default:
      console.log("no sensor found");
  }
  await dynamoDB.update(params, (err, data) => {
    if (err) {
      console.error("Unable to update data. Error JSON:", JSON.stringify(err, null, 2));
      return {
        statusCode: err.statusCode ? err.statusCode : 500,
        headers: util.getResponseHeaders(),
        body: JSON.stringify({
          Success: false,
          error: err.name ? err.name : "Exception",
          message: err.message ? err.message : "Unknown error"
        })
      };
    }
  }).promise();
}

