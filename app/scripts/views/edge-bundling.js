'use strict';
var Backbone = require('backbone');
var d3 = require('d3');
var template = require('../templates/edge-bundling.hbs');

module.exports = Backbone.View.extend({
    className: 'edge-bundling',

	initialize: function() {
		this.listenTo(this.collection, 'sync', this.d3);
	},

	d3: function() {
        function mouseovered(d) {
          node
              .each(function(n) { n.target = n.source = false; });

          link
              .classed('link--target', function(l) {
                if (l.target === d) {
                    l.source.source = true;
                    return true;
                }
              })
              .classed('link--source', function(l) {
                if (l.source === d) {
                    l.target.target = true;
                    return true;
                }
              })
            .filter(function(l) { return l.target === d || l.source === d; })
              .each(function() { this.parentNode.appendChild(this); });

          node
              .classed('node--target', function(n) { return n.target; })
              .classed('node--source', function(n) { return n.source; });
        }

        function mouseouted() {
          link
              .classed('link--target', false)
              .classed('link--source', false);

          node
              .classed('node--target', false)
              .classed('node--source', false);
        }

        // Lazily construct the package hierarchy from class names.
        function packageHierarchy(classes) {
          var map = {};

          function find(name, data) {
            var node = map[name], i;
            if (!node) {
              node = map[name] = data || {name: name, children: []};
              if (name.length) {
                node.parent = find(name.substring(0, i = name.lastIndexOf('/')));
                node.parent.children.push(node);
                node.key = name.substring(i + 1);
                node.name = name.substring(i + 1);
                node.path = node.path || node.name;
              }
            }
            if (!node.children) {
                node.children = [];
            }
            return node;
          }

          classes.forEach(function(d) {
            find(d.path, d);
          });

          return map[''];
        }

        // Return a list of imports for the given array of nodes.
        function packageImports(nodes) {
          var map = {},
              imports = [];

          // Compute a map from name to node.
          nodes.forEach(function(d) {
            map[d.path] = d;
          });

          // For each import, construct a link from the source to target node.
          nodes.forEach(function(d) {
            if (d.interdependencies) {
                d.interdependencies.forEach(function(i) {
                  imports.push({source: map[d.path], target: map[d.parent.path + '/' + i]});
                });
            }
          });

          return imports;
        }

        var diameter = 960,
            radius = diameter / 2,
            innerRadius = radius - 120;

        var cluster = d3.layout.cluster()
            .size([360, innerRadius])
            .sort(null)
            .value(function(d) { return d.size; });

        var bundle = d3.layout.bundle();

        var line = d3.svg.line.radial()
            .interpolate('bundle')
            .tension(0.85)
            .radius(function(d) { return d.y; })
            .angle(function(d) { return d.x / 180 * Math.PI; });

        var svg = d3.select('svg')
            .attr('width', diameter)
            .attr('height', diameter)
          .append('g')
            .attr('transform', 'translate(' + radius + ',' + radius + ')');

        var link = svg.append('g').selectAll('.link'),
            node = svg.append('g').selectAll('.node');

          var nodes = cluster.nodes(packageHierarchy(this.collection.toJSON())),
              links = packageImports(nodes);

          link = link
              .data(bundle(links))
            .enter().append('path')
              .each(function(d) {
                  d.source = d[0];
                  d.target = d[d.length - 1];
              })
              .attr('class', 'link')
              .attr('d', line);

          node = node
              .data(nodes.filter(function(n) { return !n.children; }))
            .enter().append('text')
              .attr('class', 'node')
              .attr('dy', '.31em')
              .attr('transform', function(d) { return 'rotate(' + (d.x - 90) + ')translate(' + (d.y + 8) + ',0)' + (d.x < 180 ? '' : 'rotate(180)'); })
              .style('text-anchor', function(d) { return d.x < 180 ? 'start' : 'end'; })
              .text(function(d) { return d.key; })
              .on('mouseover', mouseovered)
              .on('mouseout', mouseouted);
	},

	render: function() {
		this.$el.html(template());
		return this;
	}
});