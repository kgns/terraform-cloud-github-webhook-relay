// Load the AWS SDK for Node.js
const AWS = require('aws-sdk');
const https = require('https');

// Create DynamoDB service object
const ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

const target = 'api.github.com';


function asyncRequest(options, payload) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => {
                resolve({
                    "body": Buffer.concat(chunks).toString(),
                    "statusCode": res.statusCode,
                    "headers": res.headers
                });
            });
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

exports.handler = async (event, context) => {
    let user = event.pathParameters.user;
    let repo = event.pathParameters.repo;
    let bodyStr = event.body;
    if (event.isBase64Encoded) {
        let buff = Buffer.from(event.body, 'base64');
        bodyStr = buff.toString('ascii');
    }
    let body = JSON.parse(bodyStr);
    let url = body.config.url;
    let secret = body.config.secret;

    const options = {
        hostname: target,
        port: 443,
        path: event.path,
        method: event.httpMethod,
        headers: event.headers
    };
    options.headers.Host = target;
    delete options.headers['accept-encoding'];

    const response = await asyncRequest(options, bodyStr);
    if (response.statusCode == 201) {
        let hookId = JSON.parse(response.body).id.toString();

        let resp = await asyncRequest({
            hostname: target,
            port: 443,
            path: `${options.path}/${hookId}`,
            method: 'DELETE',
            headers: {
                Host: target,
                'User-Agent': 'nodejs https',
                authorization: options.headers.authorization
            }
        }, '');

        let params = {
            TableName: 'tf_webhooks',
            Item: {
                'repo' : {S: `${user}/${repo}`},
                'id' : {N: hookId},
                'url' : {S: url},
                'secret' : {S: secret},
                'date' : {S: new Date().toISOString()}
            }
        };

        // Call DynamoDB to add the item to the table
        try {
            const data = await ddb.putItem(params).promise();
        } catch (err) {
            console.log("Error", err);
            response.body = `Could not create webhook: ${err}`;
            response.statusCode = 500;
        }
    }

    return response;
};
