import "./StepIndicator.css";

const DEFAULT_STEPS = [
  { key: "location", label: "Lokasi" },
  { key: "gps", label: "GPS" },
  { key: "face", label: "Wajah" },
  { key: "done", label: "Selesai" },
];

/**
 * Progress indicator step-based: 01 Lokasi -> 02 GPS -> 03 Wajah -> 04 Selesai
 * @param {number} currentStep - index step aktif (0-based)
 */
export default function StepIndicator({ currentStep = 0, steps = DEFAULT_STEPS }) {
  return (
    <div className="step-indicator" role="list">
      {steps.map((step, index) => {
        const stepNumber = String(index + 1).padStart(2, "0");
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;

        return (
          <div className="step-indicator__item" role="listitem" key={step.key}>
            <div
              className={[
                "step-indicator__circle",
                isActive ? "step-indicator__circle--active" : "",
                isCompleted ? "step-indicator__circle--completed" : "",
              ].join(" ")}
            >
              {isCompleted ? "✓" : stepNumber}
            </div>
            <span
              className={[
                "step-indicator__label",
                isActive ? "step-indicator__label--active" : "",
              ].join(" ")}
            >
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <div
                className={[
                  "step-indicator__line",
                  isCompleted ? "step-indicator__line--completed" : "",
                ].join(" ")}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
