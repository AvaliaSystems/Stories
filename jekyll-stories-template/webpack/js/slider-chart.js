const d3 = require('d3');

class SliderChart {
  constructor(className) {
    this.margin = {
      top: 140,
      right: 50,
      bottom: 75,
      left: 50,
    };

    this.sliderMargin = 10;
    this.svg = d3.select(`.${className}`);

    this.surface = this.svg.append('g')
      .attr(
        'transform',
        `translate(${this.margin.left}, ${this.margin.top})`,
      );

    this.tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);

    this.slider = this.svg.append('g')
      .attr('class', 'slider')
      .attr('transform', `translate(${this.sliderMargin}, 45)`);

    this.width = 0;
    this.height = 0;
    this.daysGap = 100;
    this.sliderLength = 0;

    this.resize = this.resize.bind(this);
    window.addEventListener('resize', this.resize);
  }

  // eslint-disable-next-line class-methods-use-this
  loadData() {
    throw new Error('Method \'loadData()\' cannot be called from parent "SliderChart" class.');
  }

  // eslint-disable-next-line class-methods-use-this
  redraw() {
    throw new Error('Method \'redraw()\' cannot be called from parent "SliderChart" class.');
  }

  drawSlider() {
    const sliderX = d3.scaleLinear()
      .domain([0, this.sliderLength])
      .range([0, (this.width + this.margin.left + this.margin.right) - (2 * this.sliderMargin)])
      .clamp(true);

    let handle;

    this.slider.append('text')
      .attr('id', 'slider-text')
      .attr('x', 0)
      .attr('y', 45)
      .text(`Data calculated by looking back ${this.daysGap} day(s) from now.`);

    this.slider.append('line')
      .attr('class', 'track')
      .attr('x1', sliderX.range()[0])
      .attr('x2', sliderX.range()[1])
      // eslint-disable-next-line func-names
      .select(function () { return this.parentNode.appendChild(this.cloneNode(true)); })
      .attr('class', 'track-inset')
      // eslint-disable-next-line func-names
      .select(function () { return this.parentNode.appendChild(this.cloneNode(true)); })
      .attr('class', 'track-overlay')
      .call(d3.drag()
        .on('start.interrupt', () => { this.slider.interrupt(); })
        .on('start drag', () => {
          this.daysGap = parseInt(sliderX.invert(d3.event.x), 10);
          handle.attr('cx', sliderX(this.daysGap));
          this.slider.selectAll('#slider-text').text(`Data calculated by looking back ${this.daysGap} day(s) from now.`);

          this.loadData()
            .catch((err) => {
              console.log(err);
            })
            .then(this.resize);
        }));

    this.slider.insert('g', '.track-overlay')
      .attr('class', 'ticks')
      .attr('transform', 'translate(0, 18)')
      .selectAll('text')
      .data(sliderX.ticks(10))
      .enter()
      .append('text')
      .attr('x', sliderX)
      .attr('text-anchor', 'middle')
      .text(d => d);

    handle = this.slider.insert('circle', '.track-overlay')
      .attr('class', 'handle')
      .attr('cx', this.sliderLength >= this.daysGap ? sliderX(this.daysGap) : sliderX(this.sliderLength))
      .attr('r', 9);
  }

  resize() {
    const containerWidth = parseInt(d3.select('#content').style('width'), 10);

    this.slider.selectAll('*').remove();

    this.width = containerWidth - this.margin.left - this.margin.right;
    this.height = 500 - this.margin.top - this.margin.bottom;

    this.svg
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom);

    this.drawSlider();
    this.redraw();
  }
}

export default SliderChart;
