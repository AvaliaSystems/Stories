const d3 = require('d3');
const moment = require('moment');

class LineChart {
  constructor(dataFileName) {
    this.margin = {
      top: 20,
      right: 50,
      bottom: 30,
      left: 50,
    };

    this.svg = d3.select('.line-chart-complexity-score');

    this.surface = this.svg.append('g')
      .attr(
        'transform',
        `translate(${this.margin.left}, ${this.margin.top})`,
      );

    this.width = 0;
    this.height = 0;

    this.resize = this.resize.bind(this);
    window.addEventListener('resize', this.resize);

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
          this.data = d3
            .nest()
            .key(commit => moment(new Date(commit.date)).format('YYYY-MM'))
            .rollup(commits => ({
              size: d3.sum(commits, commit => commit.totalSize),
              coefficient: d3.mean(commits, commit => commit.complexityScoreCoefficient),
              complexityScore: d3.sum(commits, commit => commit.complexityScore),
            }))
            .entries(data.projects[1].commitsByDay)
            .map(score => ({
              date: score.key,
              size: score.value.size,
              coefficient: score.value.coefficient,
              complexityScore: score.value.complexityScore,
            }))
            .filter(score => moment(score.date) > moment().subtract(9, 'months'));

          resolve();
        }
      });
    });
  }

  redraw() {
    this.surface.selectAll('*').remove();

    // set the ranges
    const x = d3.scaleTime().range([0, this.width]);
    const y = d3.scaleLinear().range([this.height, 0]);

    // define the line
    const valueline = d3.line()
      .x(d => x(new Date(d.date)))
      .y(d => y(d.complexityScore));

    // define the line
    const valuelineSize = d3.line()
      .x(d => x(new Date(d.date)))
      .y(d => y(d.size));

    // define the line
    const valuelineCoefficient = d3.line()
      .x(d => x(new Date(d.date)))
      .y(d => y(d.coefficient * 10000));

    // Scale the range of the data
    x.domain(d3.extent(this.data, d => new Date(d.date)));
    y.domain([0, d3.max(this.data, d => d.size)]);

    // Add the valueline path.
    this.surface.append('path')
      .data([this.data])
      .attr('class', 'line')
      .attr('d', valueline)
      .attr('stroke', 'rgba(0, 0, 0, 0.5)')
      .attr('fill', 'none')
      .attr('stroke-width', 6);

    // Add the valueline path.
    this.surface.append('path')
      .data([this.data])
      .attr('class', 'line')
      .attr('d', valuelineSize)
      .attr('stroke', '#ff9999')
      .attr('fill', 'none')
      .attr('stroke-width', 2);

    // Add the valueline path.
    this.surface.append('path')
      .data([this.data])
      .attr('class', 'line')
      .attr('d', valuelineCoefficient)
      .attr('stroke', '#80b3ff')
      .attr('fill', 'none')
      .attr('stroke-width', 2);

    // Add the X Axis
    this.surface.append('g')
      .attr('transform', `translate(0, ${this.height})`)
      .call(d3.axisBottom(x));

    // Add the Y Axis
    this.surface.append('g')
      .call(d3.axisLeft(y));
  }

  resize() {
    const containerWidth = parseInt(d3.select('#content').style('width'), 10);

    this.width = containerWidth - this.margin.left - this.margin.right;
    this.height = 300 - this.margin.top - this.margin.bottom;

    this.svg
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom);

    this.redraw();
  }
}

export default LineChart;
