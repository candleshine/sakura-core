import { shouldRecurse } from '../../helpers';
import {
  dbSymbols,
  IDbOptions
} from '../db';
import { modelSymbols } from '../model';
import { debug } from './index';

/**
 * @instance Builds and returns a change set object with its fields mapped based on decorators like [[Db]]. The
 * resulting change set object is what's persisted to the database.
 * @param changeSet The change set. For example:
 * <pre>
 * {
 *     firstName: "George"
 * }
 * </pre>
 * This change set would cause only the `firstName` field to be updated. If the `set` parameter is not provided,
 * `toDb` will assume the entire [[Model]] is the change set (obeying the various decorators like [[Db]]).
 *
 * Nested objects are supported. Each property that is an object (except for ObjectID properties) needs to have its
 * own class declared. The properties classes that represent sub-documents, obey the `@`[[Db]] and `@`[[Json]] decorator
 * rules.
 *
 * @returns {{_id: (any|ObjectID|number)}}
 */
export function toDb(changeSet?: any): object {
  const constructor = this[modelSymbols.constructor] || this;

  const modelOptions = constructor[modelSymbols.modelOptions];
  debug.normal(`.toDb called, target '${(constructor || {} as any).name}'`);

  changeSet = changeSet || this;

  const dbObj = mapModelToDb(changeSet);

  delete (dbObj as any).id;
  if (!(dbObj as any)._id && this._id) {
    (dbObj as any)._id = this._id;
  }

  return dbObj;

  //////////
  function mapModelToDb(source, depth = 0) {

    const result = {} as any;
    if (!source) {
      return;
    }

    const dbOptionsByPropertyName: Map<string, IDbOptions> = Reflect.getMetadata(dbSymbols.dbByPropertyName, source);

    // iterate over each property
    for (const key of Object.getOwnPropertyNames(source)) {

      if (shouldRecurse(source[key])) {

        const aNewKey = keyMapper(key, source[key], dbOptionsByPropertyName);
        if (aNewKey !== undefined) {
          const value = mapModelToDb(source[key], ++depth);
          result[aNewKey] = value;
        }

        continue;
      }

      const newKey = keyMapper(key, source[key], dbOptionsByPropertyName);
      if (newKey !== undefined) {
        result[newKey] = source[key];
      }
    }

    if (depth > 0 && !result.id) { // resolves #106
      delete result.id;
    }

    if (depth > 0 && !result._id) { // resolves #106
      delete result._id;
    }

    if (depth > 0 && (result._id && result.id)) { // resolves #106
      delete result.id;
    }

    return result;
  }

  function keyMapper(key, value, dbMeta) {

    if (!dbMeta) {
      dbMeta = constructor[dbSymbols.dbByPropertyName];
    }

    let fieldName;
    // if there's @Db meta data on the property
    if (dbMeta && dbMeta.get) {
      const dbOptions = (dbMeta.get(key)) as IDbOptions;

      if ((dbOptions || {}).field) {
        // if there's specifically a @Db('fieldName') - i.e., there's a declared field name
        fieldName = dbOptions.field;
      } else if (dbOptions) {
        // if there's at least an @Db on the property, use the property name for the field name
        fieldName = key;
      }
    }

    // if the model's promiscuous use the property name for the field name if @Db wasn't found...
    // otherwise leave the field out of the results
    if (!fieldName && (modelOptions.dbConfig || {}).promiscuous) {
      fieldName = key;
    }

    return fieldName;
  }

}
