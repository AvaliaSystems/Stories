/* eslint no-unused-vars: 0 */
import GeneralCommitsChart from './js/general-commits-chart';
import ModulesChart from './js/modules-chart';
import LineChart from './js/line-chart';

const generalCommitsChart = new GeneralCommitsChart('/data/commits-stats.json');
const modulesChart = new ModulesChart('/data/modules-stats.json');
const lineChart = new LineChart('/data/commits-stats.json');
