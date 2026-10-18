# Experimental recognition assets

These are the existing frozen research models and reference previews used by
SignFlow, published for reproducible setup. No training data archive is included.
`manifest.json` records byte counts, SHA-256 identities, and compatibility install
paths. Setup verifies these before installing; it never replaces a different
existing file. The current worker still uses its historical ignored paths.

- `visign/model.npz`: locally fitted 25-label ridge research baseline. Data source:
  [star092304/ViSignLanguage-Video](https://huggingface.co/datasets/star092304/ViSignLanguage-Video),
  revision `906306d7cc9c684b034bc8e96494ce9a99bc1bfc`. Publisher attributes the
  collection to PTIT AI Challenge and declares
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- `visign-references/`: 25 training-source previews from that collection,
  transcoded to VP8/WebM without audio. Original source identities, hashes,
  frame counts, and conversion settings are in its manifest. Attribution:
  PTIT AI Challenge / star092304. Not independent evaluation or verified lessons.
- `gh/`: locally trained TCN epoch 44 with frozen normalization, 25 signs plus
  OTHER. Source: [VSL-GH](https://github.com/nguyentheanh822/Vietnamese-Sign-Language-Translation).
- `gh-references/`: derived training-source landmark animations, **not original
  human video**. Publisher MIT notice is retained in `SOURCE_LICENSE.txt`.

Upstream license declarations are publisher claims, not independent verification
of participant consent, source semantics, or the upstream provenance chain.
The models are experimental: rejection, wrong recognition and missing tracking
remain possible. Scores are not calibrated accuracy. No production accuracy or
multi-user webcam gate is passed by packaging these assets.
