/**
 * Complex Nested Records (Ember.Record) Unit Test
 *
 * @author Evin Grano
 */

 var set = Ember.set, get = Ember.get;

// ..........................................................
// Basic Set up needs to move to the setup and teardown
// 
var NestedRecord, store, testParent; 

var initModels = function(){
  NestedRecord.Address = Ember.Record.extend({
    street: Ember.Record.attr(String),
    city: Ember.Record.attr(String),
    state: Ember.Record.attr(String, {defaultValue: 'VA'})
  });
  
  NestedRecord.Person = Ember.Record.extend({
    /** Child Record Namespace */
    nestedRecordNamespace: NestedRecord,
    
    name: Ember.Record.attr(String),
    address: Ember.Record.toOne('NestedRecord.Address', { nested: true })
  });
  
  NestedRecord.ParentRecordTest = Ember.Record.extend({
    /** Child Record Namespace */
    nestedRecordNamespace: NestedRecord,

    name: Ember.Record.attr(String),
    person: Ember.Record.toOne('NestedRecord.Person', { nested: true })
  });
};

// ..........................................................
// Basic Ember.Record Stuff
// 
module("Basic Ember.Record Functions w/ a Parent > Child > Child", {

  setup: function() {
    NestedRecord = Ember.Object.create({
      store: Ember.Store.create()
    });
    store = NestedRecord.store;
    initModels();
    Ember.run.begin();
    testParent = store.createRecord(NestedRecord.ParentRecordTest, {
      name: 'Parent Name',
      person: {
        type: 'Person',
        name: 'Albert',
        address: {
          type: 'Address',
          street: '123 Sesame St',
          city: 'New York',
          state: 'NY'
        }
      }
    });
    Ember.run.end();
  },

  teardown: function() {
    delete NestedRecord.ParentRecordTest;
    delete NestedRecord.Person;
    delete NestedRecord.Address;
    NestedRecord = null;
    testParent = null;
    store = null;
  }
});

test("Function: readAttribute() in the Parent Record",
function() {
  
  equals(testParent.readAttribute('name'), 'Parent Name', "readAttribute should be correct for name attribute");
  equals(testParent.readAttribute('nothing'), null, "readAttribute should be correct for invalid key");
  same(testParent.readAttribute('person'),   
    {
      type: 'Person',
      name: 'Albert',
      address: {
        type: 'Address',
        street: '123 Sesame St',
        city: 'New York',
        state: 'NY'
      }
    },
    "readAttribute should be correct for 'person' child attribute");
});

test("Function: readAttribute() in the Parent > Child",
function() {
  var person = get(testParent, 'person');
  ok(person, "check to see if the first child in the chain exists");
  equals(person.readAttribute('name'), 'Albert', "child readAttribute should be correct for name attribute");
  equals(person.readAttribute('nothing'), null, "child readAttribute should be correct for invalid key");
  same(person.readAttribute('address'),   
    {
      type: 'Address',
      street: '123 Sesame St',
      city: 'New York',
      state: 'NY'
    },
    "readAttribute should be correct for address on the child");
});

test("Function: readAttribute() in the Parent > Child > Child",
function() {
  var address = Ember.getPath(testParent,  'person.address');
  ok(address, "check to see if the child of the child in the chain exists with a getPath()");
  equals(address.readAttribute('street'), '123 Sesame St', "child readAttribute should be correct for street attribute w/ getPath()");
  equals(address.readAttribute('nothing'), null, "child readAttribute should be correct for invalid key w/ getPath()");
  
  // Test the individual gets
  var person = get(testParent, 'person');
  var address2 = get(person, 'address');
  ok(address2, "check to see if the child of the child in the chain exists with a get");
  equals(address2.readAttribute('street'), '123 Sesame St', "child readAttribute should be correct for street attribute w/ get()");
  equals(address2.readAttribute('nothing'), null, "child readAttribute should be correct for invalid key w/ get()");
});

test("Function: writeAttribute() in the Parent Record",
function() {
  
  testParent.writeAttribute('name', 'New Parent Name');
  equals(get(testParent, 'name'), 'New Parent Name', "writeAttribute should be the new name attribute");
  
  testParent.writeAttribute('nothing', 'nothing');
  equals(get(testParent, 'nothing'), 'nothing', "writeAttribute should be correct for new key");
  
  testParent.writeAttribute('person', 
  {
    type: 'Person',
    name: 'Al Gore',
    address: {
      type: 'Address',
      street: '123 Crazy St',
      city: 'Khacki Pants',
      state: 'Insanity'
    }
  });
  same(testParent.readAttribute('person'),   
    {
      type: 'Person',
      name: 'Al Gore',
      address: {
        type: 'Address',
        street: '123 Crazy St',
        city: 'Khacki Pants',
        state: 'Insanity'
      }
    },
    "writeAttribute with readAttribute should be correct for person child attribute");
});

test("Function: writeAttribute() in the Parent > Child",
function() {  
  var person = get(testParent, 'person');
  person.writeAttribute('name', 'Luke Skywalker');
  equals(person.readAttribute('name'), 'Luke Skywalker', "writeAttribute should be the new name attribute on the child");
  var p = testParent.readAttribute('person');
  equals(p.name, 'Luke Skywalker', "check to see if a writeAttribute single change on the child will reflect on the parent");
  
  // check for a change on the child of the child
  var newAddress = {
    type: 'Address',
    street: '1 Way Street',
    city: 'Springfield',
    state: 'IL'
  };
  person.writeAttribute('address', newAddress);
  same(person.readAttribute('address'), {
    type: 'Address',
    street: '1 Way Street',
    city: 'Springfield',
    state: 'IL'
  }, "writeAttribute should be the new address attribute on the child");
  p = testParent.readAttribute('person');
  same(p.address, {
    type: 'Address',
    street: '1 Way Street',
    city: 'Springfield',
    state: 'IL'
  }, "check to see if a writeAttribute address change on the child will reflect on the parent");
});

test("Function: writeAttribute() in the Parent > Child > Child",
function() {  
  var address = Ember.getPath(testParent,  'person.address');
  address.writeAttribute('street', '1 Death Star Lane');
  equals(address.readAttribute('street'), '1 Death Star Lane', "writeAttribute should be the new name attribute on the child.street");
  // Now, test the person
  var p = testParent.readAttribute('person');
  equals(p.address.street, '1 Death Star Lane', "check to see if a writeAttribute change on the child will reflect on the child > child.address.street");
  // now test the Parent record
  var parentAttrs = get(testParent, 'attributes');
  equals(parentAttrs.person.address.street, '1 Death Star Lane', "check to see if a writeAttribute change on the child will reflect on the child > child > parent.attributes.person.address.street");
});

test("Basic Read",
function() {
  
  // Test general gets
  equals(get(testParent, 'name'), 'Parent Name', "get(Parent, ) should be correct for name attribute");
  equals(get(testParent, 'nothing'), null, "get(Parent, ) should be correct for invalid key");
  
  // Test Child Record creation
  var p = get(testParent, 'person');
  // Check Model Class information
  ok((p instanceof  Ember.Record), "get(parent > child) creates an actual instance that is a kind of a Ember.Record Object");
  ok((p instanceof NestedRecord.Person), "get(parent > child) creates an actual instance of a Person Object");
  
  // Check reference information
  var pm = get(p, 'primaryKey');
  var pKey = get(p, pm);
  var storeRef = store.find(NestedRecord.Person, pKey);
  ok(storeRef, 'checking that the store has the instance of the child record with proper primary key');
  equals(p, storeRef, "checking the parent reference is the same as the direct store reference");
  same(get(storeRef, 'attributes'), testParent.readAttribute('person'), "check that the ChildRecord's attributes are the same as the parent.person's readAttribute for the reference");
  
  var a = Ember.getPath(testParent,  'person.address');
  // Check Model Class information
  ok((a instanceof  Ember.Record), "(parent > child > child) w/ getPath() creates an actual instance that is a kind of a Ember.Record Object");
  ok((a instanceof NestedRecord.Address), "(parent > child > child) w/ getPath() creates an actual instance of an Address Object");
  
  // Check reference information
  var aKey = get(a, pm);
  storeRef = store.find(NestedRecord.Address, aKey);
  ok(storeRef, 'checking that the store has the instance of the (parent > child > child) record with proper primary key');
  equals(a, storeRef, "checking the (parent > child > child) reference is the same as the direct store reference");
  same(get(storeRef, 'attributes'), p.readAttribute('address'), "check that the ChildRecord's attributes are the same as the (parent > child.address)'s readAttribute for the reference");
});

test("Basic Write",
function() {
  var oldP, p, key, oldKey, storeRef;
  var pm, a, parentAttrs;
  // Test general gets
  set(testParent, 'name', 'New Parent Name');
  equals(get(testParent, 'name'), 'New Parent Name', "set() should change name attribute");
  set(testParent, 'nothing', 'nothing');
  equals(get(testParent, 'nothing'), 'nothing', "set should change non-existent property to a new property");
  
  // Test Child Record creation
  oldP = get(testParent, 'person');
  set(testParent, 'person', {
    type: 'Person',
    name: 'Al Gore',
    address: {
      type: 'Address',
      street: '123 Crazy St',
      city: 'Khacki Pants',
      state: 'Insanity'
    }
  });
  p = get(testParent, 'person');
  // Check Model Class information
  ok((p instanceof  Ember.Record), "set() with an object creates an actual instance that is a kind of a Ember.Record Object");
  ok((p instanceof NestedRecord.Person), "set() with an object creates an actual instance of a ChildRecordTest Object");
  
  // Check reference information
  pm = get(p, 'primaryKey');
  key = get(p, pm);
  storeRef = store.find(NestedRecord.Person, key);
  ok(storeRef, 'after a set() with an object, checking that the store has the instance of the child record with proper primary key');
  equals(p, storeRef, "after a set with an object, checking the parent reference is the same as the direct store reference");
  oldKey = get(oldP, pm);
  ok(!(oldKey === key), 'check to see that the old child record has a different key from the new child record');
  
  // Check for changes on the child bubble to the parent.
  set(p, 'name', 'Child Name Change');
  equals(get(p, 'name'), 'Child Name Change', "after a set('name', <new>) on child, checking that the value is updated");
  ok(get(p, 'status') & Ember.Record.DIRTY, 'check that the child record is dirty');
  ok(get(testParent, 'status') & Ember.Record.DIRTY, 'check that the parent record is dirty');
  oldP = p;
  p = get(testParent, 'person');
  same(p, oldP, "after a set('name', <new>) on child, checking to see that the parent has recieved the changes from the child record");
  same(testParent.readAttribute('person'), get(p, 'attributes'), "after a set('name', <new>) on child, readAttribute on the parent should be correct for info child attributes");
  
  // Check changes on the address
  a = Ember.getPath(testParent,  'person.address');
  set(a, 'street', '321 Nutty Professor Lane');
  parentAttrs = testParent.readAttribute('person');
  same(get(a, 'attributes'), parentAttrs.address, "after a set('street', <new>) on address child, checking to see that the parent has recieved the changes from the child record");
});

test("Basic normalize()", function() {
  var pAttrs;
  set(testParent, 'person', {
    type: 'Person',
    name: 'Al Gore',
    address: {
      type: 'Address',
      street: '123 Crazy St',
      city: 'Khacki Pants'
    }
  });
  testParent.normalize();
  pAttrs = get(testParent, 'attributes');
  equals(pAttrs.person.address.state, 'VA', "test normalization is the default value of VA");
});

