// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2006-2011 Apple Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

/*global module test equals context ok same notest */

var sc_get = Ember.get, sc_set = Ember.set;


module("Ember.IndexSet#max");

test("newly created index", function() {
  var set = Ember.IndexSet.create();
  equals(sc_get(set, 'max'), 0, 'max should be 0');
});

test("after adding one range", function() {
  var set = Ember.IndexSet.create().add(4,2);
  equals(sc_get(set, 'max'),6, 'max should be one greater than max index');
});

test("after adding range then removing part of range", function() {
  var set = Ember.IndexSet.create().add(4,4).remove(6,4);
  equals(sc_get(set, 'max'),6, 'max should be one greater than max index');
});

test("after adding range several disjoint ranges", function() {
  var set = Ember.IndexSet.create().add(4,4).add(6000);
  equals(sc_get(set, 'max'),6001, 'max should be one greater than max index');
});

test("after removing disjoint range", function() {
  var set = Ember.IndexSet.create().add(4,2).add(6000).remove(5998,10);
  equals(sc_get(set, 'max'),6, 'max should be one greater than max index');
});

test("after removing all ranges", function() {
  var set = Ember.IndexSet.create().add(4,2).add(6000).remove(3,6200);
  equals(sc_get(set, 'max'), 0, 'max should be back to 0 with no content');
});

