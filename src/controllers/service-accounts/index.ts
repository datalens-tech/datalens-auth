import {createServiceAccountController} from './create-service-account';
import {createServiceAccountKeyController} from './create-service-account-key';
import {deleteServiceAccountKeyController} from './delete-service-account-key';
import {exchangeServiceAccountTokenController} from './exchange-service-account-token';
import {listServiceAccountKeysController} from './list-service-account-keys';
import {updateServiceAccountController} from './update-service-account';

export default {
    createServiceAccountController,
    updateServiceAccountController,
    createServiceAccountKeyController,
    deleteServiceAccountKeyController,
    listServiceAccountKeysController,
    exchangeServiceAccountTokenController,
};
