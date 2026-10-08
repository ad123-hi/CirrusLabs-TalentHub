function Loading({ message = 'Loading...' }) {
  return (
    <div className="content-card loading-state">
      <div className="loading-spinner" />
      <p>{message}</p>
    </div>
  )
}

export default Loading
