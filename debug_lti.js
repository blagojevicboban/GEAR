import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const lti = require('ltijs');

console.log('Type of lti.Provider:', typeof lti.Provider);
console.log('Is setup function?', typeof lti.Provider.setup);
if (lti.Provider.setup) {
    console.log('It is a singleton instance. Using .setup()');
} else {
    console.log('It is NOT a singleton with setup.');
}
