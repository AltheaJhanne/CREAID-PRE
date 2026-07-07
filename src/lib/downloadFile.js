const EXTENSION_BY_TYPE = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

function sanitizeFileName(value = "download") {
  return String(value || "download")
    .replace(/[<>:"/\\|?*\x00-\x1F]+/g, "-")
    .replace(/\s+/g, " ")
    .trim() || "download";
}

function extensionFromUrl(url = "") {
  try {
    const path = new URL(url).pathname;
    const fileName = decodeURIComponent(path.split("/").pop() || "");
    const match = fileName.match(/\.([a-zA-Z0-9]{1,8})$/);
    return match?.[1]?.toLowerCase() || "";
  } catch {
    const match = String(url).split("?")[0].match(/\.([a-zA-Z0-9]{1,8})$/);
    return match?.[1]?.toLowerCase() || "";
  }
}

function extensionFromType(contentType = "") {
  const normalized = String(contentType).split(";")[0].trim().toLowerCase();
  return EXTENSION_BY_TYPE[normalized] || "";
}

function ensureExtension(fileName, extension) {
  const cleanName = sanitizeFileName(fileName);
  if (!extension || /\.[a-zA-Z0-9]{1,8}$/.test(cleanName)) return cleanName;
  return `${cleanName}.${extension}`;
}

export function getDownloadFileName(fileName, url, contentType) {
  const extension =
    extensionFromType(contentType) ||
    extensionFromUrl(url) ||
    (/\.pdf$/i.test(String(fileName || "")) ? "pdf" : "");

  return ensureExtension(fileName || "download", extension);
}

export async function downloadFile(url, fileName = "download") {
  if (!url) return false;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Download failed with ${response.status}`);

    const contentType = response.headers.get("content-type") || "";
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = objectUrl;
    link.download = getDownloadFileName(fileName, url, contentType);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
    return true;
  } catch (error) {
    console.error("Download failed:", error);

    const separator = url.includes("?") ? "&" : "?";
    const link = document.createElement("a");
    link.href = /^https?:\/\//i.test(url) && !/[?&]download=/.test(url)
      ? `${url}${separator}download=${encodeURIComponent(getDownloadFileName(fileName, url))}`
      : url;
    link.download = getDownloadFileName(fileName, url);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
    return false;
  }
}
