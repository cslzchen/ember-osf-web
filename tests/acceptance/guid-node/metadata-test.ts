import { currentRouteName, resetOnerror, setupOnerror } from '@ember/test-helpers';
import { setupMirage } from 'ember-cli-mirage/test-support';
import { percySnapshot } from 'ember-percy';
import { selectChoose } from 'ember-power-select/test-support';
import { module, skip, test } from 'qunit';

import { click, currentURL, setupOSFApplicationTest, visit } from 'ember-osf-web/tests/helpers';
import { TestContext } from 'ember-test-helpers';
import { Permission } from 'ember-osf-web/models/osf-model';
import { click as untrackedClick, fillIn } from '@ember/test-helpers';

import { languageFromLanguageCode } from 'osf-components/components/file-metadata-manager/component';

module('Acceptance | guid-node/metadata', hooks => {
    setupOSFApplicationTest(hooks);
    setupMirage(hooks);

    test('logged out', async function(this: TestContext, assert) {
        const node = server.create('node', {
            id: 'mtadt',
            currentUserPermissions: [],
        });
        const url = `/${node.id}/metadata`;

        await visit(url);
        const metadataRecord = await this.owner.lookup('service:store')
            .findRecord('custom-item-metadata-record', node.id);
        assert.equal(currentURL(), url, `We are on ${url}`);
        assert.equal(currentRouteName(), 'guid-node.metadata.detail',
            'We are at guid-node.metadata.detail');
        assert.dom('[data-test-display-resource-language]')
            .containsText(languageFromLanguageCode(metadataRecord.language), 'Language is correct');
        assert.dom('[data-test-display-resource-type-general]')
            .containsText(metadataRecord.resourceTypeGeneral, 'Resource type is correct');
        assert.dom('[data-test-display-node-description]')
            .containsText(node.description, 'Description is correct');
        for (const funder of metadataRecord.funders) {
            assert.dom(`[data-test-display-funder-name="${funder.funder_name}"]`)
                .containsText(funder.funder_name, `Funder name is correct for ${funder.funder_name}`);
            assert.dom(`[data-test-display-funder-award-title="${funder.funder_name}"]`)
                .containsText(funder.award_title, `Funder award title is correct for ${funder.funder_name}`);
            assert.dom(`[data-test-display-funder-award-uri="${funder.funder_name}"]`)
                .containsText(funder.award_uri,  `Funder award URI is correct for ${funder.funder_name}`);
            assert.dom(`[data-test-display-funder-award-number="${funder.funder_name}"`)
                .containsText(funder.award_number,  `Funder award number is correct for ${funder.funder_name}`);
        }
        assert.dom('[data-test-contributors-list]').exists();
        assert.dom('[data-test-subjects-list]').exists('Subjects list is displayed for projects');

        assert.dom('[data-test-edit-node-description-button]').doesNotExist();
        assert.dom('[data-test-edit-resource-metadata-button]').doesNotExist();
        assert.dom('[data-test-edit-funding-metadata-button]').doesNotExist();
        assert.dom('[data-test-edit-node-contributors-button]').doesNotExist();
    });

    test('AVOL', async function(this: TestContext, assert) {
        const node = server.create('node', {
            id: 'mtadt',
            currentUserPermissions: [],
            apiMeta: {
                anonymous: true,
                version: '2.20',
            },
        });
        const url = `/${node.id}/metadata`;

        await visit(url);
        const metadataRecord = await this.owner.lookup('service:store')
            .findRecord('custom-item-metadata-record', node.id);
        assert.equal(currentURL(), url, `We are on ${url}`);
        assert.equal(currentRouteName(), 'guid-node.metadata.detail', 'We are at guid-node.metadata.detail');
        assert.dom('[data-test-display-resource-language]')
            .containsText(languageFromLanguageCode(metadataRecord.language), 'Language is correct');
        assert.dom('[data-test-display-resource-type-general]')
            .containsText(metadataRecord.resourceTypeGeneral, 'Resource type is correct');
        assert.dom('[data-test-display-node-description]')
            .containsText(node.description, 'Description is correct');
        for (const funder of metadataRecord.funders) {
            assert.dom(`[data-test-display-funder-name="${funder.funder_name}"]`)
                .doesNotExist(`Funder name does not exist for ${funder.funder_name}`);
            assert.dom(`[data-test-display-funder-award-title="${funder.funder_name}"]`)
                .doesNotExist(`Funder award title does not exist for ${funder.funder_name}`);
            assert.dom(`[data-test-display-funder-award-uri="${funder.funder_name}"]`)
                .doesNotExist(`Funder award URI does not exist for ${funder.funder_name}`);
            assert.dom(`[data-test-display-funder-award-number="${funder.funder_name}"`)
                .doesNotExist(`Funder award number does not exist for ${funder.funder_name}`);
        }
        assert.dom('[data-test-contributors-list]').doesNotExist('There are no contributors for AVOL');
        assert.dom('[data-test-subjects-list]').exists('Subjects list is displayed for projects');

        assert.dom('[data-test-edit-node-description-button]').doesNotExist();
        assert.dom('[data-test-edit-resource-metadata-button]').doesNotExist();
        assert.dom('[data-test-edit-funding-metadata-button]').doesNotExist();
        assert.dom('[data-test-edit-node-contributors-button]').doesNotExist();
    });

    test('Editable', async function(this: TestContext, assert) {
        const user = server.create('user', {
            institutions: server.createList('institution', 2),
        }, 'loggedIn');
        const node = server.create('node', {
            id: 'mtadt',
            currentUserPermissions: [Permission.Read, Permission.Write],
        });
        const url = `/${node.id}/metadata`;

        await visit(url);
        const metadataRecord = await this.owner.lookup('service:store')
            .findRecord('custom-item-metadata-record', node.id);
        assert.equal(currentURL(), url, `We are on ${url}`);
        assert.equal(currentRouteName(), 'guid-node.metadata.detail', 'We are at guid-node.metadata.detail');
        assert.dom('[data-test-display-resource-language]')
            .containsText(languageFromLanguageCode(metadataRecord.language), 'Language is correct');
        assert.dom('[data-test-display-resource-type-general]')
            .containsText(metadataRecord.resourceTypeGeneral, 'Resource type is correct');
        assert.dom('[data-test-display-node-description]')
            .containsText(node.description, 'Description is correct');
        for (const funder of metadataRecord.funders) {
            assert.dom(`[data-test-display-funder-name="${funder.funder_name}"]`)
                .containsText(funder.funder_name, `Funder name is correct for ${funder.funder_name}`);
            assert.dom(`[data-test-display-funder-award-title="${funder.funder_name}"]`)
                .containsText(funder.award_title, `Funder award title is correct for ${funder.funder_name}`);
            assert.dom(`[data-test-display-funder-award-uri="${funder.funder_name}"]`)
                .containsText(funder.award_uri,  `Funder award URI is correct for ${funder.funder_name}`);
            assert.dom(`[data-test-display-funder-award-number="${funder.funder_name}"`)
                .containsText(funder.award_number,  `Funder award number is correct for ${funder.funder_name}`);
        }
        assert.dom('[data-test-contributors-list]').exists();
        assert.dom('[data-test-subjects-list]').exists('Subjects list is displayed for projects');

        assert.dom('[data-test-edit-node-title-button]').exists();
        await click('[data-test-edit-node-title-button]');
        await fillIn('[data-test-title-field] textarea', 'New title');
        await click('[data-test-cancel-editing-node-title-button]');
        assert.dom('[data-test-display-node-title]')
            .doesNotContainText('New title', 'Title is not incorrect after cancelling edit');
        await click('[data-test-edit-node-title-button]');
        await fillIn('[data-test-title-field] textarea', 'New title');
        await click('[data-test-save-node-title-button]');
        assert.dom('[data-test-display-node-title]')
            .containsText('New title', 'Title is changed');

        assert.dom('[data-test-edit-node-description-button]').exists();
        await click('[data-test-edit-node-description-button]');
        await fillIn('[data-test-description-field] textarea', 'New description');
        await click('[data-test-cancel-editing-node-description-button]');
        assert.dom('[data-test-display-node-description]')
            .doesNotContainText('New description', 'Description is not incorrect after cancelling edit');
        await click('[data-test-edit-node-description-button]');
        await fillIn('[data-test-description-field] textarea', 'New description');
        await click('[data-test-save-node-description-button]');
        assert.dom('[data-test-display-node-description]')
            .containsText('New description', 'Description is changed');

        assert.dom('[data-test-edit-resource-metadata-button]').exists();
        const metadataLanguageOriginal = metadataRecord.language;
        const metadataResourceTypeOriginal = metadataRecord.resourceTypeGeneral;
        await click('[data-test-edit-resource-metadata-button]');
        await selectChoose('[data-test-select-resource-type]', 'InteractiveResource');
        await selectChoose('[data-test-select-resource-language]', 'Esperanto');
        await click('[data-test-cancel-editing-resource-metadata-button]');
        assert.dom('[data-test-display-resource-language]')
            .containsText(languageFromLanguageCode(metadataLanguageOriginal), 'Language is unchanged');
        assert.dom('[data-test-display-resource-type-general]')
            .containsText(metadataResourceTypeOriginal, 'Resource type is unchanged');
        await click('[data-test-edit-resource-metadata-button]');
        await selectChoose('[data-test-select-resource-type]', 'InteractiveResource');
        await selectChoose('[data-test-select-resource-language]', 'Esperanto');
        await click('[data-test-save-resource-metadata-button]');
        assert.dom('[data-test-display-resource-language]')
            .containsText('Esperanto', 'Language is changed');
        assert.dom('[data-test-display-resource-type-general]')
            .containsText('InteractiveResource', 'Resource type is changed');

        assert.dom('[data-test-edit-institutions-button]').exists('Write user can edit institutions');
        assert.dom('[data-test-institution-list-institution]').doesNotExist('No affiliated institutions yet');
        await click('[data-test-edit-institutions-button]');
        user.institutionIds.forEach(institutionId => assert
            .dom(`[data-test-institution="${institutionId}"]`)
            .exists('user institution list is correct'));
        const firstInstitution = user.institutionIds[0];
        await untrackedClick(`[data-test-institution="${firstInstitution}"`);
        await click('[data-test-cancel-editing-node-institutions-button]');
        assert.dom('[data-test-institution-list-institution]').doesNotExist('No affiliated institutions after cancel');
        await click('[data-test-edit-institutions-button]');
        await untrackedClick(`[data-test-institution="${firstInstitution}"`);
        await click('[data-test-save-node-institutions-button]');
        assert.dom(`[data-test-institution-list-institution="${firstInstitution}"]`).exists('Institution saved');

        assert.dom('[data-test-edit-funding-metadata-button]').exists();
        await click('[data-test-edit-funding-metadata-button]');
        // TODO: Make some changes here with the new funding widget when it's in
        await click('[data-test-cancel-editing-funding-metadata-button]');
        const originalFunders = metadataRecord.funders;
        for (const funder of originalFunders) {
            assert.dom(`[data-test-display-funder-name="${funder.funder_name}"]`)
                .containsText(funder.funder_name, `Funder name is unchanged for ${funder.funder_name}`);
            assert.dom(`[data-test-display-funder-award-title="${funder.funder_name}"]`)
                .containsText(funder.award_title, `Funder award title is unchanged for ${funder.funder_name}`);
            assert.dom(`[data-test-display-funder-award-uri="${funder.funder_name}"]`)
                .containsText(funder.award_uri,  `Funder award URI is unchanged for ${funder.funder_name}`);
            assert.dom(`[data-test-display-funder-award-number="${funder.funder_name}"`)
                .containsText(funder.award_number,  `Funder award number is unchanged for ${funder.funder_name}`);
        }
        // TODO: Test the edit-save flow with the new funding widget when it's in

        assert.dom('[data-test-edit-node-contributors-button]').exists();
        await click('[data-test-edit-node-contributors-button]');
        assert.dom('[data-test-edit-node-contributors-button]').doesNotExist('Edit button is hidden when in edit mode');
        assert.dom('[data-test-heading-name]').exists('Contributor name field exists');
        assert.dom('[data-test-user-search-input]').exists('User search input exists');
        await click('[data-test-finish-node-contributor-editing-button]');
        assert.dom('[data-test-edit-node-contributors-button]').exists('Edit button is shown after saving');
        await percySnapshot(assert);
    });

    skip('Error handling: metadata', async function(this: TestContext, assert) {
        setupOnerror((e: any) => assert.ok(e, 'Error is handled'));
        const node = server.create('node', {
            id: 'mtadt',
            currentUserPermissions: [Permission.Read, Permission.Write],
        });
        const url = `/${node.id}/metadata`;
        server.namespace = '/v2';
        server.patch('/custom_item_metadata_records/:id', () => ({
            errors: [{ detail: 'Could not patch metadata', source: { pointer: 'points to nowhere' } }],
        }), 400);
        await visit(url);

        await click('[data-test-edit-resource-metadata-button]');
        await selectChoose('[data-test-select-resource-type]', 'InteractiveResource');
        await selectChoose('[data-test-select-resource-language]', 'Esperanto');
        await click('[data-test-save-resource-metadata-button]');
        assert.dom('#toast-container', document as any).hasTextContaining('Could not patch metadata',
            'Toast error shown after failing to update metadata');
        await click('[data-test-cancel-editing-resource-metadata-button]');

        resetOnerror();
    });

    test('Error handling: node', async function(this: TestContext, assert) {
        setupOnerror((e: any) => assert.ok(e, 'Error is handled'));
        const node = server.create('node', {
            id: 'mtadt',
            currentUserPermissions: [Permission.Read, Permission.Write],
        });
        const url = `/${node.id}/metadata`;
        server.namespace = '/v2';
        server.patch('/nodes/:id', () => ({
            errors: [{ detail: 'Could not patch node' }],
        }), 400);
        await visit(url);

        assert.dom('[data-test-display-node-description]')
            .containsText(node.description, 'Description is correct');
        await click('[data-test-edit-node-description-button]');
        await fillIn('[data-test-description-field] textarea', 'New description');
        await click('[data-test-save-node-description-button]');
        assert.dom('#toast-container', document as any).hasTextContaining('Could not patch node',
            'Toast error shown after failing to update node');
        await click('[data-test-cancel-editing-node-description-button]');

        resetOnerror();
    });

    test('Error handling: institutions', async function(this: TestContext, assert) {
        setupOnerror((e: any) => assert.ok(e, 'Error is handled'));
        const user = server.create('user', {
            institutions: server.createList('institution', 2),
        }, 'loggedIn');
        const node = server.create('node', {
            id: 'mtadt',
            currentUserPermissions: [Permission.Read, Permission.Write],
        });
        const url = `/${node.id}/metadata`;
        server.namespace = '/v2';
        server.put('/nodes/:id/relationships/institutions/', () => ({
            errors: [{ detail: 'Could not patch institutions' }],
        }), 400);
        await visit(url);

        assert.dom('[data-test-edit-institutions-button]').exists('Write user can edit institutions');
        assert.dom('[data-test-institution-list-institution]').doesNotExist('No affiliated institutions yet');
        await click('[data-test-edit-institutions-button]');
        user.institutionIds.forEach(institutionId => assert
            .dom(`[data-test-institution="${institutionId}"]`)
            .exists('user institution list is correct'));
        const firstInstitution = user.institutionIds[0];
        await click('[data-test-save-node-institutions-button]');
        assert.dom(`[data-test-institution-list-institution="${firstInstitution}"]`)
            .doesNotExist('Institution failed to save');
        assert.dom('#toast-container', document as any).hasTextContaining('Could not patch institutions',
            'Toast error shown after failing to update node');

        await click('[data-test-cancel-editing-node-institutions-button]');
        assert.dom('[data-test-institution-list-institution]').doesNotExist('No affiliated institutions after cancel');
        resetOnerror();
    });
});
