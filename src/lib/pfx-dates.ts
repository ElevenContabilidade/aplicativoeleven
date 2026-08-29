import {
  fromBER,
  Sequence,
  Set as Asn1Set,
  Constructed,
  OctetString,
  ObjectIdentifier,
  UTCTime,
  GeneralizedTime,
} from "asn1js";

/**
 * Reads the notBefore/notAfter validity dates straight out of a .pfx/.p12
 * certificate bundle, entirely client-side — no password needed.
 *
 * A PKCS#12 file stores the public certificate(s) in a plain (unencrypted)
 * SafeContents; only the private key is password-protected. So we can walk
 * the ASN.1 structure down to the X.509 certificate's `validity` field
 * without ever touching the encrypted key material. When the bundle has a
 * full certificate chain, the leaf (the holder's own certificate, as
 * opposed to the issuing CA certificates) is identified the same way
 * `openssl pkcs12 -clcerts` does: it's the only certificate bag carrying
 * bag attributes (friendlyName/localKeyID), because that's what ties it to
 * the private key it was bundled with.
 */

const OID_PKCS7_DATA = "1.2.840.113549.1.7.1";
const OID_CERT_BAG = "1.2.840.113549.1.12.10.1.3";

export interface ExtractedPfxDates {
  dataEmissao?: string;
  dataVencimento?: string;
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Parses `bytes` as a top-level DER SEQUENCE (every structure we unwrap here is one). */
function parseSequence(bytes: Uint8Array): Sequence | undefined {
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const { result } = fromBER(buffer);
  return result instanceof Sequence ? result : undefined;
}

/** Unwraps a `[n] EXPLICIT OCTET STRING` node into its raw bytes. */
function childOctetStringBytes(explicitWrapper: unknown): Uint8Array | undefined {
  if (!(explicitWrapper instanceof Constructed)) return undefined;
  const inner = explicitWrapper.valueBlock.value[0];
  return inner instanceof OctetString ? inner.valueBlock.valueHexView : undefined;
}

/** Extracts notBefore/notAfter from a DER-encoded X.509 Certificate. */
function readCertificateValidity(certDer: Uint8Array): ExtractedPfxDates {
  const cert = parseSequence(certDer);
  const tbs = cert?.valueBlock.value[0];
  if (!(tbs instanceof Sequence)) return {};

  // TBSCertificate: version [0] EXPLICIT is present on every v3 cert (the norm today);
  // fall back to index 3 for the rare v1 cert with no explicit version field.
  const hasVersion = tbs.valueBlock.value[0] instanceof Constructed;
  const validity = tbs.valueBlock.value[hasVersion ? 4 : 3];
  if (!(validity instanceof Sequence) || validity.valueBlock.value.length < 2) return {};

  const [notBefore, notAfter] = validity.valueBlock.value;
  const toDate = (t: unknown) => (t instanceof UTCTime || t instanceof GeneralizedTime ? t.toDate() : undefined);
  const emissao = toDate(notBefore);
  const vencimento = toDate(notAfter);
  return {
    dataEmissao: emissao ? toIsoDate(emissao) : undefined,
    dataVencimento: vencimento ? toIsoDate(vencimento) : undefined,
  };
}

/** Best-effort extraction of the holder certificate's validity dates from a .pfx/.p12 file. */
export async function extractPfxDates(file: File): Promise<ExtractedPfxDates> {
  const buffer = await file.arrayBuffer();
  const pfx = parseSequence(new Uint8Array(buffer));
  const authSafe = pfx?.valueBlock.value[1]; // ContentInfo
  if (!(authSafe instanceof Sequence) || authSafe.valueBlock.value.length < 2) return {};
  const authSafeType = authSafe.valueBlock.value[0];
  if (!(authSafeType instanceof ObjectIdentifier) || authSafeType.valueBlock.toString() !== OID_PKCS7_DATA) return {};

  const authSafeBytes = childOctetStringBytes(authSafe.valueBlock.value[1]);
  const authenticatedSafe = authSafeBytes && parseSequence(authSafeBytes);
  if (!authenticatedSafe) return {};

  for (const contentInfo of authenticatedSafe.valueBlock.value) {
    if (!(contentInfo instanceof Sequence) || contentInfo.valueBlock.value.length < 2) continue;
    const contentType = contentInfo.valueBlock.value[0];
    if (!(contentType instanceof ObjectIdentifier) || contentType.valueBlock.toString() !== OID_PKCS7_DATA) continue;

    const safeContentsBytes = childOctetStringBytes(contentInfo.valueBlock.value[1]);
    const safeContents = safeContentsBytes && parseSequence(safeContentsBytes);
    if (!safeContents) continue;

    for (const safeBag of safeContents.valueBlock.value) {
      if (!(safeBag instanceof Sequence) || safeBag.valueBlock.value.length < 2) continue;
      const bagId = safeBag.valueBlock.value[0];
      if (!(bagId instanceof ObjectIdentifier) || bagId.valueBlock.toString() !== OID_CERT_BAG) continue;

      const bagAttributes = safeBag.valueBlock.value[2];
      const hasAttributes = bagAttributes instanceof Asn1Set && bagAttributes.valueBlock.value.length > 0;
      if (!hasAttributes) continue; // skip CA-chain certs bundled alongside the holder's own

      const certBag = (safeBag.valueBlock.value[1] as Constructed | undefined)?.valueBlock.value[0];
      if (!(certBag instanceof Sequence) || certBag.valueBlock.value.length < 2) continue;
      const certDer = childOctetStringBytes(certBag.valueBlock.value[1]);
      if (!certDer) continue;

      const dates = readCertificateValidity(certDer);
      if (dates.dataEmissao || dates.dataVencimento) return dates;
    }
  }
  return {};
}
