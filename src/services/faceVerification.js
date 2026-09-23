const MODEL_URL =
  import.meta.env.VITE_FACE_MODEL_URL ||
  "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";

// 0.45 is intentionally stricter than the common 0.6 default.
// It can still be overridden with VITE_FACE_MATCH_THRESHOLD.
const MATCH_THRESHOLD = Number(import.meta.env.VITE_FACE_MATCH_THRESHOLD || 0.45);
const VERIFY_SAMPLES = 3;
const VERIFY_DELAY_MS = 250;

let modelsPromise = null;

function getFaceApi() {
  if (!window.faceapi) {
    throw new Error("Modul verifikasi wajah belum termuat. Refresh halaman lalu coba lagi.");
  }
  return window.faceapi;
}

async function loadModels() {
  if (!modelsPromise) {
    const faceapi = getFaceApi();
    modelsPromise = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]).catch((error) => {
      modelsPromise = null;
      throw error;
    });
  }

  await modelsPromise;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeStoredDescriptor(value) {
  let descriptor = value;

  if (typeof descriptor === "string") {
    try {
      descriptor = JSON.parse(descriptor);
    } catch {
      return null;
    }
  }

  if (descriptor && !Array.isArray(descriptor) && typeof descriptor.length === "number") {
    descriptor = Array.from(descriptor);
  }

  if (!Array.isArray(descriptor) || descriptor.length !== 128) {
    return null;
  }

  const numbers = descriptor.map(Number);
  if (numbers.some((value) => !Number.isFinite(value))) {
    return null;
  }

  return numbers;
}

async function getDescriptor(videoElement) {
  const faceapi = getFaceApi();
  await loadModels();

  if (!videoElement?.videoWidth || !videoElement?.videoHeight) {
    throw new Error("Kamera belum siap.");
  }

  // Do not use detectSingleFace here. If another person enters the frame,
  // detectSingleFace could silently select one face and verification could
  // continue. Attendance requires exactly one visible face.
  const detections = await faceapi
    .detectAllFaces(
      videoElement,
      new faceapi.TinyFaceDetectorOptions({
        inputSize: 224,
        scoreThreshold: 0.6,
      })
    )
    .withFaceLandmarks()
    .withFaceDescriptors();

  if (detections.length === 0) {
    throw new Error("Wajah tidak terdeteksi. Posisikan wajah di dalam frame.");
  }

  if (detections.length > 1) {
    throw new Error("Terdeteksi lebih dari satu wajah. Pastikan hanya satu orang di dalam frame.");
  }

  const descriptor = Array.from(detections[0].descriptor);

  if (descriptor.length !== 128 || descriptor.some((value) => !Number.isFinite(value))) {
    throw new Error("Descriptor wajah tidak valid.");
  }

  return descriptor;
}

function averageDescriptors(descriptors) {
  if (!descriptors.length) {
    throw new Error("Tidak ada descriptor wajah.");
  }

  const result = new Array(128).fill(0);

  for (const descriptor of descriptors) {
    for (let i = 0; i < 128; i += 1) {
      result[i] += descriptor[i];
    }
  }

  for (let i = 0; i < 128; i += 1) {
    result[i] /= descriptors.length;
  }

  return result;
}

export async function enrollFace(videoElement) {
  await loadModels();

  const samples = [];

  for (let i = 0; i < VERIFY_SAMPLES; i += 1) {
    samples.push(await getDescriptor(videoElement));
    if (i < VERIFY_SAMPLES - 1) {
      await sleep(VERIFY_DELAY_MS);
    }
  }

  return {
    // Store a stable descriptor created from multiple frames rather than
    // relying on one potentially noisy camera frame.
    descriptor: averageDescriptors(samples),
    enrolledAt: new Date().toISOString(),
  };
}

export async function verifyFace({ enrolledFace, videoElement }) {
  const storedDescriptor = normalizeStoredDescriptor(enrolledFace);

  if (!storedDescriptor) {
    return {
      success: false,
      confidence: 0,
      isMock: false,
      reason: "invalid-enrollment",
    };
  }

  const currentDescriptors = [];

  try {
    for (let i = 0; i < VERIFY_SAMPLES; i += 1) {
      currentDescriptors.push(await getDescriptor(videoElement));

      if (i < VERIFY_SAMPLES - 1) {
        await sleep(VERIFY_DELAY_MS);
      }
    }
  } catch (error) {
    return {
      success: false,
      confidence: 0,
      isMock: false,
      reason: "face-capture-failed",
      error: error.message,
    };
  }

  const faceapi = getFaceApi();
  const distances = currentDescriptors.map((descriptor) =>
    faceapi.euclideanDistance(
      new Float32Array(storedDescriptor),
      new Float32Array(descriptor)
    )
  );

  const sortedDistances = [...distances].sort((a, b) => a - b);
  const medianDistance = sortedDistances[Math.floor(sortedDistances.length / 2)];

  // Require the majority of independent frames to match. A single accidental
  // low distance must never be enough to authorize attendance.
  const matchingSamples = distances.filter(
    (distance) => distance <= MATCH_THRESHOLD
  ).length;

  const success = matchingSamples >= 2 && medianDistance <= MATCH_THRESHOLD;
  const confidence = Math.max(0, Math.min(1, 1 - medianDistance));

  if (import.meta.env.MODE === "development") {
    console.log("[FaceVerification] Face matching result:", {
      distances: distances.map((value) => value.toFixed(4)),
      medianDistance: medianDistance.toFixed(4),
      threshold: MATCH_THRESHOLD,
      matchingSamples,
      requiredSamples: 2,
      match: success,
    });
  }

  return {
    success,
    confidence,
    distance: medianDistance,
    distances,
    threshold: MATCH_THRESHOLD,
    matchingSamples,
    isMock: false,
    reason: success ? "match" : "mismatch",
  };
}

export async function warmUpFaceModels() {
  await loadModels();
}
