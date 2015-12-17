/* global LocalCollection */
/* global Factory:true */

const factories = {};

Factory = class Factory {
  constructor(name, collection, attributes) {
    this.name = name;
    this.collection = collection;
    this.attributes = attributes;
    this.afterHooks = [];
    this.sequence = 0;
  }

  after(fn) {
    this.afterHooks.push(fn);
    return this;
  }
};

Factory.define = (name, collection, attributes) => {
  factories[name] = new Factory(name, collection, attributes);
  return factories[name];
};

Factory.get = name => {
  const factory = factories[name];
  if (! factory) {
    throw new Error("Factory: There is no factory named " + name);
  }
  return factory;
};

Factory.build = (name, attributes = {}, options = {}) => {
  const factory = Factory.get(name);
  const result = {};

  // "raw" attributes without functions evaluated, or dotted properties resolved
  extendedAttributes = _.extend({}, factory.attributes, attributes);

  // either create a new factory and return its _id
  // or return a 'fake' _id (since we're not inserting anything)
  const makeRelation = relName => {
    if (options.insert) {
      return Factory.create(relName)._id;
    }
    // fake an id on build
    return Random.id();
  };

  factory.sequence += 1;

  const walk = (record, object) => {
    _.each(object, (value, key) => {
      let newValue = value;
      // is this a Factory instance?
      if (value instanceof Factory) {
        newValue = makeRelation(value.name);
      } else if (_.isFunction(value)) {
        const fnRes = value.call(result, {
          sequence: fn => fn(factory.sequence)
        });
        // does executing this function return a Factory instance?
        newValue = (fnRes instanceof Factory) ? makeRelation(fnRes.name) : fnRes;
      // if an object literal is passed in, traverse deeper into it
      } else if (Object.prototype.toString.call(value) === '[object Object]') {
        record[key] = record[key] || {};
        return walk(record[key], value);
      }

      const modifier = {$set: {}};

      if (key !== '_id') {
        modifier.$set[key] = newValue;
      }

      LocalCollection._modify(record, modifier);
    });
  };

  walk(result, extendedAttributes);

  result._id = extendedAttributes._id || Random.id();
  return result;
};

Factory._create = (name, doc) => {
  const collection = Factory.get(name).collection;
  const insertId = collection.insert(doc);
  const record = collection.findOne(insertId);
  return record;
};

Factory.create = (name, attributes = {}) => {
  const doc = Factory.build(name, attributes, {insert: true});
  const record = Factory._create(name, doc);

  Factory.get(name).afterHooks.forEach(cb => cb(record));

  return record;
};

Factory.extend = (name, attributes = {}) => {
  return _.extend(_.clone(Factory.get(name).attributes), attributes);
};
