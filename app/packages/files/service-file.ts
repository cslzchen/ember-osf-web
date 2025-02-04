import { getOwner, setOwner } from '@ember/application';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';
import { waitFor } from '@ember/test-waiters';
import { task } from 'ember-concurrency';
import Intl from 'ember-intl/services/intl';
import Toast from 'ember-toastr/services/toast';
import ConfiguredStorageAddonModel from 'ember-osf-web/models/configured-storage-addon';
import { ConnectedCapabilities } from 'ember-osf-web/models/authorized-account';
import { ConnectedStorageOperationNames } from 'ember-osf-web/models/addon-operation-invocation';
import FileModel from 'ember-osf-web/models/file';
import NodeModel from 'ember-osf-web/models/node';
import { Permission } from 'ember-osf-web/models/osf-model';
import CurrentUserService from 'ember-osf-web/services/current-user';
import captureException, { getApiErrorMessage } from 'ember-osf-web/utils/capture-exception';
import humanFileSize from 'ember-osf-web/utils/human-file-size';
import { ExternalServiceCapabilities } from 'ember-osf-web/models/external-service';


export enum FileSortKey {
    AscDateModified = 'date_modified',
    DescDateModified = '-date_modified',
    AscName = 'name',
    DescName = '-name',
}

// Waterbutler file version
export interface WaterButlerRevision {
    id: string;
    type: 'file_versions';
    attributes: {
        extra: {
            downloads: number,
            hashes: {
                md5: string,
                sha256: string,
            },
            user: {
                name: string,
                url: string,
            },
        },
        version: number,
        modified: Date,
        modified_utc: Date,
        versionIdentifier: 'version',
    };
}

interface DataverseExtraInfo {
    datasetVersion: 'latest-published' | 'latest';
    fileId: string;
    hasPublishedVersion: boolean;
    hashes: {
        md5: string,
    };
}

export default class ServiceFile {
    @tracked fileModel: FileModel;
    @tracked configuredStorageAddon: ConfiguredStorageAddonModel;
    @tracked totalFileCount = 0;
    @tracked waterButlerRevisions?: WaterButlerRevision[];
    @tracked userCanDownloadAsZip: boolean;
    @tracked canMoveToThisProvider: boolean;
    @tracked canAddOrUpdate: boolean;
    @tracked isDataverse: boolean; // we have some special casing for Dataverse
    shouldShowTags = false;
    shouldShowRevisions: boolean;
    providerHandlesVersioning: boolean;
    parallelUploadsLimit = 2;

    currentUser: CurrentUserService;
    @service intl!: Intl;
    @service toast!: Toast;


    constructor(
        currentUser: CurrentUserService,
        fileModel: FileModel,
        configuredStorageAddon: ConfiguredStorageAddonModel,
    ) {
        setOwner(this, getOwner(fileModel));
        this.currentUser = currentUser;
        this.fileModel = fileModel;
        this.configuredStorageAddon = configuredStorageAddon;
        this.userCanDownloadAsZip = false;
        this.canMoveToThisProvider = false;
        this.canAddOrUpdate = false;
        this.isDataverse = false;
        this.getSupportedFeatures();
        this.providerHandlesVersioning = configuredStorageAddon.connectedOperationNames
            .includes(ConnectedStorageOperationNames.HasRevisions);
        this.shouldShowRevisions = configuredStorageAddon.connectedOperationNames
            .includes(ConnectedStorageOperationNames.HasRevisions);
        this.parallelUploadsLimit = configuredStorageAddon.concurrentUploads;
    }

    async getSupportedFeatures() {
        const externalStorageService = await this.configuredStorageAddon.externalStorageService;
        this.isDataverse = externalStorageService.get('wbKey') === 'dataverse';
        this.userCanDownloadAsZip = externalStorageService.get('supportedFeatures')
            .includes(ExternalServiceCapabilities.DOWNLOAD_AS_ZIP);
        this.canMoveToThisProvider = externalStorageService.get('supportedFeatures')
            .includes(ExternalServiceCapabilities.COPY_INTO);
        this.canAddOrUpdate = externalStorageService.get('supportedFeatures')
            .includes(ExternalServiceCapabilities.ADD_UPDATE_FILES);
    }

    get isFile() {
        return this.fileModel.isFile;
    }

    get isFolder() {
        return this.fileModel.isFolder;
    }

    get showAsUnviewed() {
        return this.fileModel.showAsUnviewed;
    }

    get size() {
        return humanFileSize(this.fileModel.size);
    }

    get currentUserPermission(): string {
        if (
            this.fileModel.target.get('currentUserPermissions').includes(Permission.Write) &&
            this.configuredStorageAddon.connectedCapabilities.includes(ConnectedCapabilities.Update) &&
            this.canAddOrUpdate
        ) {
            return 'write';
        }
        return 'read';
    }

    get targetIsRegistration(){
        return this.fileModel.target.get('modelName') === 'registration';
    }

    get currentUserCanDelete() {
        return (this.fileModel.target.get('modelName') !== 'registration' && this.currentUserPermission === 'write');
    }

    get name() {
        return this.fileModel.name;
    }

    get displayName() {
        if (this.isDataverse) {
            const fileExtra = this.fileModel.extra as DataverseExtraInfo;
            const translationKeyPrefix = 'osf-components.file-browser.provider-specific-data.dataverse.';
            const fileNameSuffix = ' ' + this.intl.t(translationKeyPrefix + fileExtra.datasetVersion);
            return this.fileModel.name + fileNameSuffix;
        }
        return this.fileModel.name;
    }

    get id() {
        return this.fileModel.id;
    }

    get path() {
        return this.fileModel.path;
    }

    get links() {
        const links = this.fileModel.links;
        if (this.isFolder) {
            const uploadLink = new URL(links.upload as string);
            uploadLink.searchParams.set('zip', '');

            links.download = uploadLink.toString();
        }
        return links;
    }

    get userCanEditMetadata() {
        return this.fileModel.target.get('currentUserPermissions').includes(Permission.Write);
    }

    get dateModified() {
        return this.fileModel.dateModified;
    }

    get userCanMoveToHere() {
        return (
            this.currentUserPermission === 'write' &&
            this.canMoveToThisProvider &&
            this.fileModel.target.get('modelName') !== 'registration' &&
            this.isFolder
        );
    }

    get userCanUploadToHere() {
        return (
            this.currentUserPermission === 'write' &&
            this.fileModel.target.get('modelName') !== 'registration' &&
            this.isFolder
        );
    }

    get userCanDeleteFromHere() {
        return (
            this.isFolder &&
            this.currentUserPermission === 'write' &&
            this.fileModel.target.get('modelName') !== 'registration'
        );
    }

    get isBoaFile() {
        return this.fileModel.name.endsWith('.boa');
    }

    get providerIsOsfstorage() {
        return false;
    }

    async createFolder(newFolderName: string) {
        if (this.fileModel.isFolder) {
            await this.fileModel.createFolder(newFolderName);
        }
    }

    async getFolderItems(page: number, sort: FileSortKey, filter: string ) {
        if (this.fileModel.isFolder) {
            try {
                const queryResult = await this.fileModel.queryHasMany('files',
                    {
                        page,
                        sort,
                        'filter[name]': filter,
                    });
                this.totalFileCount = queryResult.meta.total;
                return queryResult.map(fileModel => Reflect.construct(this.constructor, [
                    this.currentUser,
                    fileModel,
                    this.configuredStorageAddon,
                ]));
            } catch (e) {
                const errorMessage = this.intl.t(
                    'osf-components.file-browser.errors.load_file_list',
                );
                captureException(e, { errorMessage });
                this.toast.error(getApiErrorMessage(e), errorMessage);
                return [];
            }
        }
        return [];
    }

    async updateContents(data: string) {
        await this.fileModel.updateContents(data);
    }

    async rename(newName: string, conflict = 'replace') {
        await this.fileModel.rename(newName, conflict);
    }

    @task
    @waitFor
    async move(node: NodeModel, path: string, provider: string, options?: { conflict: string }) {
        return await this.fileModel.move(node, path, provider, options);
    }

    @task
    @waitFor
    async copy(node: NodeModel, path: string, provider: string, options?: { conflict: string }) {
        return await this.fileModel.copy(node, path, provider, options);
    }

    @task
    @waitFor
    async delete() {
        return await this.fileModel.delete();
    }

    @task
    @waitFor
    async getRevisions() {
        const revisionsLink = new URL(this.links.upload as string);
        revisionsLink.searchParams.set('revisions', '');

        const responseObject = await this.currentUser.authenticatedAJAX({ url: revisionsLink.toString() });
        this.waterButlerRevisions = responseObject.data;
        return this.waterButlerRevisions;
    }
}
