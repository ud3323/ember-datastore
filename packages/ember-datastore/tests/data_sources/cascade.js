// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2006-2011 Apple Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
/*globals module ok equals same test Sample */

var set = Ember.set, get = Ember.get;

var store;

module("Ember.CascadeDataSource", {
  setup: function () {
    Ember.run.begin();

    var Sample = (window.Sample = Ember.Object.create());

    Sample.FooDataSource = Ember.DataSource.extend({
      commitRecords: function (st, createStoreKeys, updateStoreKeys, destroyStoreKeys, params) {
        equals(store, st, "should equal store");
        equals(0, createStoreKeys[0], "should equal [0]");
        equals(1, updateStoreKeys[0], "should equal [1]");
        equals(2, destroyStoreKeys[0], "should equal [2]");
        equals('world', params.hello, 'should equal { hello: "world" }');
        return YES;
      },

      retriveRecords: function () {
        ok(true, "retriveRecords should be handled by baz");
        return NO;
      },

      fetch: function (store, query) {
        ok(true, "fetch should be handled by bar");
        return NO;
      },

      cancel: function (st, storeKeys) {
        equals(store, st, "should equal store");
        equals(1, storeKeys[0], "should equal [1]");
        return NO;
      }
    });
    Sample.fooDataSource = Sample.FooDataSource.create();

    Sample.BarDataSource = Ember.DataSource.extend({
      commitRecords: function () {
        ok(false, "should never be called, since foo handles commitRecords first");
        return NO;
      },

      retriveRecords: function () {
        ok(true, "retriveRecords should be handled by baz");
        return NO;
      },

      fetch: function (st, query) {
        equals(store, st, "should equal store");
        equals('query', query, "should equal 'query'");
        return YES;
      }
    });
    Sample.barDataSource = Sample.BarDataSource.create();

    Sample.BazDataSource = Ember.DataSource.extend({
      commitRecords: function () {
        ok(false, "should never be called, since foo handles commitRecords first");
        return NO;
      },

      retrieveRecords: function (st, storeKeys, ids) {
        equals(store, st, "should equal store");
        equals(0, storeKeys[0], "should equal [0]");
        equals("id", ids[0], 'should equal ["id"]');
        return YES;
      },

      fetch: function () {
        ok(false, "should never be called, since bar handles fetch first");
        return NO;
      }
    });
    Sample.bazDataSource = Sample.BazDataSource.create();

    Sample.dataSource = Ember.CascadeDataSource.create({
      dataSources: "foo bar baz".w(),

      foo: Sample.fooDataSource,
      bar: Sample.barDataSource,
      baz: Sample.bazDataSource
    });

    store = Ember.Store.create({ dataSource: Sample.dataSource });
  },

  teardown: function () {
    Ember.run.end();
  }
});

test("Verify dataSources points to the actual dataSource", function () {
  var dataSource = Sample.dataSource;
  equals(dataSource.dataSources[0], dataSource.foo, 'should equal data source foo');
  equals(dataSource.dataSources[1], dataSource.bar, 'should equal data source bar');
  equals(dataSource.dataSources[2], dataSource.baz, 'should equal data source baz');
});

test("Verify dataSources added using 'from' are appended in order", function () {
  Sample.dataSource = Ember.CascadeDataSource.create()
       .from(Sample.fooDataSource)
       .from(Sample.barDataSource)
       .from(Sample.bazDataSource);

  var dataSource = Sample.dataSource;
  equals(dataSource.dataSources[0], Sample.fooDataSource, 'should equal data source foo');
  equals(dataSource.dataSources[1], Sample.barDataSource, 'should equal data source bar');
  equals(dataSource.dataSources[2], Sample.bazDataSource, 'should equal data source baz');
});

test("Verify dataSource returns 'YES' when handled by a child dataSource for commitRecords", function () {
  ok(Sample.dataSource.commitRecords(store, [0], [1], [2], { hello: "world" }),
     "commitRecords should be handled by foo");
});

test("Verify dataSource returns 'YES' when handled by a child dataSource for fetch", function () {
  ok(Sample.dataSource.fetch(store, 'query'), "fetch should be handled by bar");
});

test("Verify dataSource returns 'YES' when handled by a child dataSource for retriveRecords", function () {
  ok(Sample.dataSource.retrieveRecords(store, [0], ['id']), "retrieveRecords should be handled by baz");
});

test("Verify dataSource returns 'NO' when not handled by a child dataSource", function () {
  ok(!Sample.dataSource.cancel(store, [1]), "cancel should be handled by no data source");
});
