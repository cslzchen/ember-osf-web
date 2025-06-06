/* eslint-env node */

// HACK: This violates the intended isolation of engines
const projectConfigFactory = require('../../../config/environment');

module.exports = function(environment) {
    const projectConfig = projectConfigFactory(environment);

    const ENV = {
        // Ember settings
        environment,
        EmberENV: {
            FEATURES: {
                // Here you can enable experimental features on an ember canary build
                // e.g. 'with-controller': true
            },
            EXTEND_PROTOTYPES: {
                // Prevent Ember Data from overriding Date.parse.
                Date: false,
            },
        },
        APP: {
            // Here you can pass flags/options to your application instance
            // when it is created
        },
        hostAppName: 'registries',
        modulePrefix: 'registries',

        // Addon settings
        'ember-cli-mirage': projectConfig['ember-cli-mirage'],

        // Engine specific settings
        shareBaseUrl: projectConfig.OSF.shareBaseUrl,
        shareSearchUrl: projectConfig.OSF.shareSearchUrl,
        indexPageRegistrationIds: ['6tsnj', 'aurjt', 'e94t8', '2tpy9', '2ds52'],
        externalRegistries: [{
            https: true,
            name: 'ClinicalTrials.gov',
            urlRegex: '^https?://.*clinicaltrials\\.gov.*$',
        }, {
            https: true,
            name: 'Research Registry',
            urlRegex: '^https?://.*researchregistry\\.com.*$',
        }],
        externalLinks: {
            help: 'https://help.osf.io',
            donate: 'https://cos.io/donate',
        },
        defaultProviderId: 'osf',
    };

    if (environment === 'test') {
        // Testem prefers this...
        ENV.locationType = 'none';

        // Test environment needs to find assets in the "regular" location.
        ENV.assetsPrefix = '/';

        // Always enable mirage for tests.
        ENV['ember-cli-mirage'].enabled = true;

        // keep test console output quieter
        ENV.APP.LOG_ACTIVE_GENERATION = false;
        ENV.APP.LOG_VIEW_LOOKUPS = false;

        ENV.APP.rootElement = '#ember-testing';
        ENV.APP.autoboot = false;
    }

    return ENV;
};
