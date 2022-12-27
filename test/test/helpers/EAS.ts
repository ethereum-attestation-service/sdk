import {
  AttestationRequestData,
  EAS,
  MultiAttestationRequest,
  MultiDelegatedAttestationRequest,
  MultiDelegatedRevocationRequest,
  MultiRevocationRequest,
  NO_EXPIRATION,
  RevocationRequestData
} from '../../../src/eas';
import {
  EIP712AttestationParams,
  EIP712MessageTypes,
  EIP712Request,
  EIP712RevocationParams
} from '../../../src/offchain/delegated';
import { getOffchainUUID } from '../../../src/utils';
import { ZERO_BYTES, ZERO_BYTES32 } from '../../utils/Constants';
import { EIP712Utils } from './EIP712Utils';
import { OffchainUtils } from './offchain-utils';
import { latest } from './time';
import { EIP712Verifier } from '@ethereum-attestation-service/eas-contracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { BigNumberish, Wallet } from 'ethers';

export enum SignatureType {
  Direct = 'direct',
  Delegated = 'delegated',
  Offchain = 'offchain'
}

export interface RequestContracts {
  eas: EAS;
  verifier?: EIP712Verifier;
  eip712Utils?: EIP712Utils;
  offchainUtils?: OffchainUtils;
}

export interface AttestationOptions {
  signatureType?: SignatureType;
  from: Wallet | SignerWithAddress;
  value?: BigNumberish;
  bump?: number;
}

export interface RevocationOptions {
  signatureType?: SignatureType;
  from: Wallet | SignerWithAddress;
  value?: BigNumberish;
}

export const expectAttestation = async (
  contracts: RequestContracts,
  schema: string,
  request: AttestationRequestData,
  options: AttestationOptions
) => {
  const { eas, verifier, eip712Utils, offchainUtils } = contracts;
  const {
    recipient,
    expirationTime = NO_EXPIRATION,
    revocable = true,
    refUUID = ZERO_BYTES32,
    data = ZERO_BYTES,
    value = 0
  } = request;
  const { from: txSender, signatureType = SignatureType.Direct } = options;

  let uuid;

  switch (signatureType) {
    case SignatureType.Direct: {
      uuid = await eas
        .connect(txSender)
        .attest({ schema, data: { recipient, expirationTime, revocable, refUUID, data, value } });

      break;
    }

    case SignatureType.Delegated: {
      if (!eip712Utils || !verifier) {
        throw new Error('Invalid verifier');
      }

      const signature = await eip712Utils.signDelegatedAttestation(
        txSender,
        schema,
        recipient,
        expirationTime,
        revocable,
        refUUID,
        data,
        await verifier.getNonce(txSender.address)
      );

      expect(await eip712Utils.verifyDelegatedAttestationSignature(txSender.address, signature)).to.be.true;

      uuid = await eas.connect(txSender).attestByDelegation({
        schema,
        data: { recipient, expirationTime, revocable, refUUID, data, value },
        signature,
        attester: txSender.address
      });

      break;
    }

    case SignatureType.Offchain: {
      if (!offchainUtils) {
        throw new Error('Invalid offchain utils');
      }

      const now = await latest();
      const uuid = getOffchainUUID(schema, recipient, now, expirationTime, revocable, refUUID, data);
      const request = await offchainUtils.signAttestation(
        txSender,
        schema,
        recipient,
        now,
        expirationTime,
        revocable,
        refUUID,
        data
      );
      expect(request.uuid).to.equal(uuid);
      expect(await offchainUtils.verifyAttestation(txSender.address, request)).to.be.true;

      return;
    }
  }

  expect(await eas.isAttestationValid({ uuid })).to.be.true;
};

export const expectMultiAttestations = async (
  contracts: RequestContracts,
  requests: MultiAttestationRequest[],
  options: AttestationOptions
) => {
  const { eas, verifier, eip712Utils } = contracts;

  const { from: txSender, signatureType = SignatureType.Direct } = options;

  let uuids: string[] = [];

  switch (signatureType) {
    case SignatureType.Direct: {
      uuids = await eas.connect(txSender).multiAttest(requests);

      break;
    }

    case SignatureType.Delegated: {
      if (!eip712Utils || !verifier) {
        throw new Error('Invalid verifier');
      }

      const multiDelegatedAttestationRequests: MultiDelegatedAttestationRequest[] = [];

      let nonce = await verifier.getNonce(txSender.address);

      for (const { schema, data } of requests) {
        const signatures: EIP712Request<EIP712MessageTypes, EIP712AttestationParams>[] = [];

        for (const request of data) {
          const signature = await eip712Utils.signDelegatedAttestation(
            txSender,
            schema,
            request.recipient,
            request.expirationTime ?? NO_EXPIRATION,
            request.revocable ?? true,
            request.refUUID ?? ZERO_BYTES32,
            request.data,
            nonce
          );

          expect(await eip712Utils.verifyDelegatedAttestationSignature(txSender.address, signature)).to.be.true;

          signatures.push(signature);

          nonce = nonce.add(1);
        }

        multiDelegatedAttestationRequests.push({ schema, data, signatures, attester: txSender.address });
      }

      uuids = await eas.connect(txSender).multiAttestByDelegation(multiDelegatedAttestationRequests);

      break;
    }

    case SignatureType.Offchain: {
      throw new Error('Offchain batch attestations are unsupported');
    }
  }

  for (const uuid of uuids) {
    expect(await eas.isAttestationValid({ uuid })).to.be.true;
  }
};

export const expectRevocation = async (
  contracts: RequestContracts,
  schema: string,
  request: RevocationRequestData,
  options: RevocationOptions
) => {
  const { eas, verifier, eip712Utils } = contracts;
  const { uuid, value = 0 } = request;
  const { from: txSender, signatureType = SignatureType.Direct } = options;

  switch (signatureType) {
    case SignatureType.Direct: {
      await eas.connect(txSender).revoke({ schema, data: { uuid, value } });

      break;
    }

    case SignatureType.Delegated: {
      if (!eip712Utils || !verifier) {
        throw new Error('Invalid verifier');
      }

      const signature = await eip712Utils.signDelegatedRevocation(
        txSender,
        schema,
        uuid,
        await verifier.getNonce(txSender.address)
      );

      await eas.connect(txSender).revokeByDelegation({
        schema,
        data: { uuid, value },
        signature,
        revoker: txSender.address
      });

      break;
    }
  }

  expect(await eas.isAttestationRevoked({ uuid })).to.be.true;
};

export const expectMultiRevocations = async (
  contracts: RequestContracts,
  requests: MultiRevocationRequest[],
  options: RevocationOptions
) => {
  const { eas, verifier, eip712Utils } = contracts;

  const { from: txSender, signatureType = SignatureType.Direct } = options;

  switch (signatureType) {
    case SignatureType.Direct: {
      await eas.connect(txSender).multiRevoke(requests);

      break;
    }

    case SignatureType.Delegated: {
      if (!eip712Utils || !verifier) {
        throw new Error('Invalid verifier');
      }

      const multiDelegatedRevocationRequests: MultiDelegatedRevocationRequest[] = [];

      let nonce = await verifier.getNonce(txSender.address);

      for (const { schema, data } of requests) {
        const signatures: EIP712Request<EIP712MessageTypes, EIP712RevocationParams>[] = [];

        for (const request of data) {
          const signature = await eip712Utils.signDelegatedRevocation(txSender, schema, request.uuid, nonce);

          expect(await eip712Utils.verifyDelegatedRevocationSignature(txSender.address, signature)).to.be.true;

          signatures.push(signature);

          nonce = nonce.add(1);
        }

        multiDelegatedRevocationRequests.push({ schema, data, signatures, revoker: txSender.address });
      }

      await eas.connect(txSender).multiRevokeByDelegation(multiDelegatedRevocationRequests);

      break;
    }
  }

  for (const data of requests) {
    for (const { uuid } of data.data) {
      expect(await eas.isAttestationValid({ uuid })).to.be.true;
      expect(await eas.isAttestationRevoked({ uuid })).to.be.true;
    }
  }
};