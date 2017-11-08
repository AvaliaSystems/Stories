import SliderChart from './slider-chart';

const d3 = require('d3');
const moment = require('moment');

class ModulesChart extends SliderChart {
  constructor(dataFileName) {
    super('scatterplot-spring-module-average');

    this.dataFileName = dataFileName;

    this.loadData()
      .catch((err) => {
        throw new Error(err);
      })
      .then(this.resize);
  }

  loadData() {
    return new Promise((resolve) => {
      // Get the data
      d3.json(this.dataFileName, (error, data) => {
        if (error) {
          throw new Error(error);
        } else {
          const dataWithinGap = {
            modules: [],
          };

          data.modules.forEach((module) => {
            const moduleWithinGap = {
              moduleName: module.moduleName,
              stats: {
                totalNumberOfCommits: 0,
                totalAddedLines: 0,
                totalDeletedLines: 0,
                totalCommitsSize: 0,
                numberOfDaysForStats: this.daysGap,
                averageCommitsPerDay: 0,
              },
              commitsByDay: [],
            };

            module.commitsByDay.forEach((commit) => {
              if (moment().diff(moment(commit.date), 'days') <= this.daysGap) {
                moduleWithinGap.stats.totalNumberOfCommits += commit.numberOfCommits;
                moduleWithinGap.stats.totalAddedLines += commit.addedLines;
                moduleWithinGap.stats.totalDeletedLines += commit.deletedLines;
                moduleWithinGap.stats.totalCommitsSize += commit.totalSize;

                moduleWithinGap.commitsByDay.push(commit);
              }
            });

            moduleWithinGap.stats.averageCommitsPerDay =
              Math.round((moduleWithinGap.stats.totalNumberOfCommits / this.daysGap) * 100) / 100;

            moduleWithinGap.stats.averageSizePerCommit =
              Math.round((moduleWithinGap.stats.totalCommitsSize /
                moduleWithinGap.stats.totalNumberOfCommits) * 100) / 100;

            dataWithinGap.modules.push(moduleWithinGap);
          });

          this.minimumCommitSize = dataWithinGap.modules.reduce(
            (a, b) => (b.stats.totalCommitsSize < a ? b.stats.totalCommitsSize : a),
            dataWithinGap.modules[0].stats.totalCommitsSize,
          );

          this.maximumCommitSize = dataWithinGap.modules.reduce(
            (a, b) => (b.stats.totalCommitsSize > a ? b.stats.totalCommitsSize : a),
            0,
          );

          this.sliderLength = data.modules.reduce(
            (a, b) => (b.stats.numberOfDaysForStats > a ? b.stats.numberOfDaysForStats : a),
            0,
          );

          this.data = dataWithinGap;

          resolve();
        }
      });
    });
  }

  redraw() {
    if (this.data) {
      const self = this;
      const circlesSize = 10;

      this.surface.selectAll('*').remove();

      // Set the ranges
      const x = d3.scaleLinear().range([0, this.width]);
      const y = d3.scaleLinear().range([this.height, 0]);

      // Define the axes
      const xAxis = d3.axisBottom(x).ticks(5);
      const yAxis = d3.axisLeft(y).ticks(10);

      // Scale the range of the data
      x.domain([0, d3.max(this.data.modules, d => d.stats.averageCommitsPerDay)]);
      y.domain([0, d3.max(this.data.modules, d => d.stats.averageSizePerCommit)]);

      // Add the scatterplot
      const gdot = this.surface.selectAll('g.dot')
        .data(this.data.modules)
        .enter().append('g');

      gdot.append('circle')
        .attr('class', 'module-circle')
        .attr('r', circlesSize)
        .attr('cx', d => x(d.stats.averageCommitsPerDay))
        .attr('cy', d => y(d.stats.averageSizePerCommit))
        // We need to keep the oldschool function pattern instead of the ES6 one, because
        // we want 'this' to reference the current circle and not the GeneralCommitsChart
        // class.
        // eslint-disable-next-line func-names
        .on('mouseover', function (d) {
          const newRadius = 2 * circlesSize;
          const currentElement = d3.select(this);

          currentElement
            .transition()
            .duration(800)
            .ease(d3.easeElastic)
            .attr('r', newRadius);

          /* content of the tooltip */
          const html = `<b>${d.moduleName}</b><br/>${d.stats.totalNumberOfCommits} commits in ${d.stats.numberOfDaysForStats} day(s)<br/>${d.stats.totalCommitsSize} changed lines`;

          self.tooltip.html(html)
            .transition()
            .duration(800)
            .ease(d3.easeElastic)
            .style('left', `${d3.event.pageX}px`)
            .style('top', `${d3.event.pageY}px`)
            .style('opacity', 0.9);
        })
        // eslint-disable-next-line func-names
        .on('mouseleave', function () {
          const newRadius = circlesSize;
          const currentElement = d3.select(this);

          currentElement
            .transition()
            .duration(800)
            .ease(d3.easeElastic)
            .attr('r', newRadius);

          self.tooltip
            .transition()
            .duration(200)
            .style('opacity', 0);
        });

      // Add the X Axis
      this.surface.append('g')
        .attr('class', 'x axis')
        .attr('transform', `translate(0, ${this.height})`)
        .call(xAxis);

      this.surface.append('text')
        .attr('class', 'axis-labels')
        .attr('fill', 'drakblue')
        .attr('transform', `translate(${this.width / 2}, ${(this.height + this.margin.top) - 95})`)
        .style('text-anchor', 'middle')
        .text('Average commits per day');

      // Add the Y Axis
      this.surface.append('g')
        .attr('class', 'y axis')
        .call(yAxis);

      this.surface.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('class', 'axis-labels')
        .attr('y', 0 - this.margin.left)
        .attr('x', 0 - (this.height / 2))
        .attr('dy', '1em')
        .style('text-anchor', 'middle')
        .text('Average size of commits');
    } else {
      throw new Error('No data found.');
    }
  }
}

export default ModulesChart;
