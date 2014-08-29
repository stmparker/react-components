'use strict';

var _ = require('lodash');
var moment = require('moment');
var config = require('app/config');
var Reflux = require('reflux');
var ServerActions = require('app/actions/server');

var ComponentStore = Reflux.createStore({
    init: function() {
        this.components = {};
        this.componentSummaries = [];

        this.listenTo(ServerActions.modulesFetched, this.populate);
    },

    get: function(name) {
        return this.components[name];
    },

    getAll: function() {
        return this.components;
    },

    getSummaries: function() {
        return this.componentSummaries;
    },

    getMostRecentlyCreated: function(limit) {
        return (
            _.sortBy(this.components, 'created')
            .reverse()
            .slice(0, limit || 10)
        );
    },

    getMostRecentlyUpdated: function(limit) {
        var mostRecent  = this.getMostRecentlyCreated();
        var lastUpdated = _.sortBy(this.components, 'modified').reverse();

        return _.without.apply(null, [lastUpdated].concat(mostRecent)).slice(0, limit || 10);
    },

    populate: function(components) {
        components.map(this.addComponent.bind(this));
        this.trigger('change');
    },

    parseAuthor: function(component) {
        var distTags = component['dist-tags'] || {},
            latest   = component.versions[distTags.latest] || {};
        
        return (latest._npmUser || component.author).name;
    },

    parseComponentSummary: function(component) {
        return {
            name: component.name,
            description: component.description,
            author: this.parseAuthor(component),
            modified: moment(component.time.modified),
            created: moment(component.time.created),
            keywords: component.keywords.filter(this.isUncommonKeyword)
        };
    },

    parseComponent: function(component) {
        component.created = component.time.created;
        component.modified = component.time.modified;

        return component;
    },

    addComponent: function(component) {
        this.components[component.name] = this.parseComponent(component);
        this.componentSummaries.push(this.parseComponentSummary(component));
    },

    isUncommonKeyword: function(keyword) {
        return config['exclude-keywords'].indexOf(keyword) === -1;
    }
});

module.exports = ComponentStore;