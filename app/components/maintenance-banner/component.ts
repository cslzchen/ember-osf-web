import { computed } from '@ember/object';
import $ from 'jquery';
import Component from '@ember/component';
import { task } from 'ember-concurrency';
import config from 'ember-get-config';
import moment from 'moment';

interface MaintenanceData {
    level?: number,
    message?: string,
    start?: string,
    end?: string,
}

export default class MaintenanceBanner extends Component.extend({
    didReceiveAttrs(): void {
        this._super(...arguments);
        this.get('getMaintenanceStatus').perform();
    },
    maintenance: <MaintenanceData> null,
    getMaintenanceStatus: task(function* (): void {
        const url: string = `${config.OSF.apiUrl}/v2/status/`;
        const data = yield $.ajax(url, 'GET');
        this.set('maintenance', data.maintenance);
    }).restartable(),
}) {
    start = computed('maintenance.start', (): string => moment(this.get('maintenance.start')).format('lll'));

    end = computed('maintenance.end', (): string => moment(this.get('maintenance.end')).format('lll'));

    utc = computed('maintenance.start', (): string => moment(this.get('maintenance.start')).format('ZZ'));

    alertClass = computed('maintenance.level', (): string => {
        const levelMap = ['info', 'warning', 'danger'];
        return `alert-${levelMap[this.get('maintenance.level') - 1]}`;
    });
}
