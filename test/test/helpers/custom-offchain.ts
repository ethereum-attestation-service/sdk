import { EAS } from '../../../src/eas';
import { Offchain, OffchainAttestationType, OffChainAttestationVersion, TypedDataConfig } from '../../../src/offchain';

interface CustomOffchainParams {
  contractVersion: string;
  type?: OffchainAttestationType;
}

export class CustomOffchain extends Offchain {
  constructor(config: TypedDataConfig, version: OffChainAttestationVersion, params: CustomOffchainParams, eas: EAS) {
    super(config, version, eas);

    const { contractVersion, type } = params;

    this.config = { ...this.config, version: contractVersion };

    if (type) {
      this.signingType = type;
    }
  }
}
