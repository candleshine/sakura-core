import 'colors';

process.env.NODE_ENV = 'sakura-api-test';
process.env.SAKURA_API_CONFIG_TEST = 'found';
console.log((`NODE_ENV set to ${process.env.NODE_ENV}`.green));