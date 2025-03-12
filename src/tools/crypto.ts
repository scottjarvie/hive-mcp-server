// Cryptography tools implementation
import { PrivateKey, PublicKey, Signature, cryptoUtils } from '@hiveio/dhive';
import config from '../config';
import { Response } from '../utils/response';
import { handleError } from '../utils/error';
import { successJson, errorResponse } from '../utils/response';

// Sign a message using a private key
export async function signMessage(
  params: { 
    message: string; 
    key_type: 'posting' | 'active' | 'memo' | 'owner';
  }
): Promise<Response> {
  try {
    // Get the private key from environment variables
    let keyEnvVar: string | undefined;

    switch (params.key_type) {
      case 'posting':
        keyEnvVar = config.hive.postingKey;
        break;
      case 'active':
        keyEnvVar = config.hive.activeKey;
        break;
      case 'memo':
        keyEnvVar = config.hive.memoKey;
        break;
      case 'owner':
        keyEnvVar = config.hive.ownerKey;
        break;
      default:
        return errorResponse(`Error: Invalid key_type: ${params.key_type}`);
    }

    // Check if the key is available
    if (!keyEnvVar) {
      return errorResponse(`Error: HIVE_${params.key_type.toUpperCase()}_KEY environment variable is not set`);
    }

    // Create PrivateKey object
    let privateKey: PrivateKey;
    try {
      privateKey = PrivateKey.fromString(keyEnvVar);
    } catch (error) {
      return errorResponse(`Error: Invalid ${params.key_type} key format`);
    }

    // Hash the message with sha256 before signing
    const messageHash = cryptoUtils.sha256(params.message);

    // Sign the message hash
    let signature: string;
    try {
      signature = privateKey.sign(messageHash).toString();
    } catch (error) {
      return errorResponse(`Error signing message: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Get the public key
    const publicKey = privateKey.createPublic().toString();

    return successJson({
      success: true,
      message_hash: messageHash.toString('hex'),
      signature,
      public_key: publicKey,
    });
  } catch (error) {
    return errorResponse(handleError(error, 'sign_message'));
  }
}

// Verify a message signature
export async function verifySignature(
  params: { 
    message_hash: string; 
    signature: string;
    public_key: string;
  }
): Promise<Response> {
  try {
    // Parse the public key (handling keys with or without the STM prefix)
    let publicKey;
    try {
      publicKey = params.public_key.startsWith('STM')
        ? params.public_key
        : `STM${params.public_key}`;

      publicKey = PublicKey.fromString(publicKey);
    } catch (error) {
      return errorResponse('Error: Invalid public key format');
    }

    // Parse the signature
    let signatureObj;
    try {
      signatureObj = Signature.fromString(params.signature);
    } catch (error) {
      return errorResponse('Error: Invalid signature format');
    }

    // Validate and parse the message hash
    let messageHashBuffer;
    try {
      if (!/^[0-9a-fA-F]{64}$/.test(params.message_hash)) {
        throw new Error('Message hash must be a 64-character hex string');
      }
      messageHashBuffer = Buffer.from(params.message_hash, 'hex');
    } catch (error) {
      return errorResponse('Error: Invalid message hash format - must be a 64-character hex string');
    }

    // Verify the signature against the hash
    const isValid = publicKey.verify(messageHashBuffer, signatureObj);

    return successJson({
      success: true,
      is_valid: isValid,
      message_hash: params.message_hash,
      public_key: publicKey.toString(),
    });
  } catch (error) {
    return errorResponse(handleError(error, 'verify_signature'));
  }
}
