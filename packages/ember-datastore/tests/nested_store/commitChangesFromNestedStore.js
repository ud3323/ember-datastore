// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2006-2011 Apple Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
/*globals module ok equals same test MyApp */

var set = Ember.set, get = Ember.get;

var parent, store, child, storeKey, json;
module("Ember.NestedStore#commitChangesFromNestedStore", {
  setup: function() {
    Ember.run.begin();

    parent = Ember.Store.create();
    
    json = {
      string: "string",
      number: 23,
      bool:   YES
    };
    
    storeKey = Ember.Store.generateStoreKey();

    store = parent.chain();
    child = store.chain();  // test multiple levels deep

    // wirte basic status
    child.writeDataHash(storeKey, json, Ember.Record.READY_DIRTY);
    child.dataHashDidChange(storeKey);
    child.changelog = Ember.Set.create();
    child.changelog.add(storeKey);

    Ember.run.end();
  }
});

test("copies changed data hashes, statuses, and revisions", function() {
  
  Ember.run.begin();
  
  // verify preconditions
  equals(store.readDataHash(storeKey), null, 'precond - should not have data yet');
  ok(child.chainedChanges.contains(storeKey), 'precond - child changes should include storeKey');
  
  // perform action
  equals(store.commitChangesFromNestedStore(child, child.chainedChanges, NO), store, 'should return receiver');
  Ember.run.end();
  
  // verify new status
  equals(store.readDataHash(storeKey), json, 'now should have json');
  equals(store.readStatus(storeKey), Ember.Record.READY_DIRTY, 'now should have status');
  equals(store.revisions[storeKey], child.revisions[storeKey], 'now shoulave have revision from child');  
    
});

test("adds lock on any items not already locked", function() {

  Ember.run.begin();

  var storeKey2 = Ember.Store.generateStoreKey();
  var json2 = { kind: "json2" };
  
  // verify preconditions
  store.readDataHash(storeKey);
  ok(store.locks[storeKey], 'precond - storeKey should have lock');
  ok(!store.locks[storeKey2], 'precond - storeKey2 should not have lock');
  
  // write another record into child store to commit changes.
  child.writeDataHash(storeKey2, json2, Ember.Record.READY_DIRTY);
  child.dataHashDidChange(storeKey2);
  
  var changes = child.chainedChanges ;
  ok(changes.contains(storeKey), 'precond - child.chainedChanges should contain storeKey');
  ok(changes.contains(storeKey2), 'precond - child.chainedChanges should contain storeKey2');
  
  // now commit back to parent
  equals(store.commitChangesFromNestedStore(child, changes, NO), store, 'should return reciever');
  Ember.run.end();
  
  // and verify that both have locks
  ok(store.locks[storeKey], 'storeKey should have lock after commit (actual: %@)'.fmt(store.locks[storeKey]));
  ok(store.locks[storeKey2], 'storeKey2 should have lock after commit (actual: %@)'.fmt(store.locks[storeKey2]));
  
});

test("adds items in chainedChanges to reciever chainedChanges", function() {

  Ember.run.begin();

  var key1 = Ember.Store.generateStoreKey();

  store.dataHashDidChange(key1);
  
  ok(child.chainedChanges.contains(storeKey), 'precond - child.chainedChanges should contain store key');
  
  equals(store.commitChangesFromNestedStore(child, child.chainedChanges, NO), store, 'should return receiver');
  Ember.run.end();

  // changelog should merge nested store & existing
  ok(store.chainedChanges.contains(key1), 'chainedChanges should still contain key1');
  ok(store.chainedChanges.contains(storeKey), 'chainedChanges should also contain storeKey');
});

test("should set hasChanges to YES if has changes", function() {
  
  Ember.run.begin();
  
  var changes = child.chainedChanges;
  ok(changes.length>0, 'precond - should have some changes in child');
  equals(get(store, 'hasChanges'), NO, 'precond - store should not have changes');
  
  store.commitChangesFromNestedStore(child, changes, NO);
  equals(get(store, 'hasChanges'), YES, 'store should now have changes');
});

test("should set hasChanges to NO if no changes", function() {
  
  Ember.run.begin();
  
  child = store.chain() ; // get a new child store
  
  var changes = child.chainedChanges || Ember.Set.create();
  ok(!changes || !changes.length, 'precond - should have not have changes in child');
  equals(get(store, 'hasChanges'), NO, 'precond - store should not have changes');
  
  store.commitChangesFromNestedStore(child, changes, NO);
  Ember.run.end();
  
  equals(get(store, 'hasChanges'), NO, 'store should NOT now have changes');
});

// ..........................................................
// SPECIAL CASES
// 

test("committing changes should chain back each step", function() {

  Ember.run.begin();

  // preconditions
  equals(child.readDataHash(storeKey), json, 'precond - child should have data');
  equals(store.readDataHash(storeKey), null, 'precond - store should not have data');
  equals(parent.readDataHash(storeKey), null, 'precond - parent should not have data');
  
  // do commits
  child.commitChanges();

  equals(get(store, 'hasChanges'), YES, 'store should now have changes');
  equals(store.readDataHash(storeKey), json, 'store should now have json');
  
  store.commitChanges();
  equals(get(store, 'hasChanges'), NO, 'store should no longer have changes');
  equals(parent.readDataHash(storeKey), json, 'parent should now have json');
  Ember.run.end();
  
});



