import Component from '@ember/component';
import { serviceLinks } from 'ember-osf-web/const/service-links';

export default class OsfFooter extends Component {
    supportEmail = 'placeholder';
    serviceLinks = serviceLinks;

    didRender() {
        this._super(...arguments);
        this.set('supportEmail', atob('bWFpbHRvOmNvbnRhY3RAb3NmLmlv'));
    }
}
