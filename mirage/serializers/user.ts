import { ModelInstance } from 'ember-cli-mirage';
import config from 'ember-osf-web/config/environment';

import { MirageUser } from 'ember-osf-web/mirage/factories/user';

import { randomGravatar } from '../utils';

import ApplicationSerializer, { SerializedRelationships } from './application';

const { OSF: { apiUrl } } = config;

export default class UserSerializer extends ApplicationSerializer<MirageUser> {
    buildNormalLinks(model: ModelInstance<MirageUser>) {
        return {
            ...super.buildNormalLinks(model),
            profile_image: randomGravatar(),
            html: `/${model.id}/`,
        };
    }

    buildRelationships(model: ModelInstance<MirageUser>) {
        const serializedRelationships: SerializedRelationships<MirageUser> = {
            emails: {
                links: {
                    related: {
                        href: `${apiUrl}/v2/users/${model.id}/settings/emails/`,
                    },
                },
            },
            settings: {
                links: {
                    related: {
                        href: `${apiUrl}/v2/users/${model.id}/settings/`,
                    },
                },
            },
            institutions: {
                links: {
                    related: {
                        href: `${apiUrl}/v2/users/${model.id}/institutions/`,
                        meta: this.buildRelatedLinkMeta(model, 'institutions'),
                    },
                },
            },
            nodes: {
                links: {
                    related: {
                        href: `${apiUrl}/v2/users/${model.id}/nodes/`,
                        meta: this.buildRelatedLinkMeta(model, 'nodes'),
                    },
                },
            },
            registrations: {
                links: {
                    related: {
                        href: `${apiUrl}/v2/users/${model.id}/registrations/`,
                        meta: this.buildRelatedLinkMeta(model, 'registrations'),
                    },
                },
            },
            draftRegistrations: {
                links: {
                    related: {
                        href: `${apiUrl}/v2/users/${model.id}/draft_registrations/`,
                        meta: this.buildRelatedLinkMeta(model, 'draftRegistrations'),
                    },
                },
            },
            preprints: {
                links: {
                    related: {
                        href: `${apiUrl}/v2/users/${model.id}/preprints/`,
                        meta: this.buildRelatedLinkMeta(model, 'preprints'),
                    },
                },
            },
        };
        if (model.defaultRegion) {
            serializedRelationships.defaultRegion = {
                data: {
                    type: 'regions',
                    id: `${model.defaultRegion.id}`,
                },
                links: {
                    related: {
                        href: `${apiUrl}/v2/regions/${model.defaultRegion.id}/`,
                        meta: {},
                    },
                },
            };
        }
        return serializedRelationships;
    }
}
