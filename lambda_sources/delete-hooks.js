// Load the AWS SDK for Node.js
const AWS = require("aws-sdk");
const https = require("https");

// Create DynamoDB service object
const ddb = new AWS.DynamoDB({apiVersion: "2012-08-10"});
const repositories = JSON.parse(process.env.GITHUB_REPOSITORIES);

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
    let hookId = event.pathParameters.id;

    if (user == process.env.GITHUB_OWNER && repositories.includes(repo)) {
        let params = {
            TableName: "tf_webhooks",
            Key: {
                "repo" : {S: `${user}/${repo}`},
                "id" : {N: hookId}
            }
        };
    
        let responseBody = null;
        let statusCode = 204;
    
        // Call DynamoDB to delete the item from the table
        try {
            const data = await ddb.deleteItem(params).promise();
        } catch (err) {
            console.log("Error", err);
            responseBody = JSON.stringify({
                "error": `Could not delete webhook: ${err}`
            }, null, 2);
            statusCode = 500;
        }
    
        return {
            "body": responseBody,
            "statusCode": statusCode,
            "headers": {
                "Content-Type": "application/json"
            }
        };
    } else {
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
    
        // relay delete request to GitHub and return its response
        return await asyncRequest(options);
    }
};
