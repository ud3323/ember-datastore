// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2006-2011 Apple Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
/*globals module ok equals same test MyApp */

var set = Ember.set, get = Ember.get;

// NOTE: The test below are based on the Data Hashes state chart.  This models
// the "read" event in the NestedStore portion of the diagram.

var parent, store, child, storeKey, json;
module("Ember.NestedStore#readDataHash", {
  setup: function() {
    parent = Ember.Store.create();
    
    json = {
      string: "string",
      number: 23,
      bool:   YES
    };
    
    storeKey = Ember.Store.generateStoreKey();

    parent.writeDataHash(storeKey, json, Ember.Record.READY_CLEAN);
    parent.editables = null; // manually patch to setup test state
    
    store = parent.chain(); // create nested store
    child = store.chain();  // for deep nested
  }
});

// ..........................................................
// BASIC STATE TRANSITIONS
// 

test("data state=INHERITED, lockOnRead=YES, parent editable=NO", function() {
  // preconditions
  equals(get(store, 'lockOnRead'), YES, 'precond - lockOnRead should be YES');
  equals(store.storeKeyEditState(storeKey), Ember.Store.INHERITED, 'precond - storeKey should be inherited from parent');
  var oldrev = store.revisions[storeKey]; // save old rev for testing later

  // perform read
  equals(store.readDataHash(storeKey), json, 'should return json');

  // verify
  equals(store.storeKeyEditState(storeKey), Ember.Store.LOCKED, 'storeKey should be read-locked now');
  ok(store.dataHashes.hasOwnProperty(storeKey), 'should copy reference to json');

  // test revisions...
  equals(store.revisions[storeKey], oldrev, 'should not change revision');
  if (!Ember.none(oldrev)) {
    ok(store.revisions.hasOwnProperty(storeKey), 'should copy reference to revision');
  }
});


test("data state=INHERITED, lockOnRead=NO, parent editable=NO", function() {
  // preconditions
  set(store, 'lockOnRead', NO);
  
  equals(get(store, 'lockOnRead'), NO, 'precond - lockOnRead should be NO');
  equals(store.storeKeyEditState(storeKey), Ember.Store.INHERITED, 'precond - storeKey should be inherited from parent');
  var oldrev = store.revisions[storeKey]; // save old rev for testing later

  // perform read
  equals(store.readDataHash(storeKey), json, 'should return json');

  // verify
  equals(store.storeKeyEditState(storeKey), Ember.Store.INHERITED, 'storeKey should still be inherited');
  ok(!store.dataHashes.hasOwnProperty(storeKey), 'should NOT copy reference to json');

  // test revisions...
  equals(store.revisions[storeKey], oldrev, 'should not change revision');
  if (!Ember.none(oldrev)) {
    ok(store.revisions.hasOwnProperty(storeKey), 'should copy reference to revision');
  }
});


test("data state=INHERITED, lockOnRead=YES, parent editable=YES", function() {

  // preconditions
  
  // first, make parentStore record editable.  an editable record needs to be
  // cloned into nested stores on lock to avoid un-monitored edits
  parent.readEditableDataHash(storeKey);
  equals(parent.storeKeyEditState(storeKey), Ember.Store.EDITABLE, 'precond - parent storeKey should be editable');
  equals(get(store, 'lockOnRead'), YES, 'precond - lockOnRead should be YES');
  equals(store.storeKeyEditState(storeKey), Ember.Store.INHERITED, 'precond - storeKey should be inherited from parent');
  var oldrev = store.revisions[storeKey]; // save old rev for testing later

  // perform read
  var ret = store.readDataHash(storeKey);
  same(ret, json, 'should return equivalent json object');
  ok(!(ret === json), 'should return clone of json instance not exact same instance');

  // verify new state
  equals(store.storeKeyEditState(storeKey), Ember.Store.EDITABLE, 'storeKey should be locked');
  ok(store.dataHashes.hasOwnProperty(storeKey), 'should have reference to json');

  // test revisions...
  equals(store.revisions[storeKey], oldrev, 'should not change revision');
  if (!Ember.none(oldrev)) {
    ok(store.revisions.hasOwnProperty(storeKey), 'should copy reference to revision');
  }
});

test("data state=LOCKED", function() {
  
  // preconditions
  set(store, 'lockOnRead', YES); // make sure reading will lock
  var ret1 = store.readDataHash(storeKey);
  equals(store.storeKeyEditState(storeKey), Ember.Store.LOCKED, 'precond - data state should be LOCKED');
  var oldrev = store.revisions[storeKey];
  
  // perform read
  var ret2 = store.readDataHash(storeKey);
  
  // verify
  equals(ret1, ret2, 'should read same data hash once locked');
  equals(store.storeKeyEditState(storeKey), Ember.Store.LOCKED, 'should remain in locked state');

  // test revisions
  equals(store.revisions[storeKey], oldrev, 'should not change revision');
  if (!Ember.none(oldrev)) {
    ok(store.revisions.hasOwnProperty(storeKey), 'should copy reference to revision');
  }
});

test("data state=EDITABLE", function() {
  
  // preconditions
  set(store, 'lockOnRead', YES); // make sure reading will lock
  var ret1 = store.readEditableDataHash(storeKey);
  equals(store.storeKeyEditState(storeKey), Ember.Store.EDITABLE, 'precond - data state should be EDITABLE');
  var oldrev = store.revisions[storeKey];
  
  // perform read
  var ret2 = store.readDataHash(storeKey);
  
  // verify
  equals(ret1, ret2, 'should read same data hash once editable');
  equals(store.storeKeyEditState(storeKey), Ember.Store.EDITABLE, 'should remain in editable state');

  // test revisions
  equals(store.revisions[storeKey], oldrev, 'should not change revision');
  if (!Ember.none(oldrev)) {
    ok(store.revisions.hasOwnProperty(storeKey), 'should copy reference to revision');
  }
});

test("should return null when accessing an unknown storeKey", function() {
  equals(store.readDataHash(20000000), null, 'shuld return null for non-existant store key');
  equals(store.storeKeyEditState(20000000), Ember.Store.LOCKED, 'should put into locked edit state');
});

// ..........................................................
// SPECIAL CASES
//

test("locking deep nested store when top-level parent is editable and middle store is inherited", function() {

  // first, make the parent store data hash editable
  json = parent.readEditableDataHash(storeKey);
  equals(parent.storeKeyEditState(storeKey), Ember.Store.EDITABLE, 'parent edit state should be EDITABLE');
  equals(store.storeKeyEditState(storeKey), Ember.Store.INHERITED, 'middle store edit state should be INHERITED');
  equals(child.storeKeyEditState(storeKey), Ember.Store.INHERITED, 'child store edit state should be INHERITED');
  
  // now read data hash from child, locking child
  var json2 = child.readDataHash(storeKey);
  equals(child.storeKeyEditState(storeKey), Ember.Store.EDITABLE, 'child store edit state should be locked after reading data');
  
  // now edit the root json and make sure it does NOT propogate.
  json.newItem = "bar";
  ok(child.readDataHash(storeKey).newItem !== 'bar', 'child json should not pick up edit from parent store since it is now locked');
});




