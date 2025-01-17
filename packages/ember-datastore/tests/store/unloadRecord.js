// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2006-2011 Apple Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

var set = Ember.set, get = Ember.get;

(function() {
  var store, Person, Place;

  module("Ember.Store#unloadRecord", {
    setup: function() {
      Person = Ember.Record.extend({
        name: Ember.Record.attr(String)
      });

      Place = Ember.Record.extend({
        name: Ember.Record.attr(String)
      });

      Ember.run.begin();

      store = Ember.Store.create();

      store.loadRecords(Person, [
        {guid: 1, name: 'Soups'},
        {guid: 2, name: 'Palmdale'},
        {guid: 3, name: 'Dubs'}
      ]);

      store.loadRecords(Place, [
        {guid: 4, name: "San Francisco"},
        {guid: 5, name: "St. John's"}
      ]);

      Ember.run.end();
    },
    teardown: function() {
      store = Person = Place = null;
    }
  });

  test("Unload one record via storeKey", function() {
    var people = store.find(Person),
        record = store.find(Person, 1);

    equals(get(people, 'length'), 3, "precond - there are 3 People records in the store");

    store.unloadRecord(Person, 1);

    people = store.find(Person);
    equals(get(people, 'length'), 2, "there are 2 People records in the store after calling unloadRecord");
    ok(store.peekStatus(record) & Ember.Record.EMPTY, "Record now has status of Ember.Record.EMPTY");
  });

})();
