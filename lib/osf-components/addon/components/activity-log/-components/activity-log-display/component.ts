import Component from '@glimmer/component';
import LogModel from 'ember-osf-web/models/log';
import { inject as service } from '@ember/service';
import Intl from 'ember-intl/services/intl';
import { tracked } from '@glimmer/tracking';
import { taskFor } from 'ember-concurrency-ts';
import { task } from 'ember-concurrency';
import { waitFor } from '@ember/test-waiters';
import UserModel from 'ember-osf-web/models/user';
import NodeModel from 'ember-osf-web/models/node';
import RegistrationModel from 'ember-osf-web/models/registration';


/**
 * The Activity Log Display Args
 */
interface ActivityLogDisplayArgs {
    log: LogModel;
}


export default class ActivityLogDisplayComponent extends Component<ActivityLogDisplayArgs> {
    @service intl!: Intl;
    @tracked activityDisplay = '';
    @tracked log!: LogModel;
    user!: UserModel;
    linkedNode!: NodeModel;
    linkedRegistration!: RegistrationModel;
    node!: NodeModel;
    originalNode!: NodeModel;
    templateNode!: NodeModel;

    /**
     * constructor
     *
     * @param owner The owner
     * @param args The injected args
     */
    constructor(owner: unknown, args: ActivityLogDisplayArgs) {
        super(owner, args);
        this.log = args.log;
        taskFor(this.loadModels).perform();
    }

    /**
     * buildAHrefElement
     *
     * @description Abstracted method to build an "a" element
     *
     * @param url The url for the href
     * @param value The text to appear as clickable
     * @returns An ahref formatted string
     */
    private buildAHrefElement(url: string | undefined, value: string): string {
        url = url || '';
        return `<a href="${this.toRelativeUrl(url)}">${value}</a>`;
    }

    /**
     * Utility function to convert absolute URLs to relative urls
     * See:
     *      http://stackoverflow.com/questions/736513/how-do-i-parse-a-url-into-hostname-and-path-in-javascript
     * This method have no effect on external urls.
     * @param url {string} url to be converted
     * @returns {string} converted relative url
     */
    private toRelativeUrl(url: string): string {
        const parser = document.createElement('a');
        parser.href = url;
        let relative_url = url;
        if (window.location.hostname === parser.hostname){
            relative_url = parser.pathname + parser.search + parser.hash;
        }
        return relative_url;
    }

    /**
     * loadModels
     *
     * @description Hydrates all the models before displaying the component
     *
     * @returns a void promise
     */
    @task
    @waitFor
    public async loadModels(): Promise<void> {
        this.linkedNode = await this.log.linkedNode;
        this.linkedRegistration = await this.log.linkedRegistration;
        this.originalNode = await this.log.originalNode;
        this.node = await this.log.node;
        this.templateNode = await this.log.templateNode;
        this.user = await this.log.user;
    }

    /**
     * activity
     *
     * @description The html to display for the log
     *
     * @returns A formatted translated string for display
     */
    get activity(): string {
        const translation = this.intl.t(`activity-log.activities.${this.log?.action}`, {
            addon: this.log?.params?.addon,
            anonymous_link: this.buildAnonymous(),
            comment_location: this.buildCommentLocation(),
            contributors: this.buildContributorsList(),
            destination: this.buildDestination(),
            forked_from: this.buildNodeUrl(),
            identifiers: this.buildIdentifiers(),
            institution: this.buildInstitutionUrl(),
            kind: this.log?.params?.kind,
            license: this.log?.params?.license,
            node: this.buildNodeUrl(),
            old_page: this.buildOldPage(),
            page: this.buildPage(),
            path: this.buildPath(),
            path_type: this.buildPathType(),
            pointer: this.getEmbeddedUrl(),
            pointer_category: this.getPointerCategory(),
            preprint: this.buildPreprintUrl(),
            preprint_provider: this.buildPreprintProviderUrl(),
            preprint_word: this.intl.t('activity-log.defaults.preprint'),
            preprint_word_plural: this.intl.t('activity-log.defaults.preprint-plural'),
            source: this.buildSource(),
            tag: this.buildTagUrl(),
            template: this.getEmbeddedUrl(),
            title_new: this.buildTitleNew(),
            title_original: this.buildTitleOriginal(),
            updated_fields: this.buildUpdatedFields(),
            user: this.buildUserUrl(),
            value: this.log?.params?.value,
            version: this.buildVersion(),
            /*
            group: null,
            */

        }) as string;

        return `<span>${translation}</span>`;

    }

    /**
     * buildAnonymous
     *
     * @description Abstracted method to build the anonymous string
     *
     * @returns a formatted string
     */
    private buildAnonymous(): string {
        return this.log?.params?.anonymousLink ?
            this.intl.t('activity-log.defaults.anonymous_an') :
            this.intl.t('activity-log.defaults.anonymous_a') ;
    }

    /**
     * buildCommentLocation
     *
     * @description Abstracted method to build the comment location
     *
     * @returns a formatted string
     */
    private buildCommentLocation(): string {
        const file = this.log?.params?.file;
        const wiki = this.log?.params?.wiki;
        if (file) {
            return this.intl.t('activity-log.defaults.file_on', {
                file: this.buildAHrefElement(`/${file.url}`, file.name),
            });
        }

        if (wiki) {
            return this.intl.t('activity-log.defaults.wiki_on', {
                wiki: this.buildAHrefElement(`/${wiki.url}`, wiki.name),
            });

        }

        return '';
    }


    /**
     * buildContributorlist
     *
     * @description Abstracted method to build the contributor list
     *
     * @returns a formatted string
     */
    private buildContributorsList(): string {
        if (this.log?.params?.contributors) {
            const contributors = this.log.params.contributors;
            const maxShown = 3;
            const contribList: string[] = [];

            // Determine if we are showing the second-to-last contributor (just one more)
            const isJustOneMore = contributors.length === maxShown + 1;

            // Loop through each contributor
            for (let i = 0; i < contributors.length; i++) {
                const contributor = contributors[i];
                let separator = '';

                // Handle the separator logic for commas or "and"
                if (i < contributors.length - 1) {
                    separator = (i === maxShown - 1 && !isJustOneMore) ?
                        this.intl.t('activity-log.defaults.contributors_and') :
                        ', ';
                }

                // If we have reached the maximum number of contributors to show, add 'others'
                if (i === maxShown && !isJustOneMore) {
                    let outputString = `${contributors.length - i}`;
                    outputString += this.intl.t('activity-log.defaults.contributors_others');
                    contribList.push(outputString);
                    break; // Exit early after adding 'others'
                }

                // Add active contributors with their link, inactive ones with their name
                const displayName = contributor.active
                    ? `<a href="/${contributor.id}/">${contributor.fullName}</a>`
                    : contributor.unregisteredName || contributor.fullName;

                contribList.push(`${displayName}${separator}`);
            }

            return contribList.join(' ');

        }
        return this.intl.t('activity-log.defaults.some_users');
    }


    /**
     * buildDestination
     *
     * @description Abstracted method to build the destination
     *
     * @returns a formatted string
     */
    private buildDestination(): string {
        if (this.log?.params?.destination) {
            const destination = this.log.params.destination;
            let materialized = destination.materialized;

            if (materialized.endsWith('/')) {
                materialized = this.replaceSlash(destination.materialized);
                return this.intl.t('activity-log.defaults.materialized', {
                    materialized,
                    addon: destination.addon,
                });
            } else {
                return this.intl.t('activity-log.defaults.materialized', {
                    materialized: this.buildAHrefElement(destination.url, materialized),
                    addon: destination.addon,
                });
            }

        }
        return this.intl.t('activity-log.defaults.a_new_name_location');
    }

    /**
     * getEmbeddedUrl
     *
     * @description The pointer can exist on a linkedNode or registrationNode
     *
     * @returns the href if it exists
     */
    private getEmbeddedUrl(): string {
        if (this.linkedNode?.links?.html) {
            return this.buildAHrefElement(this.linkedNode.links.html.toString(), this.linkedNode.title);
        } else if (this.linkedRegistration?.links?.html) {
            return this.buildAHrefElement(this.linkedRegistration.links.html.toString(),
                this.linkedRegistration.title);
        } else if (this.templateNode?.links?.html) {
            return this.buildAHrefElement(this.templateNode.links.html.toString(),
                this.templateNode.title);
        } else {
            return this.intl.t('activity-log.defaults.a_title');
        }
    }


    /**
     * buildIdentifiersUrl
     *
     * @description Abstracted method to build the identifiers ahref
     *
     * @returns a formatted string
     */
    private buildIdentifiers(): string {
        if (this.log?.params?.identifiers) {
            const doi = this.log.params.identifiers.doi;
            const ark = this.log.params.identifiers.ark;
            if (doi && ark) {
                return `doi:${doi} and ark:${ark}`;
            } else if (doi) {
                return `doi:${doi}`;
            } else if (ark) {
                return `ark:${ark}`;
            }
        }
        return '';
    }

    /**
     * buildInstitutionUrl
     *
     * @description Abstracted method to build the institution ahref
     *
     * @returns a formatted string
     */
    private buildInstitutionUrl(): string {
        if (this.log?.params?.institution) {
            return this.buildAHrefElement(
                `/institutions/${this.log.params.institution.id}`, this.log.params.institution.name,
            );
        }
        return '';
    }

    /**
     * buildNodeUrl
     *
     * @description Abstracted method to build the node ahref
     *
     * @returns a formatted string
     */
    private buildNodeUrl(): string {
        if (this.log?.params?.paramsNode) {
            return this.buildAHrefElement(`/${this.log.params.paramsNode.id}`, this.log.params.paramsNode.title);
        }
        return '';
    }

    /**
     * buildOldPage
     *
     * @description Abstracted method to build the old page string
     *
     * @returns a formatted string
     */
    private buildOldPage(): string {
        return this.log?.params?.oldPage ?
            this.log.params.oldPage :
            this.intl.t('activity-log.defaults.pageTitle');
    }

    /**
     * buildPage
     *
     * @description Abstracted method to build the page string
     *
     * @returns a formatted string
     */
    private buildPage(): string {
        if (this.log?.params?.page) {
            const acceptableLinkedItems = ['wiki_updated', 'wiki_renamed'];
            if (acceptableLinkedItems.indexOf(this.log.action) !== -1) {
                return this.buildAHrefElement(`/${this.log.params.pageId}`, this.log.params.page);
            }
            return this.log.params.page;
        }

        return this.intl.t('activity-log.defaults.pageTitle');
    }

    /**
     * buildPath
     *
     * @description Abstracted method to build the path string
     *
     * @returns a formatted string
     */
    private buildPath(): string {
        if (this.log?.params?.path) {
            const path = this.replaceSlash(this.log.params.path);

            const action = this.log.action;
            const acceptableLinkedItems = ['osf_storage_file_added', 'osf_storage_file_updated',
                'file_tag_added', 'file_tag_removed', 'github_file_added', 'github_file_updated',
                'box_file_added', 'box_file_updated', 'dropbox_file_added', 'dropbox_file_updated',
                's3_file_added', 's3_file_updated', 'figshare_file_added', 'checked_in',
                'checked_out', 'file_metadata_updated'];

            if (acceptableLinkedItems.indexOf(action) !== -1 && this.log.params.urls) {
                return this.buildAHrefElement(this.log.params.urls.view, path);
            } else {
                return path;
            }

        }

        return this.intl.t('activity-log.defaults.a_file') ;
    }

    /**
     * buildPathType
     *
     * @description Abstracted method to build the path type string
     *
     * @returns a formatted string
     */

    private buildPathType(): string {
        if (this.log?.params?.path) {
            return this.log.params.path[0] === '/' ?  this.intl.t('activity-log.defaults.folder') :
                this.intl.t('activity-log.defaults.file') ;
        } else {
            return '';
        }
    }

    /**
     * getPointerCategory
     *
     * @description The pointer can exist on a linkedNode or registrationNode
     *
     * @returns the category if it exists
     */
    private getPointerCategory(): string {
        if (this.linkedNode) {
            return this.linkedNode.category;
        } else if (this.linkedRegistration) {
            return this.linkedRegistration.category;
        } else {
            return '';
        }
    }

    /**
     * buildPreprintUrl
     *
     * @description Abstracted method to build the preprint ahref
     *
     * @returns a formatted string
     */
    private buildPreprintUrl(): string {
        if (this.log?.params?.preprint) {
            return this.buildAHrefElement(`/${this.log.params.preprint}`,
                this.intl.t('activity-log.defaults.preprint'));
        }
        return '';
    }

    /**
     * buildPreprintProviderUrl
     *
     * @description Abstracted method to build the preprint provider ahref
     *
     * @returns a formatted string
     */
    private buildPreprintProviderUrl(): string {
        if (this.log?.params?.preprintProvider) {
            return this.buildAHrefElement(`/${this.log.params.preprintProvider.url}`,
                this.log.params.preprintProvider.name);
        }
        return '';
    }

    /**
     * buildSource
     *
     * @description Abstracted method to build the source
     *
     * @returns a formatted string
     */
    private buildSource(): string {
        if (this.log?.params?.source) {
            const source = this.log.params.source;
            const materialized = this.replaceSlash(source.materialized);

            return this.intl.t('activity-log.defaults.materialized', {
                materialized,
                addon: source.addon,
            });
        }
        return this.intl.t('activity-log.defaults.a_name_location');
    }

    /**
     * buildTagUrl
     *
     * @description Abstracted method to build the tag ahref
     *
     * @returns a formatted string
     */
    private buildTagUrl(): string {
        return this.log?.params?.tag ?
            this.buildAHrefElement(
                `/search?q=%22${this.log.params.tag}%22`, this.log.params.tag,
            ) : '';
    }

    /**
     * buildTitleNew
     *
     * @description Abstracted method to build the new title
     *
     * @returns a formatted string
     */
    private buildTitleNew(): string {
        return this.originalNode?.links ?
            this.buildAHrefElement(
                `${this.originalNode.links.html}`, this.log.params.titleNew,
            ) : this.intl.t('activity-log.defaults.a_title');
    }

    /**
     * buildTitleOriginal
     *
     * @description Abstracted method to build the original title
     *
     * @returns a formatted string
     */
    private buildTitleOriginal(): string {
        return this.originalNode?.links ?
            this.buildAHrefElement(
                `${this.originalNode.links.html}`, this.log.params.titleOriginal,
            ) : this.intl.t('activity-log.defaults.a_title');
    }

    /**
     * buildUpdatedFields
     *
     * @description Abstracted method to build the updated fields
     *
     * @returns a formatted string
     */
    private buildUpdatedFields(): string {
        if (this.log?.params?.updatedFields) {

            const nodeCategories =  [
                'analysis',
                'communication',
                'data',
                'hypothesis',
                'instrumentation',
                'methods and measures',
                'procedure',
                'project',
                'software',
                'other',
            ];


            const updatedFieldsParam = this.log.params.updatedFields;
            const updatedField = Object.keys(updatedFieldsParam)[0];
            if (updatedField === 'category'){

                // eslint-disable-next-line
                // @ts-ignore
                const newText = nodeCategories.includes(updatedFieldsParam[updatedField].new) ?
                // eslint-disable-next-line
                // @ts-ignore
                    this.intl.t(`node_categories.${updatedFieldsParam[updatedField].new}`) :
                    this.intl.t('activity-log.defaults.uncategorized');

                return this.intl.t('activity-log.defaults.updated_fields', {
                    old: updatedField,
                    new: newText,
                });

            }
            return this.intl.t('activity-log.defaults.updated_fields', {
                old: updatedField,
                // eslint-disable-next-line
                // @ts-ignore
                new: updatedFieldsParam[updatedField].new,
            });
        }
        return this.intl.t('activity-log.defaults.field');
    }

    /**
     * buildUserUrl
     *
     * @description Abstracted method to build the full name ahref
     *
     * @returns a formatted string
     */
    private buildUserUrl(): string {
        if (this.user || this.log?.params?.githubUser) {
            const githubUser = this.log.params.githubUser;
            if (this.user?.links) {
                return this.buildAHrefElement(this.user.links.html?.toString(), this.user.fullName);
            } else if (this.user && this.user.errors[0].meta) {
                return this.user.errors[0].meta.fullName;
            } else if (githubUser){ // paramIsReturned skipped b/c this is applicable in only a few situtations
                return githubUser;
            }
        }
        return this.intl.t('activity-log.defaults.a_user');
    }


    /**
     * buildVersion
     *
     * @description Abstracted method to build the version
     *
     * @returns a formatted string
     */
    private buildVersion(): string {
        return this.log?.params?.version ? this.log.params.version : '#';
    }

    /**
     * replaceSlash
     *
     * @description Abstracted method to remove the start and end / on a path
     *
     * @param path the path to format
     *
     * @returns a string without a / on the front or back
     */
    private replaceSlash(path: string): string {
        return path.replace(/^\/|\/$/g, '');
    }
}
