// Load the AWS SDK for Node.js
const AWS = require('aws-sdk');
const https = require('https');
const crypto = require('crypto');

// Create DynamoDB service object
const ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});


function signRequestBody(key, body) {
    return `sha1=${crypto.createHmac('sha1', key).update(body, 'utf-8').digest('hex')}`;
}

function signRequestBody256(key, body) {
    return `sha256=${crypto.createHmac('sha256', key).update(body, 'utf-8').digest('hex')}`;
}

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

    console.log(event.headers);
    const token = process.env.GITHUB_WEBHOOK_SECRET;
    const sig256 = event.headers['x-hub-signature-256'];
    const githubEvent = event.headers['x-github-event'];
    const calculatedSig = signRequestBody256(token, event.body);

    console.log(sig256);
    console.log(calculatedSig);

    if (sig256 !== calculatedSig) {
        return {
            statusCode: 401,
            headers: { 'Content-Type': 'text/plain' },
            body: 'X-Hub-Signature incorrect. Github webhook token doesn\'t match',
        };
    }

    console.log('---------------------------------');
    console.log(`Github-Event: "${githubEvent}" with action: "${JSON.parse(event.body).action}"`);
    console.log('---------------------------------');
    console.log('Payload', event.body);

    let params = {
        TableName: 'tf_webhooks',
        ExpressionAttributeValues: {
            ':repo' : {S: `${user}/${repo}`}
        },
        KeyConditionExpression: 'repo = :repo'
    };

    let lastHeaders = [];
    try {
        const data = await ddb.query(params).promise();
        for (let element of data.Items) {
            let sig = signRequestBody(element.secret.S, event.body);
            let sig256 = signRequestBody256(element.secret.S, event.body);
            let url = new URL(element.url.S);
            const options = {
                hostname: url.hostname,
                port: 443,
                path: url.pathname,
                method: 'POST',
                headers: event.headers
            };
            options.headers.host = url.hostname;
            options.headers['x-hub-signature'] = sig;
            options.headers['x-hub-signature-256'] = sig256;
            console.log(options);
            const response = await asyncRequest(options, event.body);
            lastHeaders = response.headers;
            console.log(response);
        }
    } catch (err) {
        console.log("Error", err);
    }
    
    return {
        statusCode: 200,
        body: 'OK',
        headers: lastHeaders
    };
};
