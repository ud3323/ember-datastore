// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2006-2011 Apple Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
/*globals module ok equals same test MyApp */

var set = Ember.set, get = Ember.get;

var store, child, storeKey, json;
module("Ember.Store#commitChangesFromNestedStore", {
  setup: function() {
    Ember.run.begin();

    store = Ember.Store.create();
    
    json = {
      string: "string",
      number: 23,
      bool:   YES
    };
    
    storeKey = Ember.Store.generateStoreKey();

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
  
  // verify new status
  equals(store.readDataHash(storeKey), json, 'now should have json');
  equals(store.readStatus(storeKey), Ember.Record.READY_DIRTY, 'now should have status');
  equals(store.revisions[storeKey], child.revisions[storeKey], 'now shoulave have revision from child');  
    
  Ember.run.end();
});

test("adds items in changelog to reciever changelog", function() {

  var key1 = Ember.Store.generateStoreKey();

  Ember.run.begin();
  
  store.changelog = Ember.Set.create();
  store.changelog.add(key1);
  
  ok(child.changelog.contains(storeKey), 'precond - child.changelog should contain store key');
  
  equals(store.commitChangesFromNestedStore(child, child.chainedChanges, NO), store, 'should return receiver');

  // changelog should merge nested store & existing
  ok(store.changelog.contains(key1), 'changelog should still contain key1');
  ok(store.changelog.contains(storeKey), 'changelog should also contain storeKey');
  
  Ember.run.end();
});

test("ignores changed data hashes not passed in changes set", function() {
  
  // preconditions
  equals(store.readDataHash(storeKey), null, 'precond - should not have data yet');

  // perform action
  equals(store.commitChangesFromNestedStore(child, Ember.Set.create(), NO), store, 'should return receiver');

  // verify results
  equals(store.readDataHash(storeKey), null, 'should not copy data hash for storeKey');
  
});

function createConflict(force) {
  var json2 = { kind: "json2" };
  var json3 = { kind: "json3" };
  
  // create a lock conflict.  use a new storeKey since the old one has been
  // setup in a way that won't work for this.
  storeKey = Ember.Store.generateStoreKey();
  
  // step 1: add data to root store
  store.writeDataHash(storeKey, json, Ember.Record.READY_CLEAN);
  store.dataHashDidChange(storeKey);
  
  // step 2: read data in chained store.  this will create lock
  child.readDataHash(storeKey);
  ok(child.locks[storeKey], 'child store should now have lock');
  
  // step 3: modify root store again
  store.writeDataHash(storeKey, json2, Ember.Record.READY_CLEAN);
  store.dataHashDidChange(storeKey);

  // step 4: modify data in chained store so we have something to commit.
  child.writeDataHash(storeKey, json3, Ember.Record.READY_DIRTY);
  child.dataHashDidChange(storeKey);
  
  // just to make sure verify that the lock and revision in parent do not 
  // match
  ok(child.locks[storeKey] !== store.revisions[storeKey], 'child.lock (%@) should !== store.revision (%@)'.fmt(child.locks[storeKey], store.revisions[storeKey]));
  
  // step 5: now try to commit changes from child store.  This should throw
  // an exception.
  var errorCount = 0;
  try {
    child.commitChanges(force);
  } catch(e) {
    equals(e, Ember.Store.CHAIN_CONFLICT_ERROR, 'should throw CHAIN_CONFLICT_ERROR');
    errorCount++;
  }  
  
  return errorCount ;
}

test("throws exception if any record fails optimistic locking test", function() {
  var errorCount = createConflict(NO);
  equals(errorCount, 1, 'should have raised error');
});

test("does not throw exception if optimistic locking fails but force option is passed", function() {
  var errorCount = createConflict(YES);
  equals(errorCount, 0, 'should not raise error');
});

