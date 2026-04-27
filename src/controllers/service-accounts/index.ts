import {createServiceAccountController} from './create-service-account';
import {createServiceAccountKeyController} from './create-service-account-key';
import {deleteServiceAccountKeyController} from './delete-service-account-key';
import {exchangeServiceAccountTokenController} from './exchange-service-account-token';
import {listServiceAccountKeysController} from './list-service-account-keys';

export default {
    createServiceAccountController,
    createServiceAccountKeyController,
    deleteServiceAccountKeyController,
    listServiceAccountKeysController,
    exchangeServiceAccountTokenController,
};
