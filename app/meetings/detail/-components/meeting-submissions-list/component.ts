import { action, computed } from '@ember-decorators/object';
import Component from '@ember/component';
import { task, timeout } from 'ember-concurrency';

export default class MeetingSubmissionsList extends Component.extend({
    searchSubmissions: task(function *(this: MeetingSubmissionsList, search: string) {
        yield timeout(500); // debounce
        this.set('search', search);
    }).restartable(),
}) {
    search?: string;
    sort?: string;
    meetingId!: string;

    @computed('search', 'sort')
    get query() {
        const query = {} as Record<string, string>;
        query.meetingId = this.meetingId;
        if (this.search) {
            query['filter[title,author,meeting_category]'] = this.search;
        }
        if (this.sort) {
            query.sort = this.sort;
        }
        return query;
    }

    @action
    sortSubmissions(sort: string) {
        this.set('sort', sort);
    }
}
