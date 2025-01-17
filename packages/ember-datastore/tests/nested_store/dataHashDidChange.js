// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2006-2011 Apple Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
/*globals module ok equals same test MyApp */

var set = Ember.set, get = Ember.get;

// NOTE: The test below are based on the Data Hashes state chart.  This models
// the "did_change" event in the NestedStore portion of the diagram.

var parent, store, child, storeKey, json;
module("Ember.NestedStore#dataHashDidChange", {
  setup: function() {
    parent = Ember.Store.create();
    
    json = {
      string: "string",
      number: 23,
      bool:   YES
    };
    
    storeKey = Ember.Store.generateStoreKey();
    
    Ember.run.begin();
    parent.writeDataHash(storeKey, json, Ember.Record.READY_CLEAN);
    Ember.run.end();
    
    parent.editables = null; // manually patch to setup test state
    
    store = parent.chain(); // create nested store
    child = store.chain();  // test multiple levels deep
  }
});

// ..........................................................
// BASIC STATE TRANSITIONS
// 


function testStateTransition(fromState, toState) {

  // verify preconditions
  equals(get(store, 'hasChanges'), NO, 'should not have changes');
  equals(store.storeKeyEditState(storeKey), fromState, 'precond - storeKey edit state');
  if (store.chainedChanges) {
    ok(!store.chainedChanges.contains(storeKey), 'changedChanges should NOT include storeKey');
  }

  var oldrev = store.revisions[storeKey];
  
  // perform action
  equals(store.dataHashDidChange(storeKey), store, 'should return receiver');

  // verify results
  equals(store.storeKeyEditState(storeKey), toState, 'store key edit state is in same state');

  // verify revision
  ok(oldrev !== store.revisions[storeKey], 'revisions should change. was: %@ - now: %@'.fmt(oldrev, store.revisions[storeKey]));
  ok(store.chainedChanges.contains(storeKey), 'changedChanges should now include storeKey');
  
  equals(get(store, 'hasChanges'), YES, 'should have changes');
} 

test("edit state = INHERITED, parent editable = NO", function() {

  // verify preconditions
  equals(parent.storeKeyEditState(storeKey), Ember.Store.LOCKED, 'precond - parent store edit state is not EDITABLE');
  
  testStateTransition(Ember.Store.INHERITED, Ember.Store.LOCKED);
}) ;

test("edit state = INHERITED, parent editable = YES", function() {

  // verify preconditions
  parent.readEditableDataHash(storeKey);
  equals(parent.storeKeyEditState(storeKey), Ember.Store.EDITABLE, 'precond - parent store edit state is EDITABLE');

  testStateTransition(Ember.Store.INHERITED, Ember.Store.EDITABLE);
}) ;

test("edit state = LOCKED", function() {
  store.readDataHash(storeKey); // lock
  testStateTransition(Ember.Store.LOCKED, Ember.Store.LOCKED);
}) ;

test("edit state = EDITABLE", function() {
  store.readEditableDataHash(storeKey); // make editable
  testStateTransition(Ember.Store.EDITABLE, Ember.Store.EDITABLE);
}) ;

// ..........................................................
// SPECIAL CASES
// 

test("calling with array of storeKeys will edit all store keys", function() {
  
  var storeKeys = [storeKey, Ember.Store.generateStoreKey()], idx ;
  store.dataHashDidChange(storeKeys, 2000) ;
  for(idx=0;idx<storeKeys.length;idx++) {
    equals(store.revisions[storeKeys[idx]], 2000, 'storeKey at index %@ should have new revision'.fmt(idx));
    ok(store.chainedChanges.contains(storeKeys[idx]), 'chainedChanges should include storeKey at index %@'.fmt(idx));
  }
});

test("marking change should update revision but leave lock alone", function() {
  parent.dataHashDidChange(storeKey); // make sure parent has a revision
  store.readDataHash(storeKey); // cause a lock
  store.dataHashDidChange(storeKey); // update revision
  
  equals(store.locks[storeKey], parent.revisions[storeKey], 'lock should have parent revision');
  ok(store.revisions[storeKey] !== parent.revisions[storeKey], 'revision should not match parent rev');  
});

