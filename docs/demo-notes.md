# Demo notes

## Fast walkthrough

1. Open `/` for the landing flow and main entry points.
2. Go to `/studio` to load a sample or upload a file.
3. Open `/review` to check findings, quality, regions, and report sections.
4. Open `/batch` or `/synthetic` for multi-recording review and generated test signals.
5. Open `/reports` to export the final summary.

## Good demo flows

### Cardiac review

- Load `Resting ECG`
- Apply `Cardiac review`
- Focus on the 2 to 8 second window
- Review quality and notable regions
- Export the PDF report

### Artifact cleanup

- Load `Motion-corrupted ECG`
- Apply `Signal cleanup mode`
- Toggle raw overlay
- Open `Review` and inspect flagged segments

### EMG activity review

- Load `EMG activation example`
- Apply `Muscle activity review`
- Open annotations and label one activation range
- Add a notebook entry and export the plot image

### Batch review

- Open `/batch`
- Add multiple built-in recordings
- Sort by quality or event count
- Send two recordings into compare mode

## Upload demo

- Import one of the CSV files from `public/samples/`
- Use the channel map to select numeric columns
- Let the importer infer the time column or generate it from sample rate

## Notes

- Session state is saved locally in the browser.
- Older saved session data is restored automatically.
- The export includes a prototype disclaimer.
- The signal logic is for analysis support and interface demonstration only.
