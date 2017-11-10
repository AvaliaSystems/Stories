/* eslint no-unused-vars: 0 */
import GeneralCommitsChart from './js/general-commits-chart';
import ModulesChart from './js/modules-chart';
import LineChart from './js/line-chart';

const generalCommitsChart = new GeneralCommitsChart('/Teaching-HEIGVD-TWEB-2017-Stories/data/commits-stats.json');
const modulesChart = new ModulesChart('/Teaching-HEIGVD-TWEB-2017-Stories/data/modules-stats.json');
const lineChart = new LineChart('/Teaching-HEIGVD-TWEB-2017-Stories/data/commits-stats.json');
