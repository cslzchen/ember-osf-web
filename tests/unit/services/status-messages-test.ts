import { setupTest } from 'ember-osf-web/tests/helpers/osf-qunit';
import { module, test } from 'qunit';

module('Unit | Service | status-messages', hooks => {
    setupTest(hooks);

    test('it exists', function(assert) {
        const service = this.owner.lookup('service:status-messages');
        assert.ok(service);
    });
});
