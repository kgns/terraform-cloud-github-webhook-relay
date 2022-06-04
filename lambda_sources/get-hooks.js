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

    const options = {
        hostname: target,
        port: 443,
        path: event.path,
        method: event.httpMethod,
        headers: event.headers
    };
    options.headers.Host = target;
    delete options.headers['accept-encoding'];

    const response = await asyncRequest(options, '');
    if (response.statusCode == 200) {
        let responseBody = JSON.parse(response.body);

        let params = {
            TableName: 'tf_webhooks',
            ExpressionAttributeValues: {
                ':repo' : {S: `${user}/${repo}`}
            },
            KeyConditionExpression: 'repo = :repo'
        };

        try {
            const data = await ddb.query(params).promise();
            data.Items.forEach(function(element, index, array) {
                responseBody.push({
                    type: "Repository",
                    id: element.id.N,
                    name: "web",
                    active: true,
                    events: [
                        "pull_request",
                        "push"
                    ],
                    config: {
                        content_type: "json",
                        secret: "********",
                        url: element.url.S,
                        insecure_ssl: "0"
                    },
                    updated_at: element.date.N,
                    created_at: element.date.N,
                    url: `https://api.github.com/repos/${element.repo.S}/hooks/${element.id.N}`,
                    test_url: `https://api.github.com/repos/${element.repo.S}/hooks/${element.id.N}/test`,
                    ping_url: `https://api.github.com/repos/${element.repo.S}/hooks/${element.id.N}/pings`,
                    deliveries_url: `https://api.github.com/repos/${element.repo.S}/hooks/${element.id.N}/deliveries`,
                    last_response: {
                        code: null,
                        status: "missing",
                        message: null
                    }
                });
            });
            response.body = JSON.stringify(responseBody, null, 2);
        } catch (err) {
            console.log("Error", err);
            response.body = `Could not query webhooks: ${err}`;
            response.statusCode = 500;
        }
    }

    return response;
};
