export default function URLInput({
  value,
  onChange,
  onAnalyze,
  loading = false
}) {
  function handleSubmit(event) {
    event.preventDefault()
    if (!value || loading) return
    onAnalyze()
  }

  return (
    <form className="url-input" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor="analysis-url">
        URL to analyze
      </label>
      <input
        id="analysis-url"
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder="https://example.com"
        inputMode="url"
        autoComplete="url"
      />
      <button type="submit" disabled={loading || !value.trim()}>
        {loading ? 'Analyzing' : 'Analyze'}
      </button>
    </form>
  )
}
