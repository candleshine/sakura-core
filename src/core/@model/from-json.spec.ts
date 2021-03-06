import { FromJson } from './from-json';
import { Json } from './json';
import { Model } from './model';
import { SapiModelMixin } from './sapi-model-mixin';

describe('@FromJson', () => {

  it('passes through model', () => {

    @Model()
    class SomeModel extends SapiModelMixin() {

      firstName = 'John';
      lastName = 'Adams';

      @FromJson()
      formatter(json: any, model: any, context: string) {
        return model;
      }
    }

    const result = SomeModel.fromJson({
      firstName: 'George',
      lastName: 'Washington',
      not: true
    });

    expect(result.firstName).toBe('George');
    expect(result.lastName).toBe('Washington');
    expect((result as any).not).toBeUndefined();
    expect(result instanceof SomeModel).toBeTruthy();
  });

  it('allows modification of resulting model', () => {

    @Model()
    class SomeModel extends SapiModelMixin() {

      firstName = 'John';

      @Json('ln')
      lastName = 'Adams';

      address: string;

      @FromJson()
      flattenAddress(json: any, model: any, context: string) {
        model.address = json.source.address1 + ' ' + json.source.address2;
        return model;
      }
    }

    const result = SomeModel.fromJson({
      firstName: 'George',
      ln: 'Washington',
      source: {
        address1: '123 Main St',
        address2: 'Suite 101'
      }
    });

    expect(result.firstName).toBe('George');
    expect(result.lastName).toBe('Washington');
    expect(result.address).toBe('123 Main St Suite 101');
  });

  it('allows multiple decorations', () => {
    @Model()
    class SomeModel extends SapiModelMixin() {

      firstName: string;
      lastName: string;

      @FromJson()
      format1(json: any, model: any, context: string) {
        model.firstName = '1';
        return model;
      }

      @FromJson()
      format2(json: any, model: any, context: string) {
        model.lastName = '2';
        return model;
      }
    }

    const result = SomeModel.fromJson({});

    expect(result.firstName).toBe('1');
    expect(result.lastName).toBe('2');
  });

  it('supports multiple contexts', () => {

    @Model()
    class SomeModel extends SapiModelMixin() {

      prop1: string;
      prop2: string;

      @FromJson()
      format1(json: any, model: any, context: string) {
        model.prop1 = '1';
        return model;
      }

      @FromJson('source2')
      format2(json: any, model: any, context: string) {
        model.prop2 = '2';
        return model;
      }
    }

    const result1 = SomeModel.fromJson({});
    const result2 = SomeModel.fromJson({}, 'source2');

    expect(result1.prop1).toBe('1');
    expect(result1.prop2).toBeUndefined('FormatFromJson source2 should not have been called');

    expect(result2.prop1).toBeUndefined('FormatFromJson default should not have been called');
    expect(result2.prop2).toBe('2');

  });

  it('supports * context', () => {

    @Model()
    class SomeModel extends SapiModelMixin() {

      prop1: string;
      prop2: string;

      @FromJson()
      format1(json: any, model: any, context: string) {
        model.prop1 = '1';
        return model;
      }

      @FromJson('*')
      format2(json: any, model: any, context: string) {
        model.prop2 = '2';
        return model;
      }
    }

    const result1 = SomeModel.fromJson({});

    expect(result1.prop1).toBe('1');
    expect(result1.prop2).toBe('2');
  });

  it('is called on the document and sub documents', () => {
    pending('see issue #194');

    let parentToJsonCalled = false;
    let childToJsonCalled = false;

    @Model()
    class TestChild extends SapiModelMixin() {
      @Json()
      child = 'child';

      @FromJson()
      childToJson() {
        childToJsonCalled = true;
      }
    }

    @Model()
    class TestParent extends SapiModelMixin() {

      @Json()
      parent = 'parent';

      @Json({model: TestChild})
      child = new TestChild();

      @FromJson()
      parentToJson() {
        parentToJsonCalled = true;
      }

    }

    TestParent.fromJson({});

    expect(parentToJsonCalled).toBeTruthy('parent @ToJson not called');
    expect(childToJsonCalled).toBeTruthy('child @ToJson not called');

  });
});
