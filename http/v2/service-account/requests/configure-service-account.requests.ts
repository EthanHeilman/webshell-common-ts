import { BZECert } from '../../../../../webshell-common-ts/mrtap.service/mrtap-types';
import { ServiceAccountConfiguration } from '../types/service-account-configuration.types';

export interface ConfigureServiceAccountRequest {
    serviceAccountConfiguration: ServiceAccountConfiguration;
    targets: string[];
    BZCert: BZECert;
    signature: string;
 }