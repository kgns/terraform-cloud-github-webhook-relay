// Load the AWS SDK for Node.js
const AWS = require("aws-sdk");
const https = require("https");
const crypto = require("crypto");

// Create DynamoDB service object
const ddb = new AWS.DynamoDB({apiVersion: "2012-08-10"});
const repositories = JSON.parse(process.env.GITHUB_REPOSITORIES);


function signRequestBody(key, body) {
    return `sha1=${crypto.createHmac("sha1", key).update(body, "utf-8").digest("hex")}`;
}

function signRequestBody256(key, body) {
    return `sha256=${crypto.createHmac("sha256", key).update(body, "utf-8").digest("hex")}`;
}

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

    if (user != process.env.GITHUB_OWNER || !repositories.includes(repo)) {
        return {
            statusCode: 401,
            headers: { "Content-Type": "text/plain" },
            body: "Unsupported GitHub user/repository"
        };
    }

    // GitHub request signature check
    const token = process.env.GITHUB_WEBHOOK_SECRET;
    const sig256 = event.headers["x-hub-signature-256"];
    const githubEvent = event.headers["x-github-event"];
    const calculatedSig = signRequestBody256(token, event.body);

    if (sig256 !== calculatedSig) {
        return {
            statusCode: 401,
            headers: { "Content-Type": "text/plain" },
            body: "X-Hub-Signature incorrect. Github webhook token doesn't match",
        };
    }

    let params = {
        TableName: "tf_webhooks",
        ExpressionAttributeValues: {
            ":repo" : {S: `${user}/${repo}`}
        },
        KeyConditionExpression: "repo = :repo"
    };

    let lastHeaders = [];
    try {
        const data = await ddb.query(params).promise();
        // relay GitHub webhook payload to all terraform webhook endpoints
        for (let element of data.Items) {
            let url = new URL(element.url.S);
            const options = {
                hostname: url.hostname,
                port: 443,
                path: url.pathname,
                method: "POST",
                headers: event.headers
            };
            options.headers.host = url.hostname;
            options.headers["x-hub-signature"] = signRequestBody(element.secret.S, event.body);
            options.headers["x-hub-signature-256"] = signRequestBody256(element.secret.S, event.body);
            const response = await asyncRequest(options, event.body);
            lastHeaders = response.headers;
        }
    } catch (err) {
        console.log("Error", err);
        return {
            statusCode: 500,
            headers: { "Content-Type": "text/plain" },
            body: err.toString()
        };
    }

    return {
        statusCode: 200,
        body: "OK",
        headers: lastHeaders
    };
};
