import { Component } from 'react'
export default class ErrorBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (this.state.failed) return <main className="section shell empty-state" role="alert"><h1>We couldn’t load this page.</h1><p>Your saved data has not been cleared. Try loading the page again.</p><button className="btn" onClick={() => window.location.reload()}>Try Again</button><a className="btn btn--outline" href="/">Home</a></main>
    return this.props.children
  }
}
