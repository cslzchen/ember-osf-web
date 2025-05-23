import Service from '@ember/service';
import { currentRouteName, fillIn } from '@ember/test-helpers';
import { ModelInstance } from 'ember-cli-mirage';
import { setupMirage } from 'ember-cli-mirage/test-support';
import { percySnapshot } from 'ember-percy';
import { TestContext } from 'ember-test-helpers';
import { module, test } from 'qunit';

import Registration, { RegistrationReviewStates } from 'ember-osf-web/models/registration';
import { click, currentURL, visit } from 'ember-osf-web/tests/helpers';
import { loadEngine, setupEngineApplicationTest } from 'ember-osf-web/tests/helpers/engines';
import { Permission } from 'ember-osf-web/models/osf-model';

interface OverviewTestContext extends TestContext {
    registration: ModelInstance<Registration>;
}

const KeenStub = Service.extend({
    queryNode(model: any) {
        return {
            result: [{
                'page.info.path': `/${model.id}/foo`,
            }],
        };
    },
});

module('Registries | Acceptance | overview.index', hooks => {
    setupEngineApplicationTest(hooks, 'registries');
    setupMirage(hooks);

    hooks.beforeEach(function(this: OverviewTestContext) {
        server.loadFixtures('schema-blocks');
        server.loadFixtures('registration-schemas');
        server.create('user', 'loggedIn');
        this.set('registration', server.create('registration', {
            archiving: false,
            withdrawn: false,
            registrationSchema: server.schema.registrationSchemas.find('prereg_challenge'),
            provider: server.create('registration-provider'),
        }, 'withContributors', 'withFiles', 'currentUserAdmin'));
    });

    test('it renders', async function(this: OverviewTestContext, assert: Assert) {
        await visit(`/${this.registration.id}/`);
        await percySnapshot(assert);

        assert.equal(currentURL(), `/${this.registration.id}/`, 'At the guid URL');
        assert.equal(currentRouteName(), 'registries.overview.index', 'At the expected route');
    });

    test('sidenav links', async function(this: OverviewTestContext, assert: Assert) {
        const analyticsEngine = await loadEngine('analytics-page', 'guid-registration.analytics');

        analyticsEngine.register('service:keen', KeenStub);
        this.registration.reviewsState = RegistrationReviewStates.Accepted;
        const testCases = [{
            name: 'Comments',
            route: 'registries.overview.comments',
            url: `/--registries/${this.registration.id}/comments`,
        }, {
            name: 'Analytics',
            route: 'guid-registration.analytics.index',
            url: `/--registration/${this.registration.id}/analytics`,
        }, {
            name: 'Components',
            route: 'registries.overview.children',
            url: `/--registries/${this.registration.id}/components`,
        }, {
            name: 'Links',
            route: 'registries.overview.links',
            url: `/--registries/${this.registration.id}/links`,
        }, {
            name: 'Files',
            route: 'registries.overview.files.provider',
            url: `/--registries/${this.registration.id}/files/osfstorage`,
        }, {
            name: 'Resources',
            route: 'registries.overview.resources',
            url: `/--registries/${this.registration.id}/resources`,
        }];

        for (const testCase of testCases) {
            await visit(`/${this.registration.id}/`);

            await click(`[data-analytics-name="${testCase.name}"]`);
            await percySnapshot(`Registries sidenav - ${testCase.name}`);

            assert.equal(currentRouteName(), testCase.route, 'At the correct route');
        }
    });

    test('sidenav hrefs', async function(this: OverviewTestContext, assert: Assert) {
        const testCases = [{
            selector: '[data-test-wiki-link]',
            href: `/${this.registration.id}/wiki/`,
        }];

        for (const testCase of testCases) {
            await visit(`/${this.registration.id}/`);

            assert.dom(testCase.selector).hasAttribute('href', testCase.href, 'Non-ember routes have the correct href');
        }
    });

    test('wiki link hidden if wiki not enabled', async function(this: OverviewTestContext, assert: Assert){
        this.set('registration', server.create('registration', {
            archiving: false,
            withdrawn: false,
            wikiEnabled: false,
            registrationSchema: server.schema.registrationSchemas.find('prereg_challenge'),
            provider: server.create('registration-provider'),
        }, 'withContributors', 'currentUserAdmin'));

        await visit(`/${this.registration.id}`);

        assert.dom('[data-test-wiki-link]').doesNotExist('Wiki link hidden because wiki disabled');
    });

    test('resource link hidden if not approved', async function(this: OverviewTestContext, assert: Assert){
        this.registration.reviewsState = RegistrationReviewStates.Initial;
        await visit(`/${this.registration.id}`);
        assert.dom('[data-analytics-name="Resources"]').doesNotExist('Resource link hidden for initial state');

        this.registration.reviewsState = RegistrationReviewStates.Pending;
        await visit(`/${this.registration.id}`);
        assert.dom('[data-analytics-name="Resources"]').doesNotExist('Resource link hidden for pending state');
    });

    test('withdrawn tombstone', async function(this: OverviewTestContext, assert: Assert) {
        this.set('registration', server.create('registration', {
            registrationSchema: server.schema.registrationSchemas.find('prereg_challenge'),
        }, 'withContributors', 'currentUserAdmin', 'isWithdrawn'));
        const url = `/${this.registration.id}`;
        await visit(url);
        await percySnapshot(assert);

        assert.equal(currentURL(), url, 'At the correct URL');
        assert.dom('[data-test-registration-title]').hasText(this.registration.title, 'Correct title');
        assert.dom('[data-test-tombstone-title]').hasText(
            'This registration has been withdrawn for the reason(s) stated below.',
            'Correct tombstone title',
        );
    });

    test('archiving tombstone', async function(this: OverviewTestContext, assert: Assert) {
        this.set('registration', server.create('registration', {
            registrationSchema: server.schema.registrationSchemas.find('prereg_challenge'),
        }, 'withContributors', 'currentUserAdmin', 'isArchiving'));
        const url = `/${this.registration.id}`;
        await visit(url);
        await percySnapshot(assert);

        assert.equal(currentURL(), url, 'At the correct URL');
        assert.dom('[data-test-registration-title]').hasText(this.registration.title, 'Correct title');
        assert.dom('[data-test-tombstone-title]').hasText(
            'This registration is currently archiving, and no changes can be made at this time.',
            'Correct tombstone title',
        );
    });

    test('editable title', async function(this: OverviewTestContext, assert: Assert) {
        this.set('registration', server.create('registration', {
            title: 'Some flashy title',
            registrationSchema: server.schema.registrationSchemas.find('prereg_challenge'),
        }, 'withContributors', 'currentUserAdmin'));
        await visit(`/${this.registration.id}`);

        assert.dom('[data-test-registration-title]').hasText('Some flashy title', 'Correct title shown');
        assert.dom('[data-test-edit-registration-title]').exists('Editable title button shown');
        await click('[data-test-edit-registration-title]');
        await fillIn('[data-test-registration-title-input]', '');
        assert.dom('[data-test-save-edits]').isDisabled('Save button disabled when title is empty');
        await fillIn('[data-test-registration-title-input]', 'New even flashier title');

        await click('[data-test-save-edits]');
        assert.dom('[data-test-registration-title]').hasText('New even flashier title', 'Correct title saved');

        this.registration.currentUserPermissions = [Permission.Read, Permission.Write];
        await visit(`/${this.registration.id}`);
        assert.dom('[data-test-edit-registration-title]')
            .doesNotExist('Editable title button not shown for non-admins');
    });
});
