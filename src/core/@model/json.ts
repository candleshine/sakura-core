/**
 * The symbols used by Reflect to store `@Json()` metadata for use by `@Module`. These symbols are not considered
 * part of the API contract and may change or be removed without notice on patch releases.
 */
import { IContext } from '../lib';

export const jsonSymbols = {
  jsonByFieldName: Symbol('jsonByFieldName'),
  jsonByPropertyName: Symbol('jsonByPropertyName'),
  propertyName: Symbol('jsonPropertyName')
};

/**
 * Defines the valid options for `@`[[Json]].
 */
export interface IJsonOptions {

  /**
   * Allows for multiple field mappings when marshalling to and from JSON. Context is helpful in a scenario like
   * the following:
   *
   * ### Example
   * <pre>
   * <span>@</span>Model()
   * class SomeModel {
   *      <span>@</span>Json('fName')
   *      <span>@</span>Json('first_name', 'source2')
   *      firstName = 'default';
   * }
   * </pre>
   *
   * `SomeModel.fromJson({fName: 'John'})`
   * `SomeModel.fromJson({'first_name': 'John'}, 'source2')`
   *
   *  `someModel.toJson()`          // => {"fName":"John"}
   *  `someModel.toJson('source2')` // => {"first_name":"John"}
   *
   *  `@Json` can accept a context as either its second parameter or as part of the options [[IJsonOptions]]
   *  parameter.
   */
  context?: string;

  /**
   * Override the default decryptor logic. If provided, this will be called to perform decryption instead of
   * the default logic. By default, `aes-256-gcm` is used.
   *
   * @param val the value being decrypted
   * @param {string} key the field name being decrypted
   * @param {string} cipherKey
   * @param {IContext} context
   * @returns {any}
   */
  decryptor?: (val: any, key?: string, cipherKey?: string, context?: IContext) => any;

  /**
   * Override the default encryptor logic. If provided, this will be called to perform encryption instead of
   * the default logic. By default, `aes-256-gcm` is used.
   *
   * @param val the value being encrypted
   * @param {string} property name being encrypted
   * @param {string} cipherKey
   * @param {IContext} context
   * @returns {string}
   */
  encryptor?: (val: any, key?: string, cipherKey?: string, context?: IContext) => string;

  /**
   * If true, this field will be encrypted `toJson` and decrypted `fromJson`.
   */
  encrypt?: boolean;

  /**
   * The json field name that is mapped to and from this property when marshalled to and from json with
   * [[Model]].[[toJson]] or [[Model]].[[fromJson]].
   *
   * ### Example
   * <pre>
   *    <span>@</span>Model({...})
   *    export class SomeModel {
   *        <span>@</span>Json({
   *          field: 'fn'
   *        })
   *        firstName: string = '';
   *    }
   * </pre>
   *
   * Explanation: `firstName` property of the `@Model` is mapped to the `fn` field when marshalling this model to/from
   * a json object.
   */
  field?: string;

  /**
   * The key to use with encrypt / decrypt
   */
  key?: string;

  /**
   * Allows formatting a property when it's marshalled to Json from an `@`[[Model]].
   *
   * ### Example
   * <pre>
   * <span>@</span>Model()
   * class SomeModel {
   *    @Json({
   *      formatToJson: (val, key) => val.ToUpperCase()
   *    })
   *    someProperty: string;
   * }
   * </pre>
   *
   * @param val The value of the property being marshalled to Json.
   * @param {string} key The name of the property beinng marshalled to Json
   * @returns any Returns the formatted value
   */
  toJson?: (val: any, key?: string, context?: IContext) => any;

  /**
   * Allows formatting a property when it's marshalled from Json to an `@`[[Model]].
   * ### Example
   * <pre>
   * <span>@</span>Model()
   * class SomeModel {
   *    @Json({
   *      formatFromJson: (val, key) => val.ToUpperCase()
   *    })
   *    someProperty: string;
   * }
   * </pre>
   * @param val The value of the property being marshalled to Json.
   * @param {string} key The name of the property beinng marshalled to Json
   * @returns any Returns the formatted value
   */
  fromJson?: (val: any, key?: string, context?: IContext) => any;

  /**
   * An optional `@`[[Model]] decorated class. If provided, the property will be instantiated as a sub document
   * with its default values or the values from the json object. `@`[[Json]] will utilize this same model
   * as the one set in `@`[[Db]] if `model` is not set on this attribute.
   *
   * While `@Db({model: Model})` will inform `@Json` of the model, the reciprocal is not true. As a result,
   * if you have a property that is decorated with both `@Db` and `@Json`, declare the model in the `@Db`
   * decorator.
   */
  model?: any;

  /**
   * If true, sub-documents that aren't part of a model will be mapped to the resulting object.
   */
  promiscuous?: boolean;

  /**
   * Allows casting fromJson. This might be used in the future for other types like Date,
   * or enums.
   */
  type?: 'id';
}

/**
 * Decorates properties in an `@`[[Model]] class to describe how a property will be marshaled to json
 * ([[Model]].[[toJson]]) and from json ([[Model]].[[fromJson]]).
 *
 * You can apply multiple `@`[[Json]] decorators to a property with different contexts. If the same context
 * is applied more than once, the latter wins.
 *
 * ### Example
 * <pre>
 * import {Model, Json} from '@sakuraapi/api';
 * <span/>
 * <span>@</span>Model()
 * class User {
 *    <span>@</span>Json('fn')
 *    firstName: string = 'John';
 *    <span/>
 *    <span>@</span>Json('ln')
 *    lastName: string = 'Adams';
 * }</pre>
 *
 * This will cause `user.toJson()` to return:
 * <pre>
 * {
 *    "fn":"John",
 *    "ln":"Adams"
 * }
 * </pre>
 *
 * And `User.fromJson(json)` will map the json object back to an instantiated `User`.
 *
 * @param jsonOptions sets [[IJsonOptions.field]] when a string is passed.
 * @param context Sets the context under which this @Json applies (see [[IJsonOptions.context]])
 * @returns Returns a function that is used internally by the framework.
 */
export function Json(jsonOptions?: IJsonOptions | string, context = 'default'): (target: any, key: string) => void {

  const options = (typeof jsonOptions === 'string')
    ? {field: jsonOptions}
    : jsonOptions || {};

  return (target: any, key: string) => {

    context = options.context || context;

    options[jsonSymbols.propertyName] = key;

    const metaPropertyFieldMap = getMetaDataMap(target, jsonSymbols.jsonByPropertyName);
    const metaFieldPropertyMap = getMetaDataMap(target, jsonSymbols.jsonByFieldName);

    // allow lookup by the JavaScript key for the property
    metaPropertyFieldMap.set(`${key}:${context}`, options);
    // allow lookup by the optional field name defined by @Json({field: 'value'}) or default to the
    // property name (key).
    metaFieldPropertyMap.set(`${options.field || key}:${context}`, options);
  };
}

function getMetaDataMap(source, symbol): Map<string, IJsonOptions> {

  let map: Map<string, IJsonOptions> = Reflect.getMetadata(symbol, source);

  if (!map) {
    map = new Map<string, IJsonOptions>();
    Reflect.defineMetadata(symbol, map, source);
  }

  return map;
}
