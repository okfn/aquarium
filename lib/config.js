var _ = require('underscore'),
    properties = require('properties');

try {
    // read the .env file and apply it to process.env
    _.extend(process.env, properties.parse(fs.readFileSync('.env', 'utf8')));
} catch(e) {
    // do nothing; this is normal in production
}
