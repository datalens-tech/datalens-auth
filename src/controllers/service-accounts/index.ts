import {createServiceAccountController} from './create-service-account';
import {createServiceAccountKeyController} from './create-service-account-key';
import {deleteServiceAccountController} from './delete-service-account';
import {deleteServiceAccountKeyController} from './delete-service-account-key';
import {exchangeServiceAccountTokenController} from './exchange-service-account-token';
import {listServiceAccountKeysController} from './list-service-account-keys';
import {listServiceAccountsController} from './list-service-accounts';

export default {
    createServiceAccountController,
    createServiceAccountKeyController,
    deleteServiceAccountController,
    deleteServiceAccountKeyController,
    listServiceAccountKeysController,
    listServiceAccountsController,
    exchangeServiceAccountTokenController,
};
