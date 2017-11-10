/* eslint no-unused-vars: 0 */
import GeneralCommitsChart from './js/general-commits-chart';
import ModulesChart from './js/modules-chart';
import LineChart from './js/line-chart';

// In order to parse a templates-based string, we need to process the JS file with Jekyll.
// This action is automatically done, thanks to the webpack's WrapperPlugin plugin, which
// inject the liquid-template note at the top of the generated bundle file.
// If you are curious about it, have a look at the root's webpack.config.js file.
const commitsStatsFile = "{{ '/data/commits-stats.json' | prepend: site.baseurl }}";

const generalCommitsChart = new GeneralCommitsChart(commitsStatsFile);
const modulesChart = new ModulesChart("{{ '/data/modules-stats.json' | prepend: site.baseurl }}");
const lineChart = new LineChart(commitsStatsFile);
