// Load the AWS SDK for Node.js
const AWS = require('aws-sdk');

// Create DynamoDB service object
const ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});


exports.handler = async (event, context) => {
    let user = event.pathParameters.user;
    let repo = event.pathParameters.repo;
    let hookId = event.pathParameters.id;

    let params = {
        TableName: 'tf_webhooks',
        Key: {
            'repo' : {S: `${user}/${repo}`},
            'id' : {N: hookId}
        }
    };

    let responseBody = null;
    let statusCode = 204;

    // Call DynamoDB to delete the item from the table
    try {
        const data = await ddb.deleteItem(params).promise();
    } catch (err) {
        console.log("Error", err);
        responseBody = `Could not delete webhook: ${err}`;
        statusCode = 500;
    }

    return {
        "body": responseBody,
        "statusCode": statusCode,
        "headers": {
            "Content-Type": "application/json"
        }
    };
};
