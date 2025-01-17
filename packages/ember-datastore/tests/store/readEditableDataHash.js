// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2006-2011 Apple Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
/*globals module ok equals same test MyApp */

var set = Ember.set, get = Ember.get;

// NOTE: The test below are based on the Data Hashes state chart.  This models
// the "read_editable" event in the Store portion of the diagram.

var store, storeKey, json;
module("Ember.Store#readEditableDataHash", {
  setup: function() {
    store = Ember.Store.create();
    
    json = {
      string: "string",
      number: 23,
      bool:   YES
    };
    
    storeKey = Ember.Store.generateStoreKey();

    store.writeDataHash(storeKey, json, Ember.Record.READY_CLEAN);
  }
});

test("data state=LOCKED", function() {
  
  // test preconditions
  store.editables = null ; // manually reset for testing state
  equals(store.storeKeyEditState(storeKey), Ember.Store.LOCKED, 'precond - edit state should be LOCKED');
  var oldrev = store.revisions[storeKey] ;

  // perform read
  var ret = store.readEditableDataHash(storeKey);
  
  // validate
  same(ret, json, 'should return equivalent json object');
  ok(!(ret===json), 'should not return same json instance');
  
  equals(store.storeKeyEditState(storeKey), Ember.Store.EDITABLE, 'edit state should be editable');
  
  // should not change revisions, but should copy it...
  equals(store.revisions[storeKey], oldrev, 'should not change revision');
  if (!Ember.none(oldrev)) {
    ok(store.revisions.hasOwnProperty(storeKey), 'should clone revision reference');
  }
  
});

test("data state=EDITABLE", function() {
  
  // test preconditions
  equals(store.storeKeyEditState(storeKey), Ember.Store.EDITABLE, 'precond - edit state should be EDITABLE');
  var oldrev = store.revisions[storeKey] ;

  // perform read
  var ret = store.readEditableDataHash(storeKey);
  
  // validate
  equals(ret, json, 'should return same editable json instance');
  
  equals(store.storeKeyEditState(storeKey), Ember.Store.EDITABLE, 'edit state should be editable');
  
  // should not change revisions, but should copy it...
  equals(store.revisions[storeKey], oldrev, 'should not change revision');
  if (!Ember.none(oldrev)) {
    ok(store.revisions.hasOwnProperty(storeKey), 'should clone revision reference');
  }
  
});


