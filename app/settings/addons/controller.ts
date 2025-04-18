import Controller from '@ember/controller';
import { inject as service } from '@ember/service';

import CurrentUser from 'ember-osf-web/services/current-user';

export default class SettingsAddonsController extends Controller {
    @service currentUser!: CurrentUser;
}
