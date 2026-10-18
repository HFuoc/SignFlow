import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { PredictionView } from "./Recognition";
import type { RecognitionPrediction } from "./api";

const prediction: RecognitionPrediction = {
  schema_version: "smartglove-prediction-result-v1", sample_id: null, recording_id: null,
  topic_id: "vsl_gh25", preprocessing_id: "fixture", model_sha256: "fixture", source_provenance: {},
  status: "rejected", provider_id: "vsl-gh-tcn-25", top_k: [],
  rejection_reason: "Uncertain sign", latency_ms: {}, score_kind: "uncalibrated_softmax_subset",
  quality: { candidate_top_k: [{ source_class_index: 0, label_id: "gh_tcn:vsl_gh25:0", display_name: "TÔI", score: .9 }],
    native_winner_supported: true, accept_threshold: .999266207, frames_decoded: 30, hand_coverage: .8,
    boundary_reason: "manual_finish" },
};

describe("unconfirmed camera results", () => {
  it("shows diagnostic guesses separately without claiming a recognized word", () => {
    const html = renderToStaticMarkup(createElement(PredictionView, { prediction, prominent: true }));
    expect(html).toContain("Sign not confirmed");
    expect(html).toContain("Closest supported signs · unconfirmed");
    expect(html).toContain("TÔI"); expect(html).toContain("0.900000");
    expect(html).toContain("0.999266"); expect(html).toContain("80%");
    expect(html).toContain("Recognize now");
    expect(html).not.toContain("recognition-result__word");
  });
  it("explains when the native winner is outside the supported vocabulary", () => {
    const html = renderToStaticMarkup(createElement(PredictionView, { prediction: { ...prediction,
      quality: { ...prediction.quality, native_winner_supported: false } } }));
    expect(html).toContain("highest score is outside the supported vocabulary");
  });
  it("never displays guesses for missing-hand or incomplete segments", () => {
    const html = renderToStaticMarkup(createElement(PredictionView, { prediction: { ...prediction, status: "insufficient_data" } }));
    expect(html).toContain("Sign could not be evaluated");
    expect(html).not.toContain("TÔI");
  });
});
