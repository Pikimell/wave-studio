type WaveSliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  output: string;
  ariaValueText?: string;
  onChange: (value: number) => void;
};

export const WaveSlider = ({ label, value, min, max, output, ariaValueText, onChange }: WaveSliderProps) => (
  <label className="slider-row">
    <span>{label}</span>
    <input
      type="range"
      min={min}
      max={max}
      step={1}
      value={value}
      aria-valuetext={ariaValueText}
      onChange={(event) => onChange(Number(event.target.value))}
    />
    <output>{output}</output>
  </label>
);
