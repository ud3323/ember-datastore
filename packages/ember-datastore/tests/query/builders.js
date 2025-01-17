// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2006-2011 Apple Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
/*globals module ok equals same test MyApp */

var set = Ember.set, get = Ember.get;

// This file tests the initial state of the store when it is first created
// either independently or as a chained store.

// ..........................................................
// UTILITIES
//

MyApp = {};
var TestRecord = Ember.Record.extend();
var TestRecord2 = Ember.Record.extend();

var q3;

function queryEquals(q, location, recordType, conditions, extra, desc) {
  if (desc===undefined && typeof extra === 'string') {
    desc = extra;  extra = undefined ;
  }
  if (!desc) desc = '';

  ok(!!q, desc + ': should have a query');
  equals(get(q, 'isFrozen'), YES, desc + ": should be frozen");

  if (q) {
    if (location) {
      equals(get(q, 'location'), location, desc + ": should have location");
    }

    if (recordType && recordType.isEnumerable) {
      same(get(q, 'recordTypes'), recordType, desc + ': should have recordTypes (plural)');
    } else {
      equals(get(q, 'recordType'), recordType, desc + ': should have recordType (singular)');
    }

    equals(get(q, 'conditions'), conditions, desc + ': should have conditions');

    if (extra) {
      for (var key in extra) {
        if (!extra.hasOwnProperty(key)) continue;
        equals(get(q, key), extra[key], desc + ': should have extra key ' + key);
      }
    }
  }
}

// ..........................................................
// BASIC TESTS
//

// The local() and remote() builder methods are very similar.  This will
// perform the same basic tests on both of them.  If you add a builder for a
// new type of location, you can just call this function again with your new
// location
function performBasicTests(methodName, loc) {

  module("Ember.Query.%@()".fmt(methodName), {
    setup: function() {
      MyApp = {};
      MyApp.TestRecord = TestRecord;
      MyApp.TestRecord2 = TestRecord2;
    },

    teardown: function() {
      MyApp.TestRecord = MyApp.TestRecord2 = null; // cleanup
    }
  });

  function invokeWith() {
    return Ember.Query[methodName].apply(Ember.Query, arguments);
  }

  test("basic query with just record type", function() {
    var q, q1, q2, q3, q4;

    // local
    q = invokeWith(MyApp.TestRecord);
    queryEquals(q, loc, TestRecord, null, 'first query');

    q1 = invokeWith(MyApp.TestRecord);
    equals(q1, q, 'second call should return cached value');

    // using string for record type name should work
    q2 = invokeWith("MyApp.TestRecord");
    equals(q2, q, 'queryFor with string should return cached value');

    // using an array of a single item should be treated as a single item
    q3 = invokeWith([MyApp.TestRecord]);
    equals(q3, q, 'queryFor([TestRecord]) should return cached value');

    // ditto w/ strings
    q4 = invokeWith(['MyApp.TestRecord']);
    equals(q4, q, 'queryFor(["TestRecord"]) with string should return cached value');

  });

  test("query with multiple recordtypes", function() {

    var types = [MyApp.TestRecord, MyApp.TestRecord2],
        q1, q2, a3, q4, q5, set;

    // create first query
    q1 = invokeWith(types);
    queryEquals(q1, loc, types, null, 'first query');

    // try again - should get cache
    q2 = invokeWith(types);
    equals(q2, q1, 'second queryFor call should return cached value');

    // try again - different order
    q3 = invokeWith([MyApp.TestRecord2, MyApp.TestRecord]);
    equals(q3, q1, 'queryFor with different order of record types should return same cached value');

    // try again - using a set
    set = Ember.Set.create().add(MyApp.TestRecord).add(MyApp.TestRecord2);
    q4  = invokeWith(set);
    equals(q4, q1, 'should return cached query even if using an enumerable for types');

    // try again using strings
    q5 = invokeWith('MyApp.TestRecord MyApp.TestRecord2'.w());
    equals(q5, q1, 'should return cached query even if string record names are used');
  });

  test("query with record type and conditions", function() {

    var q1, q2, q3, q4, q5, q6, q7;

    q1 = invokeWith(MyApp.TestRecord, 'foobar');
    queryEquals(q1, loc, TestRecord, 'foobar', 'first query');

    q2 = invokeWith(MyApp.TestRecord, 'foobar');
    equals(q2, q1, 'second call to queryFor(TestRecord, foobar) should return cached instance');

    q3 = invokeWith(MyApp.TestRecord2, 'foobar');
    queryEquals(q3, loc, TestRecord2, 'foobar', 'query(TestRecord2, foobar)');
    ok(q3 !== q1, 'different recordType same conditions should return new query');

    q4 = invokeWith(MyApp.TestRecord, 'baz');
    queryEquals(q4, loc, TestRecord, 'baz', 'query(TestRecord2, baz)');
    ok(q4 !== q1, 'different conditions should return new query');

    q5 = invokeWith(MyApp.TestRecord, 'baz');
    equals(q5, q4, 'second call for different conditions should return cache');
  });

  test("query with no record type and with conditions", function() {
    var q1, q2;

    q1 = invokeWith(null, 'foobar');
    queryEquals(q1, loc, Ember.Record, 'foobar', 'first query');

    q2 = invokeWith(null, 'foobar');
    equals(q2, q1, 'should return cached value');
  });

  test("query with recordtype, conditions, and parameters hash", function() {
    var opts  = { opt1: 'bar', opt2: 'baz' },
        q1, q2;

    q1 = invokeWith(MyApp.TestRecord, 'foo', opts);
    queryEquals(q1, loc, TestRecord, 'foo', { parameters: opts }, 'first query');

    q2 = invokeWith(MyApp.TestRecord, 'foo', opts);
    ok(q1 !== q2, 'second call to queryFor with opts cannot be cached');
    queryEquals(q1, loc, TestRecord, 'foo', { parameters: opts }, 'second query');
  });

  test("query with recordtype, conditions, and parameters array", function() {
    var opts  = ['foo', 'bar'],
        q1, q2;

    q1 = invokeWith(MyApp.TestRecord, 'foo', opts);
    queryEquals(q1, loc, MyApp.TestRecord, 'foo', { parameters: opts }, 'first query should include parameters prop');

    q2 = invokeWith(MyApp.TestRecord, 'foo', opts);
    ok(q1 !== q2, 'second call to queryFor with opts cannot be cached');
    queryEquals(q1, loc, MyApp.TestRecord, 'foo', { parameters: opts }, 'second query');
  });

  test("passing query object", function() {

    var local = Ember.Query.local(TestRecord),
        remote = Ember.Query.remote(TestRecord),
        q;

    q = invokeWith(local);
    if (loc === Ember.Query.LOCAL) {
      equals(q, local, 'invoking with local query should return same query');
    } else {
      ok(q !== local, 'invoke with local query should return new instance');
    }
    equals(get(q, 'location'), loc, 'query should have expected location');

    q = invokeWith(remote);
    if (loc === Ember.Query.REMOTE) {
      equals(q, remote, 'invoking with remote query should return same query');
    } else {
      ok(q !== remote, 'invoke with remote query should return new instance');
    }
    equals(get(q, 'location'), loc, 'query should have expected location');
  });

  test("no options (matches everything)", function() {
    var q1, q2;

    q1 = invokeWith();
    queryEquals(q1, loc, Ember.Record, null, 'first query - matches everything');

    q2 = invokeWith();
    equals(q2, q1, 'should return same cached query');

  });


}

performBasicTests('local', Ember.Query.LOCAL);
performBasicTests('remote', Ember.Query.REMOTE);
