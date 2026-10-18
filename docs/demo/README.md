# Reference tracking recording

`reference-tracking.webm` records the actual React application, authenticated
loopback bridge, MediaPipe tracking and isolated ViSign ridge inference worker.
The browser's camera input is a prerecorded reference replay, not a live webcam.
No prediction response is mocked and no score or acceptance rule is changed.

Source label: **Chào**. The recorded final result is **Tôi**, with Chào second.
This mismatch is retained deliberately: the video demonstrates the functioning
tracking/result path and an actual recognition failure, not validated accuracy.
Subsequent tentative predictions are not additional completed signs.

Source: PTIT AI Challenge / star092304,
[ViSignLanguage-Video](https://huggingface.co/datasets/star092304/ViSignLanguage-Video),
revision `906306d7cc9c684b034bc8e96494ce9a99bc1bfc`.
Publisher declares [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
Original reference SHA-256:
`2d48e37cacbf514df6b41ddab124b0435cbf262c380cfaad637dbfc687560f60`.
The source is converted to VP8 and replayed into the app's camera canvas;
the resulting app viewport is recorded using Playwright at 1440x900.
Training-source overlap and unverified source semantics prevent independent
accuracy claims. Participant/licensing provenance is a publisher declaration.

Recorded 2026-10-19. Browser test asserts real tracking coordinates, provisional
output while the source moves, a final result, and clean bridge shutdown.
Credentials remain in RAM; authenticated traces are disabled.
