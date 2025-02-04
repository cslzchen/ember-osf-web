import { ModelInstance } from 'ember-cli-mirage';

import { addonServiceAPIUrl } from 'ember-osf-web/adapters/addon-service';
import UserReferenceModel from 'ember-osf-web/models/user-reference';

import AddonServiceSerializer from './addon-service';

export default class UserReferenceSerializer extends AddonServiceSerializer<UserReferenceModel> {
    buildRelationships(model: ModelInstance<UserReferenceModel>) {
        return {
            authorizedStorageAccounts: {
                links: {
                    related: {
                        href: `${addonServiceAPIUrl}user-references/${model.id}/authorized_storage_accounts/`,
                    },
                },
            },
            authorizedCitationAccounts: {
                links: {
                    related: {
                        href: `${addonServiceAPIUrl}user-references/${model.id}/authorized_citation_accounts/`,
                    },
                },
            },
            authorizedComputingAccounts: {
                links: {
                    related: {
                        href: `${addonServiceAPIUrl}user-references/${model.id}/authorized_computing_accounts/`,
                    },
                },
            },
            configuredResources: {
                links: {
                    related: {
                        href: `${addonServiceAPIUrl}user-references/${model.id}/configured_resources/`,
                    },
                },
            },
        };
    }
}
