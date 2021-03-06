import { json } from 'body-parser';
import * as helmet from 'helmet';
import * as path from 'path';
import {
  SakuraApi,
  SakuraApiPlugin
} from '../../src/core';
import {urljoin} from '../../src/core';

const baseUri = '/testApi';

export const testUrl = (endpoint: string) => urljoin([baseUri, endpoint]);
export const testMongoDbUrl = (sapi) => `mongodb://localhost:${sapi.config.TEST_MONGO_DB_PORT}`;

export interface ITestSapiOptions {
  providers?: any[];
  models?: any[];
  routables?: any[];
  plugins?: SakuraApiPlugin[];
  suppressAnonymousAuthenticatorInjection?: boolean;
}

process.on('unhandledRejection', (r) => {

  // tslint:disable:no-console
  console.log('Unhandled Rejection'.red.underline);
  console.log('-'.repeat(process.stdout.columns).red);
  console.log('↓'.repeat(process.stdout.columns).zebra.red);
  console.log('-'.repeat(process.stdout.columns).red);
  console.log(r);
  console.log('-'.repeat(process.stdout.columns).red);
  console.log('↑'.repeat(process.stdout.columns).zebra.red);
  console.log('-'.repeat(process.stdout.columns).red);
  // tslint:enable:no-console

  throw r;
});

export function testSapi(options: ITestSapiOptions): SakuraApi {

  const sapi = new SakuraApi({
    baseUrl: baseUri,
    configPath: 'lib/spec/config/environment.json',
    models: options.models,
    plugins: options.plugins,
    providers: options.providers,
    routables: options.routables,
    suppressAnonymousAuthenticatorInjection: options.suppressAnonymousAuthenticatorInjection
  });

  sapi.addMiddleware(helmet(), 0);
  sapi.addMiddleware(json(), 0);

  if (process.env.TRACE_REQ) {
    sapi.addMiddleware((req, res, next) => {
      // tslint:disable:no-console
      console.log(`REQUEST: ${req.method}: ${req.url}`.blue);
      // tslint:enable:no-console
      next();
    });
  }

  sapi.addLastErrorHandlers((err, req, res, next) => {

    // tslint:disable:no-console
    console.log('-'.repeat(process.stdout.columns).red);
    console.log('↓'.repeat(process.stdout.columns).zebra.red);
    console.log('-'.repeat(process.stdout.columns).red);
    console.log('An error bubbled up in an unexpected way during testing');
    console.log(err);
    console.log('-'.repeat(process.stdout.columns).red);
    console.log('↑'.repeat(process.stdout.columns).zebra.red);
    console.log('-'.repeat(process.stdout.columns).red);
    // tslint:enable:no-console

    next(err);
  });

  return sapi;
}
