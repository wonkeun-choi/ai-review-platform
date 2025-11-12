/** Blob → ArrayBuffer */
export async function blobToArrayBuffer(blob) {
  return await blob.arrayBuffer();
}

/** Blob → Base64 문자열 (분석 서버에 전송 시 사용 가능) */
export async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
