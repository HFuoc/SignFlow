import type { Hand } from "./api";

export type StudioSection = "overview" | "dataset" | "mediapipe" | "train" | "evaluate" | "translate";

export const studioSections: Array<{ id: StudioSection; label: string; description: string }> = [
  { id: "overview", label: "Overview", description: "Bring your sources, datasets, and gesture models together." },
  { id: "dataset", label: "Dataset", description: "Organize gesture samples with clear source provenance." },
  { id: "mediapipe", label: "MediaPipe", description: "Prepare visual hand tracking and labeled sample collection." },
  { id: "train", label: "Train", description: "Prepare a training configuration for your gesture model." },
  { id: "evaluate", label: "Evaluate", description: "Review a model against a held-out dataset." },
  { id: "translate", label: "Translate", description: "A workspace for future live gesture recognition and text output." },
];

export type StudioInputSource = "sensor" | "mediapipe" | "sensor-mediapipe";
export const inputSourceLabels: Record<StudioInputSource, string> = {
  sensor: "Sensor",
  mediapipe: "MediaPipe",
  "sensor-mediapipe": "Sensor + MediaPipe",
};

// Frontend presentation contracts only; no storage or wire schema is defined here.
// Source records retain independent provenance; fusion references the originals.
export interface SensorProvenance {
  kind: "sensor";
  sessionId: string;
  deviceId: string;
  hand: Hand;
  simulated: boolean;
  channelIds: string[];
  packetSchemaVersion: string;
}

export interface MediaPipeProvenance {
  kind: "mediapipe";
  sessionId: string;
  sourceReference: string;
  taskVersion: string | null;
  landmarkSchema: string | null;
  capturedAt: string | null;
}

export type DatasetInput =
  | { kind: "sensor"; sensors: SensorProvenance[] }
  | { kind: "mediapipe"; vision: MediaPipeProvenance[] }
  | {
      kind: "sensor-mediapipe";
      sensors: SensorProvenance[];
      vision: MediaPipeProvenance[];
      alignmentReference: string | null;
    };

export interface StudioDataset {
  id: string;
  name: string;
  gestureClasses: Array<{ id: string; label: string; sampleCount: number | null }>;
  sampleCount: number | null;
  input: DatasetInput;
  createdAt: string | null;
  modifiedAt: string | null;
  partitions: Record<"train" | "validation" | "test", { sampleCount: number | null; ready: boolean }>;
}

export type MediaPipeFeature = "landmark-position" | "handedness";

export interface StudioTrainingDraft {
  datasetId: string | null;
  inputSource: StudioInputSource;
  sensorChannelIds: string[];
  mediaPipeFeatures: MediaPipeFeature[];
  modelType: "" | "cnn" | "gru";
  epochs: string;
  batchSize: string;
  learningRate: string;
}

export interface StudioModel {
  id: string;
  name: string;
  trainingRunId: string;
  datasetId: string;
  inputSource: StudioInputSource;
  artifactReference: string;
}

export interface StudioEvaluation {
  modelId: string;
  datasetId: string;
  accuracy: number | null;
  perClass: Array<{ label: string; precision: number | null; recall: number | null }>;
  confusionMatrix: { labels: string[]; values: number[][] } | null;
}

export const createTrainingDraft = (): StudioTrainingDraft => ({
  datasetId: null,
  inputSource: "sensor",
  sensorChannelIds: [],
  mediaPipeFeatures: [],
  modelType: "",
  epochs: "",
  batchSize: "",
  learningRate: "",
});
