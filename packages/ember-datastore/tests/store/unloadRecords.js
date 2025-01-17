// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2006-2011 Apple Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

var set = Ember.set, get = Ember.get;

(function() {
  var store, Person, Place;

  module("Ember.Store#unloadRecords", {
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

  test("Unload all records of a record type", function() {
    var records = store.find(Person);
    equals(get(records, 'length'), 3, "precond - store has 3 records loaded");
    store.unloadRecords(Person);
    records = store.find(Person);
    equals(get(records, 'length'), 0, "Number of People records left");
  });

  test("Unload only certain records of a record type", function() {
    var records = store.find(Person);
    equals(get(records, 'length'), 3, "precond - store has 3 records loaded");
    store.unloadRecords(Person, [1, 2]);
    records = store.find(Person);
    equals(get(records, 'length'), 1, "Number of People records left");
  });

  test("Unload all records of passed record types", function() {
    var people = store.find(Person),
        places = store.find(Place);

    equals(get(people, 'length'), 3, "precond - store has 3 Person records loaded");
    equals(get(places, 'length'), 2, "precond - store has 2 Place records loaded");

    store.unloadRecords([Person, Place]);

    people = store.find(Person);
    places = store.find(Place);

    equals(get(people, 'length'), 0, "Number of People records left");
    equals(get(places, 'length'), 0, "Number of Place records left");
  });

  test("Unload certain records of passed record types", function() {
    var people = store.find(Person),
        places = store.find(Place);

    equals(get(people, 'length'), 3, "precond - store has 3 Person records loaded");
    equals(get(places, 'length'), 2, "precond - store has 2 Place records loaded");

    store.unloadRecords([Person, Person, Place], [1, 2, 4]);

    people = store.find(Person);
    places = store.find(Place);

    equals(get(people, 'length'), 1, "Number of People records left");
    equals(get(places, 'length'), 1, "Number of Place records left");
  });

})();
