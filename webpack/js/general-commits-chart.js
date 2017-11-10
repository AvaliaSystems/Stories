import SliderChart from './slider-chart';

const d3 = require('d3');
const moment = require('moment');

class GeneralCommitsChart extends SliderChart {
  constructor(dataFileName) {
    super('scatterplot-commits-average');

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
          throw error;
        } else {
          const dataWithinGap = {
            projects: [],
          };

          data.projects.forEach((project) => {
            const projectWithinGap = {
              projectUrl: project.projectUrl,
              projectName: project.projectName,
              stats: {
                totalNumberOfCommits: 0,
                totalAddedLines: 0,
                totalDeletedLines: 0,
                totalCommitsSize: 0,
                numberOfDaysForStats: this.daysGap,
                averageCommitsPerDay: 0,
                averageSizePerCommit: 0,
              },
              commitsByDay: [],
            };

            project.commitsByDay.forEach((commit) => {
              if (moment().diff(moment(commit.date), 'days') <= this.daysGap) {
                projectWithinGap.stats.totalNumberOfCommits += commit.numberOfCommits;
                projectWithinGap.stats.totalAddedLines += commit.addedLines;
                projectWithinGap.stats.totalDeletedLines += commit.deletedLines;
                projectWithinGap.stats.totalCommitsSize += commit.totalSize;

                projectWithinGap.commitsByDay.push(commit);
              }
            });

            projectWithinGap.stats.averageCommitsPerDay =
              Math.round((projectWithinGap.stats.totalNumberOfCommits / this.daysGap) * 100) / 100;

            projectWithinGap.stats.averageSizePerCommit =
              Math.round((projectWithinGap.stats.totalCommitsSize /
                projectWithinGap.stats.totalNumberOfCommits) * 100) / 100;

            dataWithinGap.projects.push(projectWithinGap);
          });

          this.minimumCommitSize = dataWithinGap.projects.reduce(
            (a, b) => (b.stats.totalCommitsSize < a ? b.stats.totalCommitsSize : a),
            dataWithinGap.projects[0].stats.totalCommitsSize,
          );

          this.maximumCommitSize = dataWithinGap.projects.reduce(
            (a, b) => (b.stats.totalCommitsSize > a ? b.stats.totalCommitsSize : a),
            0,
          );

          this.sliderLength = data.projects.reduce(
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
      const xAxis = d3.axisBottom(x).ticks(10);
      const yAxis = d3.axisLeft(y).ticks(5);

      // Scale the range of the data
      x.domain([0, d3.max(this.data.projects, d => d.stats.averageCommitsPerDay)]);
      y.domain([0, d3.max(this.data.projects, d => d.stats.averageSizePerCommit)]);

      // Add the scatterplot
      const gdot = this.surface.selectAll('g.dot')
        .data(this.data.projects)
        .enter().append('g');

      gdot.append('circle')
        /* .attr('fill', (d) => {
          const colorScale =
            ((d.stats.totalCommitsSize - this.minimumCommitSize) /
            (this.maximumCommitSize - this.minimumCommitSize));
          return `hsla(${120 - (colorScale * 120)}, 100%, ${30 + (colorScale * 20)}%, 0.4)`;
        }) */
        .attr('class', 'project-circle')
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
          let radiusDifference = newRadius - currentElement.attr('r');

          if (d.projectName === 'spring-boot') {
            radiusDifference = -radiusDifference;
          }

          currentElement
            .transition()
            .duration(800)
            .ease(d3.easeElastic)
            .attr('r', newRadius);

          d3.selectAll(`#text-${d.projectName}`)
            .transition()
            .duration(800)
            .ease(d3.easeElastic)
            // eslint-disable-next-line func-names
            .attr('x', function () {
              return parseFloat(d3.select(this).attr('x')) + radiusDifference;
            })
            .attr('opacity', 1);

          /* content of the tooltip */
          const html = `<b>${d.projectName}</b><br/>${d.stats.totalNumberOfCommits} commits in ${d.stats.numberOfDaysForStats} day(s)<br/>${d.stats.totalCommitsSize} changed lines<br/>Average of ${d.stats.averageCommitsPerDay} commit(s) per day<br/>Average size of ${d.stats.averageSizePerCommit} per commit`;

          self.tooltip.html(html)
            .transition()
            .duration(800)
            .ease(d3.easeElastic)
            .style('left', `${d3.event.pageX}px`)
            .style('top', `${d3.event.pageY}px`)
            .style('opacity', 0.9);
        })
        // eslint-disable-next-line func-names
        .on('mouseleave', function (d) {
          const newRadius = circlesSize;
          const currentElement = d3.select(this);
          let radiusDifference = currentElement.attr('r') - newRadius;

          if (d.projectName === 'spring-boot') {
            radiusDifference = -radiusDifference;
          }

          currentElement
            .transition()
            .duration(800)
            .ease(d3.easeElastic)
            .attr('r', newRadius);

          d3.selectAll(`#text-${d.projectName}`)
            .transition()
            .duration(800)
            .ease(d3.easeElastic)
            // eslint-disable-next-line func-names
            .attr('x', function () {
              return parseFloat(d3.select(this).attr('x')) - radiusDifference;
            })
            .attr('opacity', 0.5);

          self.tooltip
            .transition()
            .duration(200)
            .style('opacity', 0);
        });

      gdot.append('text')
        .attr('class', 'projects-labels')
        .attr('id', d => `text-${d.projectName}`)
        .attr('opacity', 0.5)
        .attr('x', (d) => {
          if (d.projectName === 'spring-boot') {
            return x(d.stats.averageCommitsPerDay) - 90 - circlesSize;
          }

          return x(d.stats.averageCommitsPerDay) + 5 + circlesSize;
        })
        .attr('y', d => y(d.stats.averageSizePerCommit) + 4)
        .text(d => d.projectName);

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

export default GeneralCommitsChart;
