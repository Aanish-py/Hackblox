const axios = require("axios");
const FormData = require("form-data");

const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs";

if (!PINATA_JWT) {
  console.error("❌ Missing PINATA_JWT in .env");
}

/**
 * Pin a JSON object to IPFS via Pinata
 * @param {object} jsonData
 * @param {string} name - CID friendly name
 * @returns {Promise<string>} IPFS CID
 */
async function pinJSON(jsonData, name = "gigchain-data") {
  if (!PINATA_JWT) {
    throw new Error("Pinata JWT token not configured on server (.env PINATA_JWT missing)");
  }
  try {
    const res = await axios.post(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      {
        pinataContent: jsonData,
        pinataMetadata: { name },
      },
      {
        headers: {
          Authorization: `Bearer ${PINATA_JWT}`,
          "Content-Type": "application/json",
        },
      }
    );
    return res.data.IpfsHash;
  } catch (err) {
    const detail = err.response?.data?.error?.details || err.response?.data?.error || err.message;
    throw new Error(`Pinata IPFS JSON pinning failed: ${detail}`);
  }
}

/**
 * Pin a file buffer to IPFS via Pinata
 * @param {Buffer} fileBuffer
 * @param {string} filename
 * @returns {Promise<string>} IPFS CID
 */
async function pinFile(fileBuffer, filename) {
  if (!PINATA_JWT) {
    throw new Error("Pinata JWT token not configured on server (.env PINATA_JWT missing)");
  }
  try {
    const formData = new FormData();
    formData.append("file", fileBuffer, { filename });
    formData.append("pinataMetadata", JSON.stringify({ name: filename }));

    const res = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        headers: {
          Authorization: `Bearer ${PINATA_JWT}`,
          ...formData.getHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );
    return res.data.IpfsHash;
  } catch (err) {
    const detail = err.response?.data?.error?.details || err.response?.data?.error || err.message;
    throw new Error(`Pinata IPFS file pinning failed: ${detail}`);
  }
}

function getIPFSUrl(cid) {
  return `${PINATA_GATEWAY}/${cid}`;
}

module.exports = { pinJSON, pinFile, getIPFSUrl };
