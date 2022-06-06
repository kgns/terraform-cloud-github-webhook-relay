// Load the AWS SDK for Node.js
const AWS = require("aws-sdk");
const https = require("https");

// Create DynamoDB service object
const ddb = new AWS.DynamoDB({apiVersion: "2012-08-10"});

const target = "api.github.com";


function asyncRequest(options, payload = "") {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let chunks = [];
            res.on("data", (chunk) => chunks.push(chunk));
            res.on("end", () => {
                resolve({
                    "body": Buffer.concat(chunks).toString(),
                    "statusCode": res.statusCode,
                    "headers": res.headers
                });
            });
        });
        req.on("error", reject);
        req.write(payload);
        req.end();
    });
}

exports.handler = async (event, context) => {
    let user = event.pathParameters.user;
    let repo = event.pathParameters.repo;
    let bodyStr = event.body;
    if (event.isBase64Encoded) {
        let buff = Buffer.from(event.body, "base64");
        bodyStr = buff.toString("ascii");
    }

    const options = {
        hostname: target,
        port: 443,
        path: event.path,
        method: event.httpMethod,
        headers: event.headers
    };
    options.headers.Host = target;
    // disable compression for easier response handling
    delete options.headers["accept-encoding"];

    // proxy request to GitHub to relay a proper response and generate a webhook id
    const response = await asyncRequest(options, bodyStr);
    if (response.statusCode == 201) {
        let hookId = JSON.parse(response.body).id.toString();

        options.path = `${event.path}/${hookId}`;
        options.method = "DELETE";
        delete options.headers["Content-Length"];
        // if successful, delete the newly created webhook from GitHub
        await asyncRequest(options);

        let body = JSON.parse(bodyStr);
        let params = {
            TableName: "tf_webhooks",
            Item: {
                "repo" : {S: `${user}/${repo}`},
                "id" : {N: hookId},
                "url" : {S: body.config.url},
                "secret" : {S: body.config.secret},
                "date" : {S: new Date().toISOString()}
            }
        };

        // Call DynamoDB to add the item to the table
        try {
            await ddb.putItem(params).promise();
        } catch (err) {
            console.log("Error", err);
            response.body = JSON.stringify({
                "error": `Could not create webhook: ${err}`
            }, null, 2);
            response.statusCode = 500;
        }
    }

    return response;
};
