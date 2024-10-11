# Ethereum Attestation Service - TypeScript/JavaScript SDK

[![Docs](https://img.shields.io/badge/docs-%F0%9F%93%84-blue)](https://eas.eth.link)
[![NPM Package](https://img.shields.io/npm/v/@ethereum-attestation-service/eas-sdk.svg)](https://www.npmjs.org/package/@ethereum-attestation-service/eas-sdk)
[![Test](https://github.com/ethereum-attestation-service/eas-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/ethereum-attestation-service/eas-sdk/actions/workflows/ci.yml)

This repository contains the Ethereum Attestation Service SDK, used to interact with the Ethereum Attestation Service Protocol.

## Table of Contents

- [Installing the EAS SDK](#installing-the-eas-sdk)
- [Using the EAS SDK](#using-the-eas-sdk)
- [Getting an Attestation](#getting-an-attestation)
- [Creating Onchain Attestations](#creating-onchain-attestations)
  - [Example: Creating Onchain Attestations](#example-creating-onchain-attestations)
  - [Example: Creating Multi Onchain Attestations](#example-creating-multi-onchain-attestations)
- [Revoking Onchain Attestations](#revoking-onchain-attestations)
  - [Example: Revoking Onchain Attestations](#example-revoking-onchain-attestations)
- [Creating Offchain Attestations](#creating-offchain-attestations)
  - [Example: Creating Offchain Attestations](#example-creating-offchain-attestations)
- [Creating Delegated Onchain Attestations](#creating-delegated-onchain-attestations)
  - [Example: Creating Delegated Onchain Attestations](#example-creating-delegated-onchain-attestations)
- [Revoking Delegated Onchain Attestations](#revoking-delegated-onchain-attestations)
  - [Example: Revoking Delegated Onchain Attestations](#example-revoking-delegated-onchain-attestations)
- [Creating Timestamps](#creating-timestamps)
- [Revoking Offchain Attestations](#revoking-offchain-attestations)
- [Verifying an Offchain Attestation](#verifying-an-offchain-attestation)
- [Registering a Schema](#registering-a-schema)
- [Getting Schema Information](#getting-schema-information)
- [Using the PrivateData Class](#using-the-privatedata-class)
  - [Creating Private Data](#creating-private-data)
  - [Getting the Full Merkle Tree](#getting-the-full-merkle-tree)
  - [Generating a Multi-Proof](#generating-a-multi-proof)
  - [Verifying a Multi-Proof](#verifying-a-multi-proof)
  - [Verifying the Full Tree](#verifying-the-full-tree)
- [Example: Creating an Attestation with Private Data](#example-creating-an-attestation-with-private-data)

## Installing the EAS SDK

To install the EAS SDK, run the following command within your project directory:

```sh
yarn add @ethereum-attestation-service/eas-sdk
```

OR

```sh
npm install @ethereum-attestation-service/eas-sdk
```

OR

```sh
pnpm add @ethereum-attestation-service/eas-sdk
```

## Using the EAS SDK

Import and initialize the library

```javascript
import { EAS, Offchain, SchemaEncoder, SchemaRegistry } from '@ethereum-attestation-service/eas-sdk';
import { ethers } from 'ethers';

export const EASContractAddress = '0xC2679fBD37d54388Ce493F1DB75320D236e1815e'; // Sepolia v0.26

// Initialize the sdk with the address of the EAS Schema contract address
const eas = new EAS(EASContractAddress);

// Gets a default provider (in production use something else like infura/alchemy)
const provider = ethers.getDefaultProvider('sepolia');

// Connects an ethers style provider/signingProvider to perform read/write functions.
// MUST be a signer to do write operations!
eas.connect(provider);
```

### Getting an Attestation

The `getAttestation` function allows you to retrieve an on-chain attestation for a given UID. This function returns an attestation object containing information about the attestation, such as the schema, recipient, attester, and more.

#### Usage

```javascript
import { EAS, NO_EXPIRATION } from '@ethereum-attestation-service/eas-sdk';

const eas = new EAS(EASContractAddress);
eas.connect(provider);

const uid = '0xff08bbf3d3e6e0992fc70ab9b9370416be59e87897c3d42b20549901d2cccc3e';

const attestation = await eas.getAttestation(uid);

console.log(attestation);
```

#### Output

The `getAttestation` function returns an attestation object with the following properties:

- `uid`: The unique identifier of the attestation.
- `schema`: The schema identifier associated with the attestation.
- `refUID`: The reference UID of the attestation, if any.
- `time`: The Unix timestamp when the attestation was created.
- `expirationTime`: The Unix timestamp when the attestation expires (0 for no expiration).
- `revocationTime`: The Unix timestamp when the attestation was revoked, if applicable.
- `recipient`: The Ethereum address of the recipient of the attestation.
- `attester`: The Ethereum address of the attester who created the attestation.
- `revocable`: A boolean indicating whether the attestation is revocable or not.
- `data`: The attestation data in bytes format.

Example output:

```javascript
{
    uid: '0x5134f511e0533f997e569dac711952dde21daf14b316f3cce23835defc82c065',
    schema: '0x27d06e3659317e9a4f8154d1e849eb53d43d91fb4f219884d1684f86d797804a',
    refUID: '0x0000000000000000000000000000000000000000000000000000000000000000',
    time: 1671219600,
    expirationTime: NO_EXPIRATION,
    revocationTime: 1671219636,
    recipient: '0xFD50b031E778fAb33DfD2Fc3Ca66a1EeF0652165',
    attester: '0x1e3de6aE412cA218FD2ae3379750388D414532dc',
    revocable: true,
    data: '0x0000000000000000000000000000000000000000000000000000000000000000'
}
```

### Creating Onchain Attestations

The `attest` function allows you to create an on-chain attestation for a specific schema. This function takes an object with the following properties:

- `schema`: The UID of the schema for which the attestation is being created.
- `data`: An object containing the following properties:
  - `recipient`: The Ethereum address of the recipient of the attestation.
  - `expirationTime`: A Unix timestamp representing the expiration time of the attestation. Use `0` for no expiration.
  - `revocable`: A boolean indicating whether the attestation is revocable or not.
  - `refUID`: (Optional) The UID of a referenced attestation. Use `ZERO_BYTES32` if there is no reference.
  - `data`: The encoded data for the attestation, which should be generated using the `SchemaEncoder` class.
  - `value`: (Optional) The ETH value that is being sent with the attestation.

The function returns a `Promise` that resolves to the UID of the newly created attestation.

#### Example: Creating Onchain Attestations

```javascript
import { EAS, NO_EXPIRATION, SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';

const eas = new EAS(EASContractAddress);
eas.connect(signer);

// Initialize SchemaEncoder with the schema string
const schemaEncoder = new SchemaEncoder('uint256 eventId, uint8 voteIndex');
const encodedData = schemaEncoder.encodeData([
  { name: 'eventId', value: 1, type: 'uint256' },
  { name: 'voteIndex', value: 1, type: 'uint8' }
]);

const schemaUID = '0xb16fa048b0d597f5a821747eba64efa4762ee5143e9a80600d0005386edfc995';

const transaction = await eas.attest({
  schema: schemaUID,
  data: {
    recipient: '0xFD50b031E778fAb33DfD2Fc3Ca66a1EeF0652165',
    expirationTime: NO_EXPIRATION,
    revocable: true, // Be aware that if your schema is not revocable, this MUST be false
    data: encodedData
  }
});

const newAttestationUID = await transaction.wait();

console.log('New attestation UID:', newAttestationUID);

console.log('Transaction receipt:', transaction.receipt);
```

#### Example: Creating Multi Onchain Attestations

```javascript
import { EAS, NO_EXPIRATION, SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';

const eas = new EAS(EASContractAddress);
eas.connect(signer);

// Initialize SchemaEncoder with the schema string
const schemaEncoder = new SchemaEncoder('uint256 eventId, uint8 voteIndex');
const encodedData = schemaEncoder.encodeData([
  { name: 'eventId', value: 1, type: 'uint256' },
  { name: 'voteIndex', value: 1, type: 'uint8' }
]);
const encodedData2 = schemaEncoder.encodeData([
  { name: 'eventId', value: 10, type: 'uint256' },
  { name: 'voteIndex', value: 2, type: 'uint8' }
]);

const schemaUID = '0xb16fa048b0d597f5a821747eba64efa4762ee5143e9a80600d0005386edfc995';

const transaction = await eas.multiAttest([
  {
    schema: schemaId,
    data: [
      {
        recipient: '0xFD50b031E778fAb33DfD2Fc3Ca66a1EeF0652165',
        expirationTime: NO_EXPIRATION,
        revocable: true, // Be aware that if your schema is not revocable, this MUST be false
        data: encodedData
      },
      {
        recipient: '0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587',
        expirationTime: NO_EXPIRATION,
        revocable: false,
        data: encodedData2
      }
    ]
  }
]);

const newAttestationUID = await transaction.wait();

console.log('New attestation UID:', newAttestationUID);

console.log('Transaction receipt:', transaction.receipt);
```

### Revoking Onchain Attestations

The `revoke` function allows you to revoke an on-chain attestation. This function takes an object with the following properties:

- `schema`: The UID of the schema for which the attestation is being revoked.
- `data`: An object containing the following properties:
  - `uid`: The UID of the attestation to revoke.
  - `value`: (Optional) The ETH value that is being sent with the revocation.

### Example: Revoking Onchain Attestations

```javascript
const transaction = await eas.revoke({
  schema: '0x85500e806cf1e74844d51a20a6d893fe1ed6f6b0738b50e43d774827d08eca61',
  data: { uid: '0x6776de8122c352b4d671003e58ca112aedb99f34c629a1d1fe3b332504e2943a' }
});

// Optional: Wait for transaction to be validated
await transaction.wait();
```

### Creating Offchain Attestations

To create an offchain attestation, you can use the `signOffchainAttestation` function provided by the Offchain class in the EAS SDK. Here's an example:

#### Example: Creating Offchain Attestations

```javascript
import { EAS, NO_EXPIRATION, SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';

// Initialize EAS with the EAS contract address on whichever chain where your schema is defined
const eas = new EAS(EASContractAddress);

const offchain = await eas.getOffchain();

// Initialize SchemaEncoder with the schema string
// Note these values are sample values and should be filled with actual values
// Code samples can be found when viewing each schema on easscan.org
const schemaEncoder = new SchemaEncoder('uint256 eventId, uint8 voteIndex');
const encodedData = schemaEncoder.encodeData([
  { name: 'eventId', value: 1, type: 'uint256' },
  { name: 'voteIndex', value: 1, type: 'uint8' }
]);

// Signer is an ethers.js Signer instance
const signer = new ethers.Wallet(privateKey, provider);

const offchainAttestation = await offchain.signOffchainAttestation(
  {
    recipient: '0xFD50b031E778fAb33DfD2Fc3Ca66a1EeF0652165',
    expirationTime: NO_EXPIRATION, // Unix timestamp of when attestation expires (0 for no expiration)
    time: BigInt(Math.floor(Date.now() / 1000)), // Unix timestamp of current time
    revocable: true, // Be aware that if your schema is not revocable, this MUST be false
    schema: '0xb16fa048b0d597f5a821747eba64efa4762ee5143e9a80600d0005386edfc995',
    refUID: '0x0000000000000000000000000000000000000000000000000000000000000000',
    data: encodedData
  },
  signer
);
```

This function will return a signed offchain attestation object containing the UID, signature, and attestation data. You can then share this object with the intended recipient or store it for future use.

#### Versioning

Since the offchain attestation protocol is being constantly evolved and improved, we've recently added versioning to help the applications to support both older and newer types of attestation. Starting from version `1`, we have added a `version` field to its typed data, which is seamlessly supported by both `signOffchainAttestation` and `verifyOffchainAttestationSignature` function.

Please note that using the `getOffchainUID` function for the previous legacy version, requires passing `{ version: 0 }` explicitly.

### Creating Delegated Onchain Attestations

The `attestByDelegation` function allows you to create a delegated on-chain attestation for a specific schema. This function takes an object with the following properties:

- `schema`: The UID of the schema for which the attestation is being created.
- `data`: An object containing the following properties:
  - `recipient`: The Ethereum address of the recipient of the attestation.
  - `expirationTime`: A Unix timestamp representing the expiration time of the attestation. Use `0` for no expiration.
  - `revocable`: A boolean indicating whether the attestation is revocable or not.
  - `refUID`: (Optional) The UID of a referenced attestation. Use `ZERO_BYTES32` if there is no reference.
  - `data`: The encoded data for the attestation, which should be generated using the `SchemaEncoder` class.
  - `value`: (Optional) The ETH value that is being sent with the attestation.
- `attester`: The address of the attester.
- `signature`: A EIP712 typed-signature (`r`, `s`, and `v`) over the message (using the `signDelegatedAttestation` function).
- `deadline`: A Unix representing the expiration time of the signature.

The function returns a `Promise` that resolves to the UID of the newly created attestation.

#### Example: Creating Delegated Onchain Attestations

```javascript
import { EAS, NO_EXPIRATION, SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';

const eas = new EAS(EASContractAddress);

// Use a different account to send and pay for the attestation.
eas.connect(sender);

const delegated = await eas.getDelegated();

// Initialize SchemaEncoder with the schema string
// Note these values are sample values and should be filled with actual values
// Code samples can be found when viewing each schema on easscan.org
const schemaEncoder = new SchemaEncoder('uint256 eventId, uint8 voteIndex');
const encodedData = schemaEncoder.encodeData([
  { name: 'eventId', value: 1, type: 'uint256' },
  { name: 'voteIndex', value: 1, type: 'uint8' }
]);

const signer = new ethers.Wallet(privateKey, provider);

// Please note that if nonce isn't provided explicitly, we will try retrieving it onchain.
const response = await delegated.signDelegatedAttestation(
  {
    schema: '0xb16fa048b0d597f5a821747eba64efa4762ee5143e9a80600d0005386edfc995',
    recipient: '0xFD50b031E778fAb33DfD2Fc3Ca66a1EeF0652165',
    expirationTime: NO_EXPIRATION, // Unix timestamp of when attestation expires (0 for no expiration)
    revocable: true,
    refUID: '0x0000000000000000000000000000000000000000000000000000000000000000',
    data: encodedData,
    deadline: NO_EXPIRATION, // Unix timestamp of when signature expires (0 for no expiration)
    value: 0n
  },
  signer
);

const transaction = await eas.attestByDelegation({
  schema: '0xb16fa048b0d597f5a821747eba64efa4762ee5143e9a80600d0005386edfc995',
  data: {
    recipient: '0xFD50b031E778fAb33DfD2Fc3Ca66a1EeF0652165',
    expirationTime: NO_EXPIRATION, // Unix timestamp of when attestation expires (0 for no expiration),
    revocable: true,
    refUID: '0x0000000000000000000000000000000000000000000000000000000000000000',
    data: encodedData
  },
  signature: response.signature,
  attester: await signer.getAddress(),
  deadline: 0n // Unix timestamp of when signature expires (0 for no expiration)
});

const newAttestationUID = await transaction.wait();

console.log('New attestation UID:', newAttestationUID);

console.log('Transaction receipt:', transaction.receipt);
```

### Revoking Delegated Onchain Attestations

The `revokeByDelegation` function allows you to create a delegated on-chain revocation for a specific attestation. This function takes an object with the following properties:

- `schema`: The UID of the schema for which the attestation is being revoked.
- `data`: An object containing the following properties:
  - `uid`: The UID of the attestation to revoke.
  - `value`: (Optional) The ETH value that is being sent with the revocation.
- `revoker`: The address of the revoker.
- `signature`: A EIP712 typed-signature (`r`, `s`, and `v`) over the message (using the `signDelegatedRevocation` function).
- `deadline`: A Unix representing the expiration time of the signature.

The function returns a `Promise` that resolves to the UID of the newly created attestation.

#### Example: Revoking Delegated Onchain Attestations

```javascript
import { EAS, SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';

const eas = new EAS(EASContractAddress);

// Use a different account to send and pay for the attestation.
eas.connect(sender);

const delegated = await eas.getDelegated();

const signer = new ethers.Wallet(privateKey, provider);

const transaction = await eas.revoke({
  schema: '0x85500e806cf1e74844d51a20a6d893fe1ed6f6b0738b50e43d774827d08eca61',
  data: { uid: '0x6776de8122c352b4d671003e58ca112aedb99f34c629a1d1fe3b332504e2943a' }
});

// Please note that if nonce isn't provided explicitly, we will try retrieving it onchain.
const response = await delegated.signDelegatedRevocation(
  {
    schema: '0x85500e806cf1e74844d51a20a6d893fe1ed6f6b0738b50e43d774827d08eca61',
    uid: '0x6776de8122c352b4d671003e58ca112aedb99f34c629a1d1fe3b332504e2943a',
    deadline: 0n, // Unix timestamp of when signature expires (0 for no expiration)
    value: 0n
  },
  signer
);

const transaction = await eas.revokeByDelegation({
  schema: '0xb16fa048b0d597f5a821747eba64efa4762ee5143e9a80600d0005386edfc995',
  data: {
    uid: '0x6776de8122c352b4d671003e58ca112aedb99f34c629a1d1fe3b332504e2943a',
  },
  signature: response.signature,
  revoker: await signer.getAddress(),
  deadline: 0n // Unix timestamp of when signature expires (0 for no expiration)
});

// Optional: Wait for transaction to be validated
await transaction.wait();
```

### Creating Timestamps

To timestamp an off-chain attestation UID on-chain, you can use the timestamp function provided by the EAS SDK. Here's an example:

```javascript
import { EAS } from '@ethereum-attestation-service/eas-sdk';

const eas = new EAS(EASContractAddress);
eas.connect(provider);

const uid = '0x6776de8122c352b4d671003e58ca112aedb99f34c629a1d1fe3b332504e2943a';

const transaction = await eas.timestamp(uid);

// Optional: Wait for the transaction to be validated
await transaction.wait();
```

To create a timestamp for any piece of data, you can use the `timestamp` function provided by the EAS SDK. Here's an example:

```javascript
import { EAS } from '@ethereum-attestation-service/eas-sdk';

const eas = new EAS(EASContractAddress);
eas.connect(provider);

const data = ethers.encodeBytes32String('0x1234');

const transaction = await eas.timestamp(data);

// Optional: Wait for transaction to be validated
await transaction.wait();
```

To create timestamps for multiple pieces of data, you can use the `multiTimestamp` function:

```javascript
import { EAS } from '@ethereum-attestation-service/eas-sdk';

const eas = new EAS(EASContractAddress);
eas.connect(provider);

const data1 = ethers.encodeBytes32String('0x3e23b395b2bd2d37dd0f6e4148ac6b9e7ed22f2215107958f95cc1489e4e6289');
const data2 = ethers.encodeBytes32String('0x6776de8122c352b4d671003e58ca112aedb99f34c629a1d1fe3b332504e2943a');

const transaction = await eas.multiTimestamp([data1, data2]);

// Optional: Wait for transaction to be validated
await transaction.wait();
```

### Revoking Offchain Attestations

To revoke an offchain attestation, you can use the `revokeOffchain` function provided by the EAS SDK. Here's an example:

```javascript
import { EAS } from '@ethereum-attestation-service/eas-sdk';

const eas = new EAS(EASContractAddress);
eas.connect(provider);

const data = ethers.encodeBytes32String('0x6776de8122c352b4d671003e58ca112aedb99f34c629a1d1fe3b332504e2943a');

const transaction = await eas.revokeOffchain(data);

// Optional: Wait for transaction to be validated
await transaction.wait();
```

To revoke multiple offchain attestations, you can use the `multiRevokeOffchain` function:

```javascript
import { EAS } from '@ethereum-attestation-service/eas-sdk';

const eas = new EAS(EASContractAddress);
eas.connect(provider);

const data1 = ethers.encodeBytes32String('0x6776de8122c352b4d671003e58ca112aedb99f34c629a1d1fe3b332504e2943a');
const data2 = ethers.encodeBytes32String('0x3e23b395b2bd2d37dd0f6e4148ac6b9e7ed22f2215107958f95cc1489e4e6289');

const transaction = await eas.multiRevokeOffchain([data1, data2]);

// Optional: Wait for transaction to be validated
await transaction.wait();
```

### Verifying an Offchain Attestation

To verify an offchain attestation, you can use the `verifyOffchainAttestationSignature` function provided by the EAS SDK. Here's an example:

```javascript
import { OffchainAttestationVersion, Offchain, OffchainConfig } from "@ethereum-attestation-service/eas-sdk";

const attestation = {
  // your offchain attestation
  sig: {
    domain: {
      name: 'EAS Attestation',
      version: '0.26',
      chainId: 1,
      verifyingContract: '0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587'
    },
    primaryType: 'Attest',
    types: {
      Attest: []
    },
    signature: {
      r: '',
      s: '',
      v: 28
    },
    uid: '0x5134f511e0533f997e569dac711952dde21daf14b316f3cce23835defc82c065',
    message: {
      version: OffchainAttestationVersion.Version2,
      schema: '0x27d06e3659317e9a4f8154d1e849eb53d43d91fb4f219884d1684f86d797804a',
      refUID: '0x0000000000000000000000000000000000000000000000000000000000000000',
      time: 1671219600,
      expirationTime: NO_EXPIRATION,
      recipient: '0xFD50b031E778fAb33DfD2Fc3Ca66a1EeF0652165',
      attester: '0x1e3de6aE412cA218FD2ae3379750388D414532dc',
      revocable: true,
      data: '0x0000000000000000000000000000000000000000000000000000000000000000'
    }
  },
  signer: '0x1e3de6aE412cA218FD2ae3379750388D414532dc'
};

const EAS_CONFIG: OffchainConfig = {
  address: attestation.sig.domain.verifyingContract,
  version: attestation.sig.domain.version,
  chainId: attestation.sig.domain.chainId
};
const offchain = new Offchain(EAS_CONFIG, OffchainAttestationVersion.Version2);
const isValidAttestation = offchain.verifyOffchainAttestationSignature(attestation.signer, attestation.sig);
```

### Registering a Schema

To register a new schema, you can use the `register` function provided by the EAS SDK. This function takes an object with the following properties:

- `schema`: The schema string that defines the structure of the data to be attested.
- `resolverAddress`: The Ethereum address of the resolver responsible for managing the schema.
- `revocable`: A boolean value indicating whether attestations created with this schema can be revoked.

Here's an example of how to register a new schema:

```javascript
import { SchemaRegistry } from '@ethereum-attestation-service/eas-sdk';
import { ethers } from 'ethers';

const schemaRegistryContractAddress = '0xYourSchemaRegistryContractAddress';
const schemaRegistry = new SchemaRegistry(schemaRegistryContractAddress);

schemaRegistry.connect(signer);

const schema = 'uint256 eventId, uint8 voteIndex';
const resolverAddress = '0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0'; // Sepolia 0.26
const revocable = true;

const transaction = await schemaRegistry.register({
  schema,
  resolverAddress,
  revocable
});

// Optional: Wait for transaction to be validated
await transaction.wait();
```

After registering a schema, you can use its UID to create attestations with the specified structure.

### Getting Schema Information

To retrieve the schema information for a specific schema UID, you can use the `getSchema` function provided by the EAS SDK. Here's an example:

```javascript
import { SchemaRegistry } from "@ethereum-attestation-service/eas-sdk";

const schemaRegistryContractAddress = "0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0"; // Sepolia 0.26
const schemaRegistry = new SchemaRegistry(schemaRegistryContractAddress);
schemaRegistry.connect(provider);

const schemaUID = "0xYourSchemaUID";

const schemaRecord = await schemaRegistry.getSchema({ uid: schemaUID });

console.log(schemaRecord);

// Example Output
{
  uid: '0xYourSchemaUID',
  schema: 'bytes32 proposalId, bool vote',
  resolver: '0xResolverAddress',
  revocable: true
}
```

In the output, you will receive an object containing the schema UID, the schema string, the resolver address, and a boolean indicating whether the schema is revocable or not.

### Using the PrivateData Class

The `PrivateData` class allows you to create, prove, and verify private data using Merkle trees. This is useful for creating attestations where you want to selectively reveal only certain pieces of information while keeping the rest private.

#### Creating Private Data

To create private data, you need to initialize a `PrivateData` instance with an array of `MerkleValue` objects:

```typescript
import { MerkleValue, PrivateData } from '@ethereum-attestation-service/eas-sdk';

const values: MerkleValue[] = [
  { type: 'string', name: 'name', value: 'Alice Johnson' },
  { type: 'uint256', name: 'age', value: 28 },
  { type: 'bool', name: 'isStudent', value: false },
  { type: 'address', name: 'wallet', value: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' },
  { type: 'bytes32', name: 'dataHash', value: ethers.id('confidential information') }
];

const privateData = new PrivateData(values);
```

#### Getting the Full Merkle Tree

You can retrieve the full Merkle tree, which includes the root and all values with their salts:

```typescript
const fullTree = privateData.getFullTree();
console.log('Merkle Root:', fullTree.root);
```

#### Generating a Multi-Proof

To selectively reveal only certain pieces of information, you can generate a multi-proof:

```typescript
const proofIndexes = [0, 2, 4]; // Proving name, isStudent, and dataHash
const multiProof = privateData.generateMultiProof(proofIndexes);
```

#### Verifying a Multi-Proof

To verify a multi-proof against a known Merkle root:

```typescript
const isValid = PrivateData.verifyMultiProof(fullTree.root, multiProof);
console.log('Is Multi-Proof Valid?', isValid);
```

#### Verifying the Full Tree

You can also verify the integrity of the full Merkle tree:

```typescript
const calculatedRoot = PrivateData.verifyFullTree(fullTree);
console.log('Is Full Tree Valid?', calculatedRoot === fullTree.root);
```

### Example: Creating an Attestation with Private Data

Here's an example of how you might use the `PrivateData` class in conjunction with the EAS SDK to create an attestation with private data:

```typescript
import { EAS, NO_EXPIRATION, MerkleValue, PrivateData, SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';
import { ethers } from 'ethers';

// Initialize EAS
const eas = new EAS(EASContractAddress);
eas.connect(signer);

// Create private data
const values: MerkleValue[] = [
  { type: 'string', name: 'name', value: 'Alice Johnson' },
  { type: 'uint256', name: 'age', value: 28 },
  { type: 'bool', name: 'isStudent', value: false },
  { type: 'address', name: 'wallet', value: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' },
  { type: 'bytes32', name: 'dataHash', value: ethers.id('confidential information') }
];

const privateData = new PrivateData(values);
const fullTree = privateData.getFullTree();

// Create an attestation with the Merkle root
const schemaEncoder = new SchemaEncoder('bytes32 privateData');
const encodedData = schemaEncoder.encodeData([{ name: 'privateData', value: fullTree.root, type: 'bytes32' }]);

// Private data schema
const schemaUID = '0x20351f973fdec1478924c89dfa533d8f872defa108d9c3c6512267d7e7e5dbc2';

const transaction = await eas.attest({
  schema: schemaUID,
  data: {
    recipient: '0xFD50b031E778fAb33DfD2Fc3Ca66a1EeF0652165',
    expirationTime: NO_EXPIRATION,
    revocable: true,
    data: encodedData
  }
});

const newAttestationUID = await transaction.wait();

console.log('New attestation UID:', newAttestationUID);

// Generate a multi-proof to selectively reveal some data
const proofIndexes = [0, 2]; // Revealing only name and isStudent
const multiProof = privateData.generateMultiProof(proofIndexes);

console.log('Multi-proof for selective reveal:', multiProof);
```

In this example, we create an attestation that includes only the Merkle root of the private data. The actual data remains private, but we can selectively reveal parts of it using the multi-proof. The recipient of this attestation can verify the multi-proof against the attested Merkle root to confirm the validity of the revealed data without seeing the entire dataset.
